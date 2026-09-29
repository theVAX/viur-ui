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
 * Display widget for an entry's internal database key (type `key`).
 *
 * Renders an always-disabled `<wa-input>`, since the key cannot be edited
 * manually. The value is taken directly from the skel and serves
 * informational purposes only. Supports neither multiple nor multilang.
 *
 * @displayName KeyBone
 *
 * @cssClass bone-widget - Base class of all bone widgets
 * @cssClass bone-widget-key - Identifies the bone type
 * @cssClass bone-widget-key-default - Default variant
 * @cssClass bone-widget-key-{name} - Dynamically set to the bone name, e.g. `bone-widget-key-key`
 */
defineOptions({
  inheritAttrs: false,
})
const props = defineProps({
  /** Bone name – passed as the first argument in every `change` event. */
  name: String,
  /** Current key value (URL-safe Base64 string). */
  value: [Object, String, Number, Boolean, Array],
  /** Index in the multiple array; unused, since multiple is not supported. */
  index: Number,
  /** Language key; unused, since multilang is not supported. */
  lang: String,
  /** Readonly flag (not evaluated – the bone is always disabled). */
  readonly: Boolean,
  /** Additional bone parameters. */
  params: Object,
  /** Bone structure (currently not actively used). */
  bone: Object,
  /** Sets the focus (no effect, since the element is always disabled). */
  autofocus: Boolean,
})

const emit = defineEmits([
  /**
   * Fired on mount (initialization) and on change.
   * @arg {string} name - Bone name
   * @arg {string} value - Current key value
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
