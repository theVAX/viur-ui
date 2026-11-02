<template>
  <div class="viur-duration-input">
    <wa-input
      ref="input"
      v-bind="$attrs"
      :value="text"
      :hint="hint"
      :disabled="disabled"
      autocomplete="off"
      @input="onInput"
      @change="onChange"
    ></wa-input>
    <div
      v-if="presets.length"
      class="viur-duration-input-presets"
      role="group"
      :aria-label="t('duration.presets')"
    >
      <wa-button
        v-for="minutes in presets"
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
 * Attributes that are not props (`label`, `placeholder`, `required`, `name`, `size`, ...) go to the
 * inner `wa-input`.
 *
 * @displayName DurationInput
 *
 * @cssClass viur-duration-input - Root element (input and quick picks)
 * @cssClass viur-duration-input-presets - Row of quick-pick buttons
 */
import { computed, ref, watch, watchEffect } from "vue"
import { useI18n } from "vue-i18n"
import { DURATION_UNITS, formatDuration, parseDuration, type DurationOptions, type DurationUnit } from "./duration.ts"

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** Duration in whole minutes; `null` for no value. */
    modelValue?: number | null
    /** Hours in one day (24 = calendar day; a working day is usually 8). */
    hoursPerDay?: number
    /** Days in one week (7 = calendar week; a working week is usually 5). */
    daysPerWeek?: number
    /** Largest unit that is accepted and shown, e.g. `"hour"` shows 2400 min as `40 h`. */
    largestUnit?: DurationUnit
    /** Quick-pick values in minutes, e.g. `[15, 60, 240]`. */
    presets?: number[]
    /** Smallest allowed value in minutes. */
    min?: number
    /** Largest allowed value in minutes. */
    max?: number
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
  /** A usable value (in range) was typed or picked; `null` when the text was cleared. */
  "update:modelValue": [minutes: number | null]
  /** The text is not a duration or out of range; the value stays as it was. */
  invalid: [message: string]
}>()

const { t, te } = useI18n()

const options = computed<DurationOptions>(() => ({
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
}))

function format(minutes: number | null): string {
  return formatDuration(minutes, options.value, (unit, count) => `${count} ${t(`duration.units.${unit}`)}`)
}

function formatLong(minutes: number): string {
  return formatDuration(minutes, options.value, (unit, count) => t(`duration.long.${unit}`, count))
}

const input = ref<HTMLElement & { setCustomValidity?: (message: string) => void }>()
const text = ref(format(props.modelValue))
// the error shows once the field was left (change), not on every half-typed keystroke ("1:3")
const committed = ref(false)

const value = computed(() => parseDuration(text.value, options.value))
const error = computed(() => {
  const minutes = value.value
  if (minutes === null) return ""
  if (Number.isNaN(minutes)) return t("duration.invalid")
  if (minutes < props.min) return t("duration.min", { value: format(props.min) })
  if (props.max !== undefined && minutes > props.max) return t("duration.max", { value: format(props.max) })
  return ""
})
const hint = computed(() => {
  if (error.value) return committed.value ? error.value : ""
  const normalised = format(value.value)
  return normalised === text.value.trim() ? "" : t("duration.preview", { value: normalised })
})

// form validity of the wa-input (blocks submit, :user-invalid styling); undefined outside the browser
watchEffect(() => input.value?.setCustomValidity?.(error.value))

watch(
  () => props.modelValue,
  (minutes) => {
    if (value.value !== minutes) text.value = format(minutes)
  }
)

function report() {
  if (error.value) emit("invalid", error.value)
  else emit("update:modelValue", value.value)
}

function onInput(event: Event) {
  text.value = (event.target as HTMLInputElement).value
  committed.value = false
  report()
}

function onChange() {
  committed.value = true
  if (!error.value) text.value = format(value.value)
}

function pick(minutes: number) {
  text.value = format(minutes)
  committed.value = true
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
