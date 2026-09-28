import type { RowKey } from "../DataTable/types"

/** Knoten des Navigations-Baums (und Ordner in der Liste). */
export interface BrowserNode {
  key: RowKey
  name: string
  icon?: string | null
  /** false = sicher keine Kinder → Pfeil entfällt. */
  hasChildren?: boolean
  /** Beliebige Nutzdaten (z. B. das Skel) — der Browser liest sie nicht. */
  data?: Record<string, unknown>
}

export interface BrowserMovePayload<R = Record<string, unknown>> {
  /** Zeilenschlüssel in Anzeige-Reihenfolge. */
  keys: RowKey[]
  rows: R[]
  /** Zielknoten (null = Wurzel des aktuellen Rootnodes). */
  target: RowKey | null
  /** "inside" (in einen Ordner) oder before/after (Reihenfolge in der Liste). */
  mode: "inside" | "before" | "after"
  /** Quelle des Zugs: Liste oder Baum. */
  source: "list" | "tree"
}

export interface BrowserUploadPayload {
  files: File[]
  /** Zielknoten (null = aktuelle Ebene ist die Wurzel). */
  target: RowKey | null
}
