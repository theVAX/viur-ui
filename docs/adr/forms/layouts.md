---
covers:
  [
    src.forms.layouts.LayoutCategory,
    src.forms.layouts.LayoutList,
    src.forms.layouts.LayloutList2Columns,
    src.forms.ViFormCategory,
  ]
status: accepted
---

## Seam

Bone placement in `ViForm` is swapped with the `layout` prop (default
`LayoutCategory`). A layout is a plain component that reads
`inject("formState")` and renders its default slot once per bone with
`{ boneName, widget, visible?, label? }`. `ViForm` fills that slot with the
`<bone>`, so the layout decides only order, grouping and per-bone overrides:

- `widget` - normally `getBoneWidget(formState.structure[name].type)`;
  `undefined` skips the bone.
- `visible` - overrides `structure[name].visible` (`v-show`).
- `label` - overrides the form-wide `label` mode for this bone.

The layouts are not exported from `index.js`; import them by path
(`viur-ui/src/forms/layouts/LayoutList.vue`), the package has no `exports`
map.

Full control instead of placement: the default slot of `ViForm`
(`structure`, `skel`, `errors`, `categories`) replaces the layout and the
`<bone>` wiring. Then wire each bone's `change-internal` to the exposed
`updateSkel` (template ref) yourself, otherwise nothing is collected. That
path skips the debounced `change` event of `ViForm`; a component rendered
inside the slot can `inject("formUpdate")` instead and keeps it.

## Rules

- Keep the `<bone>` out of the layout. Rendering it there duplicates the
  props wiring of `ViForm` (`errors`, `readonly`, `default-language`,
  `formUpdate`) and drifts from it.
- Iterate `formState.structure` or `formState.categories`, not
  `formState.skel`. A bone without a value key in the skel exists in the
  structure only and would be missing.
- Honour `formState.bones` (the `bones` prop). It is only applied inside
  `updateCategories`; a layout that ignores categories has to filter itself.

## Traps

- `LayoutList` iterates `formState.skel` and ignores `bones`: it shows every
  bone that has a value key, hides bones that have none, and skips
  categories.
- `LayloutList2Columns` (sic) renders nothing with the default `bones=[]`,
  because it requires `formState.bones.includes(name)`. It also iterates the
  skel and splits by the index over all skel keys, so filtered bones leave
  the columns uneven. Its `v-id` is a typo for `v-if`; Vue only warns and the
  wrapper always renders.
- `LayoutCategory` hides a whole category when none of its bones is
  `visible` in the structure. A `visible` override from a custom layout does
  not reach `hasCategoryBones`.
- `useCategories=false` does not switch the layout: `ViFormCategory` with
  `hide` renders its bones flat, but order and the `bones` filter still come
  from the categories.
- The category name is rendered as HTML (`v-safe-html`), and
  `categoryDefaultname` can be a format string (`$(...)`) over the skel.

## See also

- `docs/adr/forms/utils.md` - `updateCategories`, `bones`, `collapsedCategories`.
- `docs/adr/forms/bones.md` - `getBoneWidget` and the widget contract.
