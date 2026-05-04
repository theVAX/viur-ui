<template>
  <wa-textarea
    v-if="boneState.bonestructure.type === 'raw.json'"
    class="widget-bone widget-bone-raw widget-bone-raw-default"
    :class="[`widget-bone-raw-${name}`]"
    :disabled="boneState?.readonly"
    :value="typeof value === 'object' ? JSON.stringify(value) : value"
    :required="
      boneState.bonestructure.required && !boneState.bonestructure.multiple && !boneState.bonestructure.languages
    "
    :placeholder="state.placeholder"
    :data-user-invalid="boneState.errorMessages.length === 0 ? undefined : true"
    @input="changeEvent"
  ></wa-textarea>
  <wa-textarea
    v-else
    class="widget-bone widget-bone-raw widget-bone-raw-default"
    :class="[`widget-bone-raw-${name}`]"
    :disabled="boneState?.readonly"
    :value="value"
    :required="
      boneState.bonestructure.required && !boneState.bonestructure.multiple && !boneState.bonestructure.languages
    "
    :placeholder="state.placeholder"
    :data-user-invalid="boneState.errorMessages.length === 0 ? undefined : true"
    @input="changeEvent"
  ></wa-textarea>
</template>

<script setup>
import { reactive, onMounted, inject, computed } from "vue"
/**
 * Mehrzeiliges Freitext- oder JSON-Eingabefeld für Rohdaten.
 *
 * Rendert ein `<wa-textarea>`. Wenn `boneState.bonestructure.type === 'raw.json'`
 * wird der Wert beim Anzeigen per `JSON.stringify` serialisiert. Unterstützt
 * Mehrsprachigkeit (`languages`) und Mehrfachwerte (`multiple`).
 *
 * @displayName RawBone
 *
 * @cssClass widget-bone - Basis-Klasse aller Bone-Widgets
 * @cssClass widget-bone-raw - Kennzeichnet den Bone-Typ
 * @cssClass widget-bone-raw-default - Standard-Variante
 * @cssClass widget-bone-raw-{name} - Dynamisch gesetzt auf den Bone-Namen, z.B. `widget-bone-raw-content`
 */
defineOptions({
  inheritAttrs: false,
})
const props = defineProps({
  /** Bone-Name – wird in jedem `change`-Event als erstes Argument übergeben. */
  name: String,
  /** Aktueller Bone-Wert. Bei `raw.json` wird ein Objekt per `JSON.stringify` dargestellt. */
  value: [Object, String, Number, Boolean, Array],
  /** Index im Multiple-Array; `undefined` bei Einzelwert. */
  index: Number,
  /** Sprach-Key bei mehrsprachigen Bones, z.B. `"de"`. */
  lang: String,
  /** Bone-Struktur (aktuell nicht aktiv genutzt). */
  bone: Object,
  /** Setzt den Fokus nach dem Mount auf das Textarea-Element. */
  autofocus: Boolean,
})

const emit = defineEmits([
  /**
   * Wird bei jeder Wertänderung sowie beim Mount (Initialisierung) gefeuert.
   * @arg {string} name - Bone-Name
   * @arg {string} value - Aktueller Eingabewert
   * @arg {string|undefined} lang - Sprach-Key
   * @arg {number|undefined} index - Index im Multiple-Array
   */
  "change",
])

const boneState = inject("boneState")
const state = reactive({
  placeholder: computed(() => {
    if (boneState.label !== "placeholder") return undefined
    let name = boneState?.bonestructure?.descr
    if (boneState.bonestructure.required) {
      name += "*"
    }
    return name
  }),
})

function changeEvent(event) {
  emit("change", props.name, event.target.value, props.lang, props.index)
}

onMounted(() => {
  emit("change", props.name, props.value, props.lang, props.index) //init
})
</script>

<style scoped>
wa-input {
  width: 100%;

  &::part(base) {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }

  @media (max-width: 900px) {
    &::part(base) {
      border-top-right-radius: 0;
      border-bottom-left-radius: var(--sl-border-radius-medium);
    }
  }
}
</style>
