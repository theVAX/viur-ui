import DOMPurify from "dompurify"

// Central, safe HTML rendering for the app.
//
// Purpose: v-html renders raw HTML and is therefore a stored-XSS sink as soon as
// the value comes from the backend or user input. This file provides ONE sanitize
// function, used in two places:
//
//   1) window.__sanitizeHtml  -> called by the compiled templates.
//      The app's Vue Vite plugin can override the built-in v-html compiler
//      transform (in the app's vite.config.js) so that EVERY v-html runs through
//      it automatically. Existing `v-html` usages become safe without code changes.
//   2) the `v-safe-html` directive as an explicit, easy-to-spot alias.
//
// DOMPurify is a fail-closed allowlist: formatting tags (h1-h6, br, p, strong, em,
// ul/ol/li, a[href], table, ...) are kept and stay functional; <script>, event
// handlers (onerror/onclick/...) and javascript: URLs are removed.
//
// IMPORTANT: do NOT run values through helpers that decode HTML entities (e.g. a
// `cleanString()`) beforehand — that turns neutralized payloads live again. Plain
// text output needs no HTML at all -> use {{ text }} / v-text.

// Protect links that open in a new tab against reverse tabnabbing.
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A" && node.getAttribute("target") === "_blank") {
    node.setAttribute("rel", "noopener noreferrer")
  }
})

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }

export function sanitizeHtml(value) {
  const html = value == null ? "" : String(value)
  // DOMPurify returns its input UNCHANGED where it can't run (no DOM, e.g. SSR or
  // some test environments). Stay fail-closed there: escape instead of passing through.
  if (!DOMPurify.isSupported) return html.replace(/[&<>"']/g, (c) => ESCAPES[c])
  // `target` is stripped by default; keep it so the hook above can secure new-tab links
  return DOMPurify.sanitize(html, { ADD_ATTR: ["target"] })
}

// For the compiled templates (v-html compiler override in the app's vite.config.js).
// Set when this module is imported — i.e. before app.mount().
if (typeof window !== "undefined") {
  window.__sanitizeHtml = sanitizeHtml
}

function render(el, value) {
  el.innerHTML = sanitizeHtml(value)
}

// Directive object — also importable for local registration (`<script setup>`:
// `import { vSafeHtml } from ".../safeHtml.js"` makes `v-safe-html` available
// without a global plugin).
export const vSafeHtml = {
  mounted(el, binding) {
    render(el, binding.value)
  },
  updated(el, binding) {
    if (binding.value !== binding.oldValue) {
      render(el, binding.value)
    }
  },
}

export default {
  install: (app) => {
    // Also available globally as an instance property (e.g. for render functions).
    app.config.globalProperties.$sanitizeHtml = sanitizeHtml

    // Explicit alias for v-html.
    app.directive("safe-html", vSafeHtml)
  },
}
