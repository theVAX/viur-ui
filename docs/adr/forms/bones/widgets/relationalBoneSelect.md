---
covers: [src.forms.bones.widgets.relationalBoneSelect]
status: accepted
---

## Seam

Widget for `relational.select` and `relational.select.*`: a `wa-select` over
the target module instead of a search combobox. On the server side this is a
RelationalBone with type suffix `select`. Same `{dest, rel}` value and same
`useRelationalSource` as `relationalBone`.

## Rules

- Only for small target modules. Options are loaded once on mount without
  search text, capped at 99; entries beyond that cannot be selected. Large
  modules belong to `relationalBone`.

## Traps

- With `using`, the nested form gets the whole `{dest, rel}` value as skel
  instead of `value.rel` (`relationalBone` passes `value?.['rel']`). Existing
  `rel` values therefore do not show up in the fields. Treat it as a bug, not
  as intended.
- A `rel` change is emitted even when no `dest` is selected yet, unlike in
  `relationalBone`; the parent then holds `{rel}` without `dest`.
- `lang` is not passed to the nested wrapper, so multilingual bones with
  `using` lose the language on nested changes.

## See also

- `docs/adr/forms/bones/widgets/relationalBone.md` - source, value shape,
  renderer and actionbar traps apply here too.
- `docs/adr/forms/bones.md`
