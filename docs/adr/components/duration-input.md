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
- Both must be at least 1 and give a whole number of minutes per day and per
  week (`7.5` hours is fine, `0.02` is not); otherwise `unitMinutes`,
  `parseDuration`, `formatDuration` and the component throw a `RangeError`.
  This keeps splitting into units lossless: every formatted value parses back
  to the same minutes.
- Only whole, non-negative, safe numbers are durations (`isDurationValue`).
  `splitDuration` / `formatDuration` throw for anything else instead of
  printing a wrong duration (`-1` used to become `6 d 23 h 59 min`). The
  component shows such a model value as it is (`-1`, `NaN`), so it reads as an
  error; quick picks that are no duration are left out.
- `update:modelValue` fires only for usable text (parsed, within `min`/`max`,
  not empty when `required`). Unusable text fires `invalid(message)` and leaves
  the value as it was; the message shows in the hint once the field is left and
  is set as custom validity on the `wa-input`. A fractional `min`/`max` allows
  the whole minutes inside it (`max: 60.5` allows 60, not 61); a non-finite one
  is no limit.
- Draft against outside update: while the user edits (typed, field not yet
  left), a new `modelValue` does not replace the text. Leaving the field
  reports the shown value again if it differs from the model, so the last edit
  wins. A change of the options or of the locale shows the model value anew
  and drops a draft, because the same text would now mean something else.
- Attributes that are not props (`label`, `placeholder`, `name`, `size`,
  listeners such as `@keydown`) go to the inner `wa-input`.

## Traps

- `webawesomeCompat.css` hides the label of every `wa-input` with
  `display: none`, and Chromium then gives the field no accessible name at
  all. Next to an own visible label pass `label` plus
  `class="wa-visually-hidden-label"`: `DurationInput` turns the label back on
  for that class and Web Awesome's utility hides it visually only.
- Web Awesome sets no `aria-invalid` on the inner input. The error reaches
  assistive technology as the description (hint, `aria-describedby`), not as
  an invalid state.
- `wa-button` does not pass `aria-label` on to its inner button. The quick
  picks therefore carry their spoken name ("15 minutes") as
  `.wa-visually-hidden` text, which needs the Web Awesome utility styles
  (`webawesome.css`, loaded by `webawesomeConfig.js`).
- The result is rounded to whole minutes: `1,5` gives `2`, `0,01h` gives `1`.
- The tests run in happy-dom without Web Awesome (it needs `ElementInternals`,
  which happy-dom lacks). Accessible name, hint as description, native
  validity and disabled buttons of the real elements were checked by hand in
  Chromium (Histoire, accessibility tree via CDP), not automatically.
- Units above `largestUnit` are rejected, not converted (`1d` in an hours-only
  field is ambiguous).
- No `Intl.DurationFormat`: its output (`1 Tg., 2 Std. und 30 Min.`) cannot be
  typed back, and its days are calendar days.

## See also

- `docs/adr/forms/bones/widgets/numericBoneDuration.md`
