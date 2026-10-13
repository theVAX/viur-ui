import { it, expect, vi } from "vitest"

// A browser that refuses IndexedDB (or Node/SSR without it) must not break requests.
globalThis.indexedDB = {
  open() {
    throw new Error("IndexedDB blocked")
  },
}

const { useEditFetch } = await import("../../src/request/request.js")
const cache = await import("../../src/request/cache.js")

function jsonResponse(data) {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    headers: { get: (k) => (k === "content-type" ? "application/json" : null) },
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    clone() {
      return this
    },
  }
}

it("an edit succeeds although the cache can't be updated", async () => {
  vi.spyOn(console, "warn").mockImplementation(() => {})
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async (url) => {
      if (url.includes("/skey")) return jsonResponse(["sk"])
      return jsonResponse({ action: "editSuccess", values: { key: "k1" } })
    })
  )

  const result = useEditFetch("items", "/", { key: "k1", name: "x" })

  await expect(result.execute()).resolves.not.toThrow()
  expect(result.error.value).toBeNull()
})

it("without IndexedDB the cache does nothing", async () => {
  delete globalThis.indexedDB

  expect(await cache.getCached("x")).toBeNull()
  await expect(cache.setCached("x", {})).resolves.toBeUndefined()
  await expect(cache.invalidateByKey("k")).resolves.toBeUndefined()
  await expect(cache.clearCache()).resolves.toBeUndefined()
})
