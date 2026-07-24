import { defineStore } from "pinia"
import { reactive, computed } from "vue"
import { createControllerFetch, resetState } from "../request/index.js"

// --------------------------------------------------------------------------- //
// User / session store (ViUR core 3.9, envelope v2)                           //
// --------------------------------------------------------------------------- //
//
// The LOGIN FLOW itself is driven generically by the multistep form component
// — `<ViForm module="user" action="login" multistep>` — which walks the v2
// envelope's `status`/`step`/`follow` chain (chooser → userpassword → 2FA →
// success). This store owns what does NOT fit a generic form step:
//   • the SESSION: the current user + access gating (`fetchSelf`, `logout`)
//   • Google sign-in via the Identity SDK token (`loginWithGoogle`)
// On a completed login the consumer calls `fetchSelf()` to load the user.

const DEFAULT_RENDERER = import.meta.env.VITE_DEFAULT_RENDERER || "json"

/** Split a ViUR url into the parts createControllerFetch needs. */
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

/** One request through the viur-ui request layer → normalized (v2) body.
 *  Rejection propagates to the caller. */
async function apiRequest(url, { method = "GET", data = {}, secure = false } = {}) {
  const spec = specFromUrl(url)
  const request = createControllerFetch({ endpoint: spec.endpoint, method, secure })
  const result = request(spec.controller, "/", data, {
    renderer: spec.renderer,
    query: spec.query,
    immediate: false,
  })
  await result.execute()
  return result.data.value
}

export const useUserStore = defineStore("viurUser", () => {
  const state = reactive({
    user: null, // UserSkel values, or null
    status: "unknown", // "unknown" | "loading" | "authenticated" | "anonymous"
    renderer: DEFAULT_RENDERER,
    googleClientId: null,
  })

  const userUrl = (endpoint) => `/${state.renderer}/user/${endpoint}`

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

  function configure({ renderer, googleClientId } = {}) {
    if (renderer) state.renderer = renderer
    if (googleClientId !== undefined) state.googleClientId = googleClientId
  }

  // ── session ──────────────────────────────────────────────────────────────────
  async function fetchSelf() {
    state.status = "loading"
    try {
      const body = await apiRequest(userUrl("view/self"), { method: "GET" })
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
      const body = await apiRequest(userUrl("logout"), { method: "POST", secure: true })
      follow = body?.follow ?? null
      state.user = null
      state.status = "anonymous"
      await resetState() // drop cached skeys + request cache
    } catch (error) {
      // clear the session locally regardless of a failed request
      state.user = null
      state.status = "anonymous"
    }
    if (typeof follow === "string" && /^https?:\/\//.test(follow)) {
      window.location.href = follow
    }
  }

  function reset() {
    state.user = null
    state.status = "unknown"
  }

  // ── Google sign-in ────────────────────────────────────────────────────────────
  // POST the GSI id-token. Returns the normalized envelope so the caller can
  // complete (status success → the session was loaded via fetchSelf) or hand a
  // 2FA `follow` to the multistep ViForm to continue in the generic flow.
  // Returns null on a transport error.
  async function loginWithGoogle(token) {
    try {
      const body = await apiRequest(userUrl("auth_googleaccount/login"), {
        method: "POST",
        secure: true,
        data: { token },
      })
      if (body?.status === "success" || body?.action === "login_success") {
        await fetchSelf()
      }
      return body
    } catch (error) {
      return null
    }
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
    // config
    configure,
    // session
    fetchSelf,
    logout,
    reset,
    // google
    loginWithGoogle,
  }
})
