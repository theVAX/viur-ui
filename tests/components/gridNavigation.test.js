import { describe, it, expect, beforeEach, vi } from "vitest"
import { ref } from "vue"
import { useGridNavigation } from "../../src/components/DataTable/useGridNavigation.ts"

// Controls inside a cell (slot `cell:<id>`) own their keys: the grid must not
// steal arrows/Home/End from an input or Enter/Space from a button.

let scroller, cell, nav, onToggleSelect, onCellActivate

function press(target, key) {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, composed: true, cancelable: true })
  target.dispatchEvent(event)
  return event
}

function shadowControl(html) {
  const host = document.createElement("x-control")
  host.attachShadow({ mode: "open" }).innerHTML = html
  cell.append(host)
  return host.shadowRoot.firstElementChild
}

beforeEach(() => {
  document.body.innerHTML = ""
  scroller = document.createElement("div")
  cell = document.createElement("div")
  cell.dataset.row = "0"
  cell.dataset.col = "0"
  cell.tabIndex = 0
  scroller.append(cell)
  document.body.append(scroller)
  onToggleSelect = vi.fn()
  onCellActivate = vi.fn()
  nav = useGridNavigation(ref(scroller), { rowCount: () => 3, colCount: () => 3, onToggleSelect, onCellActivate })
  nav.setActive(0, 0, false)
  scroller.addEventListener("keydown", nav.handleKeydown)
})

describe("useGridNavigation mit Bedienelementen in Zellen", () => {
  it("navigiert weiter, wenn die Zelle selbst fokussiert ist", () => {
    expect(press(cell, "ArrowRight").defaultPrevented).toBe(true)
    expect(nav.state.col).toBe(1)
    press(cell, " ")
    expect(onToggleSelect).toHaveBeenCalledWith(0)
  })

  it("lässt alle Tasten eines Textfelds durch (auch im Shadow DOM)", () => {
    const input = shadowControl('<input type="text">')
    for (const key of ["ArrowLeft", "ArrowRight", "Home", "End", "Enter", " "]) {
      expect(press(input, key).defaultPrevented).toBe(false)
    }
    expect(nav.state).toEqual({ row: 0, col: 0 })
    expect(onToggleSelect).not.toHaveBeenCalled()
    expect(onCellActivate).not.toHaveBeenCalled()
  })

  it("lässt Enter/Leertaste eines Knopfs oder Häkchens durch, Pfeile navigieren", () => {
    const checkbox = shadowControl('<input type="checkbox">')
    expect(press(checkbox, " ").defaultPrevented).toBe(false)
    expect(press(checkbox, "Enter").defaultPrevented).toBe(false)
    expect(onToggleSelect).not.toHaveBeenCalled()
    expect(press(checkbox, "ArrowDown").defaultPrevented).toBe(true)
    expect(nav.state.row).toBe(1)
  })

  it("Escape bringt den Fokus aus dem Feld zurück auf die Zelle", () => {
    const input = document.createElement("input")
    cell.append(input)
    input.focus()
    expect(press(input, "Escape").defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(cell)
  })

  it("Escape bei offenem Dropdown bleibt beim Dropdown", () => {
    const combobox = shadowControl('<input role="combobox" aria-expanded="true" readonly>')
    expect(press(combobox, "Escape").defaultPrevented).toBe(false)
  })
})
