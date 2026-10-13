---
covers: [src.forms.bones.widgets.selectBoneChoose]
status: accepted
---

## Seam

Widget for exactly `select.choose`. Not `multiple`: radio group. `multiple`:
one checkbox per option. Same `values` formats and the same `multibones`
handling as `selectBone` (the widget owns the list).

## Rules

- `readonly` goes on the radio group, not on the radios (see
  `booleanBoneChoose`). The checkboxes are disabled one by one, which is fine
  for checkboxes.

## Traps

- Same asymmetric string filter as `selectBone`: numeric value entries are
  dropped on init. With `values` as a list of `[number, label]`, a checkbox
  is also never shown as checked, because `state.value` holds strings and
  `includes(value[0])` compares against the number.
- The radio variant has no `required`.

## See also

- `docs/adr/forms/bones.md` - registry and widget contract.
- `docs/adr/forms/bones/widgets/selectBone.md`
