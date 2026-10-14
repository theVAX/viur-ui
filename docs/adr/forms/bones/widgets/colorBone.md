---
covers: [src.forms.bones.widgets.colorBone]
status: accepted
---

## Seam

Routes from `color` and `color.*`. Value is the hex string the
`wa-color-picker` emits; no params are read. A palette or format other than
hex needs an own widget via `addBoneWidget("color...", ...)`.

## Traps

- No `valid` in `change`: `required` is display only, an empty picker is
  stored and sent.

## See also

- `docs/adr/forms/bones.md` - registry and widget contract.
