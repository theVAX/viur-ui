import { describe, it, expect, beforeEach, vi } from "vitest"
import { IDBFactory, IDBKeyRange } from "fake-indexeddb"
import { setActivePinia, createPinia } from "pinia"
import { useUserStore } from "../../src/user/store.js"
import { resetState } from "../../src/request/request.js"

// Exercises the user store's session + login flow against the REAL request
// layer (createControllerFetch + normalizeEnvelope + skey batching) with a
// mocked global fetch. Covers both the v2 envelope flow (status/step/follow —
// the primary path) and the classic v1 action-driven flow (fallback).

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
      vi.fn().mockResolvedValue(jsonResponse({ action: "view", values: USER, structure: {}, errors: [] }))
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

  it("non-root user only has explicitly granted rights", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ action: "view", values: { ...USER, access: ["user-view"] }, structure: {}, errors: [] })
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

describe("login flow", () => {
  it("loadLogin auto-forwards to the userpassword form for a single provider", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url) => {
        if (url.includes("/user/view/self")) return jsonResponse({}, 401)
        if (url.includes("/user/login"))
          return jsonResponse({
            action: "select_authentication_provider",
            values: {},
            structure: { provider: { values: { "/json/user/auth_userpassword/login": "Username & Password" } } },
            errors: [],
          })
        return jsonResponse({}, 404)
      })
    )
    const store = useUserStore()
    await store.loadLogin()

    expect(store.state.step).toBe("userpassword")
    expect(store.state.submitUrl).toBe("/json/user/auth_userpassword/login")
  })

  it("presents a chooser when multiple providers (incl. Google) are available", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url) => {
        if (url.includes("/user/view/self")) return jsonResponse({}, 401)
        if (url.includes("/user/login"))
          return jsonResponse({
            action: "select_authentication_provider",
            values: {},
            structure: {
              provider: {
                values: {
                  "/json/user/auth_userpassword/login": "Username & Password",
                  "/json/user/auth_googleaccount/login": "Google",
                },
              },
            },
            errors: [],
          })
        return jsonResponse({}, 404)
      })
    )
    const store = useUserStore()
    await store.loadLogin()

    expect(store.state.step).toBe("provider")
    expect(store.hasGoogle).toBe(true)
    expect(Object.keys(store.passwordProviders)).toEqual(["/json/user/auth_userpassword/login"])
  })

  it("loginWithPassword → login_success loads the user and finishes", async () => {
    let loggedIn = false
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url, opts) => {
        const method = (opts?.method || "GET").toUpperCase()
        if (url.includes("/skey")) return jsonResponse(["sk1", "sk2"])
        if (url.includes("/user/view/self"))
          return loggedIn
            ? jsonResponse({ action: "view", values: USER, structure: {}, errors: [] })
            : jsonResponse({}, 401)
        if (url.includes("/user/login"))
          return jsonResponse({
            action: "select_authentication_provider",
            values: {},
            structure: { provider: { values: { "/json/user/auth_userpassword/login": "Username & Password" } } },
            errors: [],
          })
        if (url.includes("/auth_userpassword/login") && method === "POST") {
          loggedIn = true
          return jsonResponse({ action: "login_success", values: {}, structure: {}, errors: [] })
        }
        return jsonResponse({}, 404)
      })
    )
    const store = useUserStore()
    await store.loadLogin()
    await store.loginWithPassword({ name: "ada@example.com", password: "secret" })

    expect(store.state.step).toBe("done")
    expect(store.isLoggedIn).toBe(true)
    expect(store.state.user.name).toBe("ada@example.com")
  })

  it("loginWithPassword surfaces field errors on wrong credentials", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url, opts) => {
        const method = (opts?.method || "GET").toUpperCase()
        if (url.includes("/skey")) return jsonResponse(["sk1"])
        if (url.includes("/user/view/self")) return jsonResponse({}, 401)
        if (url.includes("/user/login"))
          return jsonResponse({
            action: "select_authentication_provider",
            values: {},
            structure: { provider: { values: { "/json/user/auth_userpassword/login": "Username & Password" } } },
            errors: [],
          })
        if (url.includes("/auth_userpassword/login") && method === "POST")
          return jsonResponse({
            action: "login",
            values: {},
            structure: {},
            errors: [{ severity: 2, fieldPath: "name", errorMessage: "Invalid username or password provided" }],
          })
        return jsonResponse({}, 404)
      })
    )
    const store = useUserStore()
    await store.loadLogin()
    await store.loginWithPassword({ name: "x", password: "y" })

    expect(store.state.step).toBe("userpassword")
    expect(store.state.fieldErrors).toHaveLength(1)
    expect(store.state.fieldErrors[0].fieldPath).toBe("name")
    expect(store.isLoggedIn).toBe(false)
  })

  it("advances to a second factor and completes after OTP", async () => {
    let loggedIn = false
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url, opts) => {
        const method = (opts?.method || "GET").toUpperCase()
        if (url.includes("/skey")) return jsonResponse(["sk1", "sk2", "sk3"])
        if (url.includes("/user/view/self"))
          return loggedIn
            ? jsonResponse({ action: "view", values: USER, structure: {}, errors: [] })
            : jsonResponse({}, 401)
        if (url.includes("/user/login"))
          return jsonResponse({
            action: "select_authentication_provider",
            values: {},
            structure: { provider: { values: { "/json/user/auth_userpassword/login": "Username & Password" } } },
            errors: [],
          })
        if (url.includes("/auth_userpassword/login") && method === "POST")
          // primary ok → server renders the OTP form (params.action_url = submit target)
          return jsonResponse({
            action: "edit",
            structure: { otptoken: { type: "numeric" } },
            params: { action_url: "/json/user/f2_timebasedotp/otp" },
            errors: [],
          })
        if (url.includes("/f2_timebasedotp/otp") && method === "POST") {
          loggedIn = true
          return jsonResponse({ action: "login_success", values: {}, structure: {}, errors: [] })
        }
        return jsonResponse({}, 404)
      })
    )
    const store = useUserStore()
    await store.loadLogin()
    await store.loginWithPassword({ name: "ada@example.com", password: "secret" })

    expect(store.state.step).toBe("secondfactor")
    expect(store.state.submitUrl).toBe("/json/user/f2_timebasedotp/otp")

    await store.submitSecondFactor({ otptoken: "123456" })

    expect(store.state.step).toBe("done")
    expect(store.isLoggedIn).toBe(true)
  })
})

describe("login flow (v2 envelope)", () => {
  it("drives a follow-based v2 flow to status: success", async () => {
    let loggedIn = false
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url, opts) => {
        const method = (opts?.method || "GET").toUpperCase()
        if (url.includes("/skey")) return jsonResponse(["sk1", "sk2"])
        if (url.includes("/user/view/self"))
          return loggedIn
            ? jsonResponse({
                version: 2,
                action: "view",
                status: "success",
                datatype: "entity",
                data: USER,
                errors: [],
              })
            : jsonResponse({}, 401)
        if (url.includes("/user/login"))
          return jsonResponse({
            version: 2,
            action: "login",
            status: "init",
            step: "userpassword",
            steps: { userpassword: { label: "Login" } },
            follow: "/json/v2/user/auth_userpassword",
            datatype: "entity",
            structure: { name: { type: "str" }, password: { type: "password" } },
            data: {},
            errors: [],
          })
        if (url.includes("/auth_userpassword") && method === "POST") {
          loggedIn = true
          return jsonResponse({
            version: 2,
            action: "login",
            status: "success",
            follow: "/dashboard",
            data: {},
            errors: [],
          })
        }
        return jsonResponse({}, 404)
      })
    )
    const store = useUserStore()
    await store.loadLogin()

    expect(store.state.step).toBe("userpassword")
    expect(store.state.submitUrl).toBe("/json/v2/user/auth_userpassword")

    await store.loginWithPassword({ name: "ada@example.com", password: "secret" })

    expect(store.state.step).toBe("done")
    expect(store.isLoggedIn).toBe(true)
  })

  it("follows a v2 continue pivot into the OTP step and finishes", async () => {
    let loggedIn = false
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url, opts) => {
        const method = (opts?.method || "GET").toUpperCase()
        if (url.includes("/skey")) return jsonResponse(["sk1", "sk2", "sk3"])
        if (url.includes("/user/view/self"))
          return loggedIn
            ? jsonResponse({ version: 2, status: "success", data: USER, errors: [] })
            : jsonResponse({}, 401)
        if (url.includes("/user/login"))
          return jsonResponse({
            version: 2,
            action: "login",
            status: "init",
            step: "userpassword",
            follow: "/json/v2/user/auth_userpassword",
            structure: { name: {}, password: {} },
            data: {},
            errors: [],
          })
        if (url.includes("/auth_userpassword") && method === "POST")
          // password accepted, 2FA required → continue + follow, no form in this response
          return jsonResponse({
            version: 2,
            action: "login",
            status: "continue",
            step: "userpassword",
            step_status: "success",
            follow: "/json/v2/user/auth_otp",
            errors: [],
          })
        if (url.includes("/auth_otp") && method === "GET")
          // GET the next step → the OTP form
          return jsonResponse({
            version: 2,
            action: "login",
            status: "continue",
            step: "otp",
            follow: "/json/v2/user/auth_otp",
            structure: { otptoken: { type: "numeric" } },
            data: {},
            errors: [],
          })
        if (url.includes("/auth_otp") && method === "POST") {
          loggedIn = true
          return jsonResponse({ version: 2, action: "login", status: "success", follow: "/dashboard", errors: [] })
        }
        return jsonResponse({}, 404)
      })
    )
    const store = useUserStore()
    await store.loadLogin()
    await store.loginWithPassword({ name: "ada@example.com", password: "secret" })

    expect(store.state.step).toBe("secondfactor")
    expect(store.state.submitUrl).toBe("/json/v2/user/auth_otp")

    await store.submitSecondFactor({ otptoken: "123456" })

    expect(store.state.step).toBe("done")
    expect(store.isLoggedIn).toBe(true)
  })

  it("re-renders the form with field errors on status: rejected", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url, opts) => {
        const method = (opts?.method || "GET").toUpperCase()
        if (url.includes("/skey")) return jsonResponse(["sk1"])
        if (url.includes("/user/view/self")) return jsonResponse({}, 401)
        if (url.includes("/user/login"))
          return jsonResponse({
            version: 2,
            action: "login",
            status: "init",
            step: "userpassword",
            follow: "/json/v2/user/auth_userpassword",
            structure: { name: {}, password: {} },
            data: {},
            errors: [],
          })
        if (url.includes("/auth_userpassword") && method === "POST")
          return jsonResponse({
            version: 2,
            action: "login",
            status: "rejected",
            step: "userpassword",
            follow: "/json/v2/user/auth_userpassword",
            structure: { name: {}, password: {} },
            data: {},
            errors: [{ severity: 2, fieldPath: "password", errorMessage: "Invalid" }],
          })
        return jsonResponse({}, 404)
      })
    )
    const store = useUserStore()
    await store.loadLogin()
    await store.loginWithPassword({ name: "x", password: "y" })

    expect(store.state.step).toBe("userpassword")
    expect(store.state.fieldErrors).toHaveLength(1)
    expect(store.state.fieldErrors[0].fieldPath).toBe("password")
    expect(store.isLoggedIn).toBe(false)
  })
})

describe("logout", () => {
  it("clears the session", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url) => {
        if (url.includes("/skey")) return jsonResponse(["sk1"])
        if (url.includes("/user/logout")) return jsonResponse({ action: "logout_success", values: {}, errors: [] })
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
