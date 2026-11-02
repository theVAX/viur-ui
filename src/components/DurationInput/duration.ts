// Duration shorthand ("1d 2h 30m", "2,5h", "1:30", "90") <-> whole minutes.

export type DurationUnit = "week" | "day" | "hour" | "minute"

export const DURATION_UNITS: DurationUnit[] = ["week", "day", "hour", "minute"]

export interface DurationOptions {
  /** Hours in one day (default 24; a working day is usually 8). At least 1, a whole number of minutes. */
  hoursPerDay?: number
  /** Days in one week (default 7; a working week is usually 5). At least 1, a whole number of minutes. */
  daysPerWeek?: number
  /** Largest unit that is accepted and shown (default "week"). */
  largestUnit?: DurationUnit
  /** Lower-case unit names accepted by the parser, without trailing dot (default: English). */
  aliases?: Partial<Record<DurationUnit, string[]>>
}

export const ENGLISH_ALIASES: Record<DurationUnit, string[]> = {
  week: ["w", "wk", "wks", "week", "weeks"],
  day: ["d", "day", "days"],
  hour: ["h", "hr", "hrs", "hour", "hours"],
  minute: ["m", "min", "mins", "minute", "minutes"],
}

const SHORT: Record<DurationUnit, string> = { week: "w", day: "d", hour: "h", minute: "min" }

/**
 * Minutes per unit for the given options.
 * @throws RangeError unless a day is at least an hour and a week at least a day, both in whole minutes
 *   (otherwise splitting into units would lose minutes or a unit would be worth nothing)
 */
export function unitMinutes(options: DurationOptions = {}): Record<DurationUnit, number> {
  const hoursPerDay = options.hoursPerDay ?? 24
  const daysPerWeek = options.daysPerWeek ?? 7
  const day = hoursPerDay * 60
  const week = day * daysPerWeek
  if (!(hoursPerDay >= 1 && Number.isSafeInteger(day))) {
    throw new RangeError(`hoursPerDay must be >= 1 and a whole number of minutes, got ${hoursPerDay}`)
  }
  if (!(daysPerWeek >= 1 && Number.isSafeInteger(week))) {
    throw new RangeError(`daysPerWeek must be >= 1 and a whole number of minutes, got ${daysPerWeek}`)
  }
  return { week, day, hour: 60, minute: 1 }
}

/** Whether `minutes` can be shown as a duration: a whole, non-negative, safe number. */
export function isDurationValue(minutes: unknown): minutes is number {
  return Number.isSafeInteger(minutes) && (minutes as number) >= 0
}

function allowedUnits(options: DurationOptions): DurationUnit[] {
  const largest = options.largestUnit ?? "week"
  if (!DURATION_UNITS.includes(largest)) throw new RangeError(`unknown largestUnit: ${largest}`)
  return DURATION_UNITS.slice(DURATION_UNITS.indexOf(largest))
}

/**
 * Checks the unit options (`hoursPerDay`, `daysPerWeek`, `largestUnit`) the way parser and formatter use them.
 * @throws RangeError with the reason
 */
export function checkDurationOptions(options: DurationOptions = {}): void {
  unitMinutes(options)
  allowedUnits(options)
}

const NUMBER = String.raw`\d+(?:[.,]\d+)?`
const TOKEN = new RegExp(String.raw`(${NUMBER})\s*([\p{L}]+)\.?\s*`, "uy")

/**
 * Parses a duration typed by a user.
 * @returns whole minutes (rounded), `null` for an empty text, `NaN` for a text that is not a duration
 */
export function parseDuration(text: string | null | undefined, options: DurationOptions = {}): number | null {
  const input = (text ?? "").trim().toLowerCase()
  if (input === "") return null

  // bare number: minutes
  if (new RegExp(`^${NUMBER}$`).test(input)) return whole(Number(input.replace(",", ".")))

  const clock = /^(\d+):([0-5]\d)$/.exec(input)
  if (clock) return whole(Number(clock[1]) * 60 + Number(clock[2]))

  const units = allowedUnits(options)
  const size = unitMinutes(options)
  const byAlias = new Map<string, DurationUnit>()
  for (const unit of units) {
    for (const alias of [...ENGLISH_ALIASES[unit], ...(options.aliases?.[unit] ?? [])]) byAlias.set(alias, unit)
  }

  let total = 0
  TOKEN.lastIndex = 0
  while (TOKEN.lastIndex < input.length) {
    const match = TOKEN.exec(input)
    const unit = match && byAlias.get(match[2])
    if (!match || !unit) return NaN
    total += Number(match[1].replace(",", ".")) * size[unit]
  }
  return whole(total)
}

/** Rounds to whole minutes; absurdly long input ("1" x 400) is not a duration. */
function whole(minutes: number): number {
  return Number.isSafeInteger(Math.round(minutes)) ? Math.round(minutes) : NaN
}

/**
 * Splits minutes into the largest allowed units, e.g. 90 -> [["hour", 1], ["minute", 30]].
 * `0` gives [["minute", 0]].
 * @throws RangeError for anything but a whole, non-negative, safe number (see `isDurationValue`)
 */
export function splitDuration(minutes: number, options: DurationOptions = {}): [DurationUnit, number][] {
  if (!isDurationValue(minutes)) throw new RangeError(`not a duration in minutes: ${minutes}`)
  const size = unitMinutes(options)
  const parts: [DurationUnit, number][] = []
  let rest = minutes
  for (const unit of allowedUnits(options)) {
    const count = Math.floor(rest / size[unit])
    if (count > 0) parts.push([unit, count])
    rest -= count * size[unit]
  }
  return parts.length ? parts : [["minute", 0]]
}

/**
 * Formats minutes as "1 d 2 h 30 min" (`label` gives the unit text for a count).
 * `null` gives an empty string.
 * @throws RangeError like `splitDuration`
 */
export function formatDuration(
  minutes: number | null | undefined,
  options: DurationOptions = {},
  label: (unit: DurationUnit, count: number) => string = (unit, count) => `${count} ${SHORT[unit]}`
): string {
  if (minutes == null) return ""
  return splitDuration(minutes, options)
    .map(([unit, count]) => label(unit, count))
    .join(" ")
}
