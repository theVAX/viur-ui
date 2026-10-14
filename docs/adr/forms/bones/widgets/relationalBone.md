---
covers:
  [
    src.forms.bones.widgets.relationalBone,
    src.forms.bones.relationalSource.useRelationalSource,
    src.forms.bones.actionbar.relationalBar,
  ]
status: accepted
---

## Seam

Default widget for `relational` and every `relational.*` type except
`relational.select.*` (-> `relationalBoneSelect`) and
`relational.tree.leaf.file.*` (-> `fileBone`). Replace it per module with
`addBoneWidget("relational.<sub>.", ...)`, see `forms/bones.md`.

Suggestions come from `useRelationalSource(boneState, formatString)` in
`src/forms/bones/relationalSource.js`. An own relational widget reuses it
instead of calling `useListFetch` itself; it already handles debounce,
superseded requests and `skelType` for tree modules.

Multiple relational bones get `actionbar/relationalBar.vue` (prefix
`"relational."`); its combobox adds `{dest, rel}` entries via the injected
`addMultipleEntry`.

## Rules

- Value shape is `{dest: <skel>, rel: <using values> | null}`, also per
  multiple entry. Never emit the bare key or the bare skel.
- The search text only filters on the first `$(dest.<bone>)` of the bone's
  `format`, as `<bone>$lk` prefix match. That bone must be filterable on the
  server (a StringBone with index); a format starting with a non-string bone
  searches nothing.
- `using` fields render through `BoneNestedWrapper`, which needs
  `installViurForms(app)` (global `<bone>`); without it an alert replaces the
  fields.

## Traps

- Once a target is chosen, the field turns into a disabled `wa-input`.
  Changing the target means clearing it first (delete action); the widget
  resyncs via its `props.value` watcher.
- The suggestion list is capped at 99 (`limit: 99`). With no or a
  non-matching search text further entries are not reachable.
- The suggestion request uses `VITE_DEFAULT_RENDERER || "vi"`, the nested
  `using` form `VITE_DEFAULT_RENDERER || "json"`. Without the env var both
  hit different renderers.
- `rel` changes are only emitted after a `dest` is selected; `using` input
  entered before that is kept locally and sent with the selection.
- The delete button of `relationalBar` (multiple, not readonly) calls an
  undefined `openSelector()` and throws.

## See also

- `docs/adr/forms/bones.md` - widget contract, registration.
- `docs/adr/forms/bones/widgets/relationalBoneSelect.md`
- `docs/adr/forms/bones/widgets/recordBone.md` - same nested wrapper.
