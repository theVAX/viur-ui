<template>
  <wa-textarea
    v-if="boneState.bonestructure.type === 'raw.json'"
    class="bone-widget bone-widget-raw bone-widget-raw-default"
    :class="[`bone-widget-raw-${name}`]"
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
    class="bone-widget bone-widget-raw bone-widget-raw-default"
    :class="[`bone-widget-raw-${name}`]"
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
 * Multi-line free-text or JSON input field for raw data.
 *
 * Renders a `<wa-textarea>`. If `boneState.bonestructure.type === 'raw.json'`,
 * the value is serialized via `JSON.stringify` for display. Supports
 * multiple languages (`languages`) and multiple values (`multiple`).
 *
 * @displayName RawBone
 *
 * @cssClass bone-widget - Base class of all bone widgets
 * @cssClass bone-widget-raw - Identifies the bone type
 * @cssClass bone-widget-raw-default - Default variant
 * @cssClass bone-widget-raw-{name} - Dynamically set to the bone name, e.g. `bone-widget-raw-content`
 */
defineOptions({
  inheritAttrs: false,
})
const props = defineProps({
  /** Bone name – passed as the first argument in every `change` event. */
  name: String,
  /** Current bone value. With `raw.json`, an object is displayed via `JSON.stringify`. */
  value: [Object, String, Number, Boolean, Array],
  /** Index in the multiple array; `undefined` for a single value. */
  index: Number,
  /** Language key for multilingual bones, e.g. `"de"`. */
  lang: String,
  /** Bone structure (currently not actively used). */
  bone: Object,
  /** Focuses the textarea element after mount. */
  autofocus: Boolean,
})

const emit = defineEmits([
  /**
   * Fired on every value change and on mount (initialization).
   * @arg {string} name - Bone name
   * @arg {string} value - Current input value
   * @arg {string|undefined} lang - Language key
   * @arg {number|undefined} index - Index in the multiple array
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
