import { ref, watch } from "vue"
import { createFetch } from "@vueuse/core"
import { getCached, setCached, invalidateByKey, clearCache } from "./cache.js"

export class HTTPError extends Error {
  constructor(statusCode, statusText, message, response = null) {
    super(message || statusText)
    this.statusCode = statusCode
    this.statusText = statusText
    this.response = response
  }
}


function create_url({
  controller,
  endpoint,
  renderer = "json",
  version = null,
  lang = null,
} = {}) {
  if (!controller) {
    throw new Error("Parameter 'controller' is required")
  }
  if (!endpoint) {
    throw new Error("Parameter 'endpoint' is required")
  }

  let url = ""

  if (version) url += `/${version}`
  if (lang) url += `/${lang}`

  url += `/${renderer}`

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
  return (controller, {
    params: initialParams = {},
    group = null,
    url = null,
    renderer = import.meta.env.VITE_DEFAULT_RENDERER ?? "json",
    immediate = true,
    cached = false,
    ttl = 0,
  } = {}) => {
    const data = ref([])       // skellist
    const structure = ref({})
    const cursor = ref("")
    const orders = ref([])
    const params = ref({ ...initialParams })
    let _isNext = false

    function _buildUrl() {
      const base = url ?? create_url({ controller, endpoint: group ? `list/${group}` : "list", renderer })
      const qs = new URLSearchParams()
      for (const [k, v] of Object.entries(params.value)) {
        Array.isArray(v) ? v.forEach(item => qs.append(k, item)) : qs.append(k, v)
      }
      return qs.toString() ? `${base}?${qs}` : base
    }

    async function _fetchStructure() {
      const url = create_url({ controller, endpoint: "structure", renderer })
      const resp = await fetch(url, { credentials: "include", headers: { Accept: "application/json" } })
      if (!resp.ok) return
      const structureData = await resp.json()
      const skeltype = params.value.skelType === "node" ? "viewNodeSkel"
        : params.value.skelType === "leaf" ? "viewLeafSkel"
        : "viewSkel"
      if (structureData[skeltype]) structure.value = structureData[skeltype]
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
          if (cached && !_isNext) {
            const hit = await getCached(url, ttl)
            if (hit) {
              data.value = hit.skellist ?? hit
              cursor.value = hit.cursor ?? ""
              orders.value = hit.orders ?? []
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
          const responseData = ctx.data
          if (!_isNext) {
            await _fetchStructure()
          }
          cursor.value = responseData.cursor ?? ""
          orders.value = responseData.orders ?? []
          data.value = _isNext
            ? data.value.concat(responseData.skellist)
            : responseData.skellist
          if (cached && !_isNext) {
            const entityKeys = (responseData.skellist ?? []).map(s => s.key).filter(Boolean)
            await setCached(ctx.url ?? listUrl.value, responseData, entityKeys)
          }
          ctx.data = data.value
          return ctx
        },
        onFetchError(ctx) {
          ctx.error = new HTTPError(ctx.response?.status, ctx.response?.statusText, ctx.error?.message, ctx.response)
          return ctx
        },
      },
    })

    const { isFetching, isFinished, error, execute: _execute, abort } =
      useViurFetch(listUrl, { immediate }).json()

    const fetchResult = { data, structure, orders, cursor, isFetching, isFinished, error, execute, next, filter, reset }

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

    function next() {
      if (!cursor.value) return Promise.resolve()
      params.value = { ...params.value, cursor: cursor.value }
      _isNext = true
      listUrl.value = _buildUrl()
      return executeAndThrow(fetchResult, _execute)
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

export function createControllerFetch({ endpoint, method = "GET", secure = false, invalidates = false, invalidatesAll = false } = {}) {
  return (controller, data = {}, args = "/", ctx = {}) => {
    const renderer = ctx.renderer ?? import.meta.env.VITE_DEFAULT_RENDERER ?? "json"
    const { version = null, lang = null, headers = {}, mode = null, skey: ctxSkey = null, cached = false, ttl = 0, immediate = true } = ctx

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
          const skeyToken = secure ? (ctxSkey || (await fetchSkeyToken(renderer))) : null
          const base = create_url({ controller, endpoint, renderer, version, lang })

          options.method = method
          options.headers = { ...options.headers, ...headers }
          if (mode) options.mode = mode

          if (method.toUpperCase() === "GET") {
            const qs = new URLSearchParams(data).toString()
            _cacheKey = qs ? `${base}?${qs}` : base

            if (cached) {
              const hit = await getCached(_cacheKey, ttl)
              if (hit) {
                _cachedHit = hit
                cancel()
                return { url, options }
              }
            }

            const finalUrl = skeyToken ? `${_cacheKey}${_cacheKey.includes("?") ? "&" : "?"}skey=${skeyToken}` : _cacheKey
            return { url: finalUrl, options }
          }

          const formData = data instanceof FormData ? data : (() => {
            const fd = new FormData()
            for (const [key, value] of Object.entries(data)) {
              if (Array.isArray(value)) {
                value.forEach(item => { if (item !== null && item !== undefined) fd.append(key, item) })
              } else if (value !== null && value !== undefined) {
                fd.append(key, value)
              }
            }
            return fd
          })()
          if (skeyToken) formData.append("skey", skeyToken)
          options.body = formData
          return { url: base, options }
        },
        onFetchError(ctx) {
          ctx.error = new HTTPError(ctx.response?.status, ctx.response?.statusText, ctx.error?.message, ctx.response)
          return ctx
        },
        async afterFetch(ctx) {
          if (cached && method.toUpperCase() === "GET" && _cacheKey) {
            const entityKey = ctx.data?.values?.key
            await setCached(_cacheKey, ctx.data, entityKey ? [entityKey] : [])
          }
          if (invalidates) {
            const keys = []
            if (data.key) keys.push(data.key)
            if (ctx.data?.values?.key) keys.push(ctx.data.values.key)
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
      value.forEach(item => fd.append(key, item))
    } else if (value !== undefined && value !== null) {
      fd.append(key, value)
    }
  }
  return fd
}

export async function uploadFile(file, { target = undefined, publicUpload = false, renderer = null } = {}) {
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
    create_url({ controller: "file", endpoint: "getUploadURL", renderer: _renderer }),
    { ...fetchOpts, body: fd1 }
  )
  if (!getUrlResp.ok) throw new Error(`getUploadURL failed: ${getUrlResp.status}`)
  const { values: { uploadUrl, uploadKey } } = await getUrlResp.json()

  // Step 2: upload raw bytes to external storage (no-cors, no credentials)
  await fetch(uploadUrl, { method: "POST", body: file, mode: "no-cors" })

  // Step 3: register file in ViUR
  const fd3 = _toFormData({ key: uploadKey, skelType: "leaf" })
  fd3.append("skey", await fetchSkeyToken(_renderer))

  const addResp = await fetch(
    create_url({ controller: "file", endpoint: "add", renderer: _renderer }),
    { ...fetchOpts, body: fd3 }
  )
  if (!addResp.ok) throw new Error(`file/add failed: ${addResp.status}`)
  const addData = await addResp.json()
  if (addData.action !== "addSuccess") throw new Error(`Upload failed: ${JSON.stringify(addData)}`)
  return addData.values
}

function _absolute(url) {
  if (url && !(url.startsWith("http://") || url.startsWith("https://") || url.startsWith("//"))) {
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
    if (thumbnail && "thumbnail" in bone["dest"]) {
      return _absolute(`/${renderer}${bone["dest"]["thumbnail"]}`)
    }
    if ("downloadUrl" in bone["dest"]) {
      return _absolute(`/${renderer}${bone["dest"]["downloadUrl"]}`)
    }
    return null
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

  const qs = Object.entries({ options, download }).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`)
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
export const useDeleteFetch = createControllerFetch({ endpoint: "delete", method: "POST", secure: true, invalidates: true })
export const useAddFetch = createControllerFetch({ endpoint: "add", method: "POST", secure: true, invalidatesAll: true })
