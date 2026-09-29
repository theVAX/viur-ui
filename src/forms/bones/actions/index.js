import { defineAsyncComponent, unref } from "vue"
import Translation from "./Translation.vue"
import Debug from "./Debug.vue"

// Lazy: DescribeImage zieht `@viur/vue-utils` (Legacy-Paket) nach. Eager
// importiert bricht damit der ganze Formular-Baum in Anwendungen, die dieses
// Paket nicht haben — obwohl sie die Action gar nicht benutzen. So wird es erst
// beim tatsächlichen Öffnen des Dialogs geladen (wie die schweren Bones).
const DescribeImage = defineAsyncComponent(() => import("./DescribeImage.vue"))
import { handler as downloadHandler } from "./Download.vue"
import { handler as placeholderHandler } from "./Placeholder.vue"
import { handler as deleteHandler } from "./Delete.vue"

/**
 * Default-Definitionen: identisches Inline-Format wie früher in BoneActions.
 * Strings in `bone.params.actions` werden hier nachgeschlagen.
 * Custom-Objekte aus `bone.params.actions` werden in gleicher Form durchgereicht.
 */
const defaultActions = {
  translate: {
    type: "assistant",
    arg: "translate",
    name: "Übersetzen",
    icon: "translate",
    library: "default",
    title: "Übersetzen",
  },
  describe_image: {
    type: "assistant",
    arg: "describe_image",
    name: "Bildbeschreibung erstellen",
    icon: "file-richtext",
    library: "default",
    title: "Bild beschreiben",
  },
  download: {
    type: "callback",
    arg: "download",
    name: "Download",
    icon: "download",
    library: "default",
    title: "bone.download",
    // Gerüst wie das Zeilen-X: auch ohne `boneactions` da (früher ein Knopf im
    // Datei-Widget) — und nur lesend, also auch bei readonly-Bones.
    required: true,
    allowReadonly: true,
  },
  debug: {
    type: "assistant",
    arg: "debug",
    name: "Debug",
    icon: "bug",
    library: "default",
    title: "Bone Debug-Informationen anzeigen",
  },
  placeholder: {
    type: "callback",
    arg: "placeholder",
    name: "Placeholder",
    icon: "wrench",
    library: "default",
    title: "Platzhalter (TODO: entfernen)",
  },
  delete: {
    type: "callback",
    arg: "delete",
    name: "Löschen",
    icon: "xmark",
    library: "default",
    title: "bone.del",
    position: "end",
    variant: "danger",
    // Gerüst: ohne sie wird man eine gesetzte Relation/Datei nicht wieder los
    // (früher ein Knopf im Widget) — daher auch ohne `boneactions` da.
    required: true,
    // Nur bei relationalen Single-Bones sichtbar (nicht multiple).
    when: (ctx) => prefixMatches("relational", ctx?.bone?.type) && !ctx?.bone?.multiple,
  },
  removeEntry: {
    type: "callback",
    arg: "removeEntry",
    name: "Entfernen",
    icon: "xmark",
    library: "default",
    title: "bone.del",
    position: "end",
    variant: "danger",
    // PFLICHT-Action (Gerüst): entfernt DIESE Zeile eines multiple-Bones —
    // ohne sie würde man einen Eintrag nie wieder los. Nur in Zeilen-Kontexten
    // (BoneActions mit index) sichtbar.
    required: true,
    when: (ctx) => ctx?.multipleRow === true,
  },
}

/** Dialog-Inhalt für `type: "assistant"` Actions, gemappt per `arg`. */
const componentRegistry = {
  translate: Translation,
  describe_image: DescribeImage,
  debug: Debug,
}

/** Direkt aufgerufene Handler für `type: "callback"` Actions, gemappt per `arg`. */
const handlerRegistry = {
  download: downloadHandler,
  placeholder: placeholderHandler,
  delete: deleteHandler,
  removeEntry: (ctx) => ctx.removeEntry?.(),
}

/** Kein Wert zum Bearbeiten: leer, oder ein Objekt/Array ohne Inhalt (nur
 *  null/undefined/leere Listen — wie `isObjectEmpty` im Bone). */
function isEmptyValue(value) {
  if (!value) return true
  if (typeof value !== "object") return false
  return Object.values(value).every((entry) => entry == null || (Array.isArray(entry) && entry.length === 0))
}

/** Disabled-Check per `arg`. Erhält den Action-Kontext (name, value, index, lang, bone, boneState). */
const disabledRegistry = {
  translate: (ctx) => !ctx.bone?.languages,
  describe_image: (ctx) => !ctx.value?.dest?.key,
  download: (ctx) => !ctx.value?.dest?.downloadUrl,
  // am EIGENEN Wert — bei Mehrsprachigkeit der einer Sprache, nicht des Bones
  delete: (ctx) => isEmptyValue(ctx.value),
}

/**
 * Default-Actions pro Bone-Type-Prefix. Beim Auflösen werden ALLE matchenden
 * Prefixes zusammengeführt (kürzester zuerst, dedupliziert).
 *
 * Matching-Regel: Prefix matcht, wenn `boneType === prefix` (exakt) ODER
 * `boneType.startsWith(prefix + ".")` (Subtype). Der leere Prefix `""` matcht alles.
 *
 * Definitionen mit `required: true` (delete, download) erscheinen auch ohne
 * `boneactions`; ein Host kann sie hier trotzdem abwählen (wie per `"-name"`).
 */
const defaultActionsByType = {
  "": ["debug", "placeholder"],
  relational: ["delete"],
  "relational.tree.leaf.file": ["download"],
}

/**
 * PFLICHT-Actions pro Bone-Type-Prefix (Gerüst-Funktionen). Anders als die
 * Defaults überleben sie sowohl eine `bone.params.actions`-Liste des Servers
 * als auch `setDefaultActionsForType` des Hosts — nur ihr eigenes
 * `when`-Prädikat (funktionale Verfügbarkeit) blendet sie aus. Sie werden
 * außerdem auch OHNE `boneactions` gerendert (BoneActions filtert darauf).
 */
const requiredActionsByType = {
  "": ["removeEntry"],
}

function prefixMatches(prefix, boneType) {
  if (prefix === "") return true
  if (!boneType) return false
  return boneType === prefix || boneType.startsWith(prefix + ".")
}

/**
 * Erweitert die Registry. Jedes Feld ist optional.
 * @param {string} name
 * @param {{ default?: object, component?: object, handler?: Function, disabled?: Function }} opts
 */
export function addAction(name, opts) {
  if (opts.default) defaultActions[name] = opts.default
  if (opts.component) componentRegistry[name] = opts.component
  if (opts.handler) handlerRegistry[name] = opts.handler
  if (opts.disabled) disabledRegistry[name] = opts.disabled
}

/** Setzt die Standard-Actions für einen Bone-Type-Prefix. */
export function setDefaultActionsForType(typePrefix, actionNames) {
  defaultActionsByType[typePrefix] = actionNames
}

/** Setzt die PFLICHT-Actions für einen Bone-Type-Prefix (Host-Kuratierung). */
export function setRequiredActionsForType(typePrefix, actionNames) {
  requiredActionsByType[typePrefix] = actionNames
}

/**
 * Formular-weite Action-Konfiguration (ViForm `actions`-Prop, via
 * provide("boneActionsConfig") — ggf. eine Ref) für EINEN Bone auflösen:
 * Array gilt für alle Bones, Objekt pro Bone-Name mit `"*"` für alle.
 * Die Einträge haben dieselbe Form wie `bone.params.actions` (inkl. `"-name"`).
 */
export function formConfiguredActions(config, boneName) {
  const value = unref(config)
  if (!value) return []
  if (Array.isArray(value)) return [...value]
  return [...(value["*"] ?? []), ...(value[boneName] ?? [])]
}

export function getActionComponent(arg) {
  return componentRegistry[arg]
}

export function getActionHandler(arg) {
  return handlerRegistry[arg]
}

export function isActionDisabled(action, ctx) {
  // Im Readonly-Modus sind grundsätzlich alle Actions deaktiviert — bis auf
  // rein lesende (`allowReadonly`, z.B. Download).
  if (ctx?.boneState?.readonly && !action?.allowReadonly) return true
  const fn = disabledRegistry[action?.arg]
  return fn ? !!fn(ctx) : false
}

/**
 * Sammelt alle Action-Namen einer Prefix-Map für einen Bone-Type über
 * matchende Prefixes (kürzester zuerst, dedupliziert).
 *
 * @param {Record<string, string[]>} map
 * @param {string} boneType
 * @returns {string[]}
 */
function collectFromMap(map, boneType) {
  const matched = Object.keys(map)
    .filter((p) => prefixMatches(p, boneType))
    .sort((a, b) => a.length - b.length)
  const names = []
  for (const p of matched) {
    for (const n of map[p]) {
      if (!names.includes(n)) names.push(n)
    }
  }
  return names
}

/** Liefert den `arg`-Identifier eines Eintrags (String oder Inline-Definition). */
function entryArg(entry) {
  return typeof entry === "string" ? entry : entry?.arg
}

/**
 * Löst die Action-Liste für einen Bone auf.
 * - Type-Defaults aus `defaultActionsByType` werden **immer** angewendet
 *   (matchende Prefixes vereint, kürzester zuerst).
 * - PFLICHT-Actions aus `requiredActionsByType` kommen zusätzlich IMMER dazu.
 * - `configured` (typisch `bone.params.actions`) wird vorangestellt und die
 *   Defaults werden dedupliziert dazugemerged. So bleibt z.B. die `delete`-
 *   Action für relationale Bones immer verfügbar, auch wenn das Backend eine
 *   `params.actions`-Liste schickt.
 * - EXPLIZITE ABWAHL: ein String-Eintrag `"-name"` in `configured` entfernt
 *   die Action `name` — auch eine Default- oder Pflicht-Action (die bewusste
 *   Abwahl am Bone schlägt die Pflicht; nur sie).
 * - Strings werden via Default-Lookup aufgelöst, Inline-Objekte durchgereicht.
 * - Actions mit `when(ctx)` werden ausgefiltert, wenn das Prädikat falsy liefert.
 *
 * Jede zurückgegebene Action ist eine flache Kopie, damit `_opened`-Mutationen
 * den Source nicht verändern. Sortiert: Actions mit `position: "end"` ans Ende.
 *
 * @param {object} bone - vollständige Bone-Definition (mit type, multiple, params)
 * @param {Array<string|object>|undefined} configured
 * @param {object} [boneState] - reactive Bone-State (für when/disabled-Predicates)
 * @param {object} [extras] - zusätzlicher Kontext für `when` (z.B. injizierte Hosts wie `relationSelector`)
 * @returns {object[]}
 */
export function resolveActions(bone, configured, boneState, extras = {}) {
  const defaults = collectFromMap(defaultActionsByType, bone?.type)
  const required = collectFromMap(requiredActionsByType, bone?.type)
  const entries = Array.isArray(configured) ? [...configured] : []
  // Explizite Abwahl: "-name"-Einträge sammeln und aus der Liste nehmen.
  const disabled = new Set(entries.filter((e) => typeof e === "string" && e.startsWith("-")).map((e) => e.slice(1)))
  const names = entries.filter((e) => !(typeof e === "string" && e.startsWith("-")))
  for (const d of [...defaults, ...required]) {
    if (!names.some((e) => entryArg(e) === d)) names.push(d)
  }
  const ctx = { bone, boneState, ...extras }
  return names
    .filter((entry) => !disabled.has(entryArg(entry)))
    .map((entry) => (typeof entry === "string" ? defaultActions[entry] : entry))
    .filter(Boolean)
    .map((a) => ({ ...a }))
    .filter((a) => (typeof a.when === "function" ? !!a.when(ctx) : true))
    .sort((a, b) => (a.position === "end" ? 1 : 0) - (b.position === "end" ? 1 : 0))
}
