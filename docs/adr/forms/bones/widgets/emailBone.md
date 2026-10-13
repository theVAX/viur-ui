---
covers: [src.forms.bones.widgets.emailBone]
status: accepted
---

## Seam

Routes from exactly `str.email`. Other `str.*` subtypes go to `stringBone`.
Format checking is the browser's `type="email"`; there are no params.

## Traps

- `change` carries no `valid`, so `Bone.updateValue` treats every value as
  valid. The native email check only colours the field; an invalid address
  is stored in `state.skel` and sent. The server is the only real check.
- Unlike `stringBone`, `params.pattern` is ignored.

## See also

- `docs/adr/forms/bones.md` - registry and widget contract.
- `docs/adr/forms/bones/widgets/stringBone.md`
