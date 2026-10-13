---
covers: [src.forms.bones.widgets.booleanBone]
status: accepted
---

## Seam

Default widget for `bool` and every `bool.*` subtype except `bool.choose`
(-> `booleanBoneChoose`) and `bool.select` (-> `booleanBoneSelect`). The
variant is picked by the type suffix the server sends (`type_suffix` on the
ViUR `BooleanBone`), not by a frontend param. To replace it for all booleans,
register `addBoneWidget("bool", ...)` for the plain type and
`addBoneWidget("bool.", ...)` for the subtypes - one key does not cover both.

## Traps

- The init emit sends the incoming value unnormalised when it is truthy
  (`"1"` stays `"1"`); only falsy values become `false`. The switch shows
  `checked` for anything except `false, null, undefined, ""`, so the string
  `"false"` renders as on.
- `autofocus` is accepted and ignored.

## See also

- `docs/adr/forms/bones.md` - registry and widget contract.
- `docs/adr/forms/bones/widgets/booleanBoneChoose.md`
