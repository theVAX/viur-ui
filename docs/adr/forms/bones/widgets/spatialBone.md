---
covers: [src.forms.bones.widgets.spatialBone]
status: accepted
---

## Seam

Widget for `spatial` and `spatial.*`. Two number inputs bounded by
`bonestructure.boundslat` / `boundslng` from the ViUR `SpatialBone`.

## Rules

- The value inside the form is the array `[lat, lng]`. Splitting into
  `name.lat` / `name.lng` for the server happens in `toFormData`
  (`src/forms/utils.js`) and `skelDataToFormData` (`src/request/skel.js`), not
  in the widget. An own spatial widget must emit the same array.
- A hand-built structure needs `boundslat` and `boundslng`; the template reads
  index `[0]` / `[1]` without a guard.

## Traps

- The component docstring claims `{lat, lng}` is accepted as value. It is
  not: the widget reads `value[0]` / `value[1]`, an object yields two empty
  fields without error.
- The init emit sends `[null, null]` for an empty bone.

## See also

- `docs/adr/forms/bones.md` - registry and widget contract.
