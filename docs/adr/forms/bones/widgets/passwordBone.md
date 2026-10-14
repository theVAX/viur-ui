---
covers: [src.forms.bones.widgets.passwordBone]
status: accepted
---

## Seam

Routes from `password` and `password.*`. Behaviour is driven by the server
bone, not by params: `tests` (`[regex, message, required]` triples) and
`test_threshold`. A confirmation field appears only when `tests` is
non-empty and the bone is not readonly - a login form gets
`PasswordBone(raw=True, tests=(), test_threshold=0)` and no confirmation.
Change the rules on the server bone, not in this widget.

## Rules

- Do not set `test_threshold` client-side (see the comment in
  `changeEvent`); it would override the server setting.

## Traps

- A hand-built structure must carry `tests` and `test_threshold`. Without
  `tests` `testPassword` throws (`for ... of undefined`); without
  `test_threshold` the comparison `<= undefined` is false and every input is
  emitted with `valid=false`, so nothing is ever stored.
- `valid` lags one event behind on the confirmation field: `testPassword`
  reads `state.equal` before `changeEvent` recomputes it. The keystroke that
  makes both fields equal still emits `valid=false`; the value is stored on
  the next `keyup` / `change` (blur).
- `watch(props.value)` refills the first field only; the confirmation field
  keeps its old content.

## See also

- `docs/adr/forms/bones.md` - registry and widget contract.
