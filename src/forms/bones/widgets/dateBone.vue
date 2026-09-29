<template>
  <wa-input
    class="bone-widget bone-widget-date bone-widget-date-default"
    :class="[`bone-widget-date-${name}`]"
    :disabled="boneState.readonly"
    :type="state.typeString"
    :name="name"
    :value="state.value"
    :required="
      boneState.bonestructure.required && !boneState.bonestructure.multiple && !boneState.bonestructure.languages
    "
    :placeholder="state.placeholder"
    :data-user-invalid="boneState.errorMessages.length === 0 ? undefined : true"
    step="1"
    @change="changeEvent"
  ></wa-input>
</template>

<script setup>
import { reactive, onMounted, computed, inject } from "vue"
/**
 * Date and/or time field, controlled by `bonestructure.date` and `bonestructure.time`.
 *
 * Renders a `<wa-input>` with the matching `type` attribute:
 * - `date` if only `date: true`
 * - `time` if only `time: true`
 * - `datetime-local` if both are set
 *
 * Strips timezone data from the value before it is passed to the input.
 * Supports multiple values (`multiple`), but not multiple languages.
 *
 * @displayName DateBone
 *
 * @cssClass bone-widget - Base class of all bone widgets
 * @cssClass bone-widget-date - Identifies the bone type
 * @cssClass bone-widget-date-default - Default variant
 * @cssClass bone-widget-date-{name} - Dynamically set to the bone name, e.g. `bone-widget-date-publishedAt`
 */
defineOptions({
  inheritAttrs: false,
})
const props = defineProps({
  /** Bone name – passed as the first argument in every `change` event. */
  name: String,
  /** Current bone value as an ISO string, e.g. `"2026-03-28"` or `"10:30:00"`. */
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
   * @arg {string} value - Current input value as an ISO string
   * @arg {string|undefined} lang - Language key
   * @arg {number|undefined} index - Index in the multiple array
   */
  "change",
])

const boneState = inject("boneState")
const state = reactive({
  value: computed(() => {
    // remove timezone data if timed

    let boneValue = props.value
    if (props.value && boneState.bonestructure["time"] && boneState.bonestructure["date"]) {
      boneValue = props.value?.split("+")[0]
    } else if (props.value && boneState.bonestructure["time"] && props.value.includes("T")) {
      boneValue = props.value?.split("+")[0]?.split("T")[1]
    } else if (props.value && props.value.includes("T")) {
      //convert to readable value
      boneValue = new Date(props.value).toISOString().substr(0, 10)
    }

    return boneValue
  }),
  typeString: computed(() => {
    // Calculate the correct datetype String
    let typeString = "datetime-local"
    if (!boneState.bonestructure["time"]) {
      typeString = "date"
    }

    if (!boneState.bonestructure["date"]) {
      typeString = "time"
    }
    return typeString
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

function changeEvent(event) {
  emit("change", props.name, event.target.value, props.lang, props.index)
}

onMounted(() => {
  emit("change", props.name, state.value, props.lang, props.index) //init
})
</script>
