---
covers: [src.forms.bones.widgets.codeBone]
status: accepted
---

## Seam

Widget for `raw.code.*`, loaded async (CodeMirror). The language is the type
suffix (`raw.code.python` -> `python`), resolved by CodeMirror's
`LanguageDescription.matchLanguageName` against `@codemirror/language-data`
and loaded on demand. On the server this is a RawBone with a `code.<lang>`
type suffix. Plain `raw.code` without suffix does not reach this widget, it
falls through to `rawBone`.

## Traps

- Unknown suffixes give an editor without highlighting, no warning.
- The value is rebuilt line by line with `"\n"` after every line, so it
  always ends in an extra newline. Saving and reloading adds one more each
  round trip.
- No watcher on `props.value`: the document is set once on mount. A value
  changed from outside (delete action, reset, server reload into the same
  instance) is not shown.
- `readonly` is read once when the editor is built; toggling it later has no
  effect.
- `change` fires from DOM events (`input`, `keyup`, `paste`, `cut`), not from
  CodeMirror transactions; programmatic `dispatch` changes are not emitted.

## See also

- `docs/adr/forms/bones.md`
