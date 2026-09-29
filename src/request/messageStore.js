import { defineStore, getActivePinia } from "pinia"
import { reactive, computed } from "vue"

// --------------------------------------------------------------------------- //
// Message store — user feedback (toasts / notifications)                      //
// --------------------------------------------------------------------------- //
//
// A UI-agnostic queue of feedback messages: "entry saved", "login failed",
// "request failed (500)". The REQUEST LAYER feeds it automatically (see
// `notify()` and request.js): a successful POST (add/edit/delete/clone/move/
// login/…) pushes a success, a rejected envelope or a HTTP error pushes an
// error. Components may push their own messages as well.
//
// Opt-in by existence: `notify()` only does something when a Pinia instance is
// active (`getActivePinia()`), i.e. the app installed Pinia. Without Pinia the
// request layer works exactly as before. A single form can switch it off via
// `<ViForm :use-message-store="false">`, any request via `ctx.messages = false`.
//
// Messages carry a translation `code` (e.g. "messages.request.edit.success")
// plus a generic `fallbackCode`, so the rendering component decides the text:
//   const text = te(m.code) ? t(m.code, m.params) : t(m.fallbackCode, m.params)
// Optional `text` holds a ready-made string (e.g. a server error message).

const DEFAULT_TIMEOUTS = { success: 5000, info: 5000, warning: 8000, error: 0 } // 0 = sticky

let _nextId = 1

export const useMessageStore = defineStore("viurMessages", () => {
  const state = reactive({
    messages: [],
    timeouts: { ...DEFAULT_TIMEOUTS },
    // keep at most this many messages; the oldest are dropped
    max: 50,
  })
  const _timers = new Map()

  const latest = computed(() => state.messages.at(-1) ?? null)
  const errors = computed(() => state.messages.filter((m) => m.type === "error"))
  const count = computed(() => state.messages.length)

  function configure({ timeouts, max } = {}) {
    if (timeouts) state.timeouts = { ...state.timeouts, ...timeouts }
    if (typeof max === "number") state.max = max
  }

  /**
   * Add a message. Returns the stored message (with `id`).
   * @param {object} message
   * @param {"success"|"error"|"warning"|"info"} [message.type]
   * @param {string} [message.code] translation key
   * @param {string} [message.fallbackCode] generic translation key
   * @param {string|null} [message.text] ready-made text (wins over code in UIs)
   * @param {object} [message.params] translation params
   * @param {string|null} [message.module] controller path ("user", "shop.order")
   * @param {string|null} [message.action] envelope action / endpoint
   * @param {string|null} [message.key] entity key
   * @param {Array} [message.errors] envelope errors
   * @param {number|null} [message.status] HTTP status
   * @param {number} [message.timeout] ms until auto-dismiss (0 = sticky)
   */
  function push(message) {
    const type = message.type ?? "info"
    const entry = {
      id: _nextId++,
      type,
      code: message.code ?? null,
      fallbackCode: message.fallbackCode ?? `messages.request.default.${type}`,
      text: message.text ?? null,
      params: message.params ?? {},
      module: message.module ?? null,
      action: message.action ?? null,
      key: message.key ?? null,
      errors: message.errors ?? [],
      status: message.status ?? null,
      timeout: message.timeout ?? state.timeouts[type] ?? 0,
      timestamp: Date.now(),
    }
    state.messages.push(entry)
    while (state.messages.length > state.max) {
      const dropped = state.messages.shift()
      _clearTimer(dropped.id)
    }
    if (entry.timeout > 0 && typeof setTimeout === "function") {
      _timers.set(
        entry.id,
        setTimeout(() => remove(entry.id), entry.timeout)
      )
    }
    return entry
  }

  const _shortcut =
    (type) =>
    (codeOrMessage, extra = {}) =>
      push(typeof codeOrMessage === "string" ? { type, code: codeOrMessage, ...extra } : { ...codeOrMessage, type })
  const success = _shortcut("success")
  const error = _shortcut("error")
  const warning = _shortcut("warning")
  const info = _shortcut("info")

  function _clearTimer(id) {
    const timer = _timers.get(id)
    if (timer) {
      clearTimeout(timer)
      _timers.delete(id)
    }
  }

  function remove(id) {
    _clearTimer(id)
    const index = state.messages.findIndex((m) => m.id === id)
    if (index !== -1) state.messages.splice(index, 1)
  }

  function clear(type = null) {
    const keep = type ? state.messages.filter((m) => m.type !== type) : []
    for (const m of state.messages) if (!keep.includes(m)) _clearTimer(m.id)
    state.messages = keep
  }

  return { state, latest, errors, count, configure, push, success, error, warning, info, remove, clear }
})

/**
 * The message store IF the app installed Pinia — else null. This is what makes
 * the feedback opt-in by existence.
 * @returns {ReturnType<typeof useMessageStore>|null}
 */
export function getMessageStore() {
  try {
    if (!getActivePinia()) return null
    return useMessageStore()
  } catch {
    return null
  }
}

/**
 * Push a message when a store exists; no-op otherwise. Used by the request
 * layer so it never depends on Pinia being installed.
 * @returns {object|null} the stored message or null
 */
export function notify(message) {
  const store = getMessageStore()
  return store ? store.push(message) : null
}

/**
 * Build the feedback message for a finished request from its normalized
 * envelope (or a HTTP error). Returns null when nothing should be shown
 * (GET reads, form renders, intermediate multistep steps).
 *
 * @param {{ method: string, endpoint: string, module: string|null, body?: any, error?: Error|null }} info
 */
export function requestMessage({ method, endpoint, module, body = undefined, error = null }) {
  if (error) {
    const status = error.statusCode ?? error.status ?? null
    return {
      type: "error",
      code: `messages.request.${endpoint}.error`,
      fallbackCode: "messages.request.default.error",
      text: error.message && !/^\d{3}$/.test(error.message) ? error.message : null,
      params: { status, module, action: endpoint },
      module,
      action: endpoint,
      status,
    }
  }
  if (method.toUpperCase() === "POST") {
    const isObject = body && typeof body === "object"
    const action = (isObject && body.action) || endpoint
    // a non-envelope body on a POST (e.g. v1 delete answers the string "OKAY")
    // counts as success
    const status = isObject ? body.status : "success"
    const key = isObject ? (body.data?.key ?? null) : null
    if (status === "success") {
      return {
        type: "success",
        code: `messages.request.${action}.success`,
        fallbackCode: "messages.request.default.success",
        params: { module, action },
        module,
        action,
        key,
      }
    }
    if (status === "rejected") {
      return {
        type: "error",
        code: `messages.request.${action}.rejected`,
        fallbackCode: "messages.request.default.rejected",
        params: { module, action, count: body.errors?.length ?? 0 },
        module,
        action,
        key,
        errors: body.errors ?? [],
      }
    }
  }
  return null
}
