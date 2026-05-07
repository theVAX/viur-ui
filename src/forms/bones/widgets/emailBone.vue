<template>
  <wa-input
    ref="emailBone"
    class="bone-widget bone-widget-email bone-widget-email-default"
    :class="[`bone-widget-email-${name}`]"
    :name="name"
    :disabled="boneState.readonly"
    type="email"
    :value="value"
    :required="
      boneState.bonestructure.required && !boneState.bonestructure.multiple && !boneState.bonestructure.languages
    "
    :placeholder="state.placeholder"
    :data-user-invalid="boneState.errorMessages.length === 0 ? undefined : true"
    @change="changeEvent"
    @keyup="changeEvent"
  ></wa-input>
</template>

<script setup>
import { reactive, onMounted, inject, ref, watchEffect, computed } from "vue"
import { useTimeoutFn } from "@vueuse/core"
/**
 * Einzeiliges E-Mail-Eingabefeld mit nativer Browser-Validierung.
 *
 * Rendert ein `<wa-input type="email">` und nutzt die native Constraint
 * Validation API des Browsers zur Format-Prüfung. Bei
 * `boneState.label === "placeholder"` wird die Bone-Beschreibung als
 * Placeholder angezeigt statt als Label darüber.
 *
 * @displayName EmailBone
 *
 * @cssClass bone-widget - Basis-Klasse aller Bone-Widgets
 * @cssClass bone-widget-email - Kennzeichnet den Bone-Typ
 * @cssClass bone-widget-email-default - Standard-Variante
 * @cssClass bone-widget-email-{name} - Dynamisch gesetzt auf den Bone-Namen, z.B. `bone-widget-email-email`
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

const emailBone = ref(null)

function changeEvent(event) {
  emit("change", props.name, event.target.value, props.lang, props.index)
}

watchEffect(() => {
  if (props.autofocus) {
    if (emailBone.value && emailBone.value !== null && emailBone.value !== null) {
      const { start } = useTimeoutFn(() => {
        emailBone.value.focus()
      }, 600)

      start()
    }
  }
})

onMounted(() => {
  emit("change", props.name, props.value, props.lang, props.index) //init
})
</script>
<!--
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
-->
