import { defineStore } from "pinia"
import { reactive, computed, watch } from "vue"
import { useConfigStore } from "../request/configStore.js"

// --------------------------------------------------------------------------- //
// Color store — brand color from the configuration                           //
// --------------------------------------------------------------------------- //
//
// Same principle as the colorStore of vi-vue-components (old admin): the
// configured colors (`admin.color.primary` / `admin.color.secondary`, part of
// the public /vi/config) are converted to HSL; hue and saturation stay, the
// lightness is fixed per step. The old admin fed Shoelace's
// `--sl-color-primary-50…950` that way. Here the same table feeds the eleven
// steps of the WebAwesome brand palette (`--wa-color-brand-95…05`), in the same
// order; the theme maps them onto its semantic tokens (fill / border / on, light
// and dark) as it does for any built-in brand color.

/** Lightness (HSL, %) per brand step: the old admin's table (50 → 83 %, …,
 *  950 → 3 %), step by step on WebAwesome's steps (95 … 05) — except the
 *  lightest step, which is brighter (95 % instead of 83 %). */
export const BRAND_LIGHTNESS = [
  ["95", 95],
  ["90", 78],
  ["80", 68],
  ["70", 58],
  ["60", 48],
  ["50", 43],
  ["40", 38],
  ["30", 28],
  ["20", 18],
  ["10", 8],
  ["05", 3],
]
const STEP_LIGHTNESS = Object.fromEntries(BRAND_LIGHTNESS)

/**
 * "#rrggbb" / "#rgb" → [h, s, l] (degrees, %, %) — the old admin's conversion,
 * rounding included. Anything else → null.
 */
export function hexToHsl(color) {
  let hex = typeof color === "string" ? color.trim().toLowerCase() : ""
  if (/^#[0-9a-f]{3}$/.test(hex)) hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
  if (!/^#[0-9a-f]{6}$/.test(hex)) return null

  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const cmin = Math.min(r, g, b)
  const cmax = Math.max(r, g, b)
  const delta = cmax - cmin

  let h = 0
  if (delta === 0) h = 0
  else if (cmax === r) h = ((g - b) / delta) % 6
  else if (cmax === g) h = (b - r) / delta + 2
  else h = (r - g) / delta + 4
  h = Math.round(h * 60)
  if (h < 0) h += 360

  const l = (cmax + cmin) / 2
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))
  return [h, +(s * 100).toFixed(1), +(l * 100).toFixed(1)]
}

/** CSS color from [h, s, l]; `lightness` replaces l (0 keeps it, as before). */
function hslString([h, s, l], lightness = 0, alpha = null) {
  const light = lightness || l
  return alpha === null ? `hsl(${h},${s}%,${light}%)` : `hsla(${h},${s}%,${light}%,${alpha}%)`
}

/** Relative luminance (WCAG) of [h, s, l]. */
function luminance([h, s, l]) {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100)
  const channel = (n) => {
    const k = (n + h / 30) % 12
    const c = l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(0) + 0.7152 * channel(8) + 0.0722 * channel(4)
}

/** Text on the brand's key step (50): white, or its darkest step (10) when
 *  that contrasts better — light hues such as lime or yellow. */
function brandOnColor(h, s) {
  const key = luminance([h, s, STEP_LIGHTNESS["50"]])
  const dark = luminance([h, s, STEP_LIGHTNESS["10"]])
  return 1.05 / (key + 0.05) >= (key + 0.05) / (dark + 0.05) ? "white" : "var(--wa-color-brand-10)"
}

export const useColorStore = defineStore("viurColor", () => {
  const configStore = useConfigStore()

  const state = reactive({
    // set explicitly to override the configuration; null → `admin.color.*`
    primaryColor: null,
    secondaryColor: null,
  })

  const primaryHsl = computed(() => hexToHsl(state.primaryColor ?? configStore.get("color.primary")))
  const secondaryHsl = computed(() => hexToHsl(state.secondaryColor ?? configStore.get("color.secondary")))

  /** WebAwesome brand tokens (custom property → value); empty without a
   *  valid primary color, so WebAwesome's default brand stays. */
  const brandColors = computed(() => {
    const color = primaryHsl.value
    if (!color) return {}
    const colors = {}
    for (const [step, lightness] of BRAND_LIGHTNESS) {
      colors[`--wa-color-brand-${step}`] = hslString(color, lightness)
    }
    colors["--wa-color-brand"] = "var(--wa-color-brand-50)"
    colors["--wa-color-brand-on"] = brandOnColor(color[0], color[1])
    return colors
  })

  // ── the old admin's helpers (null without a valid color) ────────────────────
  function getPrimaryColor(lightness = 0) {
    return primaryHsl.value ? hslString(primaryHsl.value, lightness) : null
  }

  function getSecondaryColor(lightness = 0) {
    return secondaryHsl.value ? hslString(secondaryHsl.value, lightness) : null
  }

  /** `color` is "primaryColor" or "secondaryColor", `alpha` in %. */
  function getAlphaColor(color, lightness, alpha) {
    const hsl = color === "secondaryColor" ? secondaryHsl.value : primaryHsl.value
    return hsl ? hslString(hsl, lightness, alpha) : null
  }

  /**
   * Write the brand palette into `doc` and keep it in sync with the
   * configuration. It goes into a `<style>` in the head as an unlayered
   * `:root` rule: that wins over WebAwesome's layered palette / brand rules,
   * reaches every shadow root, and windows that mirror the head's styles (the
   * admin's detached panes) pick it up too. Returns a function that stops the
   * sync.
   */
  function applyBrandColor(doc = globalThis.document) {
    if (!doc?.head) return () => {}
    return watch(
      brandColors,
      (colors) => {
        let style = doc.head.querySelector("style[data-viur-brand-color]")
        const entries = Object.entries(colors)
        if (!entries.length) {
          style?.remove()
          return
        }
        if (!style) {
          style = doc.createElement("style")
          style.dataset.viurBrandColor = ""
          doc.head.append(style)
        }
        style.textContent = `:root {\n${entries.map(([name, value]) => `  ${name}: ${value};`).join("\n")}\n}`
      },
      { immediate: true }
    )
  }

  return {
    state,
    brandColors,
    getPrimaryColor,
    getSecondaryColor,
    getAlphaColor,
    applyBrandColor,
  }
})
