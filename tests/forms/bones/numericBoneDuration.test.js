import { describe, it, expect, beforeEach, vi } from "vitest"
import { createApp, nextTick } from "vue"
import { createI18n } from "vue-i18n"
import { createPinia, setActivePinia } from "pinia"
import de from "../../../src/translations/de.js"
import en from "../../../src/translations/en.js"
import { getBoneWidget } from "../../../src/forms/bones/index.js"
import NumericBoneDuration from "../../../src/forms/bones/widgets/numericBoneDuration.vue"

// viur-core sends sys.maxsize as "no limit"
const NO_LIMIT = 9223372036854775807

/**
 * Mounts the widget with a minimal boneState.
 * @returns {{ input: HTMLElement, changes: Array<Array> }} the wa-input and the arguments of every `change`
 */
function mountWidget(value, bonestructure = {}) {
  const changes = []
  const app = createApp(NumericBoneDuration, { name: "estimate", value, onChange: (...args) => changes.push(args) })
  const i18n = createI18n({ legacy: false, locale: "de", fallbackLocale: "en", messages: { de, en } })
  app.use(i18n)
  app.provide("boneState", {
    readonly: false,
    errorMessages: [],
    bonestructure: { descr: "Estimate", min: -NO_LIMIT, max: NO_LIMIT, ...bonestructure },
    params: bonestructure.params ?? {},
  })
  const el = document.createElement("div")
  app.mount(el)
  return { input: el.querySelector("wa-input"), changes, i18n }
}

async function type(input, text) {
  input.value = text
  input.dispatchEvent(new Event("input"))
  await nextTick()
}

describe("numericBoneDuration", () => {
  it("is the widget of numeric.duration, not of other numeric types", () => {
    setActivePinia(createPinia())
    expect(getBoneWidget("numeric.duration")).toBe(NumericBoneDuration)
    expect(getBoneWidget("numeric")).not.toBe(NumericBoneDuration)
  })

  it.each([
    [null, ""],
    [90, "90"],
  ])("reports %j as %j on mount", (value, expected) => {
    const { changes } = mountWidget(value)
    expect(changes).toEqual([["estimate", expected, undefined, undefined]])
  })

  it("takes the day length and the quick picks from the bone params", () => {
    const { input } = mountWidget(480, { params: { hours_per_day: 8, presets: [15, 60] } })
    expect(input.getAttribute("value")).toBe("1 T")
    expect(input.getAttribute("label")).toBe("Estimate")
    // visually hidden instead of display: none, so the field keeps its accessible name
    expect(input.classList.contains("wa-visually-hidden-label")).toBe(true)
    expect(input.parentElement.querySelectorAll("wa-button")).toHaveLength(2)
  })

  it("reports typed minutes as valid and unknown text as invalid", async () => {
    const { input, changes } = mountWidget(30)
    await type(input, "2,5h")
    expect(changes.at(-1)).toEqual(["estimate", "150", undefined, undefined, true])
    await type(input, "soon")
    expect(changes.at(-1)).toEqual(["estimate", "30", undefined, undefined, false])
  })

  it("applies the bone's max and ignores the 'no limit' sentinels", async () => {
    const limited = mountWidget(null, { max: 60 })
    await type(limited.input, "2h")
    expect(limited.changes.at(-1).at(-1)).toBe(false)

    const open = mountWidget(null)
    await type(open.input, "100w")
    expect(open.changes.at(-1)).toEqual(["estimate", String(100 * 7 * 24 * 60), undefined, undefined, true])
  })

  it("reports a cleared required bone as invalid", async () => {
    const { input, changes } = mountWidget(30, { required: true })
    await type(input, "")
    expect(changes.at(-1)).toEqual(["estimate", "30", undefined, undefined, false])
  })

  it.each([
    ["min/max", { min: 30, max: 60 }],
    ["minAmount/maxAmount (compatibility mode)", { min: undefined, max: undefined, minAmount: 30, maxAmount: 60 }],
    ["min/max before minAmount/maxAmount", { min: 30, max: 60, minAmount: 0, maxAmount: 600 }],
  ])("takes the limits from %s", async (_, limits) => {
    const { input, changes } = mountWidget(null, limits)
    for (const [text, valid] of [
      ["29", false],
      ["30", true],
      ["60", true],
      ["61", false],
    ]) {
      await type(input, text)
      expect(changes.at(-1).at(-1), text).toBe(valid)
    }
  })

  it("keeps a fractional max as a limit", async () => {
    const { input, changes } = mountWidget(null, { max: 60.5 })
    await type(input, "61")
    expect(changes.at(-1).at(-1)).toBe(false)
    await type(input, "60")
    expect(changes.at(-1).at(-1)).toBe(true)
  })

  it("reports valid again when a language change drops an invalid draft", async () => {
    const { input, changes, i18n } = mountWidget(30)
    await type(input, "bad")
    expect(changes.at(-1).at(-1)).toBe(false)
    i18n.global.locale.value = "en"
    await nextTick()
    expect(changes.at(-1)).toEqual(["estimate", "30", undefined, undefined, true])
  })

  it("shows a wrong hours_per_day as a disabled field with a message", () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {})
    const { input, changes } = mountWidget(30, { params: { hours_per_day: 0 } })
    expect(input.getAttribute("disabled")).toBe("true")
    expect(input.getAttribute("hint")).toBe(de.duration.misconfigured)
    expect(changes[0]).toEqual(["estimate", "30", undefined, undefined])
    logged.mockRestore()
  })
})
