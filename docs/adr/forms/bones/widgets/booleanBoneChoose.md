---
covers: [src.forms.bones.widgets.booleanBoneChoose]
status: accepted
---

## Seam

Widget for exactly `bool.choose`: a yes/no radio group. Labels come from the
i18n keys `bones.bool.true` / `bones.bool.false`; override them in the app's
messages, not in the widget.

## Rules

- `readonly` goes on the `wa-radio-group`, not on the radios. Disabled radios
  show no selection, so a readonly bone would look empty.

## Traps

- Value type changes on first interaction: the init emit sends a boolean (or
  the raw truthy value), every later `change` sends the strings `"true"` /
  `"false"`. Code reading `skel[name]` after an edit must not test truthiness
  - `"false"` is truthy.
- `required` is only set when the bone is neither `multiple` nor
  multilingual.

## See also

- `docs/adr/forms/bones.md` - registry and widget contract.
- `docs/adr/forms/bones/widgets/booleanBone.md`
