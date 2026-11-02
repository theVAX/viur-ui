import { describe, it, expect } from "vitest"
import { createApp, h, nextTick, ref } from "vue"
import { createI18n } from "vue-i18n"
import de from "../../src/translations/de.js"
import en from "../../src/translations/en.js"
import DurationInput from "../../src/components/DurationInput/DurationInput.vue"

/**
 * Mounts DurationInput with the package translations, v-model on `model`.
 * @returns {{ el: HTMLElement, input: HTMLElement, model: import("vue").Ref, events: Array<Array> }}
 */
function mount(props = {}, locale = "de") {
  const model = ref(props.modelValue ?? null)
  const events = []
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
  app.use(createI18n({ legacy: false, locale, fallbackLocale: "en", messages: { de, en } }))
  const el = document.createElement("div")
  app.mount(el)
  return { el, input: el.querySelector("wa-input"), model, events }
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

/** Leaves the field (the wa-input fires change). */
async function leave(input) {
  input.dispatchEvent(new Event("change"))
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
    expect(el.querySelector("wa-button").hasAttribute("disabled")).toBe(true)
    expect(input.hasAttribute("disabled")).toBe(true)
  })

  it("passes other attributes to the wa-input", () => {
    const { input } = mount({ label: "Estimate", name: "estimate", required: true })
    expect(input.getAttribute("label")).toBe("Estimate")
    expect(input.getAttribute("name")).toBe("estimate")
    expect(input.hasAttribute("required")).toBe(true)
  })
})
