<template>
  <div class="viur-duration-input">
    <wa-input
      ref="input"
      v-bind="$attrs"
      :value="text"
      :hint="hint"
      :disabled="disabled"
      :required="required"
      autocomplete="off"
      @input="onInput"
      @change="onChange"
      @blur="dirty = false"
    ></wa-input>
    <div
      v-if="shownPresets.length"
      class="viur-duration-input-presets"
      role="group"
      :aria-label="t('duration.presets')"
    >
      <wa-button
        v-for="minutes in shownPresets"
        :key="minutes"
        size="small"
        appearance="outlined"
        :disabled="disabled"
        @click="pick(minutes)"
      >
        <!-- wa-button does not pass aria-label on to its inner button, so the spoken name is hidden text -->
        <span aria-hidden="true">{{ format(minutes) }}</span>
        <span class="wa-visually-hidden">{{ formatLong(minutes) }}</span>
      </wa-button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Input for a duration in whole minutes, typed as shorthand: `1d 2h 30m`, `2,5h`, `90m`, `1:30`
 * (h:mm) or a bare number (minutes). Unit names come from the translations (`duration.*`), English
 * names are always understood. Shows the normalised value as hint while typing and normalises the
 * text when the field is left. Optional quick-pick buttons set a value directly.
 *
 * While the user edits (typed, not yet left), a new `modelValue` from outside does not replace the
 * text; leaving the field reports the typed value again, so the last edit wins. A change of the
 * options or the locale shows the model value anew and drops such a draft, because the draft would
 * now mean something else.
 *
 * Attributes that are not props (`label`, `placeholder`, `name`, `size`, `class`, ...) go to the
 * inner `wa-input`. Next to an own visible label, pass the label text as `label` together with
 * `class="wa-visually-hidden-label"`: the field keeps its accessible name, also under
 * `webawesomeCompat.css`.
 *
 * @displayName DurationInput
 *
 * @cssClass viur-duration-input - Root element (input and quick picks)
 * @cssClass viur-duration-input-presets - Row of quick-pick buttons
 */
import { computed, ref, watch, watchEffect } from "vue"
import { useI18n } from "vue-i18n"
import {
  DURATION_UNITS,
  formatDuration,
  isDurationValue,
  parseDuration,
  unitMinutes,
  type DurationOptions,
  type DurationUnit,
} from "./duration.ts"

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** Duration in whole minutes; `null` for no value. */
    modelValue?: number | null
    /** Hours in one day (24 = calendar day; a working day is usually 8). At least 1, whole minutes. */
    hoursPerDay?: number
    /** Days in one week (7 = calendar week; a working week is usually 5). At least 1, whole minutes. */
    daysPerWeek?: number
    /** Largest unit that is accepted and shown, e.g. `"hour"` shows 2400 min as `40 h`. */
    largestUnit?: DurationUnit
    /** Quick-pick values in whole minutes, e.g. `[15, 60, 240]`; other entries are not shown. */
    presets?: number[]
    /** Smallest allowed value in minutes (a fraction allows the next whole minute). */
    min?: number
    /** Largest allowed value in minutes (`Infinity` / `undefined`: no limit). */
    max?: number
    /** An empty field is invalid. */
    required?: boolean
    /** Disables the input and the quick picks. */
    disabled?: boolean
  }>(),
  {
    modelValue: null,
    hoursPerDay: 24,
    daysPerWeek: 7,
    largestUnit: "week",
    presets: () => [],
    min: 0,
    max: undefined,
  }
)

const emit = defineEmits<{
  /** A usable value (in range) was typed or picked; `null` when an optional field was cleared. */
  "update:modelValue": [minutes: number | null]
  /** The text is not a duration, out of range or empty while required; the value stays as it was. */
  invalid: [message: string]
}>()

const { t, te, locale } = useI18n()

const options = computed<DurationOptions>(() => {
  const options: DurationOptions = {
    hoursPerDay: props.hoursPerDay,
    daysPerWeek: props.daysPerWeek,
    largestUnit: props.largestUnit,
    aliases: Object.fromEntries(
      DURATION_UNITS.filter((unit) => te(`duration.aliases.${unit}`)).map((unit) => [
        unit,
        t(`duration.aliases.${unit}`)
          .split(",")
          .map((alias) => alias.trim().toLowerCase())
          .filter(Boolean),
      ])
    ),
  }
  unitMinutes(options) // throws RangeError for a day or week that cannot hold whole minutes
  return options
})

function format(minutes: number | null): string {
  return formatDuration(minutes, options.value, (unit, count) => `${count} ${t(`duration.units.${unit}`)}`)
}

function formatLong(minutes: number): string {
  return formatDuration(minutes, options.value, (unit, count) => t(`duration.long.${unit}`, count))
}

/** Text for a model value; one that is no duration (-1, 1.5, NaN) shows as is and so as an error. */
function display(minutes: number | null): string {
  return isDurationValue(minutes) ? format(minutes) : minutes == null ? "" : String(minutes)
}

const shownPresets = computed(() => props.presets.filter(isDurationValue))
// a fractional limit allows the whole minutes inside it; an infinite one is no limit
const lowest = computed(() => Math.max(0, Number.isFinite(props.min) ? Math.ceil(props.min) : 0))
const highest = computed(() => (Number.isFinite(props.max) ? Math.floor(props.max as number) : undefined))

const input = ref<HTMLElement & { setCustomValidity?: (message: string) => void }>()
const text = ref(display(props.modelValue))
// the error shows once the field was left (change), not on every half-typed keystroke ("1:3")
const committed = ref(false)
// typed since the field was last left or set: a draft that an outside update must not replace
const dirty = ref(false)

const value = computed(() => parseDuration(text.value, options.value))
const error = computed(() => {
  const minutes = value.value
  if (minutes === null) return props.required ? t("duration.required") : ""
  if (Number.isNaN(minutes)) return t("duration.invalid")
  if (minutes < lowest.value) return t("duration.min", { value: format(lowest.value) })
  if (highest.value !== undefined && minutes > highest.value) {
    return t("duration.max", { value: format(highest.value) })
  }
  return ""
})
const hint = computed(() => {
  if (error.value) return committed.value ? error.value : ""
  const normalised = display(value.value)
  return normalised === text.value.trim() ? "" : t("duration.preview", { value: normalised })
})

// form validity of the wa-input (blocks submit, :user-invalid styling); undefined outside the browser
watchEffect(() => input.value?.setCustomValidity?.(error.value))

watch(
  () => props.modelValue,
  (minutes) => {
    if (!dirty.value && value.value !== minutes) text.value = display(minutes)
  }
)
watch([options, locale], () => {
  text.value = display(props.modelValue)
  dirty.value = false
})

function report() {
  if (error.value) emit("invalid", error.value)
  else emit("update:modelValue", value.value)
}

function onInput(event: Event) {
  text.value = (event.target as HTMLInputElement).value
  committed.value = false
  dirty.value = true
  report()
}

function onChange() {
  const edited = dirty.value
  committed.value = true
  dirty.value = false
  if (error.value) return
  text.value = display(value.value)
  // an outside update during the edit was not shown; the value the user sees and left wins
  if (edited && value.value !== props.modelValue) emit("update:modelValue", value.value)
}

function pick(minutes: number) {
  text.value = format(minutes)
  committed.value = true
  dirty.value = false
  report()
}
</script>

<style scoped>
.viur-duration-input-presets {
  display: flex;
  flex-wrap: wrap;
  gap: var(--wa-space-2xs);
  margin-top: var(--wa-space-2xs);
}
</style>

<style>
/* webawesomeCompat.css hides every wa-input label with display: none, which also drops the field's
   accessible name in Chromium. With Web Awesome's class `wa-visually-hidden-label` the label stays
   in the accessibility tree and is only hidden visually (the utility does the hiding). */
.viur-duration-input wa-input.wa-visually-hidden-label::part(form-control-label) {
  display: block;
}
</style>
