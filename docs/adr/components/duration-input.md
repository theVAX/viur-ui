---
covers:
  [
    src.components.DurationInput.DurationInput,
    src.components.DurationInput.duration.parseDuration,
    src.components.DurationInput.duration.formatDuration,
    src.components.DurationInput.duration.splitDuration,
  ]
status: accepted
---

## Seam

A duration stored as whole minutes (a viur-core `NumericBone`): `DurationInput`
with `v-model` (minutes or `null`). It accepts shorthand (`1d 2h 30m`, `2,5h`,
`90m`, `1:30` as h:mm, a bare number as minutes), previews the normalised
value in the `wa-input` hint while typing and normalises the text when the
field is left. `presets` (minutes) adds quick-pick buttons. Inside a `ViForm`
use the bone type `numeric.duration` instead
(`docs/adr/forms/bones/widgets/numericBoneDuration.md`).

Without a component: `parseDuration(text, options)` and
`formatDuration(minutes, options, label)` from
`src/components/DurationInput/duration.ts`, e.g. for table cells.

Unit names come from the translations: `duration.units` (display),
`duration.long` (spoken names of the quick picks, plural forms) and
`duration.aliases` (comma separated names the parser accepts in addition to
the English ones in `ENGLISH_ALIASES`).

## Rules

- `hoursPerDay` / `daysPerWeek` default to the calendar (24 / 7). Effort and
  time tracking usually wants a working day: set `8` / `5`. The same options
  must be used wherever the value is formatted, or `1 d` means two things.
- `update:modelValue` fires only for usable text (parsed and within
  `min`/`max`). Unusable text fires `invalid(message)` and leaves the value as
  it was; the message shows in the hint once the field is left and is set as
  custom validity on the `wa-input`.
- Attributes that are not props (`label`, `placeholder`, `required`, `name`,
  `size`, listeners such as `@keydown`) go to the inner `wa-input`.

## Traps

- `webawesomeCompat.css` hides the label of every `wa-input`, also the one of
  `DurationInput`. Render a visible label yourself; the `label` attribute still
  names the field for assistive technology.
- `wa-button` does not pass `aria-label` on to its inner button. The quick
  picks therefore carry their spoken name ("15 minutes") as
  `.wa-visually-hidden` text, which needs the Web Awesome utility styles
  (`webawesome.css`, loaded by `webawesomeConfig.js`).
- The result is rounded to whole minutes: `1,5` gives `2`, `0,01h` gives `1`.
- Units above `largestUnit` are rejected, not converted (`1d` in an hours-only
  field is ambiguous).
- No `Intl.DurationFormat`: its output (`1 Tg., 2 Std. und 30 Min.`) cannot be
  typed back, and its days are calendar days.

## See also

- `docs/adr/forms/bones/widgets/numericBoneDuration.md`
