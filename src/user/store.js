import { defineStore } from "pinia"
import { reactive, computed } from "vue"
import { createControllerFetch, resetState, HTTPError } from "../request/index.js"

// --------------------------------------------------------------------------- //
// User / auth store (ViUR core 3.9)                                           //
// --------------------------------------------------------------------------- //
//
// Holds the logged-in user and drives the login flow. Core 3.9 models login as
// the classic action-driven flow — responses carry `action` + `next_url` +
// `params.action_url` (NOT the viur-actions v2 `status`/`step`/`follow`
// envelope) — so this store owns the whole state machine and issues all HTTP via
// the viur-ui request layer (skey batching, normalizeEnvelope). The response is
// normalized to the v2 shape, so the entity payload is read from `data` and the
// classic `next_url` is available as `follow`; the classic `action` string is
// preserved and is what we branch on.
//
// Flow (userpassword + optional 2FA + Google):
//   GET  /<r>/user/login                     → provider chooser (or auto-forward)
//   POST /<r>/user/auth_userpassword/login   → login_success | errors | 2FA form | 2FA chooser
//   POST /<r>/user/auth_googleaccount/login  → (same outcomes)
//   GET  /<r>/user/f2_*/start                → OTP form (params.action_url)
//   POST params.action_url                   → login_success | errors
//   GET  /<r>/user/view/self                 → current user (401 = anonymous)
//   POST /<r>/user/logout

const DEFAULT_RENDERER = import.meta.env.VITE_DEFAULT_RENDERER || "json"

/** Split a ViUR url ("/<renderer>/<controller…>/<endpoint>[?query]") into the
 *  parts createControllerFetch needs. Server-provided flow urls (start_url /
 *  next_url / action_url) are absolute paths and carry their own renderer. */
function specFromUrl(url) {
  const parsed = new URL(url, window.location.origin)
  const segments = parsed.pathname.split("/").filter(Boolean)
  return {
    renderer: segments[0],
    controller: segments.slice(1, -1),
    endpoint: segments.at(-1),
    query: parsed.search ? parsed.search.slice(1) : "",
  }
}

/** Issue one request through the viur-ui request layer and return the
 *  normalized (v2-shaped) response body. Throws HTTPError on non-ok. */
async function apiRequest(url, { method = "GET", data = {}, secure = false } = {}) {
  const spec = specFromUrl(url)
  const request = createControllerFetch({ endpoint: spec.endpoint, method, secure })
  const result = request(spec.controller, "/", data, {
    renderer: spec.renderer,
    query: spec.query,
    immediate: false,
  })
  // Pass-through helper: rejection propagates to the caller (each public action
  // wraps its calls in try/catch). Same clean async/await style as request.js.
  await result.execute()
  return result.data.value
}

/** ViUR structure can arrive as an object `{name: bone}` or an ordered array
 *  `[[name, bone], …]`. Normalize to an object. */
function structAsObject(structure) {
  if (Array.isArray(structure)) {
    return Object.fromEntries(structure.map((entry) => [entry[0], entry[1]]))
  }
  return structure || {}
}

/** A SelectBone's `values` can be a `{value: label}` map or `[[value, label], …]`
 *  pairs. Normalize to a map. */
function asMap(values) {
  if (Array.isArray(values)) {
    return Object.fromEntries(values.map((entry) => [entry[0], entry[1]]))
  }
  return values || {}
}

const isGoogleUrl = (url) => /auth_googleaccount/.test(url || "")

/** A step form is an OTP form when it carries an `otptoken` bone. */
function looksLikeOtp(structObj) {
  return !!(structObj && (structObj.otptoken || structObj.otp))
}

/** A step form is a chooser when it carries a `provider` SelectBone. */
function looksLikeChooser(structObj) {
  const p = structObj?.provider
  return !!(p && (p.values || (typeof p.type === "string" && p.type.startsWith("select"))))
}

export const useUserStore = defineStore("viurUser", () => {
  const state = reactive({
    // session
    user: null, // UserSkel values, or null
    status: "unknown", // "unknown" | "loading" | "authenticated" | "anonymous"

    // login flow
    step: "idle", // idle | loading | provider | userpassword | secondfactor_choice | secondfactor | done
    formStep: null, // last rendered form step (userpassword | secondfactor) — for error re-display
    providers: {}, // primary providers { loginUrl: name }
    secondFactors: {}, // 2FA providers { startUrl: name }
    submitUrl: null, // where the current form step POSTs
    fieldErrors: [], // per-field errors [{ fieldPath, errorMessage, … }]
    errorMessage: "", // general error message

    // config
    renderer: DEFAULT_RENDERER,
    googleClientId: null,
  })

  const loginUrl = () => `/${state.renderer}/user/login`
  const selfUrl = () => `/${state.renderer}/user/view/self`
  const logoutUrl = () => `/${state.renderer}/user/logout`
  const googleLoginUrl = () => `/${state.renderer}/user/auth_googleaccount/login`

  // ── getters ────────────────────────────────────────────────────────────────
  const isLoggedIn = computed(() => state.status === "authenticated" && !!state.user)
  const access = computed(() => (Array.isArray(state.user?.access) ? state.user.access : []))
  const isRoot = computed(() => access.value.includes("root"))
  const isAdmin = computed(() => isRoot.value || access.value.includes("admin"))
  function hasAccess(right) {
    return isRoot.value || access.value.includes(right)
  }
  const shortName = computed(() => {
    const u = state.user
    if (!u) return "-"
    if (u.firstname && u.lastname) return `${u.firstname[0]}. ${u.lastname}`
    return u.lastname || u.firstname || u.name || "-"
  })
  const hasGoogle = computed(() => Object.keys(state.providers).some(isGoogleUrl))
  const passwordProviders = computed(() =>
    Object.fromEntries(Object.entries(state.providers).filter(([url]) => !isGoogleUrl(url)))
  )

  function configure({ renderer, googleClientId } = {}) {
    if (renderer) state.renderer = renderer
    if (googleClientId !== undefined) state.googleClientId = googleClientId
  }

  function _resetFlow() {
    state.step = "idle"
    state.formStep = null
    state.providers = {}
    state.secondFactors = {}
    state.submitUrl = null
    state.fieldErrors = []
    state.errorMessage = ""
  }

  function _fail(error, fallbackStep = "provider") {
    if (error instanceof HTTPError) {
      state.errorMessage = `${error.statusCode ?? ""} ${error.statusText ?? error.message ?? ""}`.trim()
    } else {
      state.errorMessage = error?.message ?? String(error)
    }
    if (state.step === "loading") state.step = fallbackStep
  }

  // ── session ──────────────────────────────────────────────────────────────────
  async function fetchSelf() {
    state.status = "loading"
    try {
      const body = await apiRequest(selfUrl(), { method: "GET" })
      state.user = body?.data ?? null
      state.status = state.user ? "authenticated" : "anonymous"
      return state.user
    } catch (error) {
      // 401 → not logged in (the expected "anonymous" signal)
      state.user = null
      state.status = "anonymous"
      return null
    }
  }

  async function logout() {
    let follow = null
    try {
      const body = await apiRequest(logoutUrl(), { method: "POST", secure: true })
      follow = body?.follow ?? null
      state.user = null
      state.status = "anonymous"
      _resetFlow()
      await resetState() // drop cached skeys + request cache
    } catch (error) {
      // clear the session locally regardless of a failed request
      state.user = null
      state.status = "anonymous"
      _resetFlow()
    }
    if (typeof follow === "string" && /^https?:\/\//.test(follow)) {
      window.location.href = follow
    }
  }

  // ── login flow ───────────────────────────────────────────────────────────────
  async function loadLogin() {
    _resetFlow()
    state.step = "loading"
    try {
      // already authenticated? (valid session cookie)
      if (await fetchSelf()) {
        state.step = "done"
        return
      }
      // The entry is just the first step of the flow — hand it to the same
      // handler that drives every subsequent step (v2 status/follow-driven,
      // with v1 action/next_url as fallback).
      await _handleAuthResponse(await apiRequest(loginUrl(), { method: "GET" }))
    } catch (error) {
      _fail(error)
    }
  }

  function _openProvider(url) {
    // Google is handled via the GSI button in the UI, not a form step.
    if (isGoogleUrl(url)) {
      state.step = "provider"
      return
    }
    // userpassword-style provider: collect credentials and POST to `url`.
    state.submitUrl = url
    state.fieldErrors = []
    state.formStep = "userpassword"
    state.step = "userpassword"
  }

  function chooseProvider(url) {
    state.errorMessage = ""
    _openProvider(url)
  }

  // Return to the primary-provider chooser (e.g. a "back" link on the password
  // form). Re-fetches the login entry when no providers are cached yet.
  function backToProviders() {
    state.errorMessage = ""
    state.fieldErrors = []
    state.submitUrl = null
    if (Object.keys(state.providers).length) {
      state.step = "provider"
    } else {
      loadLogin()
    }
  }

  async function loginWithPassword({ name, password }) {
    state.errorMessage = ""
    state.fieldErrors = []
    state.step = "loading"
    try {
      await _handleAuthResponse(
        await apiRequest(state.submitUrl, { method: "POST", secure: true, data: { name, password } })
      )
    } catch (error) {
      _fail(error, "userpassword")
    }
  }

  async function loginWithGoogle(token) {
    state.errorMessage = ""
    state.step = "loading"
    try {
      await _handleAuthResponse(await apiRequest(googleLoginUrl(), { method: "POST", secure: true, data: { token } }))
    } catch (error) {
      _fail(error, "provider")
    }
  }

  async function chooseSecondFactor(startUrl) {
    state.errorMessage = ""
    state.step = "loading"
    try {
      await _handleAuthResponse(await apiRequest(startUrl, { method: "GET" }))
    } catch (error) {
      _fail(error, "secondfactor_choice")
    }
  }

  async function submitSecondFactor({ otptoken }) {
    state.errorMessage = ""
    state.fieldErrors = []
    state.step = "loading"
    try {
      await _handleAuthResponse(await apiRequest(state.submitUrl, { method: "POST", secure: true, data: { otptoken } }))
    } catch (error) {
      _fail(error, "secondfactor")
    }
  }

  // Drive one step of the login flow. viur-ui works primarily on the v2
  // envelope: the user module (viur-actions) sets `status`/`step`/`follow`
  // explicitly (login complete = `status: "success"`, mid-flow pivot =
  // `status: "continue"` + `follow`). Classic v1 responses are lifted to the
  // same shape by normalizeEnvelope (`next_url` → `follow`, and the terminal
  // `action: "login_success"` / `select_*` verbs are handled as a fallback).
  async function _handleAuthResponse(body) {
    try {
      const status = body?.status
      const action = body?.action
      const structObj = structAsObject(body?.structure)
      const hasStructure = Object.keys(structObj).length > 0
      const hasErrors = Array.isArray(body?.errors) && body.errors.length > 0
      // where the current form submits: v2 `follow`; v1 2FA form `params.action_url`
      const target = body?.follow ?? body?.params?.action_url ?? null

      // 1) login complete — v2 status, or the v1 terminal action
      if (status === "success" || action === "login_success") {
        _resetFlow()
        await fetchSelf()
        state.step = "done"
        return
      }

      // 2) provider / second-factor selection — v1 `select_*` action, or any
      //    step whose form is a `provider` chooser (v2-safe)
      const secondFactorChoice =
        action === "select_secondfactor_provider" || action === "select_secondfactor_provider_success"
      const providerChoice =
        action === "select_authentication_provider" || action === "select_authentication_provider_success"
      if (providerChoice || secondFactorChoice || looksLikeChooser(structObj)) {
        // v1 single-choice success → the chosen url is in `follow`
        if ((providerChoice || secondFactorChoice) && action.endsWith("_success") && target) {
          if (secondFactorChoice) await chooseSecondFactor(target)
          else _openProvider(target)
          return
        }
        const choices = asMap(structObj?.provider?.values)
        if (secondFactorChoice) {
          state.secondFactors = choices
          state.step = "secondfactor_choice"
        } else {
          state.providers = choices
          const urls = Object.keys(choices)
          // exactly one plain (non-Google) provider → skip the chooser
          if (urls.length === 1 && !isGoogleUrl(urls[0])) _openProvider(urls[0])
          else state.step = "provider"
        }
        return
      }

      // 3) a credential / OTP form to render (both v2 and v1). Also covers a
      //    rejected re-render that ships the form together with field errors.
      if (hasStructure && target) {
        state.submitUrl = target
        state.fieldErrors = hasErrors ? body.errors : []
        state.formStep = looksLikeOtp(structObj) ? "secondfactor" : "userpassword"
        state.step = state.formStep
        return
      }

      // 4) v2 pivot: a step finished (no form in this response) — advance to the
      //    next step via `follow`
      if (target && !hasStructure && (status === "continue" || status === "init")) {
        await _handleAuthResponse(await apiRequest(target, { method: "GET" }))
        return
      }

      // 5) rejected on the current form (errors, no new structure) → stay put
      if (status === "rejected" || hasErrors) {
        state.fieldErrors = Array.isArray(body?.errors) ? body.errors : []
        state.step = state.formStep || "userpassword"
        return
      }

      _fail(new Error("Unexpected login response"))
    } catch (error) {
      _fail(error)
    }
  }

  function reset() {
    state.user = null
    state.status = "unknown"
    _resetFlow()
  }

  return {
    state,
    // getters
    isLoggedIn,
    access,
    isRoot,
    isAdmin,
    hasAccess,
    shortName,
    hasGoogle,
    passwordProviders,
    // config
    configure,
    // session
    fetchSelf,
    logout,
    reset,
    // login flow
    loadLogin,
    chooseProvider,
    backToProviders,
    loginWithPassword,
    loginWithGoogle,
    chooseSecondFactor,
    submitSecondFactor,
  }
})
