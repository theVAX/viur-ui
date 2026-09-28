// Spalten-Layout: Reihenfolge, Breiten, Sichtbarkeit, Pinning — plus die
// Zeigergesten für Resize und Reorder. Alles in EINEM reaktiven State-Objekt
// (analog zur Komponenten-Regel), damit die Komponente nur noch rendert.

import { computed, reactive } from "vue"
import type { PinSide, ResolvedColumn, Row } from "./types"

const DEFAULT_WIDTH = 160
const DEFAULT_MIN_WIDTH = 64

export interface LayoutColumn<R extends Row = Row> {
  column: ResolvedColumn<R>
  /** Index in der sichtbaren Reihenfolge. */
  index: number
  /** Effektive Breite in px (gemessen oder gesetzt). */
  width: number
  /** Spaltenbreite für grid-template-columns. */
  track: string
  pinned: PinSide | false
  /** Sticky-Abstand zur jeweiligen Kante (px). */
  offset: number
  /** Letzte am Start bzw. erste am Ende gepinnte Spalte (für die Trennlinie). */
  pinEdge: boolean
  resizable: boolean
  movable: boolean
  pinnable: boolean
}

export interface ColumnLayoutOptions<R extends Row = Row> {
  columns: () => ResolvedColumn<R>[]
  resizable?: () => boolean
  reorderable?: () => boolean
  pinnable?: () => boolean
  onResize?: (id: string, width: number, finished: boolean) => void
  onMove?: (order: string[], finished: boolean) => void
  onPin?: (id: string, side: PinSide | false) => void
  onVisibilityChange?: (id: string, visible: boolean) => void
}

function clampWidth<R extends Row>(column: ResolvedColumn<R>, width: number): number {
  const min = column.def.minWidth ?? DEFAULT_MIN_WIDTH
  const max = column.def.maxWidth ?? Number.POSITIVE_INFINITY
  return Math.max(min, Math.min(max, width))
}

export function useColumnLayout<R extends Row = Row>(options: ColumnLayoutOptions<R>) {
  const state = reactive({
    /** Vom Nutzer gesetzte Reihenfolge (ids). Leer = Reihenfolge der Definitionen. */
    order: [] as string[],
    /** Vom Nutzer gezogene Breiten. */
    widths: {} as Record<string, number>,
    /** Sichtbarkeit; fehlt ein Eintrag, gilt `hidden` aus der Definition. */
    visibility: {} as Record<string, boolean>,
    /** Pinning; fehlt ein Eintrag, gilt `pinned` aus der Definition. */
    pinning: {} as Record<string, PinSide | false>,
    /** Im DOM gemessene Breiten — Grundlage der Sticky-Abstände. */
    measured: {} as Record<string, number>,
    /** Laufende Resize-Geste. */
    resizing: null as { id: string; startX: number; startWidth: number } | null,
    /** Laufende Reorder-Geste. */
    dragging: null as { id: string; overId: string | null; x: number; y: number } | null,

    ordered: computed((): ResolvedColumn<R>[] => {
      const columns = options.columns()
      if (!state.order.length) return columns
      const byId = new Map(columns.map((column) => [column.id, column]))
      const sorted: ResolvedColumn<R>[] = []
      for (const id of state.order) {
        const column = byId.get(id)
        if (column) {
          sorted.push(column)
          byId.delete(id)
        }
      }
      // Neue Spalten, die die gespeicherte Reihenfolge nicht kennt, hinten dran.
      return [...sorted, ...byId.values()]
    }),

    /** Sichtbare Spalten in Anzeigereihenfolge: gepinnt (Start) → frei → gepinnt (Ende). */
    visibleColumns: computed((): LayoutColumn<R>[] => {
      const visible = state.ordered.filter((column: ResolvedColumn<R>) => isVisible(column))
      const pinnedStart = visible.filter((column: ResolvedColumn<R>) => pinOf(column) === "start")
      const pinnedEnd = visible.filter((column: ResolvedColumn<R>) => pinOf(column) === "end")
      const free = visible.filter((column: ResolvedColumn<R>) => !pinOf(column))
      const arranged = [...pinnedStart, ...free, ...pinnedEnd]

      let startOffset = 0
      const offsets = new Map<string, number>()
      for (const column of pinnedStart) {
        offsets.set(column.id, startOffset)
        startOffset += widthOf(column)
      }
      let endOffset = 0
      for (const column of [...pinnedEnd].reverse()) {
        offsets.set(column.id, endOffset)
        endOffset += widthOf(column)
      }

      return arranged.map((column, index) => {
        const pinned = pinOf(column)
        return {
          column,
          index,
          width: widthOf(column),
          track: trackOf(column),
          pinned,
          offset: offsets.get(column.id) ?? 0,
          pinEdge:
            (pinned === "start" && column === pinnedStart[pinnedStart.length - 1]) ||
            (pinned === "end" && column === pinnedEnd[0]),
          resizable: column.def.resizable ?? options.resizable?.() ?? false,
          movable: column.def.movable ?? options.reorderable?.() ?? false,
          pinnable: column.def.pinnable ?? options.pinnable?.() ?? false,
        }
      })
    }),

    hiddenColumns: computed((): ResolvedColumn<R>[] =>
      state.ordered.filter((column: ResolvedColumn<R>) => !isVisible(column))
    ),
  })

  function isVisible(column: ResolvedColumn<R>): boolean {
    return state.visibility[column.id] ?? !column.def.hidden
  }

  function pinOf(column: ResolvedColumn<R>): PinSide | false {
    return state.pinning[column.id] ?? column.def.pinned ?? false
  }

  /** Effektive Breite: gezogen > gemessen > definiert > Default. */
  function widthOf(column: ResolvedColumn<R>): number {
    const width = state.widths[column.id] ?? state.measured[column.id] ?? column.def.width ?? DEFAULT_WIDTH
    return clampWidth(column, width)
  }

  function trackOf(column: ResolvedColumn<R>): string {
    // Eine vom Nutzer gezogene Breite gewinnt IMMER — auch gegen flex, sonst
    // ließe sich eine flex-Spalte nicht von Hand skalieren.
    const dragged = state.widths[column.id]
    if (dragged !== undefined) return `${clampWidth(column, dragged)}px`
    const fixed = column.def.width
    if (fixed !== undefined && !column.def.flex) return `${clampWidth(column, fixed)}px`
    const min = column.def.minWidth ?? DEFAULT_MIN_WIDTH
    const flex = column.def.flex ?? 1
    const max = column.def.maxWidth
    const upper = max ? `${max}px` : `${flex}fr`
    return `minmax(${min}px, ${upper})`
  }

  function setMeasured(id: string, width: number): void {
    if (Math.abs((state.measured[id] ?? 0) - width) < 0.5) return
    state.measured[id] = width
  }

  // ── Sichtbarkeit ────────────────────────────────────────────────────
  function toggleColumn(id: string, visible?: boolean, silent = false): void {
    const column = options.columns().find((item) => item.id === id)
    if (!column) return
    const next = visible ?? !isVisible(column)
    state.visibility[id] = next
    if (!silent) options.onVisibilityChange?.(id, next)
  }

  // ── Pinning ─────────────────────────────────────────────────────────
  function pinColumn(id: string, side: PinSide | false, silent = false): void {
    // Ohne feste Breite die aktuelle Breite einfrieren — sonst springt die
    // Spalte beim Pinnen, weil der Sticky-Abstand eine px-Breite braucht.
    const column = options.columns().find((item) => item.id === id)
    if (column && side && state.widths[id] === undefined && column.def.width === undefined) {
      state.widths[id] = widthOf(column)
    }
    state.pinning[id] = side
    if (!silent) options.onPin?.(id, side)
  }

  function getColumnPin(id: string): PinSide | false {
    const column = options.columns().find((item) => item.id === id)
    return column ? pinOf(column) : false
  }

  // ── Reihenfolge ─────────────────────────────────────────────────────
  function currentOrder(): string[] {
    return state.ordered.map((column: ResolvedColumn<R>) => column.id)
  }

  function moveColumn(id: string, targetId: string, finished = true): void {
    if (id === targetId) return
    const order = currentOrder()
    const from = order.indexOf(id)
    const to = order.indexOf(targetId)
    if (from === -1 || to === -1) return
    order.splice(to, 0, ...order.splice(from, 1))
    state.order = order
    options.onMove?.(order, finished)
  }

  /** Spalte um `delta` Positionen verschieben (Tastatur: Shift + ←/→). */
  function shiftColumn(id: string, delta: number): void {
    const visible = state.visibleColumns.map((item: LayoutColumn<R>) => item.column.id)
    const index = visible.indexOf(id)
    const target = visible[index + delta]
    if (target) moveColumn(id, target, true)
  }

  // ── Resize ──────────────────────────────────────────────────────────
  function startResize(id: string, clientX: number): void {
    const column = options.columns().find((item) => item.id === id)
    if (!column) return
    state.resizing = { id, startX: clientX, startWidth: widthOf(column) }
  }

  function moveResize(clientX: number): void {
    const active = state.resizing
    if (!active) return
    const column = options.columns().find((item) => item.id === active.id)
    if (!column) return
    const width = clampWidth(column, active.startWidth + (clientX - active.startX))
    state.widths[active.id] = width
    options.onResize?.(active.id, width, false)
  }

  function endResize(): void {
    const active = state.resizing
    state.resizing = null
    if (active) options.onResize?.(active.id, state.widths[active.id] ?? 0, true)
  }

  function setWidth(id: string, width: number): void {
    const column = options.columns().find((item) => item.id === id)
    if (!column) return
    state.widths[id] = clampWidth(column, width)
  }

  // ── Drag & Drop (Reorder) ───────────────────────────────────────────
  function startDrag(id: string, clientX: number, clientY: number): void {
    state.dragging = { id, overId: null, x: clientX, y: clientY }
  }

  function dragOver(id: string, clientX: number, clientY: number): void {
    if (!state.dragging) return
    state.dragging.overId = id
    state.dragging.x = clientX
    state.dragging.y = clientY
  }

  function endDrag(): void {
    const active = state.dragging
    state.dragging = null
    if (active?.overId && active.overId !== active.id) moveColumn(active.id, active.overId, true)
  }

  // ── Zurücksetzen / Zustand ──────────────────────────────────────────
  function resetColumns(): void {
    state.order = []
    state.widths = {}
    state.visibility = {}
    state.pinning = {}
  }

  /** Spalten-ids, die es nicht mehr gibt, aus dem Zustand entfernen. */
  function pruneUnknown(): void {
    const ids = new Set(options.columns().map((column) => column.id))
    state.order = state.order.filter((id) => ids.has(id))
    for (const map of [state.widths, state.visibility, state.pinning, state.measured] as Record<string, unknown>[]) {
      for (const id of Object.keys(map)) if (!ids.has(id)) delete map[id]
    }
  }

  return {
    state,
    isVisible,
    pinOf,
    widthOf,
    setMeasured,
    toggleColumn,
    pinColumn,
    getColumnPin,
    currentOrder,
    moveColumn,
    shiftColumn,
    startResize,
    moveResize,
    endResize,
    setWidth,
    startDrag,
    dragOver,
    endDrag,
    resetColumns,
    pruneUnknown,
  }
}

export type ColumnLayout<R extends Row = Row> = ReturnType<typeof useColumnLayout<R>>
