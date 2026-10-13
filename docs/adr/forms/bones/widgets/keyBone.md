---
covers: [src.forms.bones.widgets.keyBone]
status: accepted
---

## Seam

Routes from type `key` only (exact match, no `key.*` prefix). Display only:
the input is always `disabled`, independent of `readonly`. To make a key
editable or clickable, register an own widget for `key`; do not drop the
`disabled` here.

## Traps

- Server-side errors are not highlighted: the template sets
  `data-data-invalid` instead of `data-user-invalid` like the other widgets.
- `params`, `readonly` and `autofocus` are declared as props but not
  evaluated.

## See also

- `docs/adr/forms/bones.md` - registry and widget contract.
