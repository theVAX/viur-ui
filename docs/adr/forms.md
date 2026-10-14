---
covers: [src.forms.ViForm, src.forms.install.installViurForms]
status: accepted
---

## Seam

Entry point for building a form. Pick the first variant that fits; each
links to the document that owns the details.

1. **Setup, once per app**: Pinia, vue-i18n with `deTranslations` /
   `enTranslations` merged in, then `installViurForms(app)`. Without it
   `<bone>`, `<vi-form>`, ... are not resolvable and nested forms show an
   alert.
2. **Server form**: `<ViForm ref="form" module="..." action="add|edit|clone"
:skelkey :group :skeltype />`, saved with `form.value.sendData()`.
   Singleton `edit` takes no `skelkey`. Details: `forms/utils.md`.
3. **Local form**: `:structure` + `:skel`, no request on render. Sending
   still needs `module`/`action` or `sendData(url)`.
4. **Subset / prefill**: `bones` limits what is shown, `values` overrides
   server defaults, `readonly`, `label` (`normal|top|hide|placeholder`).
5. **Other placement**: `layout` prop with an own layout component, or the
   default slot for a fully hand-written form: `forms/layouts.md`.
6. **Own input for a bone type**: `addBoneWidget` before mount:
   `forms/bones.md`, wrapper contract in `forms/bones/bone.md`.
7. **Buttons per bone** (translate, delete, own ones): `boneactions` +
   `actions` prop, `addAction`: `forms/bones/actions.md`.
8. **Wizard / login chain**: `multistep`: `forms/multistep.md`.
9. **Record / `using` sub-forms**: `forms/nested.md`.
10. **Read-only text of a value** (lists, detail pages), no form:
    `boneLogic`: `forms/bones/view/bone-logic.md`.

## Rules

- Start from variant 2 and only go further down the list when the server
  form cannot express it. Every step down takes over more wiring that
  `ViForm` otherwise keeps consistent.
- One `ViForm` per entity. Do not compose an entity from several sibling
  forms and merge their `state.skel` by hand; use `bones` and a layout.
- Saving is `sendData()` on the instance. Do not collect `change` events
  and post them yourself (see `forms/utils.md`, `request.md`).

## Traps

- `success` is emitted by the multi-step driver only. A single-step form
  never fires it; use the promise of `sendData()`.
- `failed` fires on every change of `state.failed`, also with `null` when
  `fetchData` / `loadStep` starts. Check the payload.
- `boneactions` is `false` on `ViForm` but `true` on a standalone `<bone>`,
  where every bone then shows the `debug` and `placeholder` buttons.
- `categoryDefaultname` defaults to the German "Allgemein" regardless of
  the i18n locale.

## See also

- `docs/adr/forms/utils.md`, `docs/adr/forms/layouts.md`,
  `docs/adr/forms/bones.md`, `docs/adr/forms/bones/bone.md`,
  `docs/adr/forms/bones/actions.md`, `docs/adr/forms/multistep.md`,
  `docs/adr/forms/nested.md`, `docs/adr/forms/bones/view/bone-logic.md`
