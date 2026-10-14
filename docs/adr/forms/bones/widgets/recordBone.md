---
covers: [src.forms.bones.widgets.recordBone, src.forms.bones.BoneNestedWrapper]
status: accepted
---

## Seam

Widget for `record` and `record.*`. It only forwards to `BoneNestedWrapper`,
which renders a full nested `<vi-form>` over `bone.using`. Layout of the
sub-form is steered by `params.categoryDefaultname` (category title, falls
back to `format`) and `params.collapsedCategories`; the last entry of a
multiple record is never collapsed.

Changing how nested forms look or behave is done in `BoneNestedWrapper`, not
here; `relationalBone` and `relationalBoneSelect` use the same wrapper for
`using`.

## Rules

- `installViurForms(app)` is mandatory. The wrapper checks for a global
  `Bone` component and shows an alert instead of the form without it.
- A nested change always carries the whole sub-skel
  (`skelRef.state.skel`), never a single field. Do not merge partial values
  in a replacement widget.
- Bone actions configured on the outer `ViForm` (`actions` prop) are passed
  into the sub-form; the sub-form does not start with an empty config.

## Traps

- The wrapper's own init emit is positional
  (`emit("change", name, val, lang, index)`), but every listener reads an
  object (`data["value"]`). It arrives as `undefined` and is dropped by
  `Bone.updateValue`. Do not rely on it to push `using` default values up.
- The nested DOM ids include `lang-<code>` and `idx-<n>` segments
  (`bonePath`); selectors written against a single-value record break for
  multiple or multilingual ones.

## See also

- `docs/adr/forms/bones.md`
- `docs/adr/forms/utils.md` - the nested form is a full `ViForm`.
