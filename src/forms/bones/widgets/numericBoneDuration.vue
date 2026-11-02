<template>
  <DurationInput
    class="bone-widget bone-widget-numeric bone-widget-numeric-duration wa-visually-hidden-label"
    :class="[`bone-widget-numeric-${name}`]"
    :name="name"
    :label="boneState.bonestructure.descr"
    :model-value="state.minutes"
    :disabled="boneState.readonly"
    :required="
      boneState.bonestructure.required && !boneState.bonestructure.multiple && !boneState.bonestructure.languages
    "
    :placeholder="state.placeholder"
    :autofocus="autofocus"
    :min="state.min"
    :max="state.max"
    :hours-per-day="boneState.params?.hours_per_day"
    :days-per-week="boneState.params?.days_per_week"
    :largest-unit="boneState.params?.largest_unit"
    :presets="boneState.params?.presets"
    :data-user-invalid="boneState.errorMessages.length === 0 ? undefined : true"
    @update:model-value="(minutes) => report(minutes, true)"
    @invalid="report(props.value, false)"
  />
</template>

<script setup>
import { reactive, onMounted, computed, inject } from "vue"
import DurationInput from "../../../components/DurationInput/DurationInput.vue"
/**
 * Duration input for a numeric bone that stores whole minutes (bone type `numeric.duration`).
 *
 * Renders `DurationInput`: shorthand like `1d 2h 30m`, `2,5h`, `1:30` or plain minutes, a preview
 * of the normalised value and optional quick picks. Configured through the bone's `params`:
 * `hours_per_day` (default 24), `days_per_week` (default 7), `largest_unit`
 * (`"week"`, `"day"`, `"hour"`, `"minute"`) and `presets` (list of minutes). `min` / `max` of the
 * bone (or `minAmount` / `maxAmount` in viur-core's compatibility mode) are the allowed range in minutes.
 *
 * @displayName NumericBoneDuration
 *
 * @cssClass bone-widget - Base class of all bone widgets
 * @cssClass bone-widget-numeric - Identifies the bone type
 * @cssClass bone-widget-numeric-duration - Duration variant
 * @cssClass bone-widget-numeric-{name} - Dynamically set to the bone name, e.g. `bone-widget-numeric-estimate`
 */
defineOptions({
  inheritAttrs: false,
})
const props = defineProps({
  /** Bone name – passed as the first argument in every `change` event. */
  name: String,
  /** Current bone value in minutes. */
  value: [Object, String, Number, Boolean, Array],
  /** Index in the multiple array; `undefined` for a single value. */
  index: Number,
  /** Language key for multilingual bones, e.g. `"de"`. */
  lang: String,
  /** Bone structure (currently not actively used). */
  bone: Object,
  /** Focuses the input (passed to `wa-input`). */
  autofocus: Boolean,
})

const emit = defineEmits([
  /**
   * Fired on every usable or unusable input and on mount (initialization).
   * @arg {string} name - Bone name
   * @arg {string} value - Minutes as a string, `""` for no value
   * @arg {string|undefined} lang - Language key
   * @arg {number|undefined} index - Index in the multiple array
   * @arg {boolean} [valid] - Validation status; missing on the init event
   */
  "change",
])

const boneState = inject("boneState")
const state = reactive({
  minutes: computed(() => (props.value == null || props.value === "" ? null : Number(props.value))),
  // `min`/`max` is what viur-core sends; `minAmount`/`maxAmount` is its compatibility copy
  min: computed(() => limit(boneState.bonestructure.min ?? boneState.bonestructure.minAmount)),
  max: computed(() => limit(boneState.bonestructure.max ?? boneState.bonestructure.maxAmount)),
  placeholder: computed(() => {
    if (boneState.label !== "placeholder") return undefined
    let name = boneState?.bonestructure?.descr
    if (boneState.bonestructure.required) {
      name += "*"
    }
    return name
  }),
})

/** A finite limit, or `undefined` for none (viur-core sends its int64 limits for "no limit"). */
function limit(value) {
  return typeof value === "number" && Math.abs(value) < Number.MAX_SAFE_INTEGER ? value : undefined
}

function report(minutes, valid) {
  emit("change", props.name, minutes == null ? "" : String(minutes), props.lang, props.index, valid)
}

onMounted(() => {
  emit("change", props.name, props.value == null ? "" : String(props.value), props.lang, props.index) //init
})
</script>
