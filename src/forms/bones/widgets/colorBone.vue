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
    <wa-copy-button
      :disabled="!value"
      :value="value"
    ></wa-copy-button>
  </div>
</template>

<script setup>
import { reactive, onMounted, inject } from "vue"
/**
 * Color picker field using a native `<wa-color-picker>` element.
 *
 * Stores the selected color value as a hex string, e.g. `"#e74c3c"`.
 * Supports multiple values (`multiple`), but not multiple languages.
 *
 * @displayName ColorBone
 *
 * @cssClass bone-widget - Base class of all bone widgets
 * @cssClass bone-widget-color - Identifies the bone type
 * @cssClass bone-widget-color-default - Default variant
 * @cssClass bone-widget-color-{name} - Dynamically set to the bone name, e.g. `bone-widget-color-color`
 */
defineOptions({
  inheritAttrs: false,
})
const props = defineProps({
  /** Bone name – passed as the first argument in every `change` event. */
  name: String,
  /** Current bone value as a hex string, e.g. `"#e74c3c"`, or `null`. */
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
   * @arg {string|null} value - Selected color value as a hex string or `null`
   * @arg {string|undefined} lang - Language key
   * @arg {number|undefined} index - Index in the multiple array
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
