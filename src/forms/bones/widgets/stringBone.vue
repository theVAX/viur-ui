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
import Utils from "../utils.js"
/**
 * Single-line text field for simple strings.
 *
 * Renders a `<wa-input>` and delegates validation to the native
 * Constraint Validation API. Supports optional regex validation
 * via `boneState.params.pattern` as well as a custom error message via
 * `boneState.params.pattern_error`. With `boneState.label === "placeholder"`,
 * the bone name is shown as a placeholder instead of as a label above.
 *
 * @displayName StringBone
 *
 * @cssClass bone-widget - Base class of all bone widgets
 * @cssClass bone-widget-string - Identifies the bone type
 * @cssClass bone-widget-string-default - Default variant
 * @cssClass bone-widget-string-{name} - Dynamically set to the bone name, e.g. `bone-widget-string-title`
 */
defineOptions({
  inheritAttrs: false,
})
const props = defineProps({
  /** Bone name – passed as the first argument in every `change` event. */
  name: String,
  /** Current bone value. */
  value: [Object, String, Number, Boolean, Array],
  /** Index in the multiple array; `undefined` for a single value. */
  index: Number,
  /** Language key for multilingual bones, e.g. `"de"`. */
  lang: String,
  /** Bone structure (currently not actively used). */
  bone: Object,
  /** Focuses the input element after 600 ms. */
  autofocus: Boolean,
})

const emit = defineEmits([
  /**
   * Fired on every value change and on mount (initialization).
   * @arg {string} name - Bone name
   * @arg {string} value - Current input value
   * @arg {string|undefined} lang - Language key
   * @arg {number|undefined} index - Index in the multiple array
   * @arg {boolean} [valid] - Validation status; missing on the init event
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
 * Handles `change` and `keyup` events of the `<wa-input>`.
 * Checks the native validity, sets a custom error message on
 * `patternMismatch` and emits the `change` event with the validation status.
 *
 * @param {Event} event - The DOM event from the input element
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
