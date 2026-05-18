import Translation from "./Translation.vue"
import DescribeImage from "./DescribeImage.vue"
import Debug from "./Debug.vue"
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
}

/** Disabled-Check per `arg`. Erhält den Action-Kontext (name, value, index, lang, bone, boneState). */
const disabledRegistry = {
  translate: (ctx) => !ctx.bone?.languages,
  describe_image: (ctx) => !ctx.value?.dest?.key,
  download: (ctx) => !ctx.value?.dest?.downloadUrl,
  delete: (ctx) => !!ctx.boneState?.isEmpty,
}

/**
 * Default-Actions pro Bone-Type-Prefix. Beim Auflösen werden ALLE matchenden
 * Prefixes zusammengeführt (kürzester zuerst, dedupliziert).
 *
 * Matching-Regel: Prefix matcht, wenn `boneType === prefix` (exakt) ODER
 * `boneType.startsWith(prefix + ".")` (Subtype). Der leere Prefix `""` matcht alles.
 */
const defaultActionsByType = {
  "": ["debug", "placeholder"],
  relational: ["delete"],
  "relational.tree.leaf.file": ["download"],
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

export function getActionComponent(arg) {
  return componentRegistry[arg]
}

export function getActionHandler(arg) {
  return handlerRegistry[arg]
}

export function isActionDisabled(action, ctx) {
  // Im Readonly-Modus sind grundsätzlich alle Actions deaktiviert.
  if (ctx?.boneState?.readonly) return true
  const fn = disabledRegistry[action?.arg]
  return fn ? !!fn(ctx) : false
}

/**
 * Sammelt alle Default-Action-Namen für einen Bone-Type über matchende Prefixes
 * (kürzester zuerst, dedupliziert).
 *
 * @param {string} boneType
 * @returns {string[]}
 */
function collectTypeDefaults(boneType) {
  const matched = Object.keys(defaultActionsByType)
    .filter((p) => prefixMatches(p, boneType))
    .sort((a, b) => a.length - b.length)
  const names = []
  for (const p of matched) {
    for (const n of defaultActionsByType[p]) {
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
 * - `configured` (typisch `bone.params.actions`) wird vorangestellt und die
 *   Defaults werden dedupliziert dazugemerged. So bleibt z.B. die `delete`-
 *   Action für relationale Bones immer verfügbar, auch wenn das Backend eine
 *   `params.actions`-Liste schickt.
 * - Strings werden via Default-Lookup aufgelöst, Inline-Objekte durchgereicht.
 *
 * Jede zurückgegebene Action ist eine flache Kopie, damit `_opened`-Mutationen
 * den Source nicht verändern. Sortiert: Actions mit `position: "end"` ans Ende.
 *
 * @param {string} boneType
 * @param {Array<string|object>|undefined} configured
 * @returns {object[]}
 */
export function resolveActions(boneType, configured) {
  const defaults = collectTypeDefaults(boneType)
  const names = Array.isArray(configured) ? [...configured] : []
  for (const d of defaults) {
    if (!names.some((e) => entryArg(e) === d)) names.push(d)
  }
  return names
    .map((entry) => (typeof entry === "string" ? defaultActions[entry] : entry))
    .filter(Boolean)
    .map((a) => ({ ...a }))
    .sort((a, b) => (a.position === "end" ? 1 : 0) - (b.position === "end" ? 1 : 0))
}
