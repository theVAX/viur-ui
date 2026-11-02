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
- The label of the `wa-input` is the bone's `descr`, visually hidden with
  `wa-visually-hidden-label` (not `display: none` as `webawesomeCompat.css`
  does), so it names the field for assistive technology; `BoneLabel` stays the
  visible label.

## Traps

- Limits: `min` / `max` (what viur-core always sends) win over `minAmount` /
  `maxAmount` (its copy with the compatibility flag
  `json.bone.structure.camelcasenames`, the only keys `numericBone` reads). The
  int64 limits viur-core sends for "no limit" are ignored, a negative `min`
  counts as `0`, a fractional limit stays a limit (`max: 60.5` refuses 61).
- A required bone that is cleared emits `valid=false`, like the native
  `required` check of `numericBone`.
- Wrong `params` (e.g. `hours_per_day: 0`) or impossible limits do not break
  the form: the field is disabled and says it is set up wrongly (see
  `duration-input.md`). After a change of the locale the widget emits `change`
  with the validity of the value shown again.

## See also

- `docs/adr/components/duration-input.md` - parser, options, translations.
- `docs/adr/forms/bones.md` - registry and widget contract.
