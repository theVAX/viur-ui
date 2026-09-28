// Typen des DataTable-Widgets — nachgebaut nach <wa-data-grid> (WebAwesome Pro
// v12), aber mit Vue-Mitteln: Zell-Inhalte kommen über Slots statt über
// Lit-Templates, Zustand über v-model statt über Properties am Element.

export type Row = Record<string, unknown>

export type Align = "start" | "center" | "end"
export type PinSide = "start" | "end"

export type SortMode =
  | "auto" // Zahlen numerisch, Datum chronologisch, sonst alphanumerisch
  | "text"
  | "textCaseSensitive"
  | "number"
  | "datetime"
  | "basic"

export type FilterType =
  | "text" // Teilstring, case-insensitive (Default)
  | "equals"
  | "number-range" // [min, max]
  | "date-range" // [von, bis], inklusive nach Kalendertag
  | "set" // Wert ist einer der gewählten
  | "includes-any" // Array-Zelle enthält einen der gewählten
  | "includes-all" // Array-Zelle enthält alle gewählten

export type AggregationKind = "sum" | "min" | "max" | "extent" | "mean" | "median" | "count" | "unique" | "uniqueCount"

export interface FilterOption {
  value: string
  label?: string
  count?: number
}

/** Eine Spaltendefinition. Reines Datenobjekt — reaktiv, ohne Render-Logik. */
export interface DataTableColumn<R extends Row = Row> {
  /** Pfad in die Zeile, Punktpfade erlaubt ("user.name"). Dient als id, wenn `id` fehlt. */
  field?: string
  /** Explizite id. Pflicht für Spalten ohne `field` (Aktionen, berechnete Spalten). */
  id?: string
  /**
   * Berechnet den Zellwert aus der Zeile. Anders als `formatter` (nur Darstellung)
   * geht dieser Wert in Sortierung, Filter, Suche und Export ein.
   */
  value?: (row: R) => unknown
  label?: string
  align?: Align
  headerAlign?: Align
  /** Default: true, sobald `field` oder `value` vorhanden ist. */
  sortable?: boolean
  sortFn?: SortMode
  /** Wohin leere Werte sortieren. */
  sortUndefined?: false | "first" | "last"
  /** Erste Sortierung dieser Spalte absteigend. */
  sortDescFirst?: boolean
  comparator?: (a: unknown, b: unknown, rowA: R, rowB: R) => number
  /** Default: true, sobald `field` oder `value` vorhanden ist. */
  searchable?: boolean
  filterable?: boolean
  filterType?: FilterType
  filterFn?: (value: unknown, filterValue: unknown, row: R) => boolean
  /** Ersetzt die berechneten Facetten im set/includes-Filter (z. B. im Server-Modus). */
  filterOptions?: FilterOption[]
  hidden?: boolean
  hideable?: boolean
  resizable?: boolean
  movable?: boolean
  pinnable?: boolean
  pinned?: PinSide
  width?: number
  minWidth?: number
  maxWidth?: number
  /** Anteil am freien Platz; schlägt `width`. */
  flex?: number
  /** Zelltext. Für reichen Inhalt den Slot `cell:<id>` verwenden. */
  formatter?: (value: unknown, row: R) => string
  /**
   * Wert(e) als farbige Plakette(n) statt als Text rendern. Positive Werte
   * grün, negative rot, alles dazwischen regenbogen-abgestuft — siehe
   * `badgesForBone` in viurColumns.ts, das diese Funktion für reine
   * select- und bool-Bones erzeugt.
   */
  badge?: (value: unknown, row: R) => CellBadge[] | null
  /** Fußzeile: Text oder Funktion über die gefilterten Zeilen (alle Seiten). */
  footer?: string | ((rows: R[]) => string)
  aggregation?: AggregationKind | ((values: unknown[], rows: R[]) => unknown)
  cellClass?: string | ((value: unknown, row: R) => string)
}

/** Spalte mit aufgelösten Defaults — was die Komponente intern benutzt. */
/** Eine farbige Zell-Plakette (siehe DataTableColumn.badge). */
export interface CellBadge {
  label: string
  /** CSS-Farbe (Basiston); Hintergrund/Rand mischt die Tabelle selbst. */
  color: string
}

export interface ResolvedColumn<R extends Row = Row> {
  id: string
  def: DataTableColumn<R>
  field?: string
  label: string
  align: Align
  headerAlign: Align
  sortable: boolean
  searchable: boolean
  filterable: boolean
  filterType: FilterType
  hideable: boolean
  /** Zellwert einer Zeile (value() oder Punktpfad). */
  get: (row: R) => unknown
  /** Zelltext für Anzeige, Suche als Text, Kopieren und CSV. */
  text: (row: R) => string
}

export interface SortEntry {
  id: string
  desc: boolean
}

export interface FilterEntry {
  id: string
  value: unknown
}

export interface ColumnFacets {
  /** Verschiedene Werte mit Trefferzahl, absteigend nach Häufigkeit. */
  values: { value: string; count: number }[]
  min?: number
  max?: number
}

/** Anfrage an den Server (dataSource / data-request). */
export interface DataTableRequest {
  sort: SortEntry[]
  filters: FilterEntry[]
  search: string
  page: number
  pageSize: number
  signal: AbortSignal
}

export interface DataTableResponse<R extends Row = Row> {
  rows: R[]
  total: number
}

/** Serialisierbarer Schnappschuss des vom Nutzer verstellbaren Zustands. */
export interface DataTableState {
  version: 1
  columnOrder?: string[]
  columnWidths?: Record<string, number>
  columnVisibility?: Record<string, boolean>
  columnPinning?: { start: string[]; end: string[] }
  sort?: SortEntry[]
  filters?: FilterEntry[]
  search?: string
  selectedKeys?: RowKey[]
  expandedKeys?: RowKey[]
  page?: number
  pageSize?: number
}

export type RowKey = string | number

/** Knoten der (Baum-/Gruppen-)Hierarchie nach Filter und Sortierung. */
export interface RowNode<R extends Row = Row> {
  kind: "data" | "group"
  key: RowKey
  depth: number
  children: RowNode<R>[]
  /** kind "data" */
  row?: R
  /** kind "group" */
  groupColumnId?: string
  groupValue?: unknown
  groupCount?: number
  groupRows?: R[]
  aggregates?: Record<string, unknown>
}

/** Eine gerenderte Zeile (flach, inklusive Detail-Panels). */
export interface DisplayRow<R extends Row = Row> {
  kind: "data" | "group" | "detail"
  /** Eindeutig im Render-Durchlauf (Detailzeilen haben ein Suffix). */
  key: string
  /** Schlüssel der zugehörigen Zeile/Gruppe. */
  nodeKey: RowKey
  depth: number
  expandable: boolean
  expanded: boolean
  /** Laufender Index der Datenzeilen (nur kind "data"). */
  index: number
  /**
   * Die DURCHLAUF-Spalten links des eigenen Winkels (Länge = `depth - 1`).
   * `true` heißt: dort läuft eine senkrechte Linie durch, weil der Vorfahre
   * dieser Spalte noch ein Geschwister nach sich hat.
   *
   * Wichtig ist die Zuordnung: die Linie in einer Spalte verbindet nicht den
   * Vorfahren DIESER Ebene mit seinem Geschwister, sondern den Vorfahren der
   * NÄCHSTEN Ebene — genau wie in `tree`-Ausgaben:
   *
   * ```
   * A
   * ├── B
   * │   └── C     ← das "│" steht hier, weil nach B noch D kommt
   * └── D
   * ```
   *
   * Wurzeln erzeugen keine Durchlauf-Spalte: zwischen zwei Wurzeln wird keine
   * Linie gezogen.
   */
  ancestorLines: boolean[]
  /** Letztes Kind seines Elternteils → Winkel „└" statt „├". */
  isLastChild: boolean
  row?: R
  node?: RowNode<R>
}

/**
 * Die per `defineExpose` freigegebene API der Komponente. Als Typ für
 * Template-Refs verwenden — `InstanceType<typeof DataTable>` funktioniert bei
 * generischen Komponenten nicht.
 */
export interface DataTableApi<R extends Row = Row> {
  getVisibleRows: () => R[]
  getProcessedRows: () => R[]
  getSelectedRows: () => R[]
  scrollToIndex: (index: number, align?: "start" | "center" | "end") => void
  expandRow: (key: RowKey) => void
  collapseRow: (key: RowKey) => void
  expandAllRows: () => void
  collapseAllRows: () => void
  toggleColumn: (id: string, visible: boolean) => void
  pinColumn: (id: string, side: PinSide | false) => void
  getColumnPin: (id: string) => PinSide | false
  autoSizeColumn: (id: string) => void
  autoSizeColumns: () => void
  sizeColumnsToFit: () => void
  resetColumns: () => void
  getColumnFacets: (id: string) => ColumnFacets
  reload: () => void
  /** Nachgeladene Kinder einer Zeile verwerfen und erneut holen. */
  reloadChildren: (key: RowKey) => Promise<void>
  /** Nachgeladene Kinder einer Zeile (undefined = noch nicht geladen). */
  getLoadedChildren: (key: RowKey) => R[] | undefined
  /** Nachgeladene Kinder einer Zeile ersetzen, ohne zu laden. */
  setLoadedChildren: (key: RowKey, rows: R[]) => void
  getDataAsCsv: (options?: {
    columnIds?: string[]
    includeHeaders?: boolean
    delimiter?: string
    escapeFormulas?: boolean
  }) => string
  exportDataAsCsv: (options?: {
    fileName?: string
    columnIds?: string[]
    includeHeaders?: boolean
    delimiter?: string
    escapeFormulas?: boolean
  }) => void
  copySelectedRows: (options?: { format?: "tsv" | "csv" }) => Promise<number>
  getState: () => DataTableState
  setState: (state: Partial<DataTableState>) => void
  resetState: () => void
  focus: () => void
}
