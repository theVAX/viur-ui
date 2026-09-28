import { reactive } from "vue"
import type { InjectionKey } from "vue"
import type { RowKey } from "../DataTable/types"

// --------------------------------------------------------------------------- //
// Drag-Session — gemeinsames Ziehen zwischen Panels (Liste ↔ Baum)            //
// --------------------------------------------------------------------------- //
//
// Die DataTable zieht Zeilen mit Zeiger-Ereignissen (kein HTML5-D&D). Damit
// eine Zeile auch AUSSERHALB der Tabelle fallen gelassen werden kann (auf einen
// Ordner im Navigations-Baum oder eine Ordnerzeile der Liste), stellt der
// Browser diese Session per provide() bereit:
//
//   • Die QUELLE (DataTable) meldet Beginn/Bewegung/Ende des Zugs.
//   • Jedes PANEL registriert sich als Container mit einer `targetFor`-Funktion,
//     die ein DOM-Element unter dem Zeiger in ein Drop-Ziel übersetzt (oder
//     null, wenn dort nichts fallen gelassen werden kann).
//   • Beim Loslassen über einem Ziel liefert `drop()` Nutzlast + Ziel an den
//     Halter der Session (Browser) — die Quelle überspringt dann ihre interne
//     Verschiebung.
//
// Die Session ist bewusst DOM-basiert (elementFromPoint statt Ziel-Rechtecke
// vorab zu vermessen): Panels scrollen und virtualisieren unabhängig.

export interface DragPayload<R = Record<string, unknown>> {
  keys: RowKey[]
  rows: R[]
  /** Container-Id der Quelle (z. B. "list"). */
  source: string
}

export interface DropTarget {
  /** Container-Id des Panels, in dem das Ziel liegt. */
  container: string
  /** Schlüssel des Zielknotens; null = Wurzelebene des Containers. */
  key: RowKey | null
  mode: "inside" | "before" | "after"
}

export interface DragContainer {
  id: string
  /** Wurzelelement des Panels — nur Treffer darin zählen. */
  el: () => HTMLElement | null
  /**
   * Element unter dem Zeiger → Drop-Ziel (oder null). `y`/`x` erlauben
   * Zonen-Entscheidungen (before/inside/after) anhand der Trefferposition.
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
  /** Hit-Test unter (x, y); `hint` übergeht elementFromPoint (Tests). */
  update(x: number, y: number, hint?: Element | null): DropTarget | null
  /** Ziel eingelöst: liefert Nutzlast+Ziel und beendet die Session. */
  drop(): { payload: DragPayload<R>; target: DropTarget } | null
  cancel(): void
}

export const DRAG_SESSION: InjectionKey<DragSession> = Symbol("viur-browser-drag-session")

export function createDragSession<R = Record<string, unknown>>(
  onDrop?: (payload: DragPayload<R>, target: DropTarget) => void
): DragSession<R> {
  const containers = new Map<string, DragContainer>()
  // `reactive` entpackt generische Typen (R wird zu UnwrapRefSimple<R>), womit
  // der Zustand nicht mehr auf DragSession<R> passt. Die Nutzlast ist reine
  // Datenweitergabe — deshalb hier die Form festschreiben.
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

/** Zonen-Helfer: Position im Element → before / inside / after. */
export function dropModeFor(hitRect: DOMRect, y: number, insideOnly = false): "inside" | "before" | "after" {
  if (insideOnly) return "inside"
  const offset = (y - hitRect.top) / Math.max(1, hitRect.height)
  if (offset < 0.25) return "before"
  if (offset > 0.75) return "after"
  return "inside"
}
