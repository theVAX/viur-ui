import { describe, it, expect, vi } from "vitest"
import { createApp, h, nextTick, reactive, ref } from "vue"
import { createI18n } from "vue-i18n"
import de from "../../src/translations/de.js"
import en from "../../src/translations/en.js"
import DurationInput from "../../src/components/DurationInput/DurationInput.vue"

/**
 * Mounts DurationInput with the package translations, v-model on `model`. `props` stays reactive
 * (change it to re-render), `i18n.global.locale.value` switches the language.
 */
function mount(initial = {}, locale = "de") {
  const props = reactive({ ...initial })
  const model = ref(initial.modelValue ?? null)
  const events = []
  const errors = []
  const app = createApp({
    render: () =>
      h(DurationInput, {
        ...props,
        modelValue: model.value,
        "onUpdate:modelValue": (minutes) => {
          events.push(["update", minutes])
          model.value = minutes
        },
        onInvalid: (message) => events.push(["invalid", message]),
      }),
  })
  const i18n = createI18n({ legacy: false, locale, fallbackLocale: "en", messages: { de, en } })
  app.use(i18n)
  app.config.errorHandler = (error) => errors.push(error)
  const el = document.createElement("div")
  app.mount(el)
  return { el, input: el.querySelector("wa-input"), props, model, events, errors, i18n }
}

/**
 * Text in the wa-input. Without Web Awesome loaded Vue writes the attribute; once a test has typed
 * (set the property), it writes the property — as with the real element.
 */
const shown = (input) => input.value ?? input.getAttribute("value")

/** Types `text` into the wa-input like the browser does. */
async function type(input, text) {
  input.value = text
  input.dispatchEvent(new Event("input"))
  await nextTick()
}

/** Leaves the field (the wa-input fires change, if the text changed, then blur). */
async function leave(input, { change = true } = {}) {
  // the browser fires change only if the text differs from the one at focus; blur always
  if (change) input.dispatchEvent(new Event("change"))
  input.dispatchEvent(new Event("blur"))
  await nextTick()
}

const workday = { hoursPerDay: 8, daysPerWeek: 5 }

describe("DurationInput", () => {
  it("shows the value normalised", () => {
    expect(shown(mount({ modelValue: 90 }).input)).toBe("1 h 30 min")
    expect(shown(mount({ modelValue: 630, ...workday }).input)).toBe("1 T 2 h 30 min")
    expect(shown(mount({ modelValue: 630, ...workday }, "en").input)).toBe("1 d 2 h 30 min")
    expect(shown(mount({ modelValue: null }).input)).toBe("")
  })

  it("understands German units and previews the normalised value", async () => {
    const { input, events } = mount(workday)
    await type(input, "1t 2std 30min")
    expect(events).toEqual([["update", 630]])
    expect(input.getAttribute("hint")).toBe("= 1 T 2 h 30 min")
  })

  it("understands English units in German and German units only in German", async () => {
    const german = mount(workday)
    await type(german.input, "1d 2h")
    expect(german.events.at(-1)).toEqual(["update", 600])

    const english = mount(workday, "en")
    await type(english.input, "1t")
    expect(english.events.at(-1)[0]).toBe("invalid")
  })

  it("normalises the text when the field is left", async () => {
    const { input } = mount()
    await type(input, "90m")
    expect(input.getAttribute("hint")).toBe("= 1 h 30 min")
    await leave(input)
    expect(shown(input)).toBe("1 h 30 min")
    expect(input.getAttribute("hint")).toBeFalsy()
  })

  it("keeps the value on unknown text and shows the error once the field is left", async () => {
    const { input, model, events } = mount({ modelValue: 30 })
    await type(input, "1:3")
    expect(events).toEqual([["invalid", de.duration.invalid]])
    expect(model.value).toBe(30)
    expect(input.getAttribute("hint")).toBeFalsy()

    await leave(input)
    expect(input.getAttribute("hint")).toBe(de.duration.invalid)
    expect(shown(input)).toBe("1:3")

    await type(input, "1:30")
    expect(events.at(-1)).toEqual(["update", 90])
    expect(input.getAttribute("hint")).toBe("= 1 h 30 min")
  })

  it("reports a cleared field as null", async () => {
    const { input, events } = mount({ modelValue: 30 })
    await type(input, " ")
    expect(events).toEqual([["update", null]])
  })

  it.each([
    ["2h", { max: 60 }, "Höchstens 1 h"],
    ["5", { min: 15 }, "Mindestens 15 min"],
    ["-5", {}, de.duration.invalid],
    ["1d", { largestUnit: "hour" }, de.duration.invalid],
  ])("rejects %j with %j", async (text, props, message) => {
    const { input, events } = mount(props)
    await type(input, text)
    await leave(input)
    expect(events).toEqual([["invalid", message]])
    expect(input.getAttribute("hint")).toBe(message)
  })

  it("follows a new value from outside", async () => {
    const { input, model } = mount({ modelValue: 30 })
    model.value = 120
    await nextTick()
    expect(shown(input)).toBe("2 h")
  })

  it("sets a value from the quick picks, with a spoken name in words", async () => {
    const { el, input, events } = mount({ presets: [15, 60, 480], ...workday })
    const group = el.querySelector("[role=group]")
    expect(group.getAttribute("aria-label")).toBe("Schnellwahl")

    const buttons = [...group.querySelectorAll("wa-button")]
    expect(buttons.map((b) => b.querySelector("[aria-hidden=true]").textContent)).toEqual(["15 min", "1 h", "1 T"])
    expect(buttons.map((b) => b.querySelector(".wa-visually-hidden").textContent)).toEqual([
      "15 Minuten",
      "1 Stunde",
      "1 Tag",
    ])

    buttons[1].dispatchEvent(new Event("click"))
    await nextTick()
    expect(events).toEqual([["update", 60]])
    expect(shown(input)).toBe("1 h")
  })

  it("renders no quick picks without presets and disables them with the input", () => {
    expect(mount().el.querySelector("[role=group]")).toBeNull()
    const { el, input } = mount({ presets: [15], disabled: true })
    expect(el.querySelector("wa-button").getAttribute("disabled")).toBe("true")
    expect(input.getAttribute("disabled")).toBe("true")
  })

  it("passes other attributes to the wa-input", () => {
    const { input } = mount({ label: "Estimate", name: "estimate", required: true })
    expect(input.getAttribute("label")).toBe("Estimate")
    expect(input.getAttribute("name")).toBe("estimate")
    expect(input.hasAttribute("required")).toBe(true)
  })

  it("refuses to clear a required field", async () => {
    const { input, model, events } = mount({ modelValue: 30, required: true })
    expect(input.hasAttribute("required")).toBe(true)
    await type(input, "")
    expect(events).toEqual([["invalid", de.duration.required]])
    expect(model.value).toBe(30)
    await leave(input)
    expect(input.getAttribute("hint")).toBe(de.duration.required)
  })

  // a model value is judged as it is: 1.5 is an error, not silently 2 (only typed text is rounded)
  it.each([-1, 1.5, NaN])("shows the model value %o as it is, with an error at once", async (minutes) => {
    const { input, events } = mount({ modelValue: minutes })
    const message = `Der gespeicherte Wert ${minutes} ist keine Dauer in ganzen Minuten`
    expect(shown(input)).toBe(String(minutes))
    expect(input.getAttribute("hint")).toBe(message)
    await leave(input, { change: false })
    expect(input.getAttribute("hint")).toBe(message)
    expect(events).toEqual([])
  })

  it("rounds typed text to whole minutes, after a model value that is no duration", async () => {
    const { input, events } = mount({ modelValue: 1.5 })
    await type(input, "1,5")
    expect(events).toEqual([["update", 2]])
    expect(input.getAttribute("hint")).toBe("= 2 min")
  })

  it("leaves out quick picks that are no duration", () => {
    const { el } = mount({ presets: [15, -5, 1.5, NaN, 60] })
    expect([...el.querySelectorAll("wa-button [aria-hidden=true]")].map((b) => b.textContent)).toEqual([
      "15 min",
      "1 h",
    ])
  })

  it.each([
    ["61", { max: 60.5 }, ["invalid", "Höchstens 1 h"]],
    ["60", { max: 60.5 }, ["update", 60]],
    ["14", { min: 14.5 }, ["invalid", "Mindestens 15 min"]],
    ["15", { min: 14.5 }, ["update", 15]],
    ["100w", { max: Infinity }, ["update", 100 * 7 * 24 * 60]],
  ])("checks %j against the fractional or infinite limit %j", async (text, props, event) => {
    const { input, events } = mount(props)
    await type(input, text)
    expect(events).toEqual([event])
  })

  it.each([
    [{ hoursPerDay: 0 }],
    [{ hoursPerDay: 0.02 }],
    [{ daysPerWeek: 0 }],
    [{ largestUnit: "month" }],
    [{ modelValue: 30, max: -1 }],
    [{ min: 1e20 }],
    [{ min: 90, max: 60 }],
    [{ min: 60.2, max: 60.8 }],
  ])("disables the field and says it is set up wrongly for %o, instead of breaking", (props) => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {})
    const { el, input, errors } = mount({ presets: [15], ...props })
    expect(errors).toEqual([])
    expect(input.getAttribute("disabled")).toBe("true")
    expect(el.querySelector("wa-button").getAttribute("disabled")).toBe("true")
    expect(input.getAttribute("hint")).toBe(de.duration.misconfigured)
    expect(logged).toHaveBeenCalledWith(expect.stringMatching(/^DurationInput: /))
    logged.mockRestore()
  })

  it("takes an unreachably high max as no limit", async () => {
    const { input, events } = mount({ max: 1e20 })
    expect(input.getAttribute("disabled")).toBe("false")
    await type(input, "100w")
    expect(events).toEqual([["update", 100 * 7 * 24 * 60]])
  })

  it("shows the model value anew when the day length changes, without changing the value", async () => {
    const { input, props, events } = mount({ modelValue: 480, hoursPerDay: 8 })
    expect(shown(input)).toBe("1 T")
    props.hoursPerDay = 24
    await nextTick()
    expect(shown(input)).toBe("8 h")
    // validity of the new text is reported again; the value itself stays
    expect(events).toEqual([["update", 480]])
  })

  it("shows the model value anew when the language changes", async () => {
    const { input, i18n, events } = mount({ modelValue: 480, hoursPerDay: 8 })
    i18n.global.locale.value = "en"
    await nextTick()
    expect(shown(input)).toBe("1 d")
    await leave(input)
    expect(events).toEqual([["update", 480]])
  })

  it("reports a dropped invalid draft as valid again after a language change", async () => {
    const { input, i18n, events } = mount({ modelValue: 30 })
    await type(input, "bad")
    expect(events).toEqual([["invalid", de.duration.invalid]])
    i18n.global.locale.value = "en"
    await nextTick()
    expect(shown(input)).toBe("30 min")
    expect(events.at(-1)).toEqual(["update", 30])
  })

  it("commits on blur when the text was edited back and no change came", async () => {
    const { input, model } = mount({ modelValue: 30 })
    await type(input, "45")
    await type(input, "30 min")
    model.value = 120 // outside update during the edit: not shown
    await nextTick()
    await leave(input, { change: false })
    expect(model.value).toBe(30)
    expect(shown(input)).toBe("30 min")
  })

  it("commits once when change and blur both come", async () => {
    const { input, model, events } = mount({ modelValue: 30 })
    await type(input, "1h")
    model.value = 120
    await nextTick()
    await leave(input)
    expect(events).toEqual([
      ["update", 60],
      ["update", 60],
    ])
  })

  it("keeps a draft against an outside update while editing; the left value wins", async () => {
    const { input, model, events } = mount({ modelValue: 30 })
    await type(input, "1:3")
    model.value = 120
    await nextTick()
    expect(shown(input)).toBe("1:3")

    await type(input, "1:30")
    model.value = 300
    await nextTick()
    expect(shown(input)).toBe("1:30")
    await leave(input)
    expect(shown(input)).toBe("1 h 30 min")
    expect(model.value).toBe(90)
    expect(events.at(-1)).toEqual(["update", 90])

    model.value = 240
    await nextTick()
    expect(shown(input)).toBe("4 h")
  })
})
