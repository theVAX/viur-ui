---
covers: [src.forms.bones.widgets.rawBone]
status: accepted
---

## Seam

Fallback widget: every type no branch of `getBoneWidget` matches lands here,
including plain `raw`. To give an unknown or custom type a real editor,
register it with `addBoneWidget` instead of patching this widget.

## Traps

- The `raw.json` branch in the template is dead in the default routing:
  `raw.json` goes to `jsonBone`. It also emits the textarea string, which
  `toFormData` would `JSON.stringify` a second time.
- An unknown type with an object value (custom bone without widget) is bound
  as-is to `wa-textarea.value`. The first keystroke replaces the object in
  `state.skel` with the textarea string.
- No `valid` in `change`: the `required` attribute is display only, an empty
  value is stored and sent.

## See also

- `docs/adr/forms/bones.md` - registry and widget contract.
