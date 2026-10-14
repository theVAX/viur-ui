---
covers: [src.forms.bones.widgets.fileBone, src.forms.bones.actionbar.fileBar]
status: accepted
---

## Seam

Widget for `relational.tree.leaf.file.*` (ViUR FileBone). Upload goes through
`uploadFile` from `src/request`; the bone's `public` flag in the structure
becomes `publicUpload`. Download/delete buttons are bone actions rendered in
the default slot, configured via `addAction` / `setDefaultActionsForType`,
not in this widget.

Multiple file bones get `actionbar/fileBar.vue` (exact key
`"relational.tree.leaf.file.file"`) for upload, drop and empty entries.

## Rules

- The emitted value is `{dest: <upload result>, rel: null}`. A replacement
  widget keeps that shape; the server expects a relational value, not a key.
- Upload errors must be reported by the widget. `uploadFile` uses plain
  `fetch` past the request layer, so nothing else notifies the user;
  `fileBone` does it via `reportUploadError`.

## Traps

- Clicking only opens the picker while the bone is empty. A set value is
  replaced by drag-and-drop or by deleting it first.
- A drop onto the widget takes only the first file, even for multiple
  bones. Multiple drops belong on `fileBar`.
- `fileBar` has no error handling: a failed upload leaves the spinner on and
  shows no message. Its delete button calls an undefined `openSelector()`.
- The `actionbar` key is exact for `relational.tree.leaf.file.file`; file
  bones with another suffix fall back to `relationalBar` (prefix
  `"relational."`) and get a search combobox instead of upload.

## See also

- `docs/adr/forms/bones.md`
- `docs/adr/forms/bones/widgets/textBone.md` - CKEditor image upload uses a
  separate path.
