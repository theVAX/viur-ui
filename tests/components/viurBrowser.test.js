import { describe, it, expect, beforeEach, vi } from "vitest"
import { IDBFactory, IDBKeyRange } from "fake-indexeddb"
import { createApp, defineComponent, h } from "vue"
import { resetState, HTTPError } from "../../src/request/request.js"

// Stub the generic browser: only the `loadNodeChildren` prop is of interest.
let captured = null
vi.mock("../../src/components/Browser/Browser.vue", () => ({
  default: defineComponent({
    props: { loadNodeChildren: { type: Function, default: null } },
    setup(props) {
      captured = props
      return () => h("div")
    },
  }),
}))
vi.mock("vue-i18n", () => ({ useI18n: () => ({ t: (key) => key }) }))

const { default: ViurBrowser } = await import("../../src/components/Browser/ViurBrowser.vue")

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

const nodes = (from, count) => Array.from({ length: count }, (_, i) => ({ key: `n${from + i}`, name: `N${from + i}` }))

// Node level of "parent": page 1 = 99 nodes, page 2 = `secondPage` (or error).
function stubFetch(secondPage) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async (url) => {
      if (url.includes("/structure")) return jsonResponse({ viewNodeSkel: {}, viewLeafSkel: {} })
      if (!url.includes("parententry=parent")) return jsonResponse({ skellist: [], cursor: "", orders: [] })
      if (!url.includes("cursor=")) return jsonResponse({ skellist: nodes(1, 99), cursor: "c1", orders: [] })
      return secondPage === "error"
        ? jsonResponse({}, 500)
        : jsonResponse({ skellist: secondPage, cursor: "", orders: [] })
    })
  )
}

function mountBrowser() {
  const app = createApp(ViurBrowser, { module: "files", rootNode: "root" })
  app.mount(document.createElement("div"))
  return app
}

beforeEach(async () => {
  globalThis.indexedDB = new IDBFactory()
  globalThis.IDBKeyRange = IDBKeyRange
  await resetState()
  vi.restoreAllMocks()
  captured = null
})

describe("ViurBrowser loadNodeChildren", () => {
  it("returns every child node across pages (more than 99)", async () => {
    stubFetch(nodes(100, 2))
    const app = mountBrowser()
    const children = await captured.loadNodeChildren({ key: "parent" })
    expect(children).toHaveLength(101)
    expect(children.at(-1)).toMatchObject({ key: "n101", name: "N101" })
    app.unmount()
  })

  it("rejects when a later page fails instead of returning a partial level", async () => {
    stubFetch("error")
    const app = mountBrowser()
    await expect(captured.loadNodeChildren({ key: "parent" })).rejects.toBeInstanceOf(HTTPError)
    app.unmount()
  })
})
