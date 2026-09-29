// @vitest-environment jsdom
import { createApp, h, nextTick, ref, withDirectives, resolveDirective } from "vue"
import safeHtml, { sanitizeHtml } from "../../src/vite/safeHtml.js"
import Utils from "../../src/forms/bones/utils.js"

describe("sanitizeHtml", () => {
  it("keeps formatting, removes scripts, handlers and javascript: URLs", () => {
    const out = sanitizeHtml(
      '<p><strong>ok</strong></p><script>x()</script><img src=x onerror="x()"><a href="javascript:x()">l</a>'
    )
    expect(out).toContain("<strong>ok</strong>")
    expect(out).not.toMatch(/script|onerror|javascript:/)
  })

  it("adds rel=noopener to target=_blank links", () => {
    expect(sanitizeHtml('<a href="/x" target="_blank">x</a>')).toContain('rel="noopener noreferrer"')
  })

  it("treats null/undefined as empty", () => {
    expect(sanitizeHtml(null)).toBe("")
    expect(sanitizeHtml(undefined)).toBe("")
  })
})

describe("v-safe-html", () => {
  it("renders sanitized HTML and updates on change", async () => {
    const html = ref('<b>a</b><img src=x onerror="x()">')
    const el = document.createElement("div")
    const app = createApp({
      render() {
        return withDirectives(h("div"), [[resolveDirective("safe-html"), html.value]])
      },
    })
    app.use(safeHtml).mount(el)
    expect(el.innerHTML).toContain("<b>a</b>")
    expect(el.innerHTML).not.toContain("onerror")
    html.value = "<i>b</i>"
    await nextTick()
    expect(el.innerHTML).toContain("<i>b</i>")
    app.unmount()
  })
})

describe("Utils.stripHtml", () => {
  it("returns the text without executing handlers", () => {
    window.__pwned = false
    expect(Utils.stripHtml('<b>Hi</b><img src=x onerror="window.__pwned = true">')).toBe("Hi")
    expect(window.__pwned).toBe(false)
  })
})

describe("installViurForms", () => {
  it("registers v-safe-html and $sanitizeHtml once", async () => {
    const { installViurForms } = await import("../../src/forms/install.js")
    const app = createApp({ render: () => null })
    installViurForms(app)
    installViurForms(app)
    expect(app.directive("safe-html")).toBeTruthy()
    expect(app.config.globalProperties.$sanitizeHtml).toBe(sanitizeHtml)
    expect(window.__sanitizeHtml).toBe(sanitizeHtml)
  })
})
