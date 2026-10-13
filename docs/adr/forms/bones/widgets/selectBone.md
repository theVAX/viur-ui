---
covers: [src.forms.bones.widgets.selectBone]
status: accepted
---

## Seam

Widget for `select` and every `select.*` subtype except `select.choose`
(-> `selectBoneChoose`). Options come from `bonestructure.values`, either
`[[key, label], ...]` or `{key: label}`. `select` and `select.` are in
`multibones`: the widget renders `multiple` itself as one `wa-select multiple`,
`Bone.vue` does not wrap it in `BoneMultipleList`.

## Traps

- Values are compared as strings, but the filter is not symmetric: with a
  list value, each entry is matched with `includes(entry)` against the
  stringified keys. Numeric entries (`[1, 2]`) never match and are dropped,
  and the init emit writes the filtered list into `state.skel`. Do not rely
  on numeric keys until this is fixed.
- Entries not present in `values` are silently dropped from a multiple value
  on init.
- An empty multiple bone (`null`) is emitted as `""`, not `[]`.
- `autofocus` is accepted and ignored.

## See also

- `docs/adr/forms/bones.md` - registry, `multibones` and widget contract.
- `docs/adr/forms/bones/widgets/selectBoneChoose.md`
