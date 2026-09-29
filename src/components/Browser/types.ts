import type { RowKey } from "../DataTable/types.ts"

/** Node of the navigation tree (and folder in the list). */
export interface BrowserNode {
  key: RowKey
  name: string
  icon?: string | null
  /** false = definitely no children → no arrow. */
  hasChildren?: boolean
  /** Arbitrary payload (e.g. the skel) — the browser doesn't read it. */
  data?: Record<string, unknown>
}

export interface BrowserMovePayload<R = Record<string, unknown>> {
  /** Row keys in display order. */
  keys: RowKey[]
  rows: R[]
  /** Target node (null = root of the current rootnode). */
  target: RowKey | null
  /** "inside" (into a folder) or before/after (order within the list). */
  mode: "inside" | "before" | "after"
  /** Source of the drag: list or tree. */
  source: "list" | "tree"
}

export interface BrowserUploadPayload {
  files: File[]
  /** Target node (null = the current level is the root). */
  target: RowKey | null
}
