<template>
  <Wrapper_nested
    :value="value"
    :name="name"
    :index="index"
    :lang="lang"
    :bone="bone"
    :disabled="bone['readonly']"
    @change="changeEvent"
  ></Wrapper_nested>
</template>

<script setup>
import { reactive, onMounted, inject, computed, getCurrentInstance } from "vue"
import Wrapper_nested from "../BoneNestedWrapper.vue"
/**
 * Record-Widget für Bones vom Typ `record`.
 *
 * Delegiert die gesamte Darstellung an `Wrapper_nested`, der die Sub-Bones
 * aus `bone.using` rendert. Der Record-Wert ist ein Objekt dessen Schlüssel
 * den Sub-Bone-Namen entsprechen. Bei `multiple: true` ist der Wert ein Array
 * dieser Objekte.
 *
 * @displayName RecordBone
 */
defineOptions({
  inheritAttrs: false,
})

const emit = defineEmits([
  /**
   * Wird weitergeleitet wenn `Wrapper_nested` einen Wert ändert oder beim Mount (Initialisierung).
   * @arg {string} name - Bone-Name
   * @arg {object} value - Aktueller Record-Wert (Objekt mit Sub-Bone-Werten)
   * @arg {string|undefined} lang - Sprach-Key
   * @arg {number|undefined} index - Index im Multiple-Array
   */
  "change",
])
const props = defineProps({
  /** Bone-Name – wird in jedem `change`-Event als erstes Argument übergeben. */
  name: String,
  /** Aktueller Record-Wert; Objekt mit Sub-Bone-Werten oder Array davon bei `multiple`. */
  value: null,
  /** Index im Multiple-Array; `undefined` bei Einzelwert. */
  index: Number,
  /** Sprach-Key bei mehrsprachigen Bones, z.B. `"de"`. */
  lang: String,
  /** Bone-Struktur; `using` enthält die Sub-Bone-Definitionen. */
  bone: Object,
  /** Aktuell nicht genutzt. */
  autofocus: Boolean,
})

const state = reactive({})

function changeEvent(data) {
  emit("change", data["name"], data["value"], data["lang"], data["index"])
}

onMounted(() => {
  emit("change", props.name, props.value, props.lang, props.index) //init
})
</script>
