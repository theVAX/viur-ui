// Keyboard navigation following the ARIA grid pattern: the whole grid is ONE
// tab stop; inside it a roving tabindex moves across the cells.
//
// The composable only knows coordinates (row -1 = header row, 0..n-1 = body)
// and calls the component's callbacks for all domain logic.

import { nextTick, reactive, type Ref } from "vue"

export interface GridNavigationOptions {
  rowCount: () => number
  colCount: () => number
  /** Rows per page for Page Up/Down. */
  pageRows?: () => number
  /** Enter on a header cell. */
  onHeaderActivate?: (col: number, shift: boolean) => void
  /** Enter on a data cell. */
  onCellActivate?: (row: number, col: number) => void
  /** Space on a row. */
  onToggleSelect?: (row: number) => void
  /** Shift + ↑/↓ */
  onExtendSelection?: (row: number) => void
  /** Ctrl + A */
  onSelectAll?: () => void
  /** Ctrl + C */
  onCopy?: () => void
  /** Shift + F10 / context menu key */
  onContextMenu?: (row: number, col: number) => void
  /** Alt + ↑/↓ on a data row (fixed order). */
  onMoveRow?: (row: number, delta: number) => void
  /** Shift + ←/→ on a header cell. */
  onMoveColumn?: (col: number, delta: number) => void
  /** Alt + ←/→ on a header cell. */
  onResizeColumn?: (col: number, delta: number) => void
}

const RESIZE_STEP = 24

export function useGridNavigation(scroller: Ref<HTMLElement | undefined>, options: GridNavigationOptions) {
  const state = reactive({
    /** -1 = header row. */
    row: -1,
    col: 0,
  })

  function isActive(row: number, col: number): boolean {
    return state.row === row && state.col === col
  }

  function clamp(): void {
    const rows = options.rowCount()
    const cols = options.colCount()
    state.row = Math.max(-1, Math.min(rows - 1, state.row))
    if (rows === 0) state.row = -1
    state.col = Math.max(0, Math.min(Math.max(0, cols - 1), state.col))
  }

  async function focusActive(): Promise<void> {
    clamp()
    await nextTick()
    const el = scroller.value?.querySelector<HTMLElement>(`[data-row="${state.row}"][data-col="${state.col}"]`)
    el?.focus({ preventScroll: false })
  }

  function setActive(row: number, col: number, focus = true): void {
    state.row = row
    state.col = col
    clamp()
    if (focus) void focusActive()
  }

  function move(deltaRow: number, deltaCol: number): void {
    setActive(state.row + deltaRow, state.col + deltaCol)
  }

  function handleKeydown(event: KeyboardEvent): void {
    const rows = options.rowCount()
    const cols = options.colCount()
    const inHeader = state.row === -1
    const meta = event.ctrlKey || event.metaKey

    switch (event.key) {
      case "ArrowDown":
        if (event.altKey && !inHeader) {
          event.preventDefault()
          options.onMoveRow?.(state.row, 1)
          return
        }
        if (event.shiftKey && !inHeader) {
          event.preventDefault()
          move(1, 0)
          options.onExtendSelection?.(state.row)
          return
        }
        event.preventDefault()
        move(1, 0)
        return
      case "ArrowUp":
        if (event.altKey && !inHeader) {
          event.preventDefault()
          options.onMoveRow?.(state.row, -1)
          return
        }
        if (event.shiftKey && !inHeader) {
          event.preventDefault()
          move(-1, 0)
          options.onExtendSelection?.(state.row)
          return
        }
        event.preventDefault()
        move(-1, 0)
        return
      case "ArrowLeft":
        event.preventDefault()
        if (inHeader && event.shiftKey) {
          options.onMoveColumn?.(state.col, -1)
          void focusActive()
          return
        }
        if (inHeader && event.altKey) {
          options.onResizeColumn?.(state.col, -RESIZE_STEP)
          return
        }
        move(0, -1)
        return
      case "ArrowRight":
        event.preventDefault()
        if (inHeader && event.shiftKey) {
          options.onMoveColumn?.(state.col, 1)
          void focusActive()
          return
        }
        if (inHeader && event.altKey) {
          options.onResizeColumn?.(state.col, RESIZE_STEP)
          return
        }
        move(0, 1)
        return
      case "Home":
        event.preventDefault()
        if (meta) setActive(rows ? 0 : -1, 0)
        else setActive(state.row, 0)
        return
      case "End":
        event.preventDefault()
        if (meta) setActive(rows - 1, cols - 1)
        else setActive(state.row, cols - 1)
        return
      case "PageDown":
        event.preventDefault()
        move(options.pageRows?.() ?? 10, 0)
        return
      case "PageUp":
        event.preventDefault()
        move(-(options.pageRows?.() ?? 10), 0)
        return
      case "Enter":
        event.preventDefault()
        if (inHeader) options.onHeaderActivate?.(state.col, event.shiftKey)
        else options.onCellActivate?.(state.row, state.col)
        return
      case " ":
      case "Spacebar":
        if (inHeader) return
        event.preventDefault()
        options.onToggleSelect?.(state.row)
        return
      case "a":
      case "A":
        if (!meta) return
        event.preventDefault()
        options.onSelectAll?.()
        return
      case "c":
      case "C":
        if (!meta) return
        options.onCopy?.()
        return
      case "F10":
        if (!event.shiftKey) return
        event.preventDefault()
        options.onContextMenu?.(state.row, state.col)
        return
      case "ContextMenu":
        event.preventDefault()
        options.onContextMenu?.(state.row, state.col)
        return
      default:
        return
    }
  }

  return { state, isActive, setActive, move, focusActive, handleKeydown, clamp }
}
