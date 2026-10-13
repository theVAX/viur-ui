---
covers: [src.forms.bones.widgets.textBone, src.forms.bones.uploadAdapter.ViURUploadAdapterPlugin]
status: accepted
---

## Seam

Widget for `text` and `text.*`, loaded async (CKEditor 5 is large). The
variant is chosen by the structure: `valid_html` or `validHtml` set ->
CKEditor (ClassicEditor), otherwise a plain `wa-textarea`.

Toolbar buttons that map to a tag (`heading`->`h1`, `bold`->`b`,
`link`->`a`, `insertTable`->`table`, `imageUpload`->`img`, ...) appear only
if the tag is in `validHtml.validTags`. Other buttons always appear. A
different editor setup means an own widget via
`addBoneWidget("text.<suffix>", ...)`; the config is built inside the widget
and has no injection point.

Image upload in the editor runs through `ViURUploadAdapterPlugin`
(`src/forms/bones/uploadAdapter.js`): `uploadFile` with renderer `vi`, the
inserted `src` is a `/file/download/...` URL so viur-core recognises the
blob reference.

## Rules

- The server's `validHtml` is the HTML boundary, not the toolbar. Source
  editing is always enabled, so a user can type any markup; the client does
  not sanitize. Restrict on the server.
- Alignment and indent write classes `viur-txt-align--*` and
  `viur-txt-indent--*`. A project-specific `validHtml` must keep
  `viur-txt-*` in `validClasses` (viur-core default has it), or they are
  silently stripped on save.

## Traps

- Editor UI language and translations are hardcoded to German.
- Required check for the editor variant runs on a hidden
  `input.bone-widget-text-hidden`, not on the editor; it is skipped for
  multiple and multilingual bones.
- Editor uploads are not public and ignore the bone's `public` flag.

## See also

- `docs/adr/forms/bones.md`
- `docs/adr/forms/bones/widgets/fileBone.md`
