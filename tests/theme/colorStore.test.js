import { describe, it, expect, beforeEach } from "vitest"
import { nextTick } from "vue"
import { setActivePinia, createPinia } from "pinia"
import { useColorStore, hexToHsl, BRAND_LIGHTNESS } from "../../src/theme/colorStore.js"
import { useConfigStore } from "../../src/request/configStore.js"

// The conversion of the old admin (vi-vue-components, stores/color.js), verbatim
// apart from formatting — the reference for "same principle".
function oldColorConvert(hexColor, lightness) {
  const r = parseInt("0x" + hexColor[1] + hexColor[2]) / 255
  const g = parseInt("0x" + hexColor[3] + hexColor[4]) / 255
  const b = parseInt("0x" + hexColor[5] + hexColor[6]) / 255
  const cmin = Math.min(r, g, b)
  const cmax = Math.max(r, g, b)
  const delta = cmax - cmin
  let h
  let s
  let l
  if (delta == 0) h = 0
  else if (cmax == r) h = ((g - b) / delta) % 6
  else if (cmax == g) h = (b - r) / delta + 2
  else h = (r - g) / delta + 4
  h = Math.round(h * 60)
  if (h < 0) h += 360
  l = (cmax + cmin) / 2
  s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))
  s = +(s * 100).toFixed(1)
  l = +(l * 100).toFixed(1)
  if (lightness) {
    l = lightness
  }
  return [h, s, l]
}

function configure(configuration) {
  useConfigStore().state.configuration = configuration
}

beforeEach(() => {
  setActivePinia(createPinia())
  document.head.querySelectorAll("style[data-viur-brand-color]").forEach((el) => el.remove())
})

describe("hexToHsl", () => {
  it("rechnet wie der alte Admin", () => {
    for (const hex of ["#d00f1c", "#333333", "#bfff00", "#808080", "#0071ec", "#ffffff", "#000000", "#12ab9f"]) {
      expect(hexToHsl(hex)).toEqual(oldColorConvert(hex, 0))
    }
  })

  it("nimmt Kurzform und Großbuchstaben, verwirft Ungültiges", () => {
    expect(hexToHsl("#Bfff00")).toEqual(hexToHsl("#bfff00"))
    expect(hexToHsl("#fa0")).toEqual(hexToHsl("#ffaa00"))
    expect(hexToHsl("rot")).toBeNull()
    expect(hexToHsl("#12345")).toBeNull()
    expect(hexToHsl(null)).toBeNull()
  })
})

describe("brandColors", () => {
  it("berechnet die elf Brand-Stufen aus admin.color.primary (feste Helligkeit je Stufe)", () => {
    configure({ "admin.color.primary": "#d00f1c" })
    const colors = useColorStore().brandColors

    expect(Object.keys(colors)).toEqual([
      ...BRAND_LIGHTNESS.map(([step]) => `--wa-color-brand-${step}`),
      "--wa-color-brand",
      "--wa-color-brand-on",
    ])
    // Farbton und Sättigung bleiben, die Helligkeit kommt aus der Tabelle
    for (const [step, lightness] of BRAND_LIGHTNESS) {
      const [h, s] = oldColorConvert("#d00f1c", lightness)
      expect(colors[`--wa-color-brand-${step}`]).toBe(`hsl(${h},${s}%,${lightness}%)`)
    }
    expect(colors["--wa-color-brand-50"]).toBe("hsl(356,86.5%,43%)")
    expect(colors["--wa-color-brand"]).toBe("var(--wa-color-brand-50)")
    expect(colors["--wa-color-brand-on"]).toBe("white")
  })

  it("dieselben Helligkeiten wie der alte Admin, in derselben Reihenfolge", () => {
    // --sl-color-primary-50…950 im alten App.vue
    expect(BRAND_LIGHTNESS.map(([, lightness]) => lightness)).toEqual([83, 78, 68, 58, 48, 43, 38, 28, 18, 8, 3])
  })

  it("dunkle Schrift auf hellen Farbtönen (Lime)", () => {
    configure({ "admin.color.primary": "#Bfff00" })
    expect(useColorStore().brandColors["--wa-color-brand-on"]).toBe("var(--wa-color-brand-10)")
  })

  it("ohne gültige Farbe bleibt die Brand-Farbe von WebAwesome", () => {
    configure({})
    expect(useColorStore().brandColors).toEqual({})
    configure({ "admin.color.primary": "kein hex" })
    expect(useColorStore().brandColors).toEqual({})
  })

  it("eine explizit gesetzte Farbe schlägt die Konfiguration", () => {
    configure({ "admin.color.primary": "#d00f1c" })
    const store = useColorStore()
    store.state.primaryColor = "#0071ec"
    const [h, s] = hexToHsl("#0071ec")
    expect(store.brandColors["--wa-color-brand-50"]).toBe(`hsl(${h},${s}%,43%)`)
  })
})

describe("Helfer des alten Admins", () => {
  it("getPrimaryColor / getSecondaryColor / getAlphaColor", () => {
    configure({ "admin.color.primary": "#d00f1c", "admin.color.secondary": "#333333" })
    const store = useColorStore()

    expect(store.getPrimaryColor(43)).toBe("hsl(356,86.5%,43%)")
    // 0 behält die eigene Helligkeit (wie bisher)
    expect(store.getPrimaryColor()).toBe("hsl(356,86.5%,43.7%)")
    expect(store.getSecondaryColor(60)).toBe("hsl(0,0%,60%)")
    // der Fokusring des alten Admins: getAlphaColor("primaryColor", 43, 40)
    expect(store.getAlphaColor("primaryColor", 43, 40)).toBe("hsla(356,86.5%,43%,40%)")
  })

  it("ohne Farbe null", () => {
    configure({})
    expect(useColorStore().getPrimaryColor(43)).toBeNull()
  })
})

describe("applyBrandColor", () => {
  const style = () => document.head.querySelector("style[data-viur-brand-color]")

  it("schreibt die Palette als :root-Regel in den head und hält sie aktuell", async () => {
    configure({ "admin.color.primary": "#d00f1c" })
    const stop = useColorStore().applyBrandColor()

    expect(style().textContent).toContain(":root {")
    expect(style().textContent).toContain("--wa-color-brand-50: hsl(356,86.5%,43%);")

    configure({ "admin.color.primary": "#0071ec" })
    await nextTick()
    expect(document.head.querySelectorAll("style[data-viur-brand-color]")).toHaveLength(1)
    expect(style().textContent).not.toContain("hsl(356")

    // Farbe fällt weg → WebAwesome-Standard
    configure({})
    await nextTick()
    expect(style()).toBeNull()

    stop()
    configure({ "admin.color.primary": "#d00f1c" })
    await nextTick()
    expect(style()).toBeNull()
  })

  it("ohne Dokument ein No-op", () => {
    expect(useColorStore().applyBrandColor(null)).toBeTypeOf("function")
  })
})
