<template>
  <DurationInput
    class="bone-widget bone-widget-numeric bone-widget-numeric-duration"
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
 * bone are the allowed range in minutes.
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
  // viur-core sends its int64 limits for "no limit"
  min: computed(() => Math.max(0, boneState.bonestructure.min ?? 0)),
  max: computed(() => (Number.isSafeInteger(boneState.bonestructure.max) ? boneState.bonestructure.max : undefined)),
  placeholder: computed(() => {
    if (boneState.label !== "placeholder") return undefined
    let name = boneState?.bonestructure?.descr
    if (boneState.bonestructure.required) {
      name += "*"
    }
    return name
  }),
})

function report(minutes, valid) {
  emit("change", props.name, minutes == null ? "" : String(minutes), props.lang, props.index, valid)
}

onMounted(() => {
  emit("change", props.name, props.value == null ? "" : String(props.value), props.lang, props.index) //init
})
</script>
