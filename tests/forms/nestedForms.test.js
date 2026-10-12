import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { createApp, defineComponent, h, inject, nextTick, ref } from "vue"

vi.mock("vue-i18n", () => ({ useI18n: () => ({ t: (key) => key }) }))

const { default: ViForm } = await import("../../src/forms/ViForm.vue")

// A nested form (as rendered for `using` / record bones) reports its values to
// the outer form debounced. Sending the outer form must not lose a change that
// is still pending in the nested form.

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

const STRUCTURE = { percent: { type: "str", visible: true, params: {} } }

let app = null

/**
 * Mounts an outer form whose layout renders a nested form. The nested form
 * reports its changes to the outer form like BoneNestedWrapper does.
 * @returns {{ outer: import("vue").Ref, nestedUpdate: () => Function, changes: Array }}
 */
function mountForms() {
  let nestedUpdate = null
  const changes = []
  const NestedLayout = defineComponent({
    setup() {
      nestedUpdate = inject("formUpdate")
      return () => null
    },
  })
  const OuterLayout = defineComponent({
    setup() {
      const outerUpdate = inject("formUpdate")
      const mainformState = inject("mainformState")
      return () =>
        h(ViForm, {
          internal: mainformState,
          structure: STRUCTURE,
          layout: NestedLayout,
          onChange: (data) => {
            changes.push(data)
            outerUpdate({ ...data, index: null, lang: null })
          },
        })
    },
  })
  const outer = ref(null)
  app = createApp({
    setup: () => () =>
      h(ViForm, { ref: outer, module: "scheme", action: "add", structure: STRUCTURE, layout: OuterLayout }),
  })
  app.config.globalProperties.$t = (key) => key
  app.mount(document.createElement("div"))
  return { outer, nestedUpdate: () => nestedUpdate, changes }
}

/** The value of `name` in the POST body sent to the server. */
function sent(name) {
  const post = fetch.mock.calls.find(([, options]) => options?.method === "POST")
  return post?.[1].body.get(name)
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ action: "addSuccess", values: {} })))
})

afterEach(() => {
  app?.unmount()
  app = null
  vi.useRealTimers()
})

describe("nested forms", () => {
  it("send the change still pending in a nested form", async () => {
    const { outer, nestedUpdate } = mountForms()
    await nextTick()

    nestedUpdate()({ name: "percent", value: "25", lang: null, index: null, valid: true })
    outer.value.sendData()

    await vi.waitFor(() => expect(sent("percent")).toBe("25"))
  })

  it("report a flushed change only once", async () => {
    vi.useFakeTimers()
    const { outer, nestedUpdate, changes } = mountForms()
    await nextTick()

    nestedUpdate()({ name: "percent", value: "25", lang: null, index: null, valid: true })
    outer.value.sendData()
    await vi.advanceTimersByTimeAsync(600)

    expect(changes).toHaveLength(1)
  })
})
