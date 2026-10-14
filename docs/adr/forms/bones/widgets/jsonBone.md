---
covers: [src.forms.bones.widgets.jsonBone]
status: accepted
---

## Seam

Widget for exactly `raw.json`. Wraps `json-editor-vue`; loaded through
`defineAsyncComponent` in `src/forms/bones/index.js`, so the editor only lands
in the bundle of apps that render such a bone.

## Rules

- Keep it async. Importing `jsonBone.vue` statically anywhere in the package
  pulls the editor into every consumer.

## Traps

- `change` emits `content.json` of the editor's change event. When that is
  `undefined`, `Bone.updateValue` drops the event without a trace.
- The tree is collapsed 300 ms after the first non-empty value arrives; a
  value that only shows up later in the lifetime is collapsed as well.

## See also

- `docs/adr/forms/bones.md` - registry, lazy loading and widget contract.
