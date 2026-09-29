import { DOMDirectiveTransforms, createCompoundExpression } from "@vue/compiler-dom"

// Compile-time v-html override for the app's vite.config.js: every v-html is routed
// through window.__sanitizeHtml (DOMPurify, set by src/vite/safeHtml.js /
// installViurForms). Wraps Vue's own transform, so its dev warnings and child
// handling stay intact.
//
//   vue({ template: { compilerOptions: { directiveTransforms: { html: sanitizeVHtml } } } })
export function sanitizeVHtml(dir, node, context) {
  const result = DOMDirectiveTransforms.html(dir, node, context)
  if (dir.exp) {
    result.props[0].value = createCompoundExpression(["window.__sanitizeHtml(", dir.exp, ")"])
  }
  return result
}
