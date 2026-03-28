<template>
  <wa-input
    ref="numericBone"
    class="widget-bone widget-bone-numeric widget-bone-numeric-default"
    :class="[`widget-bone-numeric-${name}`]"
    type="number"
    :disabled="boneState.readonly"
    :value="value"
    :min="state.minAmount"
    :max="state.maxAmount"
    :step="state.precision"
    :required="
      boneState.bonestructure.required && !boneState.bonestructure.multiple && !boneState.bonestructure.languages
    "
    :placeholder="state.placeholder"
    :data-data-invalid="boneState.errorMessages.length === 0 ? undefined : true"
    @change="changeEvent"
    @keyup="changeEvent"
  ></wa-input>
  <ul class="info">
    <li v-if="state.minAmount !== -9223372036854776000 && state.minAmount">
      {{ $t("bones.numeric.min", { val: state.minAmount }) }}
    </li>
    <li v-if="state.maxAmount !== 9223372036854776000 && state.maxAmount">
      {{ $t("bones.numeric.max", { val: state.maxAmount }) }}
    </li>
    <li v-if="state.precision">{{ $t("bones.numeric.precision", { val: boneState.bonestructure["precision"] }) }}</li>
  </ul>
</template>

<script setup>
import { reactive, onMounted, computed, inject, ref, watchEffect } from "vue"
import { useTimeoutFn } from "@vueuse/core"
/**
 * Numerisches Eingabefeld für Ganzzahlen und Dezimalwerte.
 *
 * Rendert ein `<wa-input type="number">` und zeigt optional Hinweise zu
 * Mindest-/Höchstwert und Präzision an. Unterstützt Mehrsprachigkeit
 * (`languages`) und mehrfache Werte (`multiple`). Der Schritt (`step`) wird
 * aus `boneState.bonestructure.precision` berechnet.
 *
 * @displayName NumericBone
 *
 * @cssClass widget-bone - Basis-Klasse aller Bone-Widgets
 * @cssClass widget-bone-numeric - Kennzeichnet den Bone-Typ
 * @cssClass widget-bone-numeric-default - Standard-Variante
 * @cssClass widget-bone-numeric-{name} - Dynamisch gesetzt auf den Bone-Namen, z.B. `widget-bone-numeric-amount`
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
   * @arg {string} value - Aktueller Eingabewert (als String)
   * @arg {string|undefined} lang - Sprach-Key
   * @arg {number|undefined} index - Index im Multiple-Array
   * @arg {boolean} [valid] - Validierungsstatus; fehlt beim Init-Event
   */
  "change",
])

const boneState = inject("boneState")
const state = reactive({
  minAmount: computed(() => {
    return boneState.bonestructure["minAmount"]
  }),
  maxAmount: computed(() => {
    return boneState.bonestructure["maxAmount"]
  }),
  precision: computed(() => {
    if (boneState.bonestructure["precision"] > 0) {
      return parseFloat(`0.${"0".repeat(boneState.bonestructure["precision"] - 1)}1`)
    }
    return undefined
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

const numericBone = ref(null)

function changeEvent(event) {
  let valid = numericBone.value.reportValidity()
  emit("change", props.name, event.target.value, props.lang, props.index, valid)
}

watchEffect(() => {
  if (props.autofocus) {
    if (numericBone.value && numericBone.value !== null && numericBone.value !== null) {
      const { start } = useTimeoutFn(() => {
        numericBone.value.focus()
      }, 600)

      start()
    }
  }
})

onMounted(() => {
  emit("change", props.name, "" + props.value, props.lang, props.index) //init
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

.info {
  display: flex;
  gap: 2px 7px;
  margin-top: var(--sl-spacing-x-small);
  font-size: 0.7em;
  font-weight: bold;
}
</style>
