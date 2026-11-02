---
covers: [src.forms.bones.widgets.numericBoneDuration]
status: accepted
---

## Seam

Widget for exactly `numeric.duration`: a `DurationInput` for a numeric bone
that holds whole minutes. On the server, give the bone that type, e.g.
`class DurationBone(NumericBone): type = "numeric.duration"`. Configured by
the bone's `params`: `hours_per_day`, `days_per_week`, `largest_unit`
(`"week"`, `"day"`, `"hour"`, `"minute"`) and `presets` (list of minutes).
`min` / `max` of the bone are the allowed range.

## Rules

- Emits the minutes as a string (`""` for no value), like `numericBone`.
  Unusable text emits `valid=false` with the previous value.
- The label of the `wa-input` is the bone's `descr`; it is hidden by
  `webawesomeCompat.css` and only names the field for assistive technology,
  `BoneLabel` stays the visible label.

## Traps

- Reads `min` / `max` from the structure (what viur-core sends), not the
  `minAmount` / `maxAmount` that `numericBone` reads (those only exist with the
  compatibility flag `json.bone.structure.camelcasenames`). The int64 limits
  viur-core sends for "no limit" are ignored, a negative `min` counts as `0`.

## See also

- `docs/adr/components/duration-input.md` - parser, options, translations.
- `docs/adr/forms/bones.md` - registry and widget contract.
