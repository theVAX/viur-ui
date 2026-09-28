import { describe, it, expect, beforeEach, vi } from "vitest"
import { setActivePinia, createPinia } from "pinia"
import { useConfigStore, canAccessAdminConfig } from "../../src/request/configStore.js"

function jsonResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: () => Promise.resolve(data),
  }
}

const BASE = "http://api.test"

const PUBLIC = {
  configuration: {
    "admin.name": "My App",
    "admin.user.google.clientID": "google-123",
    "admin.language": "de",
    "admin.languages": ["de", "en"],
  },
}

const ADMIN = {
  ...PUBLIC,
  configuration: {
    ...PUBLIC.configuration,
    "admin.modules.groups": { shop: { name: "Shop", sortIndex: 1 } },
  },
  version: [3, 9, 0, null],
  modules: {
    user: { name: "User", handler: "list" },
    "shop.order": {
      name: "Orders",
      handler: "list",
      moduleGroup: "shop",
      views: [{ name: "Paid", group: "paid" }],
    },
  },
}

const ROOT_USER = { key: "u1", access: ["root"] }
const ADMIN_USER = { key: "u2", access: ["admin", "user-view"] }
const PLAIN_USER = { key: "u3", access: ["user-view"] }

beforeEach(() => {
  setActivePinia(createPinia())
  vi.restoreAllMocks()
})

describe("canAccessAdminConfig", () => {
  it("is true for admin or root, false otherwise", () => {
    expect(canAccessAdminConfig(ROOT_USER)).toBe(true)
    expect(canAccessAdminConfig(ADMIN_USER)).toBe(true)
    expect(canAccessAdminConfig(PLAIN_USER)).toBe(false)
    expect(canAccessAdminConfig(null)).toBe(false)
    expect(canAccessAdminConfig({})).toBe(false)
  })
})

describe("fetchConfig (anonymous)", () => {
  it("GETs /vi/config and exposes the public settings", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(PUBLIC))
    vi.stubGlobal("fetch", fetchMock)

    const store = useConfigStore()
    expect(store.isLoaded).toBe(false)
    await store.fetchConfig()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe(`${BASE}/vi/config`)
    expect(options.credentials).toBe("include")

    expect(store.state.status).toBe("public")
    expect(store.isLoaded).toBe(true)
    expect(store.isAdminLoaded).toBe(false)
    expect(store.googleClientId).toBe("google-123")
    expect(store.hasGoogleLogin).toBe(true)
    expect(store.language).toBe("de")
    expect(store.languages).toEqual(["de", "en"])
    expect(store.state.modules).toBeNull()
    expect(store.moduleNames).toEqual([])
  })

  it("get() reads settings with or without the admin. prefix", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(PUBLIC)))
    const store = useConfigStore()
    await store.fetchConfig()

    expect(store.get("admin.name")).toBe("My App")
    expect(store.get("name")).toBe("My App")
    expect(store.get("user.google.clientID")).toBe("google-123")
    expect(store.get("missing", "fallback")).toBe("fallback")
  })

  it("has no google login when the server does not advertise a client id", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ configuration: { "admin.language": "en" } })))
    const store = useConfigStore()
    await store.fetchConfig()
    expect(store.googleClientId).toBeNull()
    expect(store.hasGoogleLogin).toBe(false)
  })

  it("shares one request between concurrent calls", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(PUBLIC))
    vi.stubGlobal("fetch", fetchMock)
    const store = useConfigStore()
    await Promise.all([store.fetchConfig(), store.fetchConfig(), store.fetchConfig()])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("sets status error and rejects on a failed request", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 500)))
    const store = useConfigStore()
    await expect(store.fetchConfig()).rejects.toThrow(/500/)
    expect(store.state.status).toBe("error")
    expect(store.state.error).toBeInstanceOf(Error)
  })

  it("configure({ renderer }) changes the endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(PUBLIC))
    vi.stubGlobal("fetch", fetchMock)
    const store = useConfigStore()
    store.configure({ renderer: "admin" })
    await store.fetchConfig()
    expect(fetchMock.mock.calls[0][0]).toBe(`${BASE}/admin/config`)
  })
})

describe("fetchConfig({ user }) after login", () => {
  it("re-fetches for admin/root and fills modules + version", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(PUBLIC)) // anonymous, before login
      .mockResolvedValueOnce(jsonResponse(ADMIN)) // after login
    vi.stubGlobal("fetch", fetchMock)

    const store = useConfigStore()
    await store.fetchConfig()
    await store.fetchConfig({ user: ROOT_USER })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(store.state.status).toBe("admin")
    expect(store.isAdminLoaded).toBe(true)
    expect(store.state.version).toEqual([3, 9, 0, null])
    expect(store.moduleNames).toEqual(["user", "shop.order"])
    expect(store.module("shop.order")).toMatchObject({ name: "Orders", handler: "list", moduleGroup: "shop" })
    expect(store.module("nope")).toBeNull()
    // public part is still there
    expect(store.googleClientId).toBe("google-123")
  })

  it("skips the request for a user without admin/root rights", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(PUBLIC))
    vi.stubGlobal("fetch", fetchMock)

    const store = useConfigStore()
    await store.fetchConfig()
    const result = await store.fetchConfig({ user: PLAIN_USER })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(result).toBe(store.state)
    expect(store.state.status).toBe("public")
  })

  it("skips the request for a null user", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(PUBLIC))
    vi.stubGlobal("fetch", fetchMock)
    const store = useConfigStore()
    await store.fetchConfig({ user: null })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("does not re-fetch when the admin part is already loaded unless forced", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(ADMIN))
    vi.stubGlobal("fetch", fetchMock)

    const store = useConfigStore()
    await store.fetchConfig({ user: ADMIN_USER })
    await store.fetchConfig({ user: ADMIN_USER })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await store.fetchConfig({ user: ADMIN_USER, force: true })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("drops admin data when a later anonymous answer arrives (logout)", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse(ADMIN)).mockResolvedValueOnce(jsonResponse(PUBLIC))
    vi.stubGlobal("fetch", fetchMock)

    const store = useConfigStore()
    await store.fetchConfig({ user: ROOT_USER })
    expect(store.isAdminLoaded).toBe(true)

    await store.fetchConfig()
    expect(store.state.status).toBe("public")
    expect(store.state.modules).toBeNull()
    expect(store.state.version).toBeNull()
  })

  it("reset() clears everything", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(ADMIN)))
    const store = useConfigStore()
    await store.fetchConfig({ user: ROOT_USER })
    store.reset()
    expect(store.state.status).toBe("unknown")
    expect(store.state.configuration).toEqual({})
    expect(store.state.modules).toBeNull()
    expect(store.isLoaded).toBe(false)
  })
})

describe("module tree", () => {
  it("liest die Gruppen unter dem Schlüssel von viur-core (admin.module.groups)", async () => {
    // viur-core rendert conf.admin.module_groups als "admin.module.groups".
    const store = useConfigStore()
    store.state.configuration = {
      "admin.module.groups": { bones: { name: "Bones", icon: "list", sortIndex: 2000 } },
    }
    store.state.modules = { boolean: { name: "Boolean", handler: "list", moduleGroup: "bones" } }
    store.setAccess(["root"])

    expect(store.groups).toEqual({ bones: { name: "Bones", icon: "list", sortIndex: 2000 } })
    expect(store.navigationTree).toHaveLength(1)
    expect(store.navigationTree[0]).toMatchObject({ type: "group", name: "Bones" })
    expect(store.navigationTree[0].children.map((c) => c.name)).toEqual(["Boolean"])
  })

  it("builds navigation tree and lookup from modules + admin.modules.groups", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(ADMIN)))
    const store = useConfigStore()
    await store.fetchConfig({ user: ROOT_USER })

    expect(store.groups).toEqual({ shop: { name: "Shop", sortIndex: 1 } })
    expect(store.moduleTree.map((n) => n.key)).toEqual(["group:shop", "user"])
    expect(store.navigationTree.map((n) => n.key)).toEqual(["group:shop", "user"])
    expect(Object.keys(store.moduleLookup).sort()).toEqual(["group:shop", "shop.order", "shop.order#0", "user"])
    expect(store.moduleNode("shop.order").name).toBe("Orders")
    expect(store.moduleNode("shop/order", "paid").name).toBe("Paid")
    expect(store.moduleNode("nope")).toBeNull()
  })

  it("gates the tree by the access of the user passed to fetchConfig", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(ADMIN)))
    const store = useConfigStore()
    await store.fetchConfig({ user: { access: ["admin", "user-edit"] } })

    expect(store.state.access).toEqual(["admin", "user-edit"])
    expect(store.navigationTree.map((n) => n.key)).toEqual(["user"])

    store.setAccess(["root"])
    expect(store.navigationTree.map((n) => n.key)).toEqual(["group:shop", "user"])
  })

  it("is empty without the admin part", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(PUBLIC)))
    const store = useConfigStore()
    await store.fetchConfig()
    expect(store.moduleTree).toEqual([])
    expect(store.moduleLookup).toEqual({})
  })
})
