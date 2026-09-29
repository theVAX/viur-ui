import type { DefineComponent } from "vue"

/** Props von ViForm.vue (siehe defineProps dort — hier die gebräuchlichen). */
export interface ViFormProps {
  /** Modulname bzw. Punkt-Pfad ("user", "shop.order"). */
  module?: string
  /** Aktion unterhalb des Moduls ("add", "edit", "login", "auth_.../login"). */
  action?: string | null
  /** Untertyp gruppierter Listen. */
  group?: string | null
  /** Schlüssel des Datensatzes für edit/clone — ein Singleton braucht keinen. */
  skelkey?: string | null
  /** Baum-Typ ("node" | "leaf"). */
  skeltype?: string | null
  /** skey mitsenden (Standard: true). */
  secure?: boolean
  /**
   * Feedback in den Message-Store schreiben (Speichern erfolgreich, Login
   * fehlgeschlagen, …). Wirkt nur, wenn die App Pinia installiert hat;
   * `false` hält dieses Formular stumm. Standard: true.
   */
  useMessageStore?: boolean
  /** Fertige Struktur/Werte statt eines Requests. */
  skel?: Record<string, any> | string | null
  structure?: Record<string, any> | unknown[] | null
  values?: Record<string, any> | null
  /** Nur diese Bones zeigen. */
  bones?: string[]
  /** Zusätzliche Daten für den AUFBAU des Formulars (z. B. `{ bounce: 1 }`). */
  params?: Record<string, any>
  /** Abweichende Adresse für den Aufbau. */
  fetchUrl?: string | null
  /** Renderer der Requests (Standard: VITE_DEFAULT_RENDERER). */
  renderer?: string
  /** Protokollversion festnageln. */
  version?: string | number | null
  useCategories?: boolean
  collapsedCategories?: string[]
  categoryDefaultname?: string
  readonly?: boolean
  /** Bone-Action-Leisten anzeigen (Pflicht-Actions erscheinen immer). */
  boneactions?: boolean
  /**
   * Formular-weite Action-Konfiguration: Einträge wie `bone.params.actions`
   * (`"-name"` deaktiviert explizit, auch Pflicht-Actions). Array = alle
   * Bones; Objekt = pro Bone-Name, `"*"` für alle.
   */
  actions?: (string | Record<string, any>)[] | Record<string, (string | Record<string, any>)[]> | null
  /** Mehrstufigen Ablauf fahren (Login, Assistenten). */
  multistep?: boolean
  showSteps?: boolean
  submitLabel?: string
  nextLabel?: string
  backLabel?: string
}

/** Zustand des Formulars, wie ihn `state` freigibt. */
export interface ViFormState {
  loading: boolean
  failed: unknown
  skel: Record<string, any>
  /** Werte des letzten Server-Stands (Grundlage von resetForm). */
  pristine: Record<string, any> | null
  structure: Record<string, any> | null
  errors: { fieldPath?: string[]; errorMessage?: string; severity?: number }[]
  /** v2-Status der letzten Antwort: "init" | "success" | "rejected" | … */
  status: string | null
  actionname: string | null
  actionparams: Record<string, any> | null
  step: string | null
  steps: Record<string, any> | null
  postUrl: string | null
  [key: string]: unknown
}

/** Was ViForm per defineExpose freigibt. */
export interface ViFormApi {
  /** Werte abschicken (POST auf die Adresse des Formulars). */
  sendData: (
    alternativeUrl?: string | null,
    additionalData?: Record<string, any> | null,
    headers?: Record<string, string> | null,
    removeKeyFromDataset?: boolean
  ) => Promise<unknown>
  /** Formular (neu) vom Server holen. */
  fetchData: (
    alternativeUrl?: string | null,
    additionalData?: Record<string, any> | null,
    headers?: Record<string, string> | null
  ) => Promise<unknown>
  /** Schritt eines mehrstufigen Ablaufs rendern. */
  loadStep: (url?: string | null) => Promise<unknown>
  /** Aktuellen Schritt abschicken und ggf. zum nächsten gehen. */
  submitStep: () => Promise<unknown>
  /** Einen Schritt zurück. */
  back: () => Promise<unknown> | void
  updateSkel: (values: Record<string, any>) => void
  /** Von vorn aufbauen — holt das Formular neu vom Server. */
  reload: () => void
  /** Änderungen verwerfen: Werte des letzten Server-Stands ohne neuen Request. */
  resetForm: () => void
  state: ViFormState
}

declare const ViForm: DefineComponent<ViFormProps, ViFormApi, any>
export default ViForm
