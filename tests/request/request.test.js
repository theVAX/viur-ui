import { describe, it, expect, beforeEach, vi } from "vitest"
import { IDBFactory, IDBKeyRange } from "fake-indexeddb"
import {
  useListFetch,
  useListFetchAll,
  useViewFetch,
  useEditFetch,
  useAddFetch,
  useDeleteFetch,
  useStructureFetch,
  createControllerFetch,
  uploadFile,
  resetState,
  HTTPError,
} from "../../src/request/request.js"
import { setCached, clearCache } from "../../src/request/cache.js"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function jsonResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: { get: (k) => (k === "content-type" ? "application/json" : null) },
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    clone() {
      return this
    },
  }
}

async function waitUntilFinished(result, timeout = 3000) {
  await vi.waitFor(
    () => {
      if (!result.isFinished.value) throw new Error("not finished yet")
    },
    { timeout }
  )
}

const BASE = "http://api.test"

// ─── Reset state before each test ─────────────────────────────────────────────

beforeEach(async () => {
  globalThis.indexedDB = new IDBFactory()
  globalThis.IDBKeyRange = IDBKeyRange
  await resetState()
  vi.restoreAllMocks()
})

// ─── HTTPError ─────────────────────────────────────────────────────────────────

describe("HTTPError", () => {
  it("is an Error with statusCode, statusText, response", () => {
    const resp = { ok: false, status: 404 }
    const err = new HTTPError(404, "Not Found", "not there", resp)
    expect(err).toBeInstanceOf(Error)
    expect(err.statusCode).toBe(404)
    expect(err.statusText).toBe("Not Found")
    expect(err.message).toBe("not there")
    expect(err.response).toBe(resp)
  })

  it("uses statusText as message when message is omitted", () => {
    const err = new HTTPError(500, "Internal Server Error")
    expect(err.message).toBe("Internal Server Error")
  })
})

// ─── skey batching ────────────────────────────────────────────────────────────

describe("skey token fetching", () => {
  it("fetches a batch and reuses tokens", async () => {
    const fetchMock = vi.fn().mockImplementation(async (url) => {
      if (url.includes("/skey")) return jsonResponse(["sk1", "sk2", "sk3"])
      return jsonResponse({ action: "editSuccess", values: { key: "k1" } })
    })
    vi.stubGlobal("fetch", fetchMock)

    const r1 = useEditFetch("mod", "/", { key: "k1" })
    const r2 = useEditFetch("mod", "/", { key: "k2" })
    await waitUntilFinished(r1)
    await waitUntilFinished(r2)

    const skeyCalls = fetchMock.mock.calls.filter(([url]) => url.includes("/skey"))
    // Both requests share the same batch — only one skey fetch needed
    expect(skeyCalls.length).toBe(1)
  })

  it("falls back to single skey when batch endpoint returns non-ok", async () => {
    const fetchMock = vi.fn().mockImplementation(async (url) => {
      if (url.includes("/skey?amount=")) return jsonResponse(null, 400)
      if (url.includes("/skey")) return jsonResponse("single-sk")
      return jsonResponse({ action: "editSuccess", values: {} })
    })
    vi.stubGlobal("fetch", fetchMock)

    const result = useEditFetch("mod", "/", {})
    await waitUntilFinished(result)

    const fallbackCall = fetchMock.mock.calls.find(([url]) => url.includes("/skey") && !url.includes("amount="))
    expect(fallbackCall).toBeDefined()
  })
})

// ─── useListFetch ─────────────────────────────────────────────────────────────

describe("useListFetch", () => {
  function makeFetch({ skellist = [], cursor = "", orders = [], viewSkel = {} } = {}) {
    return vi.fn().mockImplementation(async (url) => {
      if (url.includes("/structure")) return jsonResponse({ viewSkel })
      return jsonResponse({ skellist, cursor, orders })
    })
  }

  it("GETs /json/{controller}/list", async () => {
    const fetchMock = makeFetch({ skellist: [{ key: "e1" }] })
    vi.stubGlobal("fetch", fetchMock)

    const result = useListFetch("items", { immediate: false })
    await result.execute()
    await waitUntilFinished(result)

    const listCall = fetchMock.mock.calls.find(([url]) => url.includes("/list"))
    expect(listCall[0]).toContain(`${BASE}/json/items/list`)
    expect(result.data.value).toEqual([{ key: "e1" }])
  })

  it("passes params as query string", async () => {
    const fetchMock = makeFetch()
    vi.stubGlobal("fetch", fetchMock)

    const result = useListFetch("items", { immediate: false, params: { search: "hello", limit: 10 } })
    await result.execute()
    await waitUntilFinished(result)

    const [url] = fetchMock.mock.calls.find(([u]) => u.includes("/list"))
    expect(url).toContain("search=hello")
    expect(url).toContain("limit=10")
  })

  it("uses group in URL: list/{group}", async () => {
    const fetchMock = makeFetch()
    vi.stubGlobal("fetch", fetchMock)

    const result = useListFetch("items", { immediate: false, group: "active" })
    await result.execute()
    await waitUntilFinished(result)

    const [url] = fetchMock.mock.calls.find(([u]) => u.includes("/list/"))
    expect(url).toContain("/list/active")
  })

  it("uses custom url option", async () => {
    const fetchMock = makeFetch()
    vi.stubGlobal("fetch", fetchMock)

    const result = useListFetch("items", { immediate: false, url: `${BASE}/custom/endpoint` })
    await result.execute()
    await waitUntilFinished(result)

    const [url] = fetchMock.mock.calls.find(([u]) => u.includes("/custom/endpoint"))
    expect(url).toContain("/custom/endpoint")
  })

  it("uses custom renderer in URL", async () => {
    const fetchMock = makeFetch()
    vi.stubGlobal("fetch", fetchMock)

    const result = useListFetch("items", { immediate: false, renderer: "xml" })
    await result.execute()
    await waitUntilFinished(result)

    const [url] = fetchMock.mock.calls.find(([u]) => u.includes("/list"))
    expect(url).toContain("/xml/items/list")
  })

  it("immediate: false does not fetch until execute()", async () => {
    const fetchMock = makeFetch()
    vi.stubGlobal("fetch", fetchMock)

    useListFetch("items", { immediate: false })
    await new Promise((r) => setTimeout(r, 50))

    const listCalls = fetchMock.mock.calls.filter(([u]) => u.includes("/list"))
    expect(listCalls.length).toBe(0)
  })

  it("returns structure from /structure endpoint", async () => {
    const viewSkel = { name: { type: "str" }, age: { type: "numeric" } }
    vi.stubGlobal("fetch", makeFetch({ viewSkel }))

    const result = useListFetch("items", { immediate: false })
    await result.execute()
    await waitUntilFinished(result)

    expect(result.structure.value).toEqual(viewSkel)
  })

  it("returns orders from response", async () => {
    vi.stubGlobal("fetch", makeFetch({ orders: ["name asc", "date desc"] }))

    const result = useListFetch("items", { immediate: false })
    await result.execute()
    await waitUntilFinished(result)

    expect(result.orders.value).toEqual(["name asc", "date desc"])
  })

  it("execute() clears data synchronously before new fetch resolves", async () => {
    vi.stubGlobal("fetch", makeFetch({ skellist: [{ key: "e1" }] }))

    const result = useListFetch("items", { immediate: false })
    await result.execute()
    await waitUntilFinished(result)
    expect(result.data.value).toEqual([{ key: "e1" }])

    // execute() clears data synchronously before the new fetch resolves
    result.execute()
    expect(result.data.value).toEqual([])
  })

  it("next() appends data and uses cursor", async () => {
    let callCount = 0
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url) => {
        if (url.includes("/structure")) return jsonResponse({ viewSkel: {} })
        callCount++
        if (callCount === 1) return jsonResponse({ skellist: [{ key: "p1" }], cursor: "page2", orders: [] })
        return jsonResponse({ skellist: [{ key: "p2" }], cursor: "", orders: [] })
      })
    )

    const result = useListFetch("items", { immediate: false })
    await result.execute()
    await waitUntilFinished(result)
    expect(result.cursor.value).toBe("page2")

    await result.next()
    await waitUntilFinished(result)

    expect(result.data.value.map((e) => e.key)).toEqual(["p1", "p2"])
    expect(result.cursor.value).toBe("")
  })

  it("filter() calls execute() with new params", async () => {
    const fetchMock = makeFetch()
    vi.stubGlobal("fetch", fetchMock)

    const result = useListFetch("items", { immediate: false })
    await result.filter({ category: "books" })
    await waitUntilFinished(result)

    const [url] = fetchMock.mock.calls.find(([u]) => u.includes("/list"))
    expect(url).toContain("category=books")
  })

  it("reset() clears state without fetching", async () => {
    vi.stubGlobal("fetch", makeFetch({ skellist: [{ key: "e1" }] }))

    const result = useListFetch("items", { immediate: false })
    await result.execute()
    await waitUntilFinished(result)

    result.reset()
    expect(result.data.value).toEqual([])
    expect(result.cursor.value).toBe("")
    expect(result.orders.value).toEqual([])
  })

  it("cached: true stores response and serves cache hit", async () => {
    const fetchMock = makeFetch({ skellist: [{ key: "cached1" }] })
    vi.stubGlobal("fetch", fetchMock)

    // First fetch populates cache
    const r1 = useListFetch("items", { immediate: false, cached: true, ttl: 3600 })
    await r1.execute()
    await waitUntilFinished(r1)
    expect(r1.data.value).toEqual([{ key: "cached1" }])

    const firstCallCount = fetchMock.mock.calls.filter(([u]) => u.includes("/list")).length

    // Second instance should hit cache, not fetch
    const r2 = useListFetch("items", { immediate: false, cached: true, ttl: 3600 })
    await r2.execute()
    await waitUntilFinished(r2)
    expect(r2.data.value).toEqual([{ key: "cached1" }])

    const secondCallCount = fetchMock.mock.calls.filter(([u]) => u.includes("/list")).length
    expect(secondCallCount).toBe(firstCallCount) // no additional list fetch
  })

  it("execute() rejects with HTTPError on non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url) => {
        if (url.includes("/structure")) return jsonResponse({ viewSkel: {} })
        return jsonResponse({}, 404)
      })
    )

    const result = useListFetch("items", { immediate: false })
    await expect(result.execute()).rejects.toBeInstanceOf(HTTPError)
    expect(result.error.value).toBeInstanceOf(HTTPError)
    expect(result.error.value.statusCode).toBe(404)
  })
})

// ─── useListFetchAll ──────────────────────────────────────────────────────────

describe("useListFetchAll", () => {
  it("auto-fetches all pages until cursor is empty", async () => {
    let page = 0
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url) => {
        if (url.includes("/structure")) return jsonResponse({ viewSkel: {} })
        page++
        if (page === 1) return jsonResponse({ skellist: [{ key: "p1" }], cursor: "next", orders: [] })
        if (page === 2) return jsonResponse({ skellist: [{ key: "p2" }], cursor: "next2", orders: [] })
        return jsonResponse({ skellist: [{ key: "p3" }], cursor: "", orders: [] })
      })
    )

    const result = useListFetchAll("items", { immediate: false })
    result.execute()

    await vi.waitFor(
      () => {
        if (result.cursor.value !== "" || result.data.value.length < 3) throw new Error("not done")
      },
      { timeout: 5000 }
    )

    expect(result.data.value.map((e) => e.key)).toEqual(["p1", "p2", "p3"])
  })
})

// ─── useViewFetch ─────────────────────────────────────────────────────────────

describe("useViewFetch", () => {
  it("GETs /json/{controller}/view with data params as query string", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ values: { key: "v1", name: "Test" } }))
    vi.stubGlobal("fetch", fetchMock)

    const result = useViewFetch("items", "/", { key: "v1" })
    await waitUntilFinished(result)

    const [url] = fetchMock.mock.calls[0]
    expect(url).toContain(`${BASE}/json/items/view`)
    expect(url).toContain("key=v1")
  })

  it("cached: true returns cache hit without re-fetching", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ values: { key: "cv1" } }))
    vi.stubGlobal("fetch", fetchMock)

    const r1 = useViewFetch("items", "/", { key: "cv1" }, { cached: true, ttl: 3600 })
    await waitUntilFinished(r1)
    // body is normalized to the canonical v2 envelope: entity payload in `data`
    expect(r1.data.value.data).toEqual({ key: "cv1" })
    expect(r1.data.value.version).toBe(2)

    const callCountAfterFirst = fetchMock.mock.calls.length

    const r2 = useViewFetch("items", "/", { key: "cv1" }, { cached: true, ttl: 3600 })
    await waitUntilFinished(r2)
    expect(r2.data.value.data).toEqual({ key: "cv1" })
    expect(fetchMock.mock.calls.length).toBe(callCountAfterFirst) // no new fetch
  })

  it("sets HTTPError on non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 404)))

    const result = useViewFetch("items", "/", { key: "missing" })
    await waitUntilFinished(result)

    expect(result.error.value).toBeInstanceOf(HTTPError)
    expect(result.error.value.statusCode).toBe(404)
  })

  it("execute() rejects with HTTPError on non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 404)))

    const result = useViewFetch("items", "/", { key: "missing" }, { immediate: false })
    await expect(result.execute()).rejects.toBeInstanceOf(HTTPError)
    expect(result.error.value).toBeInstanceOf(HTTPError)
    expect(result.error.value.statusCode).toBe(404)
  })
})

// ─── useStructureFetch ────────────────────────────────────────────────────────

describe("useStructureFetch", () => {
  it("GETs /json/{controller}/structure", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ viewSkel: { title: { type: "str" } } }))
    vi.stubGlobal("fetch", fetchMock)

    const result = useStructureFetch("items", "/")
    await waitUntilFinished(result)

    const [url] = fetchMock.mock.calls[0]
    expect(url).toContain(`${BASE}/json/items/structure`)
  })
})

// ─── useEditFetch ─────────────────────────────────────────────────────────────

describe("useEditFetch", () => {
  it("POSTs FormData with skey to /json/{controller}/edit", async () => {
    const fetchMock = vi.fn().mockImplementation(async (url) => {
      if (url.includes("/skey")) return jsonResponse(["sk-edit"])
      return jsonResponse({ action: "editSuccess", values: { key: "k1" } })
    })
    vi.stubGlobal("fetch", fetchMock)

    const result = useEditFetch("items", "/", { key: "k1", name: "Updated" })
    await waitUntilFinished(result)

    const [editUrl, editOptions] = fetchMock.mock.calls.find(([u]) => u.includes("/edit"))
    expect(editUrl).toContain(`${BASE}/json/items/edit`)
    expect(editOptions.method).toBe("POST")
    expect(editOptions.body).toBeInstanceOf(FormData)
    expect(editOptions.body.get("skey")).toBe("sk-edit")
    expect(editOptions.body.get("name")).toBe("Updated")
  })

  it("invalidates cache by entity key after success", async () => {
    // Pre-populate cache
    await setCached(`${BASE}/json/items/view?key=k1`, { values: { key: "k1" } }, ["k1"])
    expect(
      await import("../../src/request/cache.js").then((m) => m.getCached(`${BASE}/json/items/view?key=k1`, 0))
    ).not.toBeNull()

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url) => {
        if (url.includes("/skey")) return jsonResponse(["sk-inv"])
        return jsonResponse({ action: "editSuccess", values: { key: "k1" } })
      })
    )

    const result = useEditFetch("items", "/", { key: "k1" })
    await waitUntilFinished(result)

    const cached = await import("../../src/request/cache.js").then((m) =>
      m.getCached(`${BASE}/json/items/view?key=k1`, 0)
    )
    expect(cached).toBeNull()
  })

  it("sends credentials: include", async () => {
    const fetchMock = vi.fn().mockImplementation(async (url) => {
      if (url.includes("/skey")) return jsonResponse(["sk"])
      return jsonResponse({ action: "editSuccess", values: {} })
    })
    vi.stubGlobal("fetch", fetchMock)

    const result = useEditFetch("items", "/", {})
    await waitUntilFinished(result)

    const [, options] = fetchMock.mock.calls.find(([u]) => u.includes("/edit"))
    expect(options.credentials).toBe("include")
  })

  it("null values are omitted from FormData", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url) => {
        if (url.includes("/skey")) return jsonResponse(["sk"])
        return jsonResponse({ action: "editSuccess", values: {} })
      })
    )

    const result = useEditFetch("items", "/", { name: "x", emptyField: null })
    await waitUntilFinished(result)

    const [, options] = vi.mocked(globalThis.fetch).mock.calls.find(([u]) => u.includes("/edit"))
    // null should not appear as the string "null"
    expect(options.body.get("emptyField")).toBeNull()
    expect(options.body.get("name")).toBe("x")
  })
})

// ─── useAddFetch ──────────────────────────────────────────────────────────────

describe("useAddFetch", () => {
  it("POSTs to /json/{controller}/add with skey", async () => {
    const fetchMock = vi.fn().mockImplementation(async (url) => {
      if (url.includes("/skey")) return jsonResponse(["sk-add"])
      return jsonResponse({ action: "addSuccess", values: { key: "new-key" } })
    })
    vi.stubGlobal("fetch", fetchMock)

    const result = useAddFetch("items", "/", { name: "New Item" })
    await waitUntilFinished(result)

    const [addUrl, addOptions] = fetchMock.mock.calls.find(([u]) => u.includes("/add"))
    expect(addUrl).toContain(`${BASE}/json/items/add`)
    expect(addOptions.body.get("skey")).toBe("sk-add")
  })

  it("clears cache by controller prefix after success", async () => {
    const listKey = `${BASE}/json/items/list`
    await setCached(listKey, { skellist: [] }, [])

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url) => {
        if (url.includes("/skey")) return jsonResponse(["sk-add"])
        return jsonResponse({ action: "addSuccess", values: { key: "new-key" } })
      })
    )

    const result = useAddFetch("items", "/", { name: "New" })
    await waitUntilFinished(result)

    const cached = await import("../../src/request/cache.js").then((m) => m.getCached(listKey, 0))
    expect(cached).toBeNull()
  })
})

// ─── useDeleteFetch ───────────────────────────────────────────────────────────

describe("useDeleteFetch", () => {
  it("POSTs to /json/{controller}/delete with skey and invalidates", async () => {
    const viewKey = `${BASE}/json/items/view?key=del1`
    await setCached(viewKey, { values: { key: "del1" } }, ["del1"])

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url) => {
        if (url.includes("/skey")) return jsonResponse(["sk-del"])
        return jsonResponse({ action: "deleteSuccess", values: { key: "del1" } })
      })
    )

    const result = useDeleteFetch("items", "/", { key: "del1" })
    await waitUntilFinished(result)

    const [delUrl] = vi.mocked(globalThis.fetch).mock.calls.find(([u]) => u.includes("/delete"))
    expect(delUrl).toContain(`${BASE}/json/items/delete`)

    const cached = await import("../../src/request/cache.js").then((m) => m.getCached(viewKey, 0))
    expect(cached).toBeNull()
  })
})

// ─── createControllerFetch options ───────────────────────────────────────────

describe("createControllerFetch options", () => {
  it("version: adds version segment to URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ values: {} }))
    vi.stubGlobal("fetch", fetchMock)

    const useFetch = createControllerFetch({ endpoint: "view" })
    const result = useFetch("items", "/", {}, { version: "v2" })
    await waitUntilFinished(result)

    const [url] = fetchMock.mock.calls[0]
    expect(url).toContain("/v2/")
  })

  it("query: appends extra query string to a GET url", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ values: {} }))
    vi.stubGlobal("fetch", fetchMock)

    const useFetch = createControllerFetch({ endpoint: "view" })
    const result = useFetch("items", "/", {}, { query: "token=abc&foo=bar" })
    await waitUntilFinished(result)

    const [url] = fetchMock.mock.calls[0]
    expect(url).toContain("token=abc")
    expect(url).toContain("foo=bar")
  })

  it("query: appends to a POST url without leaking into the body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ action: "editSuccess", values: {} }))
    vi.stubGlobal("fetch", fetchMock)

    // secure defaults to false here → no skey fetch
    const useFetch = createControllerFetch({ endpoint: "edit", method: "POST" })
    const result = useFetch("items", "/", { name: "x" }, { query: "token=abc" })
    await waitUntilFinished(result)

    const [url, options] = fetchMock.mock.calls.find(([u]) => u.includes("/edit"))
    expect(url).toContain("token=abc")
    expect(options.body).toBeInstanceOf(FormData)
    expect(options.body.get("name")).toBe("x")
    expect(options.body.get("token")).toBeNull() // query stays in the URL, not the body
  })

  it("lang: adds lang segment to URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ values: {} }))
    vi.stubGlobal("fetch", fetchMock)

    const useFetch = createControllerFetch({ endpoint: "view" })
    const result = useFetch("items", "/", {}, { lang: "de" })
    await waitUntilFinished(result)

    const [url] = fetchMock.mock.calls[0]
    expect(url).toContain("/de/")
  })

  it("renderer: uses custom renderer in URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ values: {} }))
    vi.stubGlobal("fetch", fetchMock)

    const useFetch = createControllerFetch({ endpoint: "view" })
    const result = useFetch("items", "/", {}, { renderer: "vi" })
    await waitUntilFinished(result)

    const [url] = fetchMock.mock.calls[0]
    expect(url).toContain("/vi/items/view")
  })

  it("headers: custom headers are merged into request", async () => {
    const fetchMock = vi.fn().mockImplementation(async (url) => {
      if (url.includes("/skey")) return jsonResponse(["sk"])
      return jsonResponse({ action: "editSuccess", values: {} })
    })
    vi.stubGlobal("fetch", fetchMock)

    const useFetch = createControllerFetch({ endpoint: "edit", method: "POST", secure: true })
    const result = useFetch("items", "/", {}, { headers: { "X-Custom": "test-value" } })
    await waitUntilFinished(result)

    const [, options] = fetchMock.mock.calls.find(([u]) => u.includes("/edit"))
    expect(options.headers["X-Custom"]).toBe("test-value")
  })

  it("mode: sets fetch mode option", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ values: {} }))
    vi.stubGlobal("fetch", fetchMock)

    const useFetch = createControllerFetch({ endpoint: "view" })
    const result = useFetch("items", "/", {}, { mode: "cors" })
    await waitUntilFinished(result)

    const [, options] = fetchMock.mock.calls[0]
    expect(options.mode).toBe("cors")
  })

  it("controller as array: joins with slashes", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ values: {} }))
    vi.stubGlobal("fetch", fetchMock)

    const useFetch = createControllerFetch({ endpoint: "view" })
    const result = useFetch(["category", "items"], "/")
    await waitUntilFinished(result)

    const [url] = fetchMock.mock.calls[0]
    expect(url).toContain("/json/category/items/view")
  })
})

// ─── uploadFile ───────────────────────────────────────────────────────────────

describe("uploadFile", () => {
  it("performs three-step upload: getUploadURL → storage → file/add", async () => {
    const uploadUrl = "https://storage.googleapis.com/upload/abc"
    const fetchMock = vi.fn().mockImplementation(async (url) => {
      if (url.includes("/skey")) return jsonResponse(["sk1", "sk2", "sk3", "sk4"])
      if (url.includes("/getUploadURL")) return jsonResponse({ values: { uploadUrl, uploadKey: "upload-key" } })
      if (url.includes("/file/add"))
        return jsonResponse({ action: "addSuccess", values: { key: "file-key", name: "test.jpg" } })
      // storage upload (no-cors)
      return { ok: true, status: 200, json: () => Promise.resolve(null) }
    })
    vi.stubGlobal("fetch", fetchMock)

    const file = new File(["hello"], "test.jpg", { type: "image/jpeg" })
    const values = await uploadFile(file)

    expect(values).toEqual({ key: "file-key", name: "test.jpg" })

    const urlCalls = fetchMock.mock.calls.map(([u]) => u)
    expect(urlCalls.some((u) => u.includes("/getUploadURL"))).toBe(true)
    expect(urlCalls.some((u) => u === uploadUrl)).toBe(true)
    expect(urlCalls.some((u) => u.includes("/file/add"))).toBe(true)
  })

  it("uses no-cors mode for storage upload", async () => {
    const fetchMock = vi.fn().mockImplementation(async (url, opts) => {
      if (url.includes("/skey")) return jsonResponse(["sk1", "sk2", "sk3", "sk4"])
      if (url.includes("/getUploadURL"))
        return jsonResponse({ values: { uploadUrl: "https://storage.example.com/upload", uploadKey: "k" } })
      if (url.includes("/file/add")) return jsonResponse({ action: "addSuccess", values: {} })
      return { ok: true, status: 200, json: () => Promise.resolve(null) }
    })
    vi.stubGlobal("fetch", fetchMock)

    const file = new File(["data"], "file.bin", { type: "application/octet-stream" })
    await uploadFile(file)

    const storageCall = fetchMock.mock.calls.find(([u]) => u.includes("storage.example.com"))
    expect(storageCall[1].mode).toBe("no-cors")
  })

  it("passes target and publicUpload to getUploadURL", async () => {
    const fetchMock = vi.fn().mockImplementation(async (url) => {
      if (url.includes("/skey")) return jsonResponse(["sk1", "sk2", "sk3", "sk4"])
      if (url.includes("/getUploadURL"))
        return jsonResponse({ values: { uploadUrl: "https://storage.example.com/upload", uploadKey: "k" } })
      if (url.includes("/file/add")) return jsonResponse({ action: "addSuccess", values: {} })
      return { ok: true, status: 200, json: () => Promise.resolve(null) }
    })
    vi.stubGlobal("fetch", fetchMock)

    const file = new File(["x"], "x.txt", { type: "text/plain" })
    await uploadFile(file, { target: "node-key", publicUpload: true })

    const [, opts] = fetchMock.mock.calls.find(([u]) => u.includes("/getUploadURL"))
    expect(opts.body.get("node")).toBe("node-key")
    expect(opts.body.get("public")).toBe("true")
  })

  it("throws when getUploadURL fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url) => {
        if (url.includes("/skey")) return jsonResponse(["sk1", "sk2"])
        return { ok: false, status: 500, json: () => Promise.resolve(null) }
      })
    )

    const file = new File(["x"], "x.txt")
    await expect(uploadFile(file)).rejects.toThrow("getUploadURL failed")
  })
})
