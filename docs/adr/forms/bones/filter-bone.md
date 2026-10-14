---
covers: [src.forms.bones.FilterBone]
status: accepted
---

## Seam

None. `FilterBone.vue` is a stale copy of `Bone.vue` with nothing importing
it. It imports `./rawBone.vue`, which does not exist (the widget lives in
`widgets/rawBone.vue`), so importing it breaks the build.

Filtering lists goes through the DataTable (`components/datatable.md`); a
filter form is a `ViForm` with `structure` + `bones`.

## Rules

- Do not import or revive it. Delete it or rebuild from `Bone.vue`.

## Traps

- Whoever repairs the import: it sets `multiple = false` on the shared
  structure object passed in (mutates the caller's structure), types
  `errors` as Object but iterates it as an array, and reports the whole
  value with the current language on every language switch.

## See also

- `docs/adr/forms/bones/bone.md`
