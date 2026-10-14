---
covers: [src.forms.bones.widgets.dateBone]
status: accepted
---

## Seam

Routes from `date` and `date.*`. Input type comes from the server bone flags:
`date` + `time` -> `datetime-local`, no `time` -> `date`, no `date` ->
`time`. The value is a plain string; the server sees exactly what the input
emits, without timezone.

## Traps

- Timezone stripping only knows `+`: `value.split("+")[0]`. Values with a
  negative offset (`-05:00`) or `Z` are passed unchanged and a
  `datetime-local` / `time` input cannot parse them, so the field shows empty.
- Date-only bones convert via `new Date(value).toISOString()`, i.e. to UTC.
  A server value `2026-03-28T00:00:00+01:00` shows as `2026-03-27`. The init
  emit writes that shifted date into `state.skel`, so saving without touching
  the field moves the date back by one day.
- No `valid` in `change`: `required` is display only.

## See also

- `docs/adr/forms/bones.md` - registry and widget contract.
