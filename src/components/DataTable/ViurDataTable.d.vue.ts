import type { DefineComponent, Ref } from "vue"
import type { Row, RowKey } from "./types"

/** Props von ViurDataTable.vue (siehe defineProps dort). */
export interface ViurDataTableProps {
  /** Modulname bzw. Punkt-Pfad ("user", "shop.order"). */
  module: string
  /** Renderer der Requests; Standard: VITE_DEFAULT_RENDERER. */
  renderer?: string | null
  /** Untertyp gruppierter Listen (Handler `list.grouped`). */
  group?: string | null
  /** Zusätzliche Request-Parameter — bei jedem Abruf gespreadet. */
  params?: Record<string, unknown>
  /** Spalten; ohne Angabe aus der viewSkel-Struktur abgeleitet. */
  columns?: unknown[] | null
  /** Nur diese Bones als Spalten (bei abgeleiteten Spalten). */
  bones?: string[] | null
  label?: string | null
  selectable?: false | "single" | "multiple"
  /** Einträge je Nachladen (ViUR `limit`). */
  pageSize?: number
  /** Obergrenze des Lokal-Modus (alles geladen → Client-Pipeline). */
  localModeLimit?: number
  /** X-VIUR-BONELIST senden, wenn Felder abgewählt sind (Server braucht ein "*"-Subskel). */
  bonelist?: boolean
  /** localStorage-Key der Feld-Sichtbarkeit; null = keine Persistenz. */
  storageKey?: string | null
  language?: string | null
  /** Steht bei language="*" vorn (üblicherweise die UI-Sprache). */
  primaryLanguage?: string | null
  locale?: string | null
  /** Spaltenbreite ziehbar (Default true — anders als die nackte DataTable). */
  resizable?: boolean
  /** Spalten per Drag umsortierbar (Default true). */
  reorderable?: boolean
  /** Spalten anpinnbar (Default true). */
  pinnable?: boolean
  /** Wird an die DataTable durchgereicht. */
  tableProps?: Record<string, unknown>
}

export interface ViurDataTableEmitProps<R extends Row = Row> {
  /** Doppelklick auf eine Zeile. */
  onOpen?: (payload: { row: R; key: RowKey }) => void
  /** v-model:selectedKeys */
  "onUpdate:selectedKeys"?: (value: RowKey[]) => void
}

/** Was ViurDataTable per defineExpose freigibt. */
export interface ViurDataTableApi<R extends Row = Row> {
  /** Der ListRequest (useListFetch): data, structure, cursor, execute, … */
  list: Record<string, unknown>
  /** Template-Ref auf die DataTable (DataTableApi). */
  table: Ref<unknown>
  /** Von vorn laden — mit den aktuellen props.params. */
  refresh: () => Promise<unknown>
  /** Suche: serverseitig (ViUR `search`) bzw. lokal, wenn alles geladen. */
  search: (term: string) => void
  /** Feld-Sichtbarkeit (z.B. für einen „Felder"-Dialog). */
  columns: {
    all: () => { id: string; label: string; hidden: boolean }[]
    apply: (visibleIds: string[]) => void
  }
  /** Beschriftung eines Eintrags (erster Textwert seiner Spalten). */
  entryTitle: (key: RowKey) => string
  /** Alles geladen → Sortieren/Filtern/Suchen laufen lokal. */
  allLoaded: Ref<boolean>
  rows: Ref<R[]>
}

declare const ViurDataTable: DefineComponent<ViurDataTableProps & ViurDataTableEmitProps>
export default ViurDataTable
