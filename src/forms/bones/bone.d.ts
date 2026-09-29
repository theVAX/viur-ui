import type { DefineComponent } from "vue"

export interface BoneProps {
  /** The bone widget component object (e.g. StringBone). Typically set by ViForm. */
  is?: object
  /** Bone identifier; must match a key in structure and skel. */
  name: string
  /** Explicit language list; overrides bonestructure.languages. */
  languages?: unknown[]
  /** Explicit multiple flag; overrides bonestructure.multiple. */
  multiple?: boolean
  /** Explicit readonly flag; overrides bonestructure.readonly. */
  readonly?: boolean
  /** Explicit required flag; overrides bonestructure.required. */
  required?: boolean
  /** Additional parameters; overrides bonestructure.params. */
  params?: Record<string, unknown>
  /** Explicit value; overrides skel[name] if set. */
  value?: object | string | number | boolean | unknown[]
  /** Complete skeleton structure (all bone definitions of the form). */
  structure: Record<string, unknown>
  /** Skeleton data object with the current values. */
  skel: unknown
  /** Error array from the server response. Entries with a matching fieldPath are displayed. */
  errors?: unknown[]
  /** Label mode. */
  label?: "normal" | "top" | "hide" | "placeholder"
  /** Enables BoneActions buttons next to the input. */
  boneactions?: boolean
  /** Shows tooltip content as wa-alert instead of a tooltip. */
  showLabelInfo?: boolean
  /** Passes autofocus on to the bone widget. */
  autofocus?: boolean
  /** Language active by default in the multilang tab. */
  defaultLanguage?: string
  /** Forces the tooltip on the input area regardless of the label mode. */
  showBoneTooltip?: boolean
  /** Error display style. */
  errorStyle?: "default" | "decent"
  /** Enables debug mode: bone name as tooltip on the label. */
  debug?: boolean
}

declare const Bone: DefineComponent<BoneProps>
export default Bone
