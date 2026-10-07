import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { IDBFactory, IDBKeyRange } from "fake-indexeddb"
import { createApp, defineComponent, h } from "vue"
import { createPinia, setActivePinia } from "pinia"
import { resetState } from "../../src/request/request.js"

// Only the start of the login is of interest here: which branch the screen
// renders after GET /user/login. The multistep form is stubbed.
vi.mock("../../src/forms/ViForm.vue", () => ({
  default: defineComponent({
    name: "ViForm",
    setup() {
      return () => h("div", { class: "viform-stub" })
    },
  }),
}))
vi.mock("vue-i18n", () => ({ useI18n: () => ({ t: (key) => key }) }))
vi.mock("vue-router", () => ({ useRouter: () => undefined }))

const { default: LoginScreen } = await import("../../src/user/LoginScreen.vue")

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

// a v2 answer without the classic provider choice: the multistep form takes over
const V2_LOGIN = { version: 2, action: "login", status: "init", structure: {}, data: {}, errors: [] }

/** fetch stub: no session, no config; `/user/login` answers with `loginResponse()`. */
function stubFetch(loginResponse) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async (url) => {
      if (String(url).includes("/user/login")) return loginResponse()
      return jsonResponse({}, 401)
    })
  )
}

let app = null
let el = null

function mountScreen() {
  const pinia = createPinia()
  setActivePinia(pinia)
  el = document.createElement("div")
  document.body.appendChild(el)
  app = createApp(LoginScreen, { googleClientId: false })
  app.use(pinia)
  app.mount(el)
  return el
}

beforeEach(async () => {
  globalThis.indexedDB = new IDBFactory()
  globalThis.IDBKeyRange = IDBKeyRange
  await resetState()
})

afterEach(() => {
  app?.unmount()
  el?.remove()
  vi.unstubAllGlobals()
})

describe("LoginScreen start", () => {
  it("shows an error instead of an empty form when /user/login fails", async () => {
    stubFetch(() => jsonResponse({}, 403))
    const root = mountScreen()

    await vi.waitFor(() => expect(root.textContent).toContain("login.unavailable"))
    expect(root.querySelector(".viform-stub")).toBeNull()
  })

  it("loads the login again on retry", async () => {
    let fail = true
    stubFetch(() => (fail ? jsonResponse({}, 403) : jsonResponse(V2_LOGIN)))
    const root = mountScreen()
    await vi.waitFor(() => expect(root.querySelector(".viur-login__retry")).not.toBeNull())

    fail = false
    root.querySelector(".viur-login__retry").dispatchEvent(new Event("click"))

    await vi.waitFor(() => expect(root.querySelector(".viform-stub")).not.toBeNull())
    expect(root.textContent).not.toContain("login.unavailable")
  })

  it("hands a v2 answer without provider choice to the multistep form", async () => {
    stubFetch(() => jsonResponse(V2_LOGIN))
    const root = mountScreen()

    await vi.waitFor(() => expect(root.querySelector(".viform-stub")).not.toBeNull())
    expect(root.textContent).not.toContain("login.unavailable")
  })
})
