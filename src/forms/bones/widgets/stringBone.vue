<template>
  <wa-input
    ref="stringBone"
    class="bone-widget bone-widget-string bone-widget-string-default"
    :class="[`bone-widget-string-${name}`]"
    :name="name"
    :disabled="boneState.readonly"
    :value="Utils.unescape(value)"
    :required="
      boneState.bonestructure.required && !boneState.bonestructure.multiple && !boneState.bonestructure.languages
    "
    :placeholder="state.placeholder"
    :data-user-invalid="boneState.errorMessages.length === 0 ? null : true"
    :pattern="state.pattern"
    :maxlength="boneState.maxlength"
    :minlength="boneState.minlength"
    @change="changeEvent"
    @keyup="changeEvent"
  ></wa-input>
</template>

<script setup>
import { reactive, onMounted, inject, computed, watchEffect, ref } from "vue"
import { useTimeoutFn } from "@vueuse/core"
import Utils from "../utils"
/**
 * Einzeiliges Textfeld für einfache Zeichenketten.
 *
 * Rendert ein `<wa-input>` und delegiert Validierung an das native
 * Constraint Validation API. Unterstützt optionale Regex-Validierung
 * via `boneState.params.pattern` sowie eine eigene Fehlermeldung via
 * `boneState.params.pattern_error`. Bei `boneState.label === "placeholder"`
 * wird der Bone-Name als Placeholder angezeigt statt als Label darüber.
 *
 * @displayName StringBone
 *
 * @cssClass bone-widget - Basis-Klasse aller Bone-Widgets
 * @cssClass bone-widget-string - Kennzeichnet den Bone-Typ
 * @cssClass bone-widget-string-default - Standard-Variante
 * @cssClass bone-widget-string-{name} - Dynamisch gesetzt auf den Bone-Namen, z.B. `bone-widget-string-title`
 */
defineOptions({
  inheritAttrs: false,
})
const props = defineProps({
  /** Bone-Name – wird in jedem `change`-Event als erstes Argument übergeben. */
  name: String,
  /** Aktueller Bone-Wert. */
  value: [Object, String, Number, Boolean, Array],
  /** Index im Multiple-Array; `undefined` bei Einzelwert. */
  index: Number,
  /** Sprach-Key bei mehrsprachigen Bones, z.B. `"de"`. */
  lang: String,
  /** Bone-Struktur (aktuell nicht aktiv genutzt). */
  bone: Object,
  /** Setzt den Fokus nach 600 ms auf das Input-Element. */
  autofocus: Boolean,
})

const emit = defineEmits([
  /**
   * Wird bei jeder Wertänderung sowie beim Mount (Initialisierung) gefeuert.
   * @arg {string} name - Bone-Name
   * @arg {string} value - Aktueller Eingabewert
   * @arg {string|undefined} lang - Sprach-Key
   * @arg {number|undefined} index - Index im Multiple-Array
   * @arg {boolean} [valid] - Validierungsstatus; fehlt beim Init-Event
   */
  "change",
])

const boneState = inject("boneState")
const state = reactive({
  value: computed(() => props.value),
  valid: null,
  pattern: computed(() => {
    let pat = boneState.params?.pattern
    if (!pat) return undefined

    if (typeof pat === "string") {
      return pat
    }
    return pat?.[boneState.defaultLanguage]
  }),
  pattern_error: computed(() => {
    let pat = boneState.params?.pattern_error
    if (!pat) return ""

    if (typeof pat === "string") {
      return pat
    }
    return pat?.[boneState.defaultLanguage] ? pat?.[boneState.defaultLanguage] : ""
  }),
  placeholder: computed(() => {
    if (boneState.label !== "placeholder") return undefined
    let name = boneState?.bonestructure?.descr
    if (boneState.bonestructure.required) {
      name += "*"
    }
    return name
  }),
})

const stringBone = ref(null)

/**
 * Verarbeitet `change`- und `keyup`-Events des `<wa-input>`.
 * Prüft die native Validität, setzt bei `patternMismatch` eine eigene
 * Fehlermeldung und emittiert den `change`-Event mit Validierungsstatus.
 *
 * @param {Event} event - Das DOM-Event vom Input-Element
 */
function changeEvent(event) {
  let valid = stringBone.value.reportValidity()
  let validStates = stringBone.value.validity
  if (validStates["patternMismatch"]) {
    stringBone.value.setCustomValidity(state.pattern_error)
  } else {
    stringBone.value.setCustomValidity("")
  }
  emit("change", props.name, event.target.value, props.lang, props.index, valid)
}

watchEffect(() => {
  if (props.autofocus) {
    if (stringBone.value && stringBone.value !== null && stringBone.value !== null) {
      const { start } = useTimeoutFn(() => {
        stringBone.value.focus()
      }, 600)

      start()
    }
  }
})

onMounted(() => {
  emit("change", props.name, props.value, props.lang, props.index) //init
})
</script>
