---
covers: [src.vite.safeHtml.sanitizeHtml, src.vite.safeHtml.vSafeHtml, src.vite.sanitizeVHtml.sanitizeVHtml]
status: accepted
---

## Seam

All HTML coming from the backend or from users is rendered through
`sanitizeHtml()` (DOMPurify, allowlist). Three ways to reach it:

- `v-safe-html` - directive, registered globally by the `safeHtml` plugin
  (`installViurForms(app)` installs it), or locally via
  `import { vSafeHtml }` in `<script setup>`.
- `$sanitizeHtml` / `sanitizeHtml()` - for render functions and computed values.
- `sanitizeVHtml` - compile-time transform for the app's `vite.config.js`
  (`vue({ template: { compilerOptions: { directiveTransforms: { html: sanitizeVHtml } } } })`).
  Routes every plain `v-html` of the app through `window.__sanitizeHtml`.

Plain text needs no HTML at all: `{{ text }}` or `v-text`.

## Rules

- No bare `v-html` with backend or user data in this package - it is a
  stored-XSS sink. Use `v-safe-html`.
- Do not run a value through a helper that decodes HTML entities before
  sanitizing or rendering it - that turns neutralized payloads live again.
- Do not widen the DOMPurify config per call site. The only addition is
  `ADD_ATTR: ["target"]`, so the hook can force `rel="noopener noreferrer"` on
  `target="_blank"` links.

## Traps

- `v-html` is compiled to an `innerHTML` prop at build time. Installing the
  plugin at runtime does not touch it - only the `sanitizeVHtml` transform in the
  app's Vite config does.
- `sanitizeVHtml` calls `window.__sanitizeHtml`, which exists only after
  `src/vite/safeHtml.js` was imported (`installViurForms` or the plugin). A
  `v-html` rendered before that throws.
- Without a DOM (SSR, some test environments) `DOMPurify.isSupported` is false
  and `sanitizeHtml` escapes the whole string instead of sanitizing it.
  Formatting is lost there; that is intended (fail-closed).
- `vSafeHtml.updated` re-renders only when the value changed by identity.

## See also

- `docs/adr/forms/bones.md`
- `docs/adr/forms/bones/view/bone-logic.md` - returns entity-decoded text.
