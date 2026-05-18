<template>
  <wa-input
    class="bone-widget bone-widget-key bone-widget-key-default"
    :class="[`bone-widget-key-${name}`]"
    disabled
    :value="value"
    :data-data-invalid="boneState.errorMessages.length === 0 ? undefined : true"
    @change="changeEvent"
  ></wa-input>
</template>

<script setup>
import { reactive, onMounted, inject } from "vue"
/**
 * Anzeige-Widget für den internen Datenbankschlüssel eines Eintrags (Typ `key`).
 *
 * Rendert ein immer deaktiviertes `<wa-input>`, da der Schlüssel nicht manuell
 * editiert werden kann. Der Wert wird direkt aus dem Skel übernommen und dient
 * ausschließlich zur Information. Unterstützt kein multiple und kein multilang.
 *
 * @displayName KeyBone
 *
 * @cssClass bone-widget - Basis-Klasse aller Bone-Widgets
 * @cssClass bone-widget-key - Kennzeichnet den Bone-Typ
 * @cssClass bone-widget-key-default - Standard-Variante
 * @cssClass bone-widget-key-{name} - Dynamisch gesetzt auf den Bone-Namen, z.B. `bone-widget-key-key`
 */
defineOptions({
  inheritAttrs: false,
})
const props = defineProps({
  /** Bone-Name – wird in jedem `change`-Event als erstes Argument übergeben. */
  name: String,
  /** Aktueller Schlüsselwert (URL-safe Base64-String). */
  value: [Object, String, Number, Boolean, Array],
  /** Index im Multiple-Array; nicht genutzt, da multiple nicht unterstützt wird. */
  index: Number,
  /** Sprach-Key; nicht genutzt, da multilang nicht unterstützt wird. */
  lang: String,
  /** Readonly-Flag (wird nicht ausgewertet – der Bone ist immer disabled). */
  readonly: Boolean,
  /** Zusätzliche Bone-Parameter. */
  params: Object,
  /** Bone-Struktur (aktuell nicht aktiv genutzt). */
  bone: Object,
  /** Setzt den Fokus (ohne Effekt, da das Element immer disabled ist). */
  autofocus: Boolean,
})

const emit = defineEmits([
  /**
   * Wird beim Mount (Initialisierung) und bei change gefeuert.
   * @arg {string} name - Bone-Name
   * @arg {string} value - Aktueller Schlüsselwert
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
