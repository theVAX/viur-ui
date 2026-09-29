// Pure column/cell logic: resolving definitions, comparison, filters,
// facets, aggregation. Deliberately free of Vue — so the whole
// data path is testable without a DOM.

import type {
  AggregationKind,
  Align,
  ColumnFacets,
  DataTableColumn,
  FilterEntry,
  FilterType,
  ResolvedColumn,
  Row,
  SortEntry,
  SortMode,
} from "./types.ts"

/** Read a value via a dot path ("user.name"). */
export function getPath(row: Row, path: string): unknown {
  if (!path.includes(".")) return row[path]
  let current: unknown = row
  for (const part of path.split(".")) {
    if (current === null || current === undefined) return undefined
    current = (current as Row)[part]
  }
  return current
}

export function columnId(def: DataTableColumn): string {
  const id = def.id ?? def.field
  if (!id) throw new Error("[DataTable] Spalte braucht `id` oder `field`")
  return id
}

function defaultText(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (Array.isArray(value)) return value.map((v) => defaultText(v)).join(", ")
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

export function resolveColumns<R extends Row>(defs: DataTableColumn<R>[]): ResolvedColumn<R>[] {
  return defs.map((def) => {
    const id = columnId(def as DataTableColumn)
    const hasAccessor = Boolean(def.field || def.value)
    const get = def.value
      ? (row: R) => def.value!(row)
      : def.field
        ? (row: R) => getPath(row, def.field!)
        : () => undefined
    const align: Align = def.align ?? "start"
    return {
      id,
      def,
      field: def.field,
      label: def.label ?? id,
      align,
      headerAlign: def.headerAlign ?? align,
      sortable: def.sortable ?? hasAccessor,
      searchable: def.searchable ?? hasAccessor,
      filterable: def.filterable ?? false,
      filterType: def.filterType ?? "text",
      hideable: def.hideable ?? true,
      get,
      text: (row: R) => {
        const value = get(row)
        return def.formatter ? def.formatter(value, row) : defaultText(value)
      },
    }
  })
}

export function findColumn<R extends Row>(columns: ResolvedColumn<R>[], id: string): ResolvedColumn<R> | undefined {
  return columns.find((column) => column.id === id)
}

// ── Sorting ───────────────────────────────────────────────────────────

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" })
const collatorCase = new Intl.Collator(undefined, { numeric: true })

function toTime(value: unknown): number {
  if (value instanceof Date) return value.getTime()
  if (typeof value === "number") return value
  const parsed = Date.parse(String(value))
  return Number.isNaN(parsed) ? Number.NaN : parsed
}

export function isEmptyValue(value: unknown): boolean {
  return value === null || value === undefined || value === ""
}

/**
 * Reduce composite cell values to the sort atom: for arrays the FIRST entry
 * counts, for plain objects the FIRST value — recursively, until a primitive
 * (or Date) remains. This way `multiple` bones, multilingual values
 * ({ de: "…" }) and relational bones ({ dest: { … } }) sort by their
 * respective first value instead of by "[object Object]".
 */
export function firstValueOf(value: unknown, depth = 0): unknown {
  if (depth > 10 || value === null || value === undefined) return value
  if (Array.isArray(value)) return firstValueOf(value[0], depth + 1)
  if (typeof value === "object" && !(value instanceof Date)) {
    const values = Object.values(value as Record<string, unknown>)
    return values.length ? firstValueOf(values[0], depth + 1) : undefined
  }
  return value
}

/** Compare two cell values in one of the built-in modes (ascending). */
export function compareValues(a: unknown, b: unknown, mode: SortMode = "auto"): number {
  switch (mode) {
    case "basic":
      return a === b ? 0 : (a as number) > (b as number) ? 1 : -1
    case "number": {
      const na = Number(a)
      const nb = Number(b)
      if (Number.isNaN(na) && Number.isNaN(nb)) return 0
      if (Number.isNaN(na)) return 1
      if (Number.isNaN(nb)) return -1
      return na - nb
    }
    case "datetime": {
      const ta = toTime(a)
      const tb = toTime(b)
      if (Number.isNaN(ta) && Number.isNaN(tb)) return 0
      if (Number.isNaN(ta)) return 1
      if (Number.isNaN(tb)) return -1
      return ta - tb
    }
    case "text":
      return collator.compare(defaultText(a), defaultText(b))
    case "textCaseSensitive":
      return collatorCase.compare(defaultText(a), defaultText(b))
    case "auto":
    default: {
      // Arrays/objects: sort by the first value (see firstValueOf).
      if (a !== null && typeof a === "object" && !(a instanceof Date)) a = firstValueOf(a)
      if (b !== null && typeof b === "object" && !(b instanceof Date)) b = firstValueOf(b)
      if (typeof a === "number" && typeof b === "number") return a - b
      if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b)
      if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime()
      return collator.compare(defaultText(a), defaultText(b))
    }
  }
}

/**
 * Stably sorts a row list by multiple columns. Empty values end up at the
 * front or back according to the column's `sortUndefined` (default: compared normally).
 */
export function sortRows<R extends Row>(rows: R[], sort: SortEntry[], columns: ResolvedColumn<R>[]): R[] {
  if (!sort.length) return rows
  const entries = sort
    .map((entry) => ({ entry, column: findColumn(columns, entry.id) }))
    .filter((item): item is { entry: SortEntry; column: ResolvedColumn<R> } => Boolean(item.column))
  if (!entries.length) return rows

  // Carry the index along → stable sorting regardless of the engine.
  return rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => {
      for (const { entry, column } of entries) {
        const a = column.get(left.row)
        const b = column.get(right.row)
        const emptyRule = column.def.sortUndefined ?? false
        if (emptyRule && (isEmptyValue(a) || isEmptyValue(b))) {
          if (isEmptyValue(a) && isEmptyValue(b)) continue
          const emptyFirst = emptyRule === "first"
          return isEmptyValue(a) ? (emptyFirst ? -1 : 1) : emptyFirst ? 1 : -1
        }
        const raw = column.def.comparator
          ? column.def.comparator(a, b, left.row, right.row)
          : compareValues(a, b, column.def.sortFn ?? "auto")
        if (raw !== 0) return entry.desc ? -raw : raw
      }
      return left.index - right.index
    })
    .map((item) => item.row)
}

/**
 * Next sort state when clicking a column header.
 * asc → desc → off (or cycling endlessly with `withoutSortRemoval`),
 * multi-column with Shift (limited by `maxMultiSort`, 0 = unlimited).
 */
export function nextSortState(
  current: SortEntry[],
  column: ResolvedColumn,
  options: {
    multi?: boolean
    descFirst?: boolean
    withoutRemoval?: boolean
    maxMultiSort?: number
  } = {}
): SortEntry[] {
  const descFirst = column.def.sortDescFirst ?? options.descFirst ?? false
  const existing = current.find((entry) => entry.id === column.id)
  const others = current.filter((entry) => entry.id !== column.id)

  let next: SortEntry | null
  if (!existing) next = { id: column.id, desc: descFirst }
  else if (existing.desc === descFirst) next = { id: column.id, desc: !descFirst }
  else next = options.withoutRemoval ? { id: column.id, desc: descFirst } : null

  if (!options.multi) return next ? [next] : []
  if (!next) return others
  const combined = [...others, next]
  const max = options.maxMultiSort ?? 0
  return max > 0 ? combined.slice(-max) : combined
}

// ── Filter & search ───────────────────────────────────────────────────

function dayStart(value: unknown): number {
  const time = toTime(value)
  if (Number.isNaN(time)) return Number.NaN
  const date = new Date(time)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/** Is a filter value "empty" (then the column doesn't filter)? */
export function isEmptyFilter(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return true
  if (Array.isArray(value)) return value.every((item) => isEmptyFilter(item))
  return false
}

export function matchesFilter(value: unknown, filterValue: unknown, type: FilterType): boolean {
  if (isEmptyFilter(filterValue)) return true
  switch (type) {
    case "equals":
      return defaultText(value).toLowerCase() === String(filterValue).toLowerCase()
    case "number-range": {
      const [min, max] = filterValue as [unknown, unknown]
      const num = Number(value)
      if (Number.isNaN(num)) return false
      if (!isEmptyFilter(min) && num < Number(min)) return false
      if (!isEmptyFilter(max) && num > Number(max)) return false
      return true
    }
    case "date-range": {
      const [from, to] = filterValue as [unknown, unknown]
      const day = dayStart(value)
      if (Number.isNaN(day)) return false
      if (!isEmptyFilter(from) && day < dayStart(from)) return false
      if (!isEmptyFilter(to) && day > dayStart(to)) return false
      return true
    }
    case "set": {
      const wanted = (filterValue as unknown[]).map((item) => String(item))
      return wanted.includes(defaultText(value))
    }
    case "includes-any": {
      const wanted = (filterValue as unknown[]).map((item) => String(item))
      const actual = (Array.isArray(value) ? value : [value]).map((item) => defaultText(item))
      return wanted.some((item) => actual.includes(item))
    }
    case "includes-all": {
      const wanted = (filterValue as unknown[]).map((item) => String(item))
      const actual = (Array.isArray(value) ? value : [value]).map((item) => defaultText(item))
      return wanted.every((item) => actual.includes(item))
    }
    case "text":
    default:
      return defaultText(value).toLowerCase().includes(String(filterValue).toLowerCase())
  }
}

export function rowMatchesFilters<R extends Row>(
  row: R,
  filters: FilterEntry[],
  columns: ResolvedColumn<R>[]
): boolean {
  for (const filter of filters) {
    if (isEmptyFilter(filter.value)) continue
    const column = findColumn(columns, filter.id)
    if (!column) continue
    const value = column.get(row)
    const ok = column.def.filterFn
      ? column.def.filterFn(value, filter.value, row)
      : matchesFilter(value, filter.value, column.filterType)
    if (!ok) return false
  }
  return true
}

// Search text cache per (column, row): `column.text` runs through the formatter
// (for ViUR columns: language resolution, multiple joins, format strings) — without
// a cache, searching a large, fully loaded dataset freezes the
// browser (rows × columns × keystroke). WeakMaps: the cache lives as
// long as the column or row and cleans up after itself.
const searchTextCache = new WeakMap<object, WeakMap<object, string>>()

function searchTextOf<R extends Row>(column: ResolvedColumn<R>, row: R): string {
  let byRow = searchTextCache.get(column as object)
  if (!byRow) {
    byRow = new WeakMap<object, string>()
    searchTextCache.set(column as object, byRow)
  }
  let text = byRow.get(row as object)
  if (text === undefined) {
    text = column.text(row).toLowerCase()
    byRow.set(row as object, text)
  }
  return text
}

export function rowMatchesSearch<R extends Row>(
  row: R,
  term: string,
  columns: ResolvedColumn<R>[],
  searchFn?: ((value: unknown, term: string, row: R) => boolean) | null
): boolean {
  const needle = term.trim().toLowerCase()
  if (!needle) return true
  return columns.some((column) => {
    if (!column.searchable) return false
    if (searchFn) return searchFn(column.get(row), term, row)
    return searchTextOf(column, row).includes(needle)
  })
}

/**
 * Facets of a column: distinct values with hit count and numeric
 * range — computed over the rows that pass all OTHER filters (and the search).
 * That's exactly what a set filter needs so it doesn't empty itself.
 */
export function computeFacets<R extends Row>(rows: R[], column: ResolvedColumn<R>): ColumnFacets {
  const counts = new Map<string, number>()
  let min: number | undefined
  let max: number | undefined

  for (const row of rows) {
    const value = column.get(row)
    const items = Array.isArray(value) ? value : [value]
    for (const item of items) {
      if (item === null || item === undefined) continue
      const text = defaultText(item)
      counts.set(text, (counts.get(text) ?? 0) + 1)
      const num = Number(item)
      if (!Number.isNaN(num) && item !== "") {
        min = min === undefined ? num : Math.min(min, num)
        max = max === undefined ? num : Math.max(max, num)
      }
    }
  }

  const values = [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || collator.compare(a.value, b.value))

  return { values, min, max }
}

// ── Aggregation (group rows) ──────────────────────────────────────────

function numbers(values: unknown[]): number[] {
  return values.map((value) => Number(value)).filter((value) => !Number.isNaN(value))
}

export function aggregate(kind: AggregationKind, values: unknown[]): unknown {
  const nums = numbers(values)
  switch (kind) {
    case "sum":
      return nums.reduce((total, value) => total + value, 0)
    case "min":
      return nums.length ? Math.min(...nums) : undefined
    case "max":
      return nums.length ? Math.max(...nums) : undefined
    case "extent":
      return nums.length ? [Math.min(...nums), Math.max(...nums)] : undefined
    case "mean":
      return nums.length ? nums.reduce((total, value) => total + value, 0) / nums.length : undefined
    case "median": {
      if (!nums.length) return undefined
      const sorted = [...nums].sort((a, b) => a - b)
      const middle = Math.floor(sorted.length / 2)
      return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
    }
    case "count":
      return values.length
    case "unique":
      return [...new Set(values.map((value) => defaultText(value)))]
    case "uniqueCount":
      return new Set(values.map((value) => defaultText(value))).size
    default:
      return undefined
  }
}

export function aggregateColumn<R extends Row>(column: ResolvedColumn<R>, rows: R[]): unknown {
  const kind = column.def.aggregation
  if (!kind) return undefined
  const values = rows.map((row) => column.get(row))
  return typeof kind === "function" ? kind(values, rows) : aggregate(kind, values)
}

export { defaultText }
