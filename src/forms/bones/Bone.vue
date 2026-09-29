<template>
  <div
    class="bone"
    :class="{
      'has-subbones': state.bonestructure['using'],
      'is-label-top': label === 'top',
      'is-label-hide': ['hide', 'placeholder'].includes(label),
      [`bone-type-${state.bonestructure['type'].split('.')[0]}`]: true,
      [`bone-name-${name}`]: true,
      'is-required': state.required,
    }"
  >
    <bone-label
      v-if="!['hide', 'placeholder'].includes(label)"
      :name="name"
      :debug="state.debug"
    >
      <span :class="{ 'bone-label-required': state.required }">{{ state.bonestructure["descr"] }}</span>
      <span
        v-if="state.required"
        class="bone-label-required"
      >
        *
      </span>
      <wa-tooltip
        v-if="state.hasTooltip && !showLabelInfo"
        :for="state.labelTooltipTargetId"
        :content="$t(state.bonestructure.params['tooltip'])"
        placement="top-center"
      ></wa-tooltip>
      <div
        v-if="state.hasTooltip && !showLabelInfo"
        :id="state.labelTooltipTargetId"
        class="bone-label-tooltip"
      >
        <wa-icon name="question"></wa-icon>
      </div>
    </bone-label>

    <wa-alert
      v-if="showLabelInfo && state.hasTooltip"
      variant="brand"
      open
      class="bone-label-info"
    >
      <wa-icon
        slot="icon"
        name="circle-info"
      ></wa-icon>
      {{ state.bonestructure.params["tooltip"] }}
    </wa-alert>
    <wa-tooltip
      class="bone-tooltip"
      :for="state.boneTooltipTargetId"
      :disabled="!state.showtooltip"
      :content="state.bonestructure?.['descr']"
      style="--show-delay: 1000"
    ></wa-tooltip>

    <div
      :id="state.boneTooltipTargetId"
      class="bone-inner wa-stack wa-gap-xs"
      :class="{ 'is-required': state.required }"
    >
      <!-- Multilanguage: Tab per Sprache -->
      <div
        v-if="state.multilanguage"
        class="bone-row wa-flank:end wa-gap-xs wa-align-items-start"
      >
        <wa-tab-group
          class="bone-lang-tabs"
          placement="bottom"
        >
          <template
            v-for="lang in state.languages"
            :key="name + '_' + lang + '_tab'"
          >
            <wa-tab
              slot="nav"
              :panel="'lang_' + lang"
              :active="state.currentLanguage === lang"
              :data-lang="lang"
              @click="updateLanguage"
            >
              {{ $t(lang) }}
            </wa-tab>
            <wa-tab-panel
              :name="'lang_' + lang"
              :active="state.currentLanguage === lang"
            >
              <bone-multiple-list
                :is="is"
                v-if="state.multiple && !BoneHasMultipleHandling(state.bonestructure['type'])"
                :name="name"
                :lang="lang"
                :entries="state.bonevalue?.[lang]"
                :bonestructure="state.bonestructure"
                :readonly="state.readonly"
                :actionbar="state.actionbar"
              />
              <bone-single-entry
                :is="is"
                v-else
                :name="name"
                :lang="lang"
                :bonevalue="state.bonevalue?.[lang]"
                :bonestructure="state.bonestructure"
                :boneactions="false"
              />
            </wa-tab-panel>
          </template>
        </wa-tab-group>
        <div
          v-if="state.boneactions && !state.multiple && state.hasActions"
          class="wa-cluster wa-gap-xs"
        >
          <bone-actions
            :value="state.bonevalue"
            :name="name"
            :index="null"
            :bone="state.bonestructure"
            @change="updateValue"
          ></bone-actions>
        </div>
      </div>

      <!-- Einsprachig -->
      <template v-else>
        <bone-multiple-list
          :is="is"
          v-if="state.multiple && !BoneHasMultipleHandling(state.bonestructure['type'])"
          :name="name"
          :entries="state.bonevalue"
          :bonestructure="state.bonestructure"
          :readonly="state.readonly"
          :actionbar="state.actionbar"
        />
        <bone-single-entry
          :is="is"
          v-else
          :name="name"
          :bonevalue="state.bonevalue"
          :bonestructure="state.bonestructure"
          :boneactions="state.boneactions"
          :autofocus="autofocus"
        />
      </template>

      <!-- Fehlermeldungen -->
      <template v-if="errorStyle === 'default'">
        <wa-callout
          v-for="message in state.errorMessages"
          :key="message"
          open
          :summary="$t('bone.errors_summary')"
          variant="danger"
          class="bone-error"
        >
          <wa-icon
            slot="icon"
            name="triangle-exclamation"
          ></wa-icon>
          <div class="bone-error">
            {{ errorMessage(message) }}
          </div>
        </wa-callout>
      </template>
      <template v-else>
        <div
          v-for="message in state.errorMessages"
          :key="message"
          style="font-size: 0.8em; color: red"
        >
          {{ errorMessage(message) }}
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
/** @displayName Bone */
import { reactive, computed, onBeforeMount, provide, watch, watchEffect, inject, unref } from "vue"
import BoneLabel from "./BoneLabel.vue"
import { BoneHasMultipleHandling, getBoneActionbar } from "./index"
import rawBone from "./widgets/rawBone.vue"
import Utils, { buildBoneDomId } from "./utils"
import BoneActions from "./BoneActions.vue"
import { formConfiguredActions, resolveActions } from "./actions"
import BoneMultipleList from "./BoneMultipleList.vue"
import BoneSingleEntry from "./BoneSingleEntry.vue"
import { useI18n } from "vue-i18n"

/**
 * @emits change - Historisches Relikt, wird nicht direkt genutzt
 * @emits change-internal {Object} - Internes Event für ViForm: { name, value, lang, index, valid }
 * @emits handleClick - Historisches Relikt, wird nicht direkt genutzt
 */
const emit = defineEmits(["change", "change-internal", "handleClick"])

const props = defineProps({
  is: {
    type: Object,
    default: rawBone, // Das zu rendernde Bone-Widget (z.B. StringBone), typischerweise von ViForm gesetzt
  },
  name: {
    type: String,
    required: true, // Bone-Identifier; muss einem Key in structure und skel entsprechen
  },
  languages: {
    type: Array,
    default: undefined, // Explizite Sprach-Liste; überschreibt bonestructure.languages
  },
  multiple: {
    type: Boolean,
    default: false, // Expliziter Multiple-Flag; überschreibt bonestructure.multiple
  },
  readonly: {
    type: Boolean,
    default: false, // Expliziter Readonly-Flag; überschreibt bonestructure.readonly
  },
  required: {
    type: Boolean,
    default: false, // Expliziter Required-Flag; überschreibt bonestructure.required
  },
  params: {
    type: Object,
    default: undefined, // Zusätzliche Parameter; überschreibt bonestructure.params
  },
  value: {
    type: [Object, String, Number, Boolean, Array],
    default: undefined, // Expliziter Wert; überschreibt skel[name] wenn gesetzt
  },
  structure: {
    type: Object,
    required: true, // Vollständige Skeleton-Struktur (alle Bone-Definitionen des Formulars)
  },
  skel: {
    type: null,
    required: true, // Skeleton-Datenobjekt mit den aktuellen Werten
  },
  errors: {
    type: Array,
    default: () => [], // Fehler-Array aus der Server-Antwort; Einträge mit passendem fieldPath werden angezeigt
  },
  label: {
    type: String,
    default: "normal", // Label-Modus: "normal" | "top" | "hide" | "placeholder"
    validator(value, props) {
      return ["normal", "top", "hide", "placeholder"].includes(value)
    },
  },
  boneactions: {
    type: Boolean,
    default: true, // Aktiviert BoneActions (Defaults pro Bone-Type + bone.params.actions). Explizit false um Actions zu unterdrücken.
  },
  showLabelInfo: {
    type: Boolean,
    default: false, // Zeigt Tooltip-Inhalt als wa-alert statt als Tooltip
  },
  autofocus: {
    type: Boolean,
    default: false, // Gibt autofocus an das Bone-Widget weiter
  },
  defaultLanguage: {
    type: String,
    default: "de", // Standardmäßig aktive Sprache im Multilang-Tab
  },
  showBoneTooltip: {
    type: Boolean,
    default: false, // Erzwingt den Tooltip auf dem Input-Bereich
  },
  errorStyle: {
    type: String,
    default: "default", // Fehler-Darstellungsstil: "default" (wa-alert) | "decent" (kleiner roter Text)
    validator(value, props) {
      return ["default", "decent"].includes(value)
    },
  },
  debug: {
    type: Boolean,
    default: false, // Aktiviert Debug-Modus: Bone-Name als Tooltip am Label
  },
})
const { t } = useI18n()

const parentBonePath = inject("bonePath", [])
// Für die Sichtbarkeit der Relations-Auswahl (Action-`when` prüft darauf).
const relationSelector = inject("viurRelationSelector", null)
// Formular-weite Action-Konfiguration (ViForm `actions`-Prop).
const boneActionsConfig = inject("boneActionsConfig", null)
/** Vollständiger Bone-Pfad als Array für verschachtelte Bone-DOM-IDs. @returns {ComputedRef<string[]>} */
const bonePath = computed(() => [...(unref(parentBonePath) ?? []), props.name])
provide("bonePath", bonePath)

/**
 * Prüft ob ein Objekt ausschließlich null-Werte oder leere Arrays enthält.
 * @param {Object} obj - Das zu prüfende Objekt
 * @returns {boolean}
 */
function isObjectEmpty(obj) {
  for (const [, value] of Object.entries(obj)) {
    if (value !== null) {
      if (Array.isArray(value) && value.length > 0) {
        return false
      } else if (!Array.isArray(value)) {
        return false
      }
    }
  }
  return true
}

const state = reactive({
  boneactions: computed(() => props.boneactions), // Ob BoneActions-Schaltflächen angezeigt werden

  // Die Bone-Definition aus der Struktur (z.B. type, params, languages)
  bonestructure: computed(() => {
    return props.structure?.[props.name]
  }),
  bonevalue: null, // Aktueller Bone-Wert; wird aus skel initialisiert und bei Änderungen aktualisiert
  multilanguage: computed(() => state.languages?.length && state.languages.length > 0), // Ob der Bone mehrsprachig ist (mindestens eine Sprache konfiguriert)
  // Aktive Sprach-Liste: aus props.languages oder bonestructure.languages
  languages: computed(() => {
    if (props.languages) {
      return props.languages
    }
    return state.bonestructure && Object.keys(state.bonestructure).includes("languages")
      ? state.bonestructure["languages"]
      : []
  }),
  // Readonly-Status: props.readonly hat Vorrang vor bonestructure.readonly
  readonly: computed(() => {
    if (props.readonly) {
      return props.readonly
    }
    return state.bonestructure && Object.keys(state.bonestructure).includes("readonly")
      ? state.bonestructure["readonly"]
      : false
  }),
  // Required-Status: props.required hat Vorrang vor bonestructure.required
  required: computed(() => {
    if (props.required) {
      return props.required
    }
    return state.bonestructure && Object.keys(state.bonestructure).includes("required")
      ? state.bonestructure["required"]
      : false
  }),
  // Ob ein Tooltip-Text in bonestructure.params vorhanden ist
  hasTooltip: computed(() => {
    // `params` kommt von viur-core immer als Objekt; fehlt es (eigener Renderer,
    // handgebaute Struktur), darf das Formular davon nicht sterben.
    return state.bonestructure && Object.keys(state.bonestructure["params"] ?? {}).includes("tooltip") ? true : false
  }),
  // Multiple-Status: props.multiple hat Vorrang vor bonestructure.multiple
  multiple: computed(() => {
    if (props.multiple) {
      return props.multiple
    }
    return state.bonestructure && Object.keys(state.bonestructure).includes("multiple")
      ? state.bonestructure["multiple"]
      : false
  }),
  // Bone-Parameter: props.params hat Vorrang vor bonestructure.params
  params: computed(() => {
    if (props.params) {
      return props.params
    }
    return state.bonestructure && Object.keys(state.bonestructure).includes("params")
      ? state.bonestructure["params"]
      : {}
  }),
  // Die Actionbar-Komponente passend zum Bone-Typ (z.B. für File, Relational)
  actionbar: computed(() => {
    return getBoneActionbar(state.bonestructure?.["type"])
  }),
  // Ob der Bone-Wert leer ist (null, leeres Array, leeres Objekt). Im Readonly-Modus immer false
  isEmpty: computed(() => {
    // Ignore the computation when the state is readonly
    if (state.readonly) return false

    // Check for null or undefined values
    if (!state.bonevalue) return true

    // Check if the value is an array with elements
    if (Array.isArray(state.bonevalue) && state.bonevalue.length === 0) return true

    // Check if the value is an object and not an array, then use helper function to check if it's empty
    if (state.bonevalue === Object(state.bonevalue) && !Array.isArray(state.bonevalue))
      return isObjectEmpty(state.bonevalue)

    return false
  }),
  // Fehlermeldungen aus props.errors, gefiltert auf diesen Bone (fieldPath + severity)
  errorMessages: computed(() => {
    let errors = []
    for (let error of props.errors) {
      if (
        error["fieldPath"][0] === props.name &&
        (error["fieldPath"].length === 1 ||
          ((state.multilanguage || state.multiple) && error["fieldPath"].length === 2) ||
          (state.multilanguage && state.multiple && error["fieldPath"].length === 3)) &&
        (error["severity"] > 2 || (state.required && (error["severity"] === 2 || error["severity"] === 0)))
      ) {
        //severity level???
        errors.push(error["errorMessage"])
      }
    }
    return errors
  }),
  label: computed(() => props.label), // Aktueller Label-Modus (gespiegelt von props.label)
  // Ob der Bone-Tooltip angezeigt wird (bei hidden/placeholder-Label oder showBoneTooltip=true)
  showtooltip: computed(() => {
    if (props.showBoneTooltip) {
      return true
    }
    if (["hide", "placeholder"].includes(props.label)) {
      return true
    }
    return false
  }),
  defaultLanguage: computed(() => props.defaultLanguage), // Standardsprache (gespiegelt von props.defaultLanguage)
  currentLanguage: null, // Aktuell aktiver Sprach-Tab
  debug: computed(() => props.debug), // Debug-Modus (gespiegelt von props.debug)
  labelTooltipTargetId: computed(() => buildBoneDomId(unref(bonePath) ?? [], "label-tooltip")), // Eindeutige DOM-ID für den Label-Tooltip-Anker
  boneTooltipTargetId: computed(() => buildBoneDomId(unref(bonePath) ?? [], "field-tooltip")), // Eindeutige DOM-ID für den Bone-Tooltip-Anker
  // Ob für diesen Bone überhaupt Actions auflösbar sind (für UI-Wrapper-Sichtbarkeit).
  // MIT demselben Extra-Kontext und derselben Konfigurations-Merge-Reihenfolge
  // wie BoneActions selbst — sonst fällt z.B. die Relations-Auswahl
  // (when: relationSelector) hier raus und der Wrapper versteckt eine real
  // vorhandene Action, oder eine per ViForm abgewählte bleibt "sichtbar".
  hasActions: computed(
    () =>
      resolveActions(
        state.bonestructure,
        [...formConfiguredActions(boneActionsConfig, props.name), ...(state.bonestructure?.params?.actions ?? [])],
        state,
        { relationSelector }
      ).length > 0
  ),
})
provide("boneState", state)

/**
 * Weist jedem Objekt im Array ein stabiles _key-Attribut (UUID) zu, falls noch keines vorhanden ist.
 * Wird via watchEffect aufgerufen um stabile :key-Bindings für vue-draggable sicherzustellen.
 * @param {Array<Object>} arr - Multiple-Array dessen Einträge Objekte sind
 */
function ensureKeys(arr) {
  for (const it of arr) {
    if (!it._key && typeof it === "object") {
      it._key = crypto.randomUUID()
    }
  }
}
watchEffect(() => {
  if (Array.isArray(state.bonevalue)) {
    ensureKeys(state.bonevalue)
  }
})

/**
 * Aktualisiert state.bonevalue anhand von lang/index-Kontext und feuert change-internal.
 * Bei valid=false wird der Wert nicht gespeichert, das Event aber trotzdem gefeuert.
 * Bei state.readonly wird kein Event gefeuert.
 * @param {string} name - Bone-Name
 * @param {unknown} val - Neuer Wert
 * @param {string|null} lang - Sprach-Key (bei Multilang-Bones)
 * @param {number|null} index - Index (bei Multiple-Bones)
 * @param {boolean} valid - Ob der Wert valide ist
 * @returns {false|void}
 */
function updateValue(name, val, lang = null, index = null, valid = true) {
  if (val === undefined) return false
  if (valid) {
    if (lang) {
      if (!state.bonevalue) {
        state.bonevalue = {}
      }
      if (Object.keys(state.bonevalue).includes(lang) && index !== null) {
        state.bonevalue[lang][index] = val
      } else {
        state.bonevalue[lang] = val
      }
    } else if (index !== null) {
      state.bonevalue[index] = val
    } else {
      state.bonevalue = val
    }
  }

  if (state.readonly) return false

  let changeInternalObj = {
    name: name,
    value: val,
    lang: lang,
    index: index,
    valid: valid,
  }

  emit("change-internal", changeInternalObj)
}

/**
 * Fügt einen neuen Eintrag zum Multiple-Array hinzu.
 * Wird via provide("addMultipleEntry") an Actionbars weitergegeben.
 * @param {string|null} lang - Sprach-Key (bei Multilang-Bones)
 * @param {unknown} data - Initialer Wert des neuen Eintrags
 */
function addMultipleEntry(lang = null, data = "") {
  if (lang) {
    if (Object.keys(state.bonevalue).includes(lang)) {
      state.bonevalue[lang].push(data)
    } else {
      state.bonevalue[lang] = [data]
    }
  } else {
    if (state.bonevalue) {
      state.bonevalue.push(data)
    } else {
      state.bonevalue = [data]
    }
  }
}

/**
 * Feuert updateValue nach einer Multiple-Array-Mutation (splice).
 * @param {string|null} lang - Sprach-Key oder null
 */
function emitMultipleUpdate(lang) {
  if (lang) {
    updateValue(props.name, state.bonevalue[lang], lang)
  } else {
    updateValue(props.name, state.bonevalue)
  }
}

/**
 * Entfernt einen einzelnen Eintrag aus dem Multiple-Array per Index.
 * @param {number} index - Index des zu entfernenden Eintrags
 * @param {string|null} lang - Sprach-Key (bei Multilang-Bones)
 */
function removeMultipleEntry(index, lang = null) {
  if (lang) {
    state.bonevalue?.[lang].splice(index, 1)
  } else {
    state.bonevalue.splice(index, 1)
  }
  emitMultipleUpdate(lang)
}

/**
 * Entfernt alle Einträge aus dem Multiple-Array.
 * Wird via provide("removeMultipleEntries") an Actionbars weitergegeben.
 * @param {string|null} lang - Sprach-Key (bei Multilang-Bones)
 */
function removeMultipleEntries(lang = null) {
  if (lang) {
    state.bonevalue?.[lang].splice(0)
  } else {
    state.bonevalue.splice(0)
  }
  emitMultipleUpdate(lang)
}

/**
 * Wechselt die aktive Sprache anhand des data-lang-Attributs des geklickten Tab-Elements.
 * @param {Event} e - Click-Event vom wa-tab
 */
function updateLanguage(e) {
  state.currentLanguage = e.target.dataset.lang
}

/**
 * Delegiert an Utils.formatString — wird via provide("formatString") für Relational-Bones bereitgestellt.
 * @param {string} formatstr - Format-Template
 * @param {unknown} boneValue - Bone-Wert der in das Template eingesetzt wird
 * @returns {string}
 */
function formatString(formatstr, boneValue) {
  return Utils.formatString(formatstr, boneValue)
}

/**
 * Übersetzt einen Fehler-Key via vue-i18n (errors.{key}). Fällt auf den rohen String zurück.
 * @param {string} error - Fehler-Key oder roher Fehlertext
 * @returns {string}
 */
function errorMessage(error) {
  const key = `errors.${error}`
  let temp = t(key)
  if (temp === key) {
    temp = t(error)
  }
  return temp
}

watch(
  () => props.skel?.[props.name],
  () => {
    state.bonevalue = props.skel?.[props.name]
  }
)

// Sprach-Tab wählen: die gewünschte Sprache — führt der Bone sie nicht,
// die erste seiner Sprachen (sonst wäre KEIN Tab aktiv).
function pickLanguage(wanted) {
  if (!state.languages?.length || state.languages.includes(wanted)) return wanted
  return state.languages[0]
}

watch(
  () => state.defaultLanguage,
  (newVal) => {
    state.currentLanguage = pickLanguage(newVal)
  }
)

onBeforeMount(() => {
  if (props.value) {
    state.bonevalue = props.value
  } else {
    state.bonevalue = props.skel?.[props.name]
  }
  state.currentLanguage = pickLanguage(state.defaultLanguage)
})

provide("updateValue", updateValue)
provide("addMultipleEntry", addMultipleEntry)
// Für die Pflicht-Action "removeEntry" (Zeilen-X der Multiple-Listen).
provide("removeMultipleEntry", removeMultipleEntry)
provide("removeMultipleEntries", removeMultipleEntries)
provide("formatString", formatString)
</script>

<style scoped>
@layer foundation.form {
  /* Bone-Wrapper: Label links, Inhalt rechts (auf Mobile gestapelt) */
  .bone {
    display: grid;
    grid-template-columns: 235px 1fr;
    grid-gap: var(--wa-space-s);
    margin-bottom: 20px;

    /* Label über dem Inhalt oder gar keins: eine Spalte auf jeder Breite */
    &.is-label-top,
    &.is-label-hide {
      grid-template-columns: 1fr;
    }

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
    }
  }
  .bone-label-required {
    color: var(--wa-color-brand-50);
    font-weight: 700;
  }

  /* Fehler-Callout unter dem Bone-Inhalt */
  wa-callout.bone-error {
    padding: var(--wa-space-xs);
    border: 1px solid var(--wa-color-border-loud);
    border-radius: var(--wa-border-radius-m);
    color: var(--wa-color-on-quiet);

    & wa-icon {
      margin-inline-end: var(--wa-space-2xs);
    }
  }

  /* Sprachumschaltung: Tabs unter dem Eingabefeld (Multilang-Bones) */
  .bone-lang-tabs {
    width: 100%;
    --track-width: 0;

    &::part(body) {
      overflow-x: hidden;
    }

    & wa-tab-panel::part(base) {
      padding: 0;
    }

    & wa-tab {
      &::part(base) {
        padding: var(--wa-space-xs);
        background-color: var(--wa-color-neutral-80);
        border-radius: 0;
        border-left: 1px solid var(--wa-color-border-loud);
        border-bottom: 1px solid var(--wa-color-border-loud);
      }

      &:hover::part(base) {
        background-color: var(--wa-color-neutral-90);
      }

      &[aria-selected="true"] {
        &::part(base) {
          border-bottom: 2px solid var(--wa-color-brand-50);
          background-color: var(--wa-color-fill-quiet);
        }
      }

      /* abgerundete Außenecken; Nachbar-Tabs überlappen sich um 1px */
      &:first-child::part(base) {
        margin-left: 1rem;
        border-bottom-left-radius: 5px;
      }

      &:nth-last-child(2)::part(base) {
        border-bottom-right-radius: 5px;
        border-right: 1px solid var(--wa-color-border-loud);
      }

      &:not(:first-child)::part(base) {
        margin-left: -1px;
      }
    }
  }
}
</style>
<style>
* {
  box-sizing: border-box;
}
</style>
<!--
<style scoped>
@layer foundation.form {
  .bone-wrapper {
    display: grid;
    grid-template-columns: 235px 1fr;
    grid-gap: var(--wa-space-s);
    margin-bottom: 20px;

    &.bone-wrapper-record,
    &.label-top,
    &.has-subbones {
      display: flex;
      flex-direction: column;
      grid-gap: 0;

      & > :deep(.bone-name) {
        border-bottom-left-radius: 0;
        border-top-right-radius: var(--wa-border-radius-m);
        min-width: 235px;
      }

      & > .bone-inner-wrap {
        padding-top: var(--wa-space-s);
        border-top: 2px solid var(--wa-color-neutral-80);
        margin-bottom: 5px;
      }

      & .multiple-bone {
        border-bottom: 1px solid var(--wa-color-neutral-80);
        padding-bottom: var(--wa-space-s);
        margin-bottom: var(--wa-space-s);

        &:deep(wa-details) {
          &:last-child {
            &::part(base) {
              border-bottom: none;
            }
          }
        }
      }
    }

    &.label-hide {
      display: flex;
      flex-direction: column;
      grid-gap: 0;
    }

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
    }
  }

  wa-tab-panel::part(base) {
    padding: 0;
  }

  .lang-tab {
    width: 100%;
    --track-width: 0;
    --indicator-color: var(--vi-background-color);
    --track-color: var(--vi-border-color);

    &::part(body) {
      padding-bottom: var(--wa-space-xs);
      overflow-x: hidden;
    }

    &::part(tabs) {
      border-top: 1px solid var(--vi-border-color);
    }

    & wa-tab {
      margin-top: -1px;

      &[aria-selected="true"] {
        z-index: 1;

        &::part(base) {
          background-color: var(--vi-background-color);
          border: 1px solid var(--vi-border-color);
          border-top: 1px solid var(--vi-background-color) !important;
          border-bottom: 2px solid var(--wa-color-brand-50) !important;
        }
      }

      &::part(base) {
        background-color: var(--wa-color-neutral-90);
        border: 1px solid var(--wa-color-neutral-70);
        border-top: 1px solid var(--vi-border-color);
        border-radius: 0;
        padding: var(--wa-space-xs);
        transition: all ease 0.3s;
      }

      &:hover {
        &::part(base) {
          background-color: var(--vi-background-color);
          border: 1px solid var(--vi-border-color);
        }
      }

      &:first-child {
        &::part(base) {
          border-bottom-left-radius: 5px;
        }
      }

      &:nth-last-child(2) {
        &::part(base) {
          border-bottom-right-radius: 5px;
        }
      }

      &:not(:first-child) {
        &::part(base) {
          margin-left: -1px;
        }
      }
    }
  }

  .multiple-placeholder {
    &:not(.readonly) {
      margin-bottom: var(--wa-space-xs);
    }

    & wa-input {
      &::part(base) {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
        opacity: 0.7;
      }
    }

    @media (max-width: 900px) {
      & wa-input {
        &::part(base) {
          border-top-right-radius: 0;
          border-bottom-left-radius: var(--wa-border-radius-m);
        }
      }
    }
  }

  .multiple-bone {
    margin-bottom: var(--wa-space-xs);

    &:first-child {
      padding-top: var(--wa-space-xs);
    }

    & .bone-wrapper {
      margin-bottom: var(--wa-space-xs);
    }

    &:first-child {
      & :deep(.value-line) {
      }
    }
  }

  .bone-inner-wrap {
    min-width: 1px;

    & wa-alert {
      margin-top: var(--wa-space-xs);
      background-color: transparent;

      &::part(message) {
        padding: var(--wa-space-xs) var(--wa-space-s);
      }

      &::part(icon) {
        padding-left: var(--wa-space-s);
      }
    }
  }

  .label-info {
    &::part(base) {
      align-items: center;
      margin-left: 0.5em;
      background-color: var(--wa-color-info-95);
      border: none;
      overflow: visible;
    }

    &::part(message) {
      padding: var(--wa-space-s);
    }

    &::part(icon) {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background-color: var(--wa-color-surface-default);
      width: 1em;
      height: 1em;
      margin-left: -0.5em;
      padding-left: 0;
    }
  }

  .tooltip {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: auto;
    padding-left: 0.4em;

    & wa-icon {
      background-color: var(--wa-color-info-50);
      color: #fff;
      padding: 0.4em;
      border-radius: 50%;
      font-size: 0.55em;
    }
  }

  wa-tooltip {
    &::part(body) {
      background-color: var(--wa-color-info-50);
    }

    &::part(base__arrow) {
      background-color: var(--wa-color-info-50);
    }
  }

  .required {
    color: var(--wa-color-brand-50);
    font-weight: 700;
  }

  :deep(wa-combobox) {
    &::part(input__base) {
      border: 1px solid var(--vi-border-color);
      box-shadow: none !important;
    }

    &::part(input__prefix) {
      display: none !important;
    }

    &::part(input__suffix) {
      display: none !important;
    }
  }

  wa-tooltip.bone-tooltip {
    &::part(body) {
      background-color: var(--wa-color-brand-50);
    }

    &::part(base__arrow) {
      background-color: var(--wa-color-brand-50);
    }
  }
}

.error-msg::part(base) {
  background-color: #ffecec;
  color: var(--wa-color-danger-30);
}

.wrapper-bone-row {
  display: flex;
  flex-direction: row;
  gap: var(--wa-space-xs);
}

.wrapper-bone-block {
  display: block;
  width: 100%;
}
</style>

<style>
wa-input[data-user-invalid]::part(base),
wa-select[data-user-invalid]::part(combobox),
wa-checkbox[data-user-invalid]::part(control) {
  border-color: var(--wa-color-danger-50);
}
</style>
-->
