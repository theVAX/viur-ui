import { reactive } from "vue"
import type { InjectionKey } from "vue"
import type { RowKey } from "../DataTable/types"

// --------------------------------------------------------------------------- //
// Drag session — shared dragging between panels (list ↔ tree)                 //
// --------------------------------------------------------------------------- //
//
// The DataTable drags rows with pointer events (no HTML5 D&D). So that a row
// can also be dropped OUTSIDE the table (onto a folder in the navigation tree
// or a folder row of the list), the browser provides this session via
// provide():
//
//   • The SOURCE (DataTable) reports start/move/end of the drag.
//   • Every PANEL registers itself as a container with a `targetFor` function
//     that translates a DOM element under the pointer into a drop target (or
//     null if nothing can be dropped there).
//   • On release over a target, `drop()` hands payload + target to the
//     holder of the session (browser) — the source then skips its internal
//     move.
//
// The session is deliberately DOM-based (elementFromPoint instead of measuring
// target rectangles up front): panels scroll and virtualize independently.

export interface DragPayload<R = Record<string, unknown>> {
  keys: RowKey[]
  rows: R[]
  /** Container id of the source (e.g. "list"). */
  source: string
}

export interface DropTarget {
  /** Container id of the panel the target lies in. */
  container: string
  /** Key of the target node; null = root level of the container. */
  key: RowKey | null
  mode: "inside" | "before" | "after"
}

export interface DragContainer {
  id: string
  /** Root element of the panel — only hits inside it count. */
  el: () => HTMLElement | null
  /**
   * Element under the pointer → drop target (or null). `y`/`x` allow
   * zone decisions (before/inside/after) based on the hit position.
   */
  targetFor: (hit: Element, x: number, y: number) => DropTarget | null
}

export interface DragSession<R = Record<string, unknown>> {
  state: {
    active: boolean
    payload: DragPayload<R> | null
    over: DropTarget | null
  }
  register(container: DragContainer): () => void
  start(payload: DragPayload<R>): void
  /** Hit test at (x, y); `hint` bypasses elementFromPoint (tests). */
  update(x: number, y: number, hint?: Element | null): DropTarget | null
  /** Target redeemed: returns payload+target and ends the session. */
  drop(): { payload: DragPayload<R>; target: DropTarget } | null
  cancel(): void
}

export const DRAG_SESSION: InjectionKey<DragSession> = Symbol("viur-browser-drag-session")

export function createDragSession<R = Record<string, unknown>>(
  onDrop?: (payload: DragPayload<R>, target: DropTarget) => void
): DragSession<R> {
  const containers = new Map<string, DragContainer>()
  // `reactive` unwraps generic types (R becomes UnwrapRefSimple<R>), so the
  // state no longer matches DragSession<R>. The payload is pure data
  // pass-through — hence the shape is pinned down here.
  const state = reactive({
    active: false,
    payload: null as DragPayload<R> | null,
    over: null as DropTarget | null,
  }) as DragSession<R>["state"]

  function register(container: DragContainer): () => void {
    containers.set(container.id, container)
    return () => containers.delete(container.id)
  }

  function start(payload: DragPayload<R>): void {
    state.active = true
    state.payload = payload as typeof state.payload
    state.over = null
  }

  function update(x: number, y: number, hint?: Element | null): DropTarget | null {
    if (!state.active) return null
    const hit = hint !== undefined ? hint : (document.elementFromPoint(x, y) ?? null)
    if (!hit) {
      state.over = null
      return null
    }
    for (const container of containers.values()) {
      const root = container.el()
      if (!root || !root.contains(hit)) continue
      state.over = container.targetFor(hit, x, y)
      return state.over
    }
    state.over = null
    return null
  }

  function drop(): { payload: DragPayload<R>; target: DropTarget } | null {
    const payload = state.payload
    const target = state.over
    cancel()
    if (!payload || !target) return null
    onDrop?.(payload, target)
    return { payload, target }
  }

  function cancel(): void {
    state.active = false
    state.payload = null
    state.over = null
  }

  return { state, register, start, update, drop, cancel }
}

/** Zone helper: position within the element → before / inside / after. */
export function dropModeFor(hitRect: DOMRect, y: number, insideOnly = false): "inside" | "before" | "after" {
  if (insideOnly) return "inside"
  const offset = (y - hitRect.top) / Math.max(1, hitRect.height)
  if (offset < 0.25) return "before"
  if (offset > 0.75) return "after"
  return "inside"
}
