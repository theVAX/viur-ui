import { describe, it, expect } from "vitest"
import { createApp, h } from "vue"
import { createPinia, setActivePinia } from "pinia"

const { default: LayoutList } = await import("../../src/forms/layouts/LayoutList.vue")
const { default: LayoutList2Columns } = await import("../../src/forms/layouts/LayoutList2Columns.vue")

const structure = { a: { type: "str" }, b: { type: "str" }, c: { type: "str" }, d: { type: "str" } }

/** Renders the layout with every bone as a <i> carrying its name, grouped by column if any. */
function render(layout, formState) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const app = createApp({ render: () => h(layout, null, { default: ({ boneName }) => h("i", boneName) }) })
  app.use(pinia)
  app.provide("formState", formState)
  const el = document.createElement("div")
  app.mount(el)
  return el
}

const names = (el) => [...el.querySelectorAll("i")].map((i) => i.textContent)

describe("list layouts", () => {
  it("LayoutList shows every bone of the structure, also without a value", () => {
    const el = render(LayoutList, { structure, skel: { a: "1" }, bones: [] })
    expect(names(el)).toEqual(["a", "b", "c", "d"])
  })

  it("LayoutList follows the bones prop", () => {
    const el = render(LayoutList, { structure, skel: {}, bones: ["b", "d"] })
    expect(names(el)).toEqual(["b", "d"])
  })

  it("LayoutList2Columns shows all bones without a bones prop", () => {
    const el = render(LayoutList2Columns, { structure, skel: {}, bones: [] })
    expect(names(el)).toEqual(["a", "c", "b", "d"])
  })

  it("LayoutList2Columns splits the filtered bones evenly", () => {
    const el = render(LayoutList2Columns, { structure, skel: {}, bones: ["a", "b"] })
    expect([...el.querySelectorAll(".column")].map((column) => names(column))).toEqual([["a"], ["b"]])
  })

  it("LayoutList2Columns renders nothing before the structure is there", () => {
    const el = render(LayoutList2Columns, { structure: {}, skel: {}, bones: [] })
    expect(el.querySelector(".wrapper")).toBeNull()
  })
})
