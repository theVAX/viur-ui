import type { CellBadge, DataTableColumn, Row } from "./types"
import { compareValues, firstValueOf } from "./columns"
// @ts-expect-error – JS-Modul ohne Typen
import Utils from "../../forms/bones/utils.js"

// --------------------------------------------------------------------------- //
// ViUR-Struktur → Spalten der DataTable                                       //
// --------------------------------------------------------------------------- //
//
// Eine ViUR-Liste liefert neben den Datensätzen ihre `structure`: je Bone ein
// Objekt mit `descr` (Beschriftung), `type` ("str", "str.email", "numeric",
// "select", "relational.…"), `multiple`, `languages`, `indexed`, `visible` und
// typabhängigen Zusätzen (`values` bei select, `precision` bei numeric,
// `format` bei relationalen Bones).
//
// Hier entstehen daraus Spalten: Beschriftung, Ausrichtung, Sortierbarkeit und
// ein `formatter`. Die Übersetzung Wert → Text macht `Utils.boneToString`
// (src/forms/bones/utils.js) — die EINE Stelle dafür, die auch die Formulare
// und Formatstrings der Bones benutzen.

/** Ein Bone der Struktur, wie der Renderer ihn liefert. */
export interface BoneDescription {
  descr?: string
  type?: string
  multiple?: boolean
  languages?: string[] | null
  /** Nur indizierte Bones lassen sich serverseitig sortieren. */
  indexed?: boolean
  visible?: boolean
  readonly?: boolean
  /** select: Wert → Beschriftung. */
  values?: Record<string, string> | [string, string][]
  /** numeric: Nachkommastellen. */
  precision?: number
  /** date: was der Bone überhaupt führt. */
  date?: boolean
  time?: boolean
  params?: Record<string, unknown> | null
  [key: string]: unknown
}

export type BoneStructure = Record<string, BoneDescription>

export interface ColumnsFromStructureOptions<R extends Row = Row> {
  /**
   * Sprache mehrsprachiger Bones: ein Code zeigt diese Sprache (leer →
   * erste befüllte, mit ihrer Flagge gekennzeichnet), `"*"` zeigt ALLE
   * befüllten Sprachen mit Flaggen-Präfix; ohne Angabe die erste des Bones.
   */
  language?: string | null
  /** Steht im `"*"`-Modus vorn — üblicherweise die UI-Sprache. */
  primaryLanguage?: string | null
  /** Gebietseinstellung für Zahlen und Datumsangaben. */
  locale?: string
  /** Nur diese Bones, in dieser Reihenfolge (Standard: alle sichtbaren). */
  bones?: string[]
  /** Diese Bones nie zeigen (zusätzlich zu den ohnehin verborgenen). */
  exclude?: string[]
  /** Beschriftung für `bool`-Werte. */
  boolTexts?: [string, string]
  /** Ergänzt/überschreibt die erzeugte Spalte je Bone. */
  overrides?: Record<string, Partial<DataTableColumn<R>>>
  /**
   * Der VOLLSTÄNDIGE Datensatz liegt im Client (alles geladen): Sortieren,
   * Suchen und Spaltenfilter laufen dann lokal auf allen Spalten — ohne den
   * Server. Ohne das Flag bleibt beides aus, denn auf einem ANGELADENEN
   * Ausschnitt wären lokale Sortierung/Filter eine Lüge; dort sortiert der
   * Server (nur indizierte Bones, über die Tabellen-Ereignisse).
   */
  local?: boolean
}

/** Bones, die in einer Liste nichts zu suchen haben. */
const HIDDEN_TYPES = ["password", "credential"]

// --------------------------------------------------------------------------- //
// Plaketten für reine select- und bool-Bones                                   //
// --------------------------------------------------------------------------- //
//
// Reine Auswahlwerte ("select" ohne Untertyp — country & Co. bleiben Text) und
// bool-Werte werden als farbige Plakette gerendert: POSITIVE Werte grün,
// NEGATIVE rot, alle übrigen Optionen bekommen regenbogen-abgestufte Farbtöne
// (gleichmäßig über den Farbkreis, stabil je Optionsreihenfolge). Ob ein Wert
// positiv/negativ ist, entscheidet die Schlüsselwortliste unten — geprüft
// werden Options-SCHLÜSSEL und -BESCHRIFTUNG, unabhängig von Groß-/
// Kleinschreibung ("Ja", "ja", "yes", "Aktiv", "visible", …).

/** Positive Werte → grün. Erweiterbar (z. B. `POSITIVE_KEYWORDS.add("live")`). */
export const POSITIVE_KEYWORDS = new Set([
  "yes",
  "ja",
  "true",
  "1",
  "active",
  "aktiv",
  "enabled",
  "aktiviert",
  "visible",
  "sichtbar",
  "on",
  "an",
  "ok",
  "public",
  "öffentlich",
  "released",
  "freigegeben",
  "erlaubt",
  "allowed",
  "online",
])

/** Negative Werte → rot. */
export const NEGATIVE_KEYWORDS = new Set([
  "no",
  "nein",
  "false",
  "0",
  "inactive",
  "inaktiv",
  "disabled",
  "deaktiviert",
  "hidden",
  "versteckt",
  "unsichtbar",
  "invisible",
  "off",
  "aus",
  "blocked",
  "gesperrt",
  "denied",
  "verboten",
  "private",
  "privat",
  "deleted",
  "gelöscht",
  "offline",
])

const POSITIVE_COLOR = "var(--wa-color-success-50, #16a34a)"
const NEGATIVE_COLOR = "var(--wa-color-danger-50, #dc2626)"

function keywordTone(...candidates: unknown[]): string | null {
  for (const candidate of candidates) {
    const word = String(candidate ?? "")
      .trim()
      .toLowerCase()
    if (!word) continue
    if (POSITIVE_KEYWORDS.has(word)) return POSITIVE_COLOR
    if (NEGATIVE_KEYWORDS.has(word)) return NEGATIVE_COLOR
  }
  return null
}

/** select-`values` vereinheitlichen: [ [schlüssel, beschriftung], … ]. */
function selectOptions(bone: BoneDescription): [string, string][] {
  const values = bone.values
  if (Array.isArray(values)) return values.map(([key, label]) => [String(key), String(label)])
  if (values && typeof values === "object") return Object.entries(values).map(([key, label]) => [key, String(label)])
  return []
}

/**
 * Farbzuordnung der Optionen eines reinen select-Bones: Schlüsselwörter
 * entscheiden grün/rot, die übrigen Optionen teilen sich den Farbkreis
 * (Regenbogen), in der Reihenfolge ihrer Definition.
 */
export function selectToneMap(bone: BoneDescription): Map<string, { label: string; color: string }> {
  const options = selectOptions(bone)
  const map = new Map<string, { label: string; color: string }>()
  const neutrals: [string, string][] = []
  for (const [key, label] of options) {
    const tone = keywordTone(key, label)
    if (tone) map.set(key, { label, color: tone })
    else neutrals.push([key, label])
  }
  neutrals.forEach(([key, label], index) => {
    // Regenbogen: gleichmäßig verteilte Farbtöne, Sättigung/Helligkeit fest.
    const hue = Math.round((360 / Math.max(1, neutrals.length)) * index)
    map.set(key, { label, color: `oklch(0.62 0.16 ${hue})` })
  })
  return map
}

/**
 * Plaketten-Funktion für einen Bone — oder null, wenn der Bone keine bekommt.
 * Nur REINE selects (`type === "select"`, kein select.country o. Ä.) und bools.
 */
export function badgesForBone(
  bone: BoneDescription,
  options: ColumnsFromStructureOptions = {}
): ((value: unknown) => CellBadge[] | null) | null {
  if (bone.type === "bool") {
    const [yes, no] = options.boolTexts ?? ["Ja", "Nein"]
    return (value) => {
      if (value === null || value === undefined || value === "") return null
      const truthy = value === true || value === "true" || value === 1 || value === "1"
      return [{ label: truthy ? yes : no, color: truthy ? POSITIVE_COLOR : NEGATIVE_COLOR }]
    }
  }
  if (bone.type !== "select") return null
  const tones = selectToneMap(bone)
  return (value) => {
    if (value === null || value === undefined || value === "") return null
    const keys = Array.isArray(value) ? value : [value]
    const badges: CellBadge[] = []
    for (const key of keys) {
      const entry = tones.get(String(key))
      badges.push(entry ?? { label: String(key), color: keywordTone(key) ?? "var(--wa-color-neutral-60, #71717a)" })
    }
    return badges.length ? badges : null
  }
}

/** Typfamilie eines Bones: "str.email" → "str". */
export function boneFamily(type: string | undefined | null): string {
  return Utils.boneFamily(type) as string
}

/**
 * Bone-Wert eines Datensatzes als Text — mit Sprachen, `multiple` und dem
 * Formatstring relationaler Bones. Dünne Hülle um `Utils.boneToString`, damit
 * Tabellen-Code bei den DataTable-Typen bleiben kann.
 */
export function boneText(value: unknown, bone: BoneDescription, options: ColumnsFromStructureOptions = {}): string {
  return Utils.boneToString(value, bone, options) as string
}

/** Lokaler Spaltenfilter passend zum Bone-Typ. */
function localFilterFor(bone: BoneDescription, options: ColumnsFromStructureOptions): Partial<DataTableColumn> {
  const family = boneFamily(bone.type)
  if (bone.type === "bool") {
    const [yes, no] = options.boolTexts ?? ["Ja", "Nein"]
    return {
      filterable: true,
      filterType: "set",
      filterOptions: [
        { value: "true", label: yes },
        { value: "false", label: no },
      ],
    }
  }
  if (family === "select") {
    const options = selectOptions(bone).map(([value, label]) => ({ value, label }))
    return { filterable: true, filterType: bone.multiple ? "includes-any" : "set", filterOptions: options }
  }
  if (family === "numeric") return { filterable: true, filterType: "number-range" }
  if (family === "date") return { filterable: true, filterType: "date-range" }
  return { filterable: true, filterType: "text" }
}

const isEmptyValue = (value: unknown): boolean => value === null || value === undefined || value === ""

/**
 * Sortierwert eines MEHRSPRACHIGEN Bones: dieselbe Sprache, die die Anzeige
 * nach vorn stellt — die gewünschte (bzw. bei `"*"` die primäre), und wenn
 * die leer ist, die erste befüllte. So sortiert die Spalte nach dem Text, den
 * die Zelle tatsächlich zeigt, nicht stur nach der ersten Bone-Sprache.
 */
function languageSortValue(value: unknown, languages: string[], options: ColumnsFromStructureOptions): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value
  const record = value as Record<string, unknown>
  const wanted = options.language === "*" ? (options.primaryLanguage ?? null) : (options.language ?? null)
  let lang = wanted && languages.includes(wanted) ? wanted : languages[0]
  if (isEmptyValue(record[lang])) {
    lang = languages.find((other) => !isEmptyValue(record[other])) ?? lang
  }
  return record[lang]
}

/** Zahlen rechts, alles andere links — wie in Tabellen üblich. */
function alignOf(bone: BoneDescription): "start" | "end" {
  return boneFamily(bone.type) === "numeric" && !bone.multiple ? "end" : "start"
}

/**
 * Spalten aus einer ViUR-Struktur.
 *
 * Sortierbar wird eine Spalte nur, wenn der Bone `indexed` ist und weder
 * `multiple` noch mehrsprachig — nach allem anderen kann der Server nicht
 * ordnen. Suche und Spaltenfilter bleiben aus: die macht bei einer Liste der
 * Server, der Aufrufer verdrahtet sie über die Ereignisse der Tabelle.
 */
export function columnsFromStructure<R extends Row = Row>(
  structure: BoneStructure | null | undefined,
  options: ColumnsFromStructureOptions<R> = {}
): DataTableColumn<R>[] {
  const bones = structure ?? {}
  const exclude = new Set(options.exclude ?? [])
  const names = options.bones ?? Object.keys(bones)

  const columns: DataTableColumn<R>[] = []
  for (const name of names) {
    const bone = bones[name]
    if (!bone || exclude.has(name)) continue
    if (bone.visible === false) continue
    if (HIDDEN_TYPES.includes(boneFamily(bone.type))) continue

    // Server-Modus: nur indizierte Bones sind sortierbar; lokal (alles
    // geladen) darf nach jeder Spalte sortiert, gesucht und gefiltert werden.
    const sortable = options.local === true || (bone.indexed === true && !bone.multiple && !bone.languages?.length)
    const column: DataTableColumn<R> = {
      field: name,
      label: bone.descr ?? name,
      align: alignOf(bone),
      sortable,
      searchable: options.local === true,
      filterable: false,
      formatter: (value) => boneText(value, bone, options as ColumnsFromStructureOptions),
      minWidth: 120,
      flex: 1,
    }
    // Mehrsprachig: nach der ANGEZEIGTEN Sprache sortieren (siehe oben).
    if (bone.languages?.length) {
      const languages = bone.languages
      column.comparator = (a, b) =>
        compareValues(
          firstValueOf(languageSortValue(a, languages, options as ColumnsFromStructureOptions)),
          firstValueOf(languageSortValue(b, languages, options as ColumnsFromStructureOptions)),
          "auto"
        )
    }

    // Reine selects und bools als farbige Plaketten (siehe badgesForBone).
    const badge = badgesForBone(bone, options as ColumnsFromStructureOptions)
    if (badge) column.badge = (value) => badge(value)
    if (options.local === true) Object.assign(column, localFilterFor(bone, options as ColumnsFromStructureOptions))
    columns.push({ ...column, ...(options.overrides?.[name] ?? {}) })
  }
  return columns
}
