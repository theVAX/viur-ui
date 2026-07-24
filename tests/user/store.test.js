import { describe, it, expect, beforeEach, vi } from "vitest"
import { IDBFactory, IDBKeyRange } from "fake-indexeddb"
import { setActivePinia, createPinia } from "pinia"
import { useUserStore } from "../../src/user/store.js"
import { resetState } from "../../src/request/request.js"

// The user store owns the SESSION + Google sign-in. The multi-step login FLOW
// itself is driven by <ViForm multistep> (its engine is covered by
// tests/forms/formFlow.test.js). These tests hit the REAL request layer
// (createControllerFetch + normalizeEnvelope + skey batching) via a mocked
// global fetch, using v2-envelope responses.

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

const USER = {
  key: "u1",
  name: "ada@example.com",
  firstname: "Ada",
  lastname: "Lovelace",
  access: ["root", "user-view"],
}

beforeEach(async () => {
  globalThis.indexedDB = new IDBFactory()
  globalThis.IDBKeyRange = IDBKeyRange
  setActivePinia(createPinia())
  await resetState()
  vi.restoreAllMocks()
})

describe("session", () => {
  it("fetchSelf populates the user and derives access getters", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ version: 2, action: "view", status: "success", data: USER, errors: [] }))
    )
    const store = useUserStore()
    await store.fetchSelf()

    expect(store.isLoggedIn).toBe(true)
    expect(store.state.user.name).toBe("ada@example.com")
    expect(store.isRoot).toBe(true)
    expect(store.isAdmin).toBe(true)
    expect(store.hasAccess("user-view")).toBe(true)
    expect(store.hasAccess("anything")).toBe(true) // root ⇒ all rights
    expect(store.shortName).toBe("A. Lovelace")
  })

  it("fetchSelf treats 401 as anonymous", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 401)))
    const store = useUserStore()
    await store.fetchSelf()

    expect(store.state.status).toBe("anonymous")
    expect(store.isLoggedIn).toBe(false)
    expect(store.access).toEqual([])
  })

  it("still consumes a classic v1 self response (values → data)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ action: "view", values: USER, structure: {}, errors: [] }))
    )
    const store = useUserStore()
    await store.fetchSelf()

    expect(store.isLoggedIn).toBe(true)
    expect(store.state.user.name).toBe("ada@example.com")
  })

  it("non-root user only has explicitly granted rights", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ version: 2, status: "success", data: { ...USER, access: ["user-view"] }, errors: [] })
        )
    )
    const store = useUserStore()
    await store.fetchSelf()

    expect(store.isRoot).toBe(false)
    expect(store.isAdmin).toBe(false)
    expect(store.hasAccess("user-view")).toBe(true)
    expect(store.hasAccess("user-edit")).toBe(false)
  })
})

describe("google sign-in", () => {
  it("posts the id-token and loads the session on success", async () => {
    let loggedIn = false
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url, opts) => {
        const method = (opts?.method || "GET").toUpperCase()
        if (url.includes("/skey")) return jsonResponse(["sk1"])
        if (url.includes("/user/view/self"))
          return loggedIn
            ? jsonResponse({ version: 2, status: "success", data: USER, errors: [] })
            : jsonResponse({}, 401)
        if (url.includes("/auth_googleaccount/login") && method === "POST") {
          loggedIn = true
          return jsonResponse({ version: 2, action: "login", status: "success", data: {}, errors: [] })
        }
        return jsonResponse({}, 404)
      })
    )
    const store = useUserStore()
    const body = await store.loginWithGoogle("id-token")

    expect(body.status).toBe("success")
    expect(store.isLoggedIn).toBe(true)
    expect(store.state.user.name).toBe("ada@example.com")
  })

  it("returns a follow for a second-factor handoff without logging in", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url, opts) => {
        const method = (opts?.method || "GET").toUpperCase()
        if (url.includes("/skey")) return jsonResponse(["sk1"])
        if (url.includes("/auth_googleaccount/login") && method === "POST")
          return jsonResponse({
            version: 2,
            action: "login",
            status: "continue",
            follow: "/json/v2/user/auth_otp",
            errors: [],
          })
        return jsonResponse({}, 404)
      })
    )
    const store = useUserStore()
    const body = await store.loginWithGoogle("id-token")

    expect(body.status).toBe("continue")
    expect(body.follow).toBe("/json/v2/user/auth_otp")
    expect(store.isLoggedIn).toBe(false)
  })

  it("returns null on a transport error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url) => {
        if (url.includes("/skey")) return jsonResponse(["sk1"])
        return jsonResponse({}, 500)
      })
    )
    const store = useUserStore()
    const body = await store.loginWithGoogle("id-token")

    expect(body).toBeNull()
    expect(store.isLoggedIn).toBe(false)
  })
})

describe("logout", () => {
  it("clears the session", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url) => {
        if (url.includes("/skey")) return jsonResponse(["sk1"])
        if (url.includes("/user/logout"))
          return jsonResponse({ version: 2, action: "logout", status: "success", errors: [] })
        return jsonResponse({}, 404)
      })
    )
    const store = useUserStore()
    store.state.user = { ...USER }
    store.state.status = "authenticated"

    await store.logout()

    expect(store.state.user).toBeNull()
    expect(store.state.status).toBe("anonymous")
    expect(store.isLoggedIn).toBe(false)
  })
})
