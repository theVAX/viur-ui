<template>
  <div class="wa-flank wa-align-item-center">
    <wa-color-picker
      class="bone-widget bone-widget-color bone-widget-color-default"
      :class="[`bone-widget-color-${name}`]"
      :disabled="boneState.readonly"
      :value="value"
      :required="
        boneState.bonestructure.required && !boneState.bonestructure.multiple && !boneState.bonestructure.languages
      "
      :data-user-invalid="boneState.errorMessages.length === 0 ? undefined : true"
      @change="changeEvent"
    ></wa-color-picker>
    <span>{{ value || "-" }}</span>
    <wa-copy-button :disabled="!value" :value="value"></wa-copy-button>
  </div>
</template>

<script setup>
import { reactive, onMounted, inject } from "vue"
/**
 * Farbauswahl-Feld über ein natives `<wa-color-picker>`-Element.
 *
 * Speichert den gewählten Farbwert als Hex-String, z.B. `"#e74c3c"`.
 * Unterstützt mehrfache Werte (`multiple`), aber keine Mehrsprachigkeit.
 *
 * @displayName ColorBone
 *
 * @cssClass bone-widget - Basis-Klasse aller Bone-Widgets
 * @cssClass bone-widget-color - Kennzeichnet den Bone-Typ
 * @cssClass bone-widget-color-default - Standard-Variante
 * @cssClass bone-widget-color-{name} - Dynamisch gesetzt auf den Bone-Namen, z.B. `bone-widget-color-color`
 */
defineOptions({
  inheritAttrs: false,
})
const props = defineProps({
  /** Bone-Name – wird in jedem `change`-Event als erstes Argument übergeben. */
  name: String,
  /** Aktueller Bone-Wert als Hex-String, z.B. `"#e74c3c"`, oder `null`. */
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
   * @arg {string|null} value - Gewählter Farbwert als Hex-String oder `null`
   * @arg {string|undefined} lang - Sprach-Key
   * @arg {number|undefined} index - Index im Multiple-Array
   */
  "change",
])
const boneState = inject("boneState")
const state = reactive({})

function changeEvent(event) {
  emit("change", props.name, event.target.value, props.lang, props.index)
}

onMounted(() => {
  emit("change", props.name, props.value, props.lang, props.index) //init
})
</script>
<!--
<style scoped>
wa-color-picker {
  &::part(trigger) {
    border-radius: 0;
  }
}
</style>
-->
