---
covers: [src.forms.bones.BoneNestedWrapper, src.forms.utils.logics]
status: accepted
---

## Seam

A form inside a form comes from a bone with `using` (record, relational
with `using`). `BoneNestedWrapper` renders a full `<vi-form>` with
`:internal="mainformState"`, `:skel="value"`, `:structure="bone.using"` and
emits the whole sub-skel as the bone value. An own widget that needs a
sub-form does the same; it is not a separate API.

What crosses the levels, via provide/inject:

- `formState` - the nearest form.
- `mainformState` - the outermost form only (provided when `internal` is
  not set). Nested forms take `readonly` and `boneactions` from it.
- `nestedFlushes` - a Set owned by the outermost form; every nested form
  registers its pending-change flush there.
- `boneActionsConfig` - the outer `actions` prop, passed down unchanged.
- `bonePath` - DOM id path, extended by `lang-<code>` / `idx-<n>`.

In `visibleIf` / `readonlyIf` / `requiredIf` / `evaluate`, `_skel` is the
skel of the outermost form on every level.

## Rules

- Values go up only as the bone's `change` with the complete sub-skel. Do
  not write into `mainformState.skel` from a nested form.
- Submit only through the outermost form's exposed `sendData` (or
  `submitStep`); that is where the nested flush happens.

## Traps

- Every form debounces `change` by 500 ms and emits only the last change of
  a burst. The outer `state.skel` lags behind nested edits until the flush;
  code that reads it directly (own request, computed "dirty") misses them.
- The nested form watches its `skel` prop deeply: every outer change re-runs
  `initForm` there, replaces its `pristine` snapshot and recomputes the
  categories. `values` is not reapplied (the watcher passes `state.value`,
  which does not exist).
- `_skel` skips intermediate levels: a record inside a record cannot address
  its parent record, only the outermost form.
- Nested forms receive no `errors`. A server error for a sub-bone stays in
  the outer `state.errors`, and the outer `<bone>` shows only paths of
  length 1 (2 with `multiple` or `languages`, 3 with both), so errors on
  fields of a single record are not displayed anywhere.
- A readonly record bone still renders editable sub-bones: `recordBone`
  passes `disabled`, which `BoneNestedWrapper` does not declare. The edits
  are then dropped by the readonly outer `<bone>` and never sent.

## See also

- `docs/adr/forms/bones/widgets/recordBone.md` - wrapper details.
- `docs/adr/forms/utils.md` - `logics()`, `initForm`, `resetForm`.
