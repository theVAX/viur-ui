---
covers: [src.forms.bones.widgets.booleanBoneSelect]
status: accepted
---

## Seam

Widget for exactly `bool.select`: a `wa-select` with the two options
`bones.bool.true` / `bones.bool.false` (i18n keys).

## Why not

The option values are the strings `"true"` / `"false"`, not booleans:
`wa-select` matches its `value` against the option values when it is set, and
a boolean would never match, so the stored value would not show. Do not
"fix" this to `:value="true"`.

## Traps

- Same type flip as `booleanBoneChoose`: boolean on the init emit, the
  strings `"true"` / `"false"` after the first change.
- No `required` attribute, unlike `booleanBoneChoose`.

## See also

- `docs/adr/forms/bones.md` - registry and widget contract.
- `docs/adr/forms/bones/widgets/booleanBoneChoose.md`
