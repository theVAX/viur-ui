import { describe, it, expect } from "vitest"
import { formatDuration, parseDuration } from "../../src/components/DurationInput/duration.ts"

const workday = { hoursPerDay: 8, daysPerWeek: 5 }
const german = { aliases: { week: ["wo"], day: ["t", "tag"], hour: ["std"], minute: ["min"] } }

describe("parseDuration", () => {
  it.each([
    // [text, options, minutes]
    ["", {}, null],
    ["   ", {}, null],
    [null, {}, null],
    ["0", {}, 0],
    ["45", {}, 45],
    ["90m", {}, 90],
    ["90 min", {}, 90],
    ["2h", {}, 120],
    ["2,5h", {}, 150],
    ["2.5 h", {}, 150],
    ["1:30", {}, 90],
    ["0:05", {}, 5],
    ["1d 2h 30m", workday, 630],
    ["1d2h", workday, 600],
    ["1D 2H 30M", workday, 630],
    ["1w", workday, 2400],
    ["1w", {}, 7 * 24 * 60],
    ["1d", {}, 24 * 60],
    ["1 day 2 hours", workday, 600],
    ["1t 2std 30min", { ...workday, ...german }, 630],
    ["1 T 2 h 30 min", { ...workday, ...german }, 630],
    ["2 Std.", german, 120],
    ["1,5", {}, 2],
    ["0,01h", {}, 1],
    ["1h 1h", {}, 120],
  ])("%j -> %j", (text, options, minutes) => {
    expect(parseDuration(text, options)).toBe(minutes)
  })

  it.each([
    "-5",
    "-1h",
    "abc",
    "1x",
    "h",
    "1h 30",
    "1:3",
    "1:60",
    "1,2,3h",
    "1t", // German alias without German aliases
    "1".repeat(400),
  ])("%j is not a duration", (text) => {
    expect(parseDuration(text)).toBeNaN()
  })

  it("rejects units above the largest unit", () => {
    expect(parseDuration("1d", { largestUnit: "hour" })).toBeNaN()
    expect(parseDuration("30h", { largestUnit: "hour" })).toBe(1800)
  })
})

describe("formatDuration", () => {
  it.each([
    [null, {}, ""],
    [0, {}, "0 min"],
    [45, {}, "45 min"],
    [90, {}, "1 h 30 min"],
    [60, {}, "1 h"],
    [630, workday, "1 d 2 h 30 min"],
    [2400, workday, "1 w"],
    [2400, { ...workday, largestUnit: "day" }, "5 d"],
    [2400, { ...workday, largestUnit: "hour" }, "40 h"],
    [1440, {}, "1 d"],
    [10080, {}, "1 w"],
  ])("%j -> %j", (minutes, options, text) => {
    expect(formatDuration(minutes, options)).toBe(text)
  })

  it("uses the given unit labels", () => {
    const label = (unit, count) => `${count} ${{ week: "W", day: "T", hour: "h", minute: "min" }[unit]}`
    expect(formatDuration(630, workday, label)).toBe("1 T 2 h 30 min")
  })

  it.each([0, 1, 59, 61, 479, 480, 630, 2399, 2400, 9999])("%j round-trips through the parser", (minutes) => {
    expect(parseDuration(formatDuration(minutes, workday), workday)).toBe(minutes)
  })
})
