import type { DefineComponent } from "vue"

export interface BoneProps {
  /** Das Bone-Widget-Component-Objekt (z.B. StringBone). Typischerweise von ViForm gesetzt. */
  is?: object
  /** Bone-Identifier; muss einem Key in structure und skel entsprechen. */
  name: string
  /** Explizite Sprach-Liste; überschreibt bonestructure.languages. */
  languages?: unknown[]
  /** Expliziter Multiple-Flag; überschreibt bonestructure.multiple. */
  multiple?: boolean
  /** Expliziter Readonly-Flag; überschreibt bonestructure.readonly. */
  readonly?: boolean
  /** Expliziter Required-Flag; überschreibt bonestructure.required. */
  required?: boolean
  /** Zusätzliche Parameter; überschreibt bonestructure.params. */
  params?: Record<string, unknown>
  /** Expliziter Wert; überschreibt skel[name] wenn gesetzt. */
  value?: object | string | number | boolean | unknown[]
  /** Vollständige Skeleton-Struktur (alle Bone-Definitionen des Formulars). */
  structure: Record<string, unknown>
  /** Skeleton-Datenobjekt mit den aktuellen Werten. */
  skel: unknown
  /** Fehler-Array aus der Server-Antwort. Einträge mit passendem fieldPath werden angezeigt. */
  errors?: unknown[]
  /** Label-Modus. */
  label?: "normal" | "top" | "hide" | "placeholder"
  /** Aktiviert BoneActions-Schaltflächen neben dem Input. */
  boneactions?: boolean
  /** Zeigt Tooltip-Inhalt als wa-alert statt als Tooltip. */
  showLabelInfo?: boolean
  /** Gibt autofocus an das Bone-Widget weiter. */
  autofocus?: boolean
  /** Standardmäßig aktive Sprache im Multilang-Tab. */
  defaultLanguage?: string
  /** Erzwingt den Tooltip auf dem Input-Bereich unabhängig vom Label-Modus. */
  showBoneTooltip?: boolean
  /** Fehler-Darstellungsstil. */
  errorStyle?: "default" | "decent"
  /** Aktiviert Debug-Modus: Bone-Name als Tooltip am Label. */
  debug?: boolean
}

declare const Bone: DefineComponent<BoneProps>
export default Bone
