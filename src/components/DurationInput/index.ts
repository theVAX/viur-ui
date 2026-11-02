// Public surface of the duration input.
export { default as DurationInput } from "./DurationInput.vue"
export {
  DURATION_UNITS,
  ENGLISH_ALIASES,
  formatDuration,
  parseDuration,
  splitDuration,
  unitMinutes,
  type DurationOptions,
  type DurationUnit,
} from "./duration.ts"
