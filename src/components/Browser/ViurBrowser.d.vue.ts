import type { DefineComponent } from "vue"
import type { RowKey } from "../DataTable/types"
import type { BrowserMovePayload, BrowserUploadPayload } from "./types"

/** Props of ViurBrowser.vue (see defineProps there). */
export interface ViurBrowserProps {
  /** Module name or dotted path ("file", "shop.category"). */
  module: string
  /** Renderer for the requests; default: VITE_DEFAULT_RENDERER. */
  renderer?: string | null
  /** Fixed root node; without it, `/listRootNodes` is queried. */
  rootNode?: string | Record<string, unknown> | null
  /** Columns; if omitted, derived from the leaf structure. */
  columns?: unknown[] | null
  /** Only these bones as columns (for derived columns). */
  bones?: string[] | null
  /** Additional parameters for the list requests. */
  params?: Record<string, unknown>
  /** Field holding the fixed order (default "sortindex"). */
  orderField?: string
  /** Allow uploading files into the level (file modules). */
  uploads?: boolean
  /** Passed through to the DataTable. */
  tableProps?: Record<string, unknown>
}

/** Events as `on*` props so that `@open` & co. are typed in the template. */
export interface ViurBrowserEmitProps<R = Record<string, unknown>> {
  /** Double-click on a LEAF (folders navigate into themselves instead). */
  onOpen?: (payload: { row: R; key: RowKey }) => void
  /** Move saved. */
  onMoved?: (payload: { keys: RowKey[]; target: RowKey | null; parentChanged?: boolean }) => void
  onMoveFailed?: (payload: { keys: RowKey[]; target: RowKey | null; error: unknown }) => void
  /** Uploads finished (only with `uploads`). */
  onUploaded?: (payload: { files: unknown[]; target: RowKey | null }) => void
  onUploadFailed?: (payload: { file: File; error: unknown }) => void
  /** v-model:location — current location (key of the node, null = root). */
  onUpdateLocation?: (value: RowKey | null) => void
  /** v-model:selectedKeys */
  onUpdateSelectedKeys?: (value: RowKey[]) => void
}

/** What ViurBrowser exposes via defineExpose. */
export interface ViurBrowserApi<R = Record<string, unknown>> {
  /** The generic browser underneath. */
  browser: unknown
  /** Contents of the current location (nodes AND leaves, each with `skelType`). */
  tree: {
    data: { value: R[] }
    structure: { value: { node?: Record<string, unknown>; leaf?: Record<string, unknown> } }
    isFetching: { value: boolean }
    [key: string]: unknown
  }
  /** Re-fetch the location from the server. */
  refresh: () => void
}

declare const ViurBrowser: DefineComponent<
  ViurBrowserProps & ViurBrowserEmitProps & { location?: RowKey | null; selectedKeys?: RowKey[] },
  ViurBrowserApi,
  any
>
export default ViurBrowser
export type { BrowserMovePayload, BrowserUploadPayload }
