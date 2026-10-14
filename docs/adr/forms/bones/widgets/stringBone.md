---
covers: [src.forms.bones.widgets.stringBone]
status: accepted
---

## Seam

Routes from `str` and every `str.*` except `str.email` (emailBone) and
`str.phone` (phoneBone). Exact-match only for those two: `str.email.foo`
lands here again.

Validation hook: `params.pattern` (regex, string or per-language object) and
`params.pattern_error` (message, same shape) on the server bone. Prefer that
over a custom widget when only the format differs.

## Traps

- A per-language `pattern` / `pattern_error` is picked by
  `boneState.defaultLanguage`, not by the `lang` of the tab being edited. All
  language tabs validate against the default language's pattern.
- The pattern check is client-side only and must be repeated on the server.

## See also

- `docs/adr/forms/bones.md` - registry and widget contract.
- `docs/adr/forms/bones/widgets/emailBone.md`
