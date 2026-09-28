// Virtualisierung: nur das sichtbare Fenster (plus Overscan) rendert.
//
// Höhen sind nicht überall gleich — Detail-Panels dürfen beliebig hoch sein.
// Deshalb wird ein Präfixsummen-Array über die Zeilenhöhen geführt (gemessene
// Höhen überschreiben die Standardhöhe) und darin binär gesucht. Das Fenster
// wird über Padding oben/unten positioniert, nicht über absolute Positionen —
// so bleiben Grid-Spalten und Sticky-Pinning unangetastet.

import { computed, reactive, type Ref } from "vue"
import type { DisplayRow, Row } from "./types"

export interface VirtualRowsOptions<R extends Row = Row> {
  rows: () => DisplayRow<R>[]
  rowHeight: () => number
  enabled: () => boolean
  overscan?: number
}

export function useVirtualRows<R extends Row = Row>(
  scroller: Ref<HTMLElement | undefined>,
  options: VirtualRowsOptions<R>
) {
  const overscan = options.overscan ?? 6

  const state = reactive({
    scrollTop: 0,
    viewportHeight: 0,
    /** Gemessene Höhen (nur für Zeilen, die von der Standardhöhe abweichen). */
    heights: {} as Record<string, number>,

    offsets: computed((): number[] => {
      const rows = options.rows()
      const base = options.rowHeight()
      const offsets = new Array<number>(rows.length + 1)
      offsets[0] = 0
      for (let index = 0; index < rows.length; index++) {
        offsets[index + 1] = offsets[index] + (state.heights[rows[index].key] ?? base)
      }
      return offsets
    }),

    totalHeight: computed((): number => {
      const offsets = state.offsets as number[]
      return offsets[offsets.length - 1] ?? 0
    }),

    range: computed((): { start: number; end: number } => {
      const rows = options.rows()
      if (!options.enabled() || !rows.length) return { start: 0, end: rows.length }
      const offsets = state.offsets as number[]
      const viewport = state.viewportHeight || options.rowHeight() * 12
      const first = findIndex(offsets, state.scrollTop)
      const last = findIndex(offsets, state.scrollTop + viewport) + 1
      return {
        start: Math.max(0, first - overscan),
        end: Math.min(rows.length, last + overscan),
      }
    }),

    windowRows: computed((): DisplayRow<R>[] => {
      const { start, end } = state.range as { start: number; end: number }
      return options.rows().slice(start, end)
    }),

    padStart: computed((): number => {
      const offsets = state.offsets as number[]
      return offsets[(state.range as { start: number }).start] ?? 0
    }),

    padEnd: computed((): number => {
      const offsets = state.offsets as number[]
      const end = (state.range as { end: number }).end
      return Math.max(0, (state.totalHeight as number) - (offsets[end] ?? 0))
    }),
  })

  /** Größter Index, dessen Offset <= position ist (binäre Suche). */
  function findIndex(offsets: number[], position: number): number {
    let low = 0
    let high = offsets.length - 1
    while (low < high) {
      const middle = (low + high) >> 1
      if (offsets[middle + 1] <= position) low = middle + 1
      else high = middle
    }
    return low
  }

  function syncViewport(): void {
    const el = scroller.value
    if (!el) return
    state.scrollTop = el.scrollTop
    state.viewportHeight = el.clientHeight
  }

  function onScroll(): void {
    syncViewport()
  }

  /** Höhe einer abweichenden Zeile (Detail-Panel) hinterlegen. */
  function measureRow(key: string, height: number): void {
    if (height <= 0) return
    if (Math.abs((state.heights[key] ?? 0) - height) < 1) return
    state.heights[key] = height
  }

  function forgetRow(key: string): void {
    delete state.heights[key]
  }

  function scrollToIndex(index: number, align: "start" | "center" | "end" = "start"): void {
    const el = scroller.value
    if (!el) return
    const offsets = state.offsets as number[]
    const clamped = Math.max(0, Math.min(offsets.length - 2, index))
    const top = offsets[clamped] ?? 0
    const height = (offsets[clamped + 1] ?? top) - top
    const viewport = el.clientHeight
    const target =
      align === "center" ? top - viewport / 2 + height / 2 : align === "end" ? top - viewport + height : top
    el.scrollTop = Math.max(0, target)
    syncViewport()
  }

  return { state, onScroll, syncViewport, measureRow, forgetRow, scrollToIndex }
}
