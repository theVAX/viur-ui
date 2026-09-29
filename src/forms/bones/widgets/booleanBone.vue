<template>
  <wa-switch
    class="bone-widget bone-widget-boolean bone-widget-boolean-default"
    :class="[`bone-widget-boolean-${name}`]"
    :disabled="boneState.readonly"
    :checked="state.value"
    :data-user-invalid="boneState.errorMessages.length === 0 ? undefined : true"
    @change="changeEvent"
  ></wa-switch>
</template>

<script setup>
import { reactive, onMounted, inject, computed } from "vue"
/**
 * Switch for boolean values (true/false).
 *
 * Available in three variants: `bool` (switch), `bool.choose` (yes/no buttons),
 * `bool.select` (dropdown). The values `null`, `undefined`, `false` and `""` are
 * uniformly treated as `false`.
 *
 * @displayName BooleanBone
 *
 * @cssClass bone-widget - Base class of all bone widgets
 * @cssClass bone-widget-boolean - Identifies the bone type
 * @cssClass bone-widget-boolean-default - Default variant
 * @cssClass bone-widget-boolean-{name} - Dynamically set to the bone name
 */
defineOptions({
  inheritAttrs: false,
})
const props = defineProps({
  /** Bone name – passed as the first argument in every `change` event. */
  name: String,
  /** Current bone value. `null`, `undefined`, `false` and `""` count as `false`. */
  value: [Object, String, Number, Boolean, Array],
  /** Index in the multiple array; `undefined` for a single value. */
  index: Number,
  /** Language key for multilingual bones, e.g. `"de"`. */
  lang: String,
  /** Bone structure (currently not actively used). */
  bone: Object,
  /** Autofocus (currently not actively used). */
  autofocus: Boolean,
})

const emit = defineEmits([
  /**
   * Fired on every value change and on mount (initialization).
   * @arg {string} name - Bone name
   * @arg {boolean} value - Current value
   * @arg {string|undefined} lang - Language key
   * @arg {number|undefined} index - Index in the multiple array
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

<style scoped>
wa-switch {
  padding: calc(var(--wa-form-control-height) / 2 - var(--wa-form-control-toggle-size) / 2 - 1px);
  border: 1px solid var(--wa-color-border-quiet);
  border-radius: var(--wa-border-radius-m);
  background-color: var(--wa-color-neutral-on-loud);
}
</style>
