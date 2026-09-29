import { ref, computed, watch } from "vue"
import { createFetch } from "@vueuse/core"
import { getCached, setCached, invalidateByKey, clearCache } from "./cache.js"
import { normalizeStructure } from "./skel.js"
import { normalizeEnvelope } from "./envelope.js"
import { notify, requestMessage } from "./messageStore.js"

const controllerPath = (controller) => (Array.isArray(controller) ? controller.join(".") : controller)

export class HTTPError extends Error {
  constructor(statusCode, statusText, message, response = null) {
    super(message || statusText)
    this.statusCode = statusCode
    this.statusText = statusText
    this.response = response
  }
}

/**
 * Build a ViUR request URL: `[/lang]/<renderer>[/<version>]/<controller>/<endpoint>`.
 *
 * `version` is optional and orthogonal to `renderer`. Omit it to hit the
 * unversioned endpoint (e.g. `/json/…`), which the server aliases to the newest
 * wire format (envelope v2). Pass `2`/`"v2"` or `1`/`"v1"` to pin a version
 * (`/json/v2/…`, `/json/v1/…`). A numeric version is rendered as `v<n>`.
 */
function create_url({ controller, endpoint, renderer = "json", version = null, lang = null } = {}) {
  if (!controller) {
    throw new Error("Parameter 'controller' is required")
  }
  if (!endpoint) {
    throw new Error("Parameter 'endpoint' is required")
  }

  let url = ""

  if (lang) url += `/${lang}`

  url += `/${renderer}`

  const versionSegment = version == null ? null : typeof version === "number" ? `v${version}` : version
  if (versionSegment) url += `/${versionSegment}`

  if (Array.isArray(controller)) {
    url += "/" + controller.join("/")
  } else {
    url += `/${controller}`
  }

  url += `/${endpoint}`

  if (url && !(url.startsWith("http://") || url.startsWith("https://") || url.startsWith("//"))) {
    url = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : window.location.origin) + url
  }

  return url
}

const SKEY_BATCH_SIZE = 10
let _skeyCache = []
let _skeyPending = null

async function _refillSkeys(renderer) {
  const base = import.meta.env.VITE_API_URL ?? window.location.origin
  let response = await fetch(`${base}/${renderer}/skey?amount=${SKEY_BATCH_SIZE}`, { credentials: "include" })
  if (!response.ok) {
    response = await fetch(`${base}/${renderer}/skey`, { credentials: "include" })
    if (!response.ok) throw new Error("Failed to fetch skey token")
  }
  let data = await response.json()
  if (!Array.isArray(data)) data = [data]
  _skeyCache.push(...data)
  _skeyPending = null
}

async function fetchSkeyToken(renderer) {
  if (_skeyCache.length === 0) {
    if (!_skeyPending) _skeyPending = _refillSkeys(renderer)
    await _skeyPending
  }
  return _skeyCache.shift()
}

async function executeAndThrow(fetchResult, executeImpl) {
  await executeImpl()
  if (fetchResult.error.value) {
    throw fetchResult.error.value
  }
  return fetchResult
}

function createControllerListFetch({ all = false, secure = false } = {}) {
  return (
    controller,
    {
      params: initialParams = {},
      group = null,
      url = null,
      renderer = import.meta.env.VITE_DEFAULT_RENDERER ?? "json",
      version = null,
      immediate = true,
      cached = false,
      ttl = 0,
      // push failures to the message store (when one exists)
      messages = true,
      // extra request headers for the LIST requests (not the structure fetch):
      // object or function returning one — e.g. X-VIUR-BONELIST, evaluated per
      // request so the caller can react to state changes.
      headers = null,
    } = {}
  ) => {
    const data = ref([]) // skellist
    const structure = ref({})
    const cursor = ref("")
    const orders = ref([])
    const params = ref({ ...initialParams })
    let _isNext = false

    function _buildUrl() {
      const base = url ?? create_url({ controller, endpoint: group ? `list/${group}` : "list", renderer, version })
      const qs = new URLSearchParams()
      for (const [k, v] of Object.entries(params.value)) {
        Array.isArray(v) ? v.forEach((item) => qs.append(k, item)) : qs.append(k, v)
      }
      return qs.toString() ? `${base}?${qs}` : base
    }

    /**
     * Struktur der Liste holen.
     *
     * Zwei Antwortformen sind unterwegs:
     *   • aktuell:  `/<modul>/structure` rendert wie jede andere Aktion, also
     *     `{ action: "structure.view", values, structure }`
     *   • historisch (getStructure): `{ viewSkel: {…}, editSkel: {…} }`
     * Zusätzlich kann die Struktur eine PAAR-LISTE sein
     * (`json.bone.structure.keytuples`) — normalizeStructure glättet das.
     */
    async function _fetchStructure() {
      const skeltype =
        params.value.skelType === "node"
          ? "viewNodeSkel"
          : params.value.skelType === "leaf"
            ? "viewLeafSkel"
            : "viewSkel"
      let url = create_url({ controller, endpoint: "structure", renderer, version })
      if (params.value.skelType) {
        url += `${url.includes("?") ? "&" : "?"}skelType=${encodeURIComponent(params.value.skelType)}`
      }
      const resp = await fetch(url, { credentials: "include", headers: { Accept: "application/json" } })
      if (!resp.ok) return
      const body = normalizeEnvelope(await resp.json())
      const raw = body?.["structure"] ?? body?.[skeltype]
      if (raw) structure.value = normalizeStructure(raw)
    }

    const listUrl = ref(_buildUrl())

    const useViurFetch = createFetch({
      baseUrl: "",
      fetchOptions: {
        credentials: "include",
        headers: { Accept: "application/json" },
      },
      options: {
        async beforeFetch({ options, url, cancel }) {
          const extraHeaders = typeof headers === "function" ? headers() : headers
          if (extraHeaders) options.headers = { ...options.headers, ...extraHeaders }
          if (cached && !_isNext) {
            const hit = await getCached(url, ttl)
            if (hit) {
              data.value = hit.data ?? hit.skellist ?? hit
              cursor.value = hit.meta?.cursor ?? hit.cursor ?? ""
              orders.value = hit.meta?.orders ?? hit.orders ?? []
              cancel()
              return { options, url }
            }
          }
          if (!secure) return { options, url }
          const skey = await fetchSkeyToken(renderer)
          const separator = url.includes("?") ? "&" : "?"
          return { url: `${url}${separator}skey=${skey}`, options }
        },
        async afterFetch(ctx) {
          // Normalize v1/v2 up to the canonical v2 envelope, then read the list
          // payload from `data` and pagination from `meta`.
          const responseData = normalizeEnvelope(ctx.data)
          if (!_isNext) {
            await _fetchStructure()
          }
          const list = responseData.data ?? []
          // Manche Installationen liefern die Struktur in der Liste mit
          // (Kompatibilitäts-Flag `json.bone.structure.inlists`) — dann ist der
          // separate Aufruf oben umsonst gewesen, aber diese hier ist aktueller.
          if (responseData.structure) {
            structure.value = normalizeStructure(responseData.structure)
          }
          cursor.value = responseData.meta?.cursor ?? ""
          orders.value = responseData.meta?.orders ?? []
          data.value = _isNext ? data.value.concat(list) : list
          if (cached && !_isNext) {
            const entityKeys = list.map((s) => s.key).filter(Boolean)
            await setCached(ctx.url ?? listUrl.value, responseData, entityKeys)
          }
          ctx.data = data.value
          return ctx
        },
        onFetchError(ctx) {
          ctx.error = new HTTPError(ctx.response?.status, ctx.response?.statusText, ctx.error?.message, ctx.response)
          if (messages) {
            notify(
              requestMessage({ method: "GET", endpoint: "list", module: controllerPath(controller), error: ctx.error })
            )
          }
          return ctx
        },
      },
    })

    const { isFetching, isFinished, error, execute: _execute, abort } = useViurFetch(listUrl, { immediate }).json()

    /** Alles geladen: letzte Antwort da und kein Cursor mehr offen. Ab hier
     *  dürfen Sortierung/Filter lokal auf dem Datensatz laufen. */
    const complete = computed(() => isFinished.value && !cursor.value)

    const fetchResult = {
      data,
      structure,
      orders,
      cursor,
      params,
      complete,
      isFetching,
      isFinished,
      error,
      execute,
      next,
      nextAll,
      filter,
      reset,
    }

    // when all=true: automatically fetch next pages until cursor is empty
    watch(isFinished, async (finished) => {
      if (finished && all && cursor.value) {
        params.value = { ...params.value, cursor: cursor.value }
        _isNext = true
        listUrl.value = _buildUrl()
        await executeAndThrow(fetchResult, _execute)
      }
    })

    function execute() {
      _isNext = false
      abort()
      data.value = []
      structure.value = {}
      cursor.value = ""
      orders.value = []
      const { cursor: _, ...rest } = params.value
      params.value = rest
      listUrl.value = _buildUrl()
      return executeAndThrow(fetchResult, _execute)
    }

    /** Eine Seite nachladen; erkennt das ViUR-Ende (leere Seite mit derselben
     *  Cursor-Marke) und löscht dann den Cursor. Liefert true bei Fortschritt. */
    async function _advance() {
      if (!cursor.value) return false
      const before = data.value.length
      const cursorBefore = cursor.value
      params.value = { ...params.value, cursor: cursor.value }
      _isNext = true
      listUrl.value = _buildUrl()
      await executeAndThrow(fetchResult, _execute)
      if (data.value.length === before && cursor.value === cursorBefore) {
        cursor.value = ""
        return false
      }
      return true
    }

    /** Die nächsten `pages` Seiten laden (Standard: eine) — z. B. direkt als
     *  Handler der DataTable-Cursor-Leiste: `@load-more="({ pages }) =>
     *  pages === 'all' ? list.nextAll() : list.next(pages)"`. */
    async function next(pages = 1) {
      let remaining = pages
      while (remaining-- > 0) {
        if (!(await _advance())) return
      }
    }

    /** Alle restlichen Seiten laden ("Alles laden"). */
    async function nextAll() {
      while (await _advance()) {
        /* bis zum Ende */
      }
    }

    function filter(newParams) {
      params.value = newParams
      return execute()
    }

    function reset() {
      abort()
      data.value = []
      structure.value = {}
      cursor.value = ""
      orders.value = []
      const { cursor: _, ...rest } = params.value
      params.value = rest
    }

    return fetchResult
  }
}

/**
 * Convenience fetch for Tree prototypes: loads nodes and leaves of one parent
 * node together. Internally composes two list fetches (`skelType=node` and
 * `skelType=leaf`) that share the same params, so `filter()`/`execute()`/
 * `reset()` apply to both.
 *
 * - `nodes` / `leaves`: the individual skellists
 * - `data`: nodes followed by leaves, each item enriched with `skelType`
 * - `structure`: `{ node, leaf }` structures
 * - `next()`: paginates nodes first, then leaves; `hasMore` tells if there is more
 * - `open(parententry)`: shortcut for `filter({ ...params, parententry })`
 *
 * @param {string|string[]} controller
 * @param {object} [options] same as `useListFetch` (minus `group`/`url`), plus
 *   `parententry` (shortcut for `params.parententry`) and `all` (fetch every
 *   page of both lists automatically)
 */
export function useTreeFetch(
  controller,
  { params: initialParams = {}, parententry = null, all = false, ...listOptions } = {}
) {
  const baseParams = { ...initialParams }
  if (parententry) baseParams.parententry = parententry

  const listFetch = all ? useListFetchAll : useListFetch
  const nodes = listFetch(controller, { ...listOptions, params: { ...baseParams, skelType: "node" } })
  const leaves = listFetch(controller, { ...listOptions, params: { ...baseParams, skelType: "leaf" } })

  const data = computed(() => [
    ...nodes.data.value.map((skel) => ({ ...skel, skelType: "node" })),
    ...leaves.data.value.map((skel) => ({ ...skel, skelType: "leaf" })),
  ])
  const structure = computed(() => ({ node: nodes.structure.value, leaf: leaves.structure.value }))
  const isFetching = computed(() => nodes.isFetching.value || leaves.isFetching.value)
  const isFinished = computed(() => nodes.isFinished.value && leaves.isFinished.value)
  const error = computed(() => nodes.error.value ?? leaves.error.value)
  const hasMore = computed(() => !!(nodes.cursor.value || leaves.cursor.value))
  /** Beide Listen vollständig geladen — Sortierung/Filter dürfen lokal laufen. */
  const complete = computed(() => isFinished.value && !hasMore.value)

  function _both(fn) {
    return Promise.all([fn(nodes), fn(leaves)])
  }

  function execute() {
    return _both((l) => l.execute())
  }

  // Eine Seite nachladen: erst Nodes zu Ende, dann Leaves. Das ViUR-Ende
  // (leere Seite mit derselben Cursor-Marke) erkennt useListFetch.next()
  // selbst und löscht dann seinen Cursor — hier zählt nur der Fortschritt.
  async function _nextOf(list) {
    const before = list.data.value.length
    await list.next()
    return list.data.value.length > before
  }

  async function next() {
    if (nodes.cursor.value && (await _nextOf(nodes))) return
    if (leaves.cursor.value) await _nextOf(leaves)
  }

  /** Alle restlichen Seiten beider Listen laden ("Alles laden"). */
  async function nextAll() {
    while (nodes.cursor.value) {
      if (!(await _nextOf(nodes))) break
    }
    while (leaves.cursor.value) {
      if (!(await _nextOf(leaves))) break
    }
  }

  function filter(newParams) {
    const { skelType: _, ...rest } = newParams
    return _both((l) => l.filter({ ...rest, skelType: l === nodes ? "node" : "leaf" }))
  }

  function open(key) {
    const { skelType: _, cursor: __, ...rest } = nodes.params.value
    return filter({ ...rest, parententry: key })
  }

  function reset() {
    nodes.reset()
    leaves.reset()
  }

  return {
    nodes,
    leaves,
    data,
    structure,
    isFetching,
    isFinished,
    error,
    hasMore,
    complete,
    execute,
    next,
    nextAll,
    filter,
    open,
    reset,
  }
}

export function createControllerFetch({
  endpoint,
  method = "GET",
  secure = false,
  invalidates = false,
  invalidatesAll = false,
} = {}) {
  return (controller, args = "/", data = {}, ctx = {}) => {
    const renderer = ctx.renderer ?? import.meta.env.VITE_DEFAULT_RENDERER ?? "json"
    const {
      version = null,
      lang = null,
      headers = {},
      mode = null,
      skey: ctxSkey = null,
      cached = false,
      ttl = 0,
      immediate = true,
      // extra URL query string/params, appended to the request URL for GET and
      // POST alike (e.g. query carried on a server-provided `follow` URL)
      query = null,
      // feed the message store (when one exists): success/rejected on POST,
      // errors on every method. `false` keeps this request silent.
      messages = true,
    } = ctx

    // Stable cache key: base URL + data params, skey excluded so it stays consistent across requests
    let _cacheKey = null
    let _cachedHit = null

    const fetchReturn = createFetch({
      baseUrl: "",
      fetchOptions: {
        credentials: "include",
        headers: { Accept: "application/json" },
      },
      options: {
        async beforeFetch({ options, url, cancel }) {
          const skeyToken = secure ? ctxSkey || (await fetchSkeyToken(renderer)) : null
          const base = create_url({ controller, endpoint, renderer, version, lang })
          const extraQs = query ? (typeof query === "string" ? query : new URLSearchParams(query).toString()) : ""

          options.method = method
          options.headers = { ...options.headers, ...headers }
          if (mode) options.mode = mode

          if (method.toUpperCase() === "GET") {
            const dataQs = new URLSearchParams(data).toString()
            const qs = [dataQs, extraQs].filter(Boolean).join("&")
            _cacheKey = qs ? `${base}?${qs}` : base

            if (cached) {
              const hit = await getCached(_cacheKey, ttl)
              if (hit) {
                _cachedHit = hit
                cancel()
                return { url, options }
              }
            }

            const finalUrl = skeyToken
              ? `${_cacheKey}${_cacheKey.includes("?") ? "&" : "?"}skey=${skeyToken}`
              : _cacheKey
            return { url: finalUrl, options }
          }

          const formData =
            data instanceof FormData
              ? data
              : (() => {
                  const fd = new FormData()
                  for (const [key, value] of Object.entries(data)) {
                    if (Array.isArray(value)) {
                      value.forEach((item) => {
                        if (item !== null && item !== undefined) fd.append(key, item)
                      })
                    } else if (value !== null && value !== undefined) {
                      fd.append(key, value)
                    }
                  }
                  return fd
                })()
          if (skeyToken) formData.append("skey", skeyToken)
          options.body = formData
          const postUrl = extraQs ? `${base}${base.includes("?") ? "&" : "?"}${extraQs}` : base
          return { url: postUrl, options }
        },
        onFetchError(ctx) {
          ctx.error = new HTTPError(ctx.response?.status, ctx.response?.statusText, ctx.error?.message, ctx.response)
          if (messages) {
            notify(requestMessage({ method, endpoint, module: controllerPath(controller), error: ctx.error }))
          }
          return ctx
        },
        async afterFetch(ctx) {
          // Normalize v1/v2 up to the canonical v2 envelope so downstream
          // consumers (and cache/invalidation below) read the entity from `data`.
          ctx.data = normalizeEnvelope(ctx.data)
          if (messages) {
            const message = requestMessage({ method, endpoint, module: controllerPath(controller), body: ctx.data })
            if (message) notify(message)
          }
          if (cached && method.toUpperCase() === "GET" && _cacheKey) {
            const entityKey = ctx.data?.data?.key
            await setCached(_cacheKey, ctx.data, entityKey ? [entityKey] : [])
          }
          if (invalidates) {
            const keys = []
            if (data.key) keys.push(data.key)
            if (ctx.data?.data?.key) keys.push(ctx.data.data.key)
            if (keys.length) await invalidateByKey(keys)
          }
          if (invalidatesAll) {
            const base = import.meta.env.VITE_API_URL ?? window.location.origin
            const controllerPath = Array.isArray(controller) ? controller.join("/") : controller
            await clearCache(`${base}/${renderer}/${controllerPath}/`)
          }
          return ctx
        },
      },
    })(args, { immediate }).json()

    const _execute = fetchReturn.execute
    fetchReturn.execute = () => executeAndThrow(fetchReturn, _execute)

    // When a cache hit cancelled the fetch, isFinished fires but data is null.
    // Apply the cached value once isFinished becomes true.
    const stop = watch(fetchReturn.isFinished, (finished) => {
      if (finished && _cachedHit !== null) {
        fetchReturn.data.value = _cachedHit
        _cachedHit = null
        stop()
      }
    })

    return fetchReturn
  }
}

/**
 * Upload a file to ViUR.
 * 1. POST /file/getUploadURL  (secure) — get signed upload URL + uploadKey
 * 2. POST uploadUrl           (no-cors) — push raw file bytes to storage
 * 3. POST /file/add           (secure) — register the file in ViUR
 *
 * @param {File} file
 * @param {{ target?: string, publicUpload?: boolean, renderer?: string }} [options]
 * @returns {Promise<object>} values of the newly created file skel
 */
function _toFormData(obj) {
  const fd = new FormData()
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      value.forEach((item) => fd.append(key, item))
    } else if (value !== undefined && value !== null) {
      fd.append(key, value)
    }
  }
  return fd
}

export async function uploadFile(
  file,
  { target = undefined, publicUpload = false, renderer = null, version = null } = {}
) {
  const _renderer = renderer ?? import.meta.env.VITE_DEFAULT_RENDERER ?? "json"
  const fetchOpts = { credentials: "include", headers: { Accept: "application/json" }, method: "POST" }

  // Step 1: get upload URL
  const filedata = {
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size.toString(),
  }
  if (target) filedata.node = target
  if (publicUpload) filedata.public = true
  const fd1 = _toFormData(filedata)
  fd1.append("skey", await fetchSkeyToken(_renderer))

  const getUrlResp = await fetch(
    create_url({ controller: "file", endpoint: "getUploadURL", renderer: _renderer, version }),
    {
      ...fetchOpts,
      body: fd1,
    }
  )
  if (!getUrlResp.ok) throw new Error(`getUploadURL failed: ${getUrlResp.status}`)
  // Envelope-agnostic: v2 carries the payload in `data`, v1 in `values`.
  const getUrlData = normalizeEnvelope(await getUrlResp.json())
  const { uploadUrl, uploadKey } = getUrlData.data ?? getUrlData.values ?? {}

  // Step 2: upload raw bytes to external storage (no-cors, no credentials)
  await fetch(uploadUrl, { method: "POST", body: file, mode: "no-cors" })

  // Step 3: register file in ViUR
  const fd3 = _toFormData({ key: uploadKey, skelType: "leaf" })
  fd3.append("skey", await fetchSkeyToken(_renderer))

  const addResp = await fetch(create_url({ controller: "file", endpoint: "add", renderer: _renderer, version }), {
    ...fetchOpts,
    body: fd3,
  })
  if (!addResp.ok) throw new Error(`file/add failed: ${addResp.status}`)
  const addData = normalizeEnvelope(await addResp.json())
  if (addData.status !== "success") throw new Error(`Upload failed: ${JSON.stringify(addData)}`)
  return addData.data ?? addData.values
}

function _absolute(url) {
  if (
    url &&
    !(url.startsWith("http://") || url.startsWith("https://") || url.startsWith("//") || url.startsWith("data:"))
  ) {
    return (import.meta.env.VITE_API_URL ?? window.location.origin) + url
  }
  return url
}

/**
 * Build a download URL for a file bone value.
 * @param {any} bone - file bone value (object with dest, or raw URL string)
 * @param {boolean} [thumbnail=false] - use thumbnail URL if available
 * @param {string} [renderer]
 * @returns {string|null}
 */
export function downloadUrlFor(bone, thumbnail = false, renderer = import.meta.env.VITE_DEFAULT_RENDERER ?? "json") {
  if (bone && typeof bone === "object" && "dest" in bone) {
    let url
    if (thumbnail && "thumbnail" in bone["dest"]) {
      url = bone["dest"]["thumbnail"]
    } else if ("downloadUrl" in bone["dest"]) {
      url = bone["dest"]["downloadUrl"]
    } else {
      return null
    }
    return url.startsWith("data:") ? url : _absolute(`/${renderer}${url}`)
  }
  return _absolute(bone)
}

/**
 * Build a serving URL for a Google Cloud Storage file.
 * Converts https://<host>.googleusercontent.com/<key> → /file/serve/<host>/<key>[/<size>][/<filename>][?options&download]
 * @param {string} servingurl
 * @param {number|null} [size]
 * @param {string|null} [filename]
 * @param {string} [options=""]
 * @param {boolean} [download=false]
 * @returns {string}
 */
export function serveUrlFor(servingurl, size = null, filename = null, options = "", download = false) {
  const match = servingurl?.match(/^https:\/\/(.*?)\.googleusercontent\.com\/(.*?)$/)
  if (!match) return _absolute(servingurl)

  let url = `/file/serve/${match[1]}/${match[2]}`
  if (size) url += `/${size}`
  if (filename) url += `/${filename}`

  const qs = Object.entries({ options, download })
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${v}`)
  if (qs.length) url += `?${qs.join("&")}`

  return _absolute(url)
}

export function resetState() {
  _skeyCache = []
  _skeyPending = null
  return clearCache()
}

export const useStructureFetch = createControllerFetch({ endpoint: "structure" })
export const useListFetch = createControllerListFetch()
export const useListFetchAll = createControllerListFetch({ all: true })
export const useViewFetch = createControllerFetch({ endpoint: "view" })
export const useEditFetch = createControllerFetch({ endpoint: "edit", method: "POST", secure: true, invalidates: true })
export const useDeleteFetch = createControllerFetch({
  endpoint: "delete",
  method: "POST",
  secure: true,
  invalidates: true,
})
export const useAddFetch = createControllerFetch({
  endpoint: "add",
  method: "POST",
  secure: true,
  invalidatesAll: true,
})

/**
 * Clone an entry. Works for both prototypes:
 * - List: `useCloneFetch("items", "/", { key, ...values })`
 * - Tree: `useCloneFetch("files", "/", { skelType: "node", key, parententry, ...values })`
 * Pass `bounce: true` to validate without writing (returns the clone form).
 */
export const useCloneFetch = createControllerFetch({
  endpoint: "clone",
  method: "POST",
  secure: true,
  invalidatesAll: true,
})

/**
 * Preview an entry without writing it (List prototype only).
 * `usePreviewFetch("items", "/", { ...values })`
 */
export const usePreviewFetch = createControllerFetch({ endpoint: "preview", method: "POST", secure: true })

/**
 * Move a node or leaf to another node (Tree prototype only).
 * `useMoveFetch("files", "/", { skelType: "leaf", key, parentNode, sortindex })`
 * Invalidates the moved entity and all cached lists of the controller, since
 * both the source and destination node listings change.
 */
export const useMoveFetch = createControllerFetch({
  endpoint: "move",
  method: "POST",
  secure: true,
  invalidates: true,
  invalidatesAll: true,
})

/**
 * List the root nodes (repositories) available to the current user (Tree
 * prototype only). The response is a plain array of `{ name, key }`.
 * `useListRootNodesFetch("files")`
 */
export const useListRootNodesFetch = createControllerFetch({ endpoint: "listRootNodes" })
