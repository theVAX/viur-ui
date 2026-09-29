import type { DefineComponent } from "vue"
import type { RowKey } from "../DataTable/types"
import type { BrowserMovePayload, BrowserUploadPayload } from "./types"

/** Props von ViurBrowser.vue (siehe defineProps dort). */
export interface ViurBrowserProps {
  /** Modulname bzw. Punkt-Pfad ("file", "shop.category"). */
  module: string
  /** Renderer der Requests; Standard: VITE_DEFAULT_RENDERER. */
  renderer?: string | null
  /** Fester Wurzelknoten; ohne ihn wird `/listRootNodes` befragt. */
  rootNode?: string | Record<string, unknown> | null
  /** Spalten; ohne Angabe aus der Struktur der Blätter abgeleitet. */
  columns?: unknown[] | null
  /** Nur diese Bones als Spalten (bei abgeleiteten Spalten). */
  bones?: string[] | null
  /** Zusätzliche Parameter für die Listen-Requests. */
  params?: Record<string, unknown>
  /** Feld der festen Reihenfolge (Standard "sortindex"). */
  orderField?: string
  /** Dateien in die Ebene hochladen erlauben (Datei-Module). */
  uploads?: boolean
  /** Wird an die DataTable durchgereicht. */
  tableProps?: Record<string, unknown>
}

/** Ereignisse als `on*`-Props, damit `@open` & Co. im Template typen. */
export interface ViurBrowserEmitProps<R = Record<string, unknown>> {
  /** Doppelklick auf ein BLATT (Ordner navigieren stattdessen hinein). */
  onOpen?: (payload: { row: R; key: RowKey }) => void
  /** Verschieben gespeichert. */
  onMoved?: (payload: { keys: RowKey[]; target: RowKey | null; parentChanged?: boolean }) => void
  onMoveFailed?: (payload: { keys: RowKey[]; target: RowKey | null; error: unknown }) => void
  /** Uploads fertig (nur mit `uploads`). */
  onUploaded?: (payload: { files: unknown[]; target: RowKey | null }) => void
  onUploadFailed?: (payload: { file: File; error: unknown }) => void
  /** v-model:location — aktueller Ort (Schlüssel des Knotens, null = Wurzel). */
  onUpdateLocation?: (value: RowKey | null) => void
  /** v-model:selectedKeys */
  onUpdateSelectedKeys?: (value: RowKey[]) => void
}

/** Was ViurBrowser per defineExpose freigibt. */
export interface ViurBrowserApi<R = Record<string, unknown>> {
  /** Der generische Browser darunter. */
  browser: unknown
  /** Inhalt des aktuellen Ortes (Knoten UND Blätter, je mit `skelType`). */
  tree: {
    data: { value: R[] }
    structure: { value: { node?: Record<string, unknown>; leaf?: Record<string, unknown> } }
    isFetching: { value: boolean }
    [key: string]: unknown
  }
  /** Ort neu vom Server holen. */
  refresh: () => void
}

declare const ViurBrowser: DefineComponent<
  ViurBrowserProps & ViurBrowserEmitProps & { location?: RowKey | null; selectedKeys?: RowKey[] },
  ViurBrowserApi,
  any
>
export default ViurBrowser
export type { BrowserMovePayload, BrowserUploadPayload }
