<template>
  <wa-switch
    class="widget-bone widget-bone-boolean widget-bone-boolean-default"
    :class="[`widget-bone-boolean-${name}`]"
    :disabled="boneState.readonly"
    :checked="state.value"
    :data-user-invalid="boneState.errorMessages.length === 0 ? undefined : true"
    @change="changeEvent"
  ></wa-switch>
</template>

<script setup>
import { reactive, onMounted, inject, computed } from "vue"
/**
 * Schalter für boolesche Werte (true/false).
 *
 * Verfügbar in drei Varianten: `bool` (Switch), `bool.choose` (Ja/Nein-Buttons),
 * `bool.select` (Dropdown). Der Wert `null`, `undefined`, `false` und `""` wird
 * einheitlich als `false` behandelt.
 *
 * @displayName BooleanBone
 *
 * @cssClass widget-bone - Basis-Klasse aller Bone-Widgets
 * @cssClass widget-bone-boolean - Kennzeichnet den Bone-Typ
 * @cssClass widget-bone-boolean-default - Standard-Variante
 * @cssClass widget-bone-boolean-{name} - Dynamisch gesetzt auf den Bone-Namen
 */
defineOptions({
  inheritAttrs: false,
})
const props = defineProps({
  /** Bone-Name – wird in jedem `change`-Event als erstes Argument übergeben. */
  name: String,
  /** Aktueller Bone-Wert. `null`, `undefined`, `false` und `""` gelten als `false`. */
  value: [Object, String, Number, Boolean, Array],
  /** Index im Multiple-Array; `undefined` bei Einzelwert. */
  index: Number,
  /** Sprach-Key bei mehrsprachigen Bones, z.B. `"de"`. */
  lang: String,
  /** Bone-Struktur (aktuell nicht aktiv genutzt). */
  bone: Object,
  /** Autofocus (aktuell nicht aktiv genutzt). */
  autofocus: Boolean,
})

const emit = defineEmits([
  /**
   * Wird bei jeder Wertänderung sowie beim Mount (Initialisierung) gefeuert.
   * @arg {string} name - Bone-Name
   * @arg {boolean} value - Aktueller Wert
   * @arg {string|undefined} lang - Sprach-Key
   * @arg {number|undefined} index - Index im Multiple-Array
   */
  "change",
])
const boneState = inject("boneState")
const state = reactive({
  value: computed(() => {
    return ![false, null, undefined, ""].includes(props.value)
  }),
})

function changeEvent(event) {
  emit("change", props.name, event.target.checked, props.lang, props.index)
}

onMounted(() => {
  let val = props.value
  if (!val) {
    val = false
  }
  emit("change", props.name, val, props.lang, props.index) //init
})
</script>

<style scoped></style>
