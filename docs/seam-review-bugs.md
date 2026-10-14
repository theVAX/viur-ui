# Bugs found while writing the seam docs (2026-10-13)

Found while writing the ADRs under `docs/adr/`. State at discovery: `main` @ 4fa5e4e. The section "State after the bug round" at the end lists what was fixed.

Evidence column: **checked** = looked up in the code and/or reproduced with Node; **read** = derived from the code only, not run.

## Forms - bone registry (`src/forms/bones/index.js`)

| #   | Bug                                                                                                                                                                                                                                                                                                                                                      | Evidence       |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| 1   | The sort `sort((a, b) => b.length - a.length)` in `getBoneWidget`, `getBoneActionbar` and `BoneHasMultipleHandling` compares the length of the `[key, widget]` pairs (always 2). Instead of the longest prefix, the registration order wins: `"relational.tree."` registered before `"relational.tree.leaf.file."` -> a file bone gets the wrong widget. | checked (Node) |
| 2   | `addBoneWidget` after the first render has no effect: `additionalBones` is a `shallowRef` inside `reactive`, the mutation triggers nothing.                                                                                                                                                                                                              | checked (Node) |
| 3   | `importWidgets` calls `bones.add(v)` on a plain object and throws as soon as a custom widget is registered. No callers.                                                                                                                                                                                                                                  | read           |

## Forms - widgets (`src/forms/bones/widgets/`)

| #   | File                                            | Bug                                                                                                                                                                                                                                                            | Evidence       |
| --- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| 4   | `dateBone.vue:80`                               | Date-only bones: `new Date(value).toISOString().substr(0, 10)` converts to UTC. In Europe/Berlin `2026-03-28T00:00:00+01:00` becomes `2026-03-27`. The init emit writes that into `state.skel` -> saving without touching the field moves the date by one day. | checked (Node) |
| 5   | `dateBone.vue:75-77`                            | The zone is only removed via `split("+")`. Values with a negative offset or `Z` stay unchanged and are not parsed by `datetime-local`/`time` -> empty field.                                                                                                   | checked (Node) |
| 6   | `numericBone.vue:123`                           | The init emit `"" + props.value` turns `null` into the string `"null"`, which is sent as is.                                                                                                                                                                   | checked        |
| 7   | `keyBone.vue`, `numericBone.vue`                | Attribute `data-data-invalid` instead of `data-user-invalid` -> server errors are not highlighted.                                                                                                                                                             | read           |
| 8   | `passwordBone.vue`                              | `testPassword` runs before `state.equal` is updated: the keystroke that makes both fields equal still emits `valid=false`.                                                                                                                                     | read           |
| 9   | `passwordBone.vue`                              | Without `tests` in the structure the widget throws (`for ... of undefined`); without `test_threshold` every input is `valid=false` and never saved.                                                                                                            | read           |
| 10  | `stringBone.vue`                                | `params.pattern`/`pattern_error` are picked by `boneState.defaultLanguage`, not by the tab's `lang`. (Diagnosis was wrong, see below.)                                                                                                                         | read           |
| 11  | `emailBone`, `rawBone`, `colorBone`, `dateBone` | Never send `valid` -> `required` and native checks are only visual, invalid values get saved. (Not a bug, see below.)                                                                                                                                          | read           |
| 12  | `selectBone.vue`, `selectBoneChoose.vue`        | List values are filtered with `.includes` against stringified keys -> numeric keys drop out (`[1,"2"]` -> `['2']`). The init emit writes the filtered list into the skel. In `selectBoneChoose` numeric checkboxes are never checked.                          | checked (Node) |
| 13  | `phoneBone.vue`                                 | `parsePhoneNumber` (libphonenumber-js/min) returns `undefined` for input it can't parse (e.g. `"089 1234567"` without `+`); then `.countryCallingCode`/`.formatNational()` on `undefined` -> crash on mount.                                                   | checked (Node) |
| 14  | `phoneBone.vue`                                 | The dial code select is not `disabled` when readonly; input of <= 4 characters emits nothing (shortening keeps the old value); the `test` regex from the viur-core structure is ignored.                                                                       | read           |
| 15  | `spatialBone.vue`                               | The docstring promises `{lat, lng}` as value, only `value[0]`/`value[1]` is read.                                                                                                                                                                              | read           |
| 16  | `codeBone.vue`                                  | The listener appends `"\n"` to every line, the last one included -> every save/load adds a line break. No watcher on `props.value`.                                                                                                                            | read           |
| 17  | `relationalBoneSelect.vue:26`                   | Hands `value` (the whole `{dest, rel}`) to the nested wrapper instead of `value?.rel` like `relationalBone` -> `using` fields don't show existing values. No `lang`; `rel` changes are emitted without a `dest` too.                                           | read           |
| 18  | `fileBone.vue`                                  | Leftover `console.log` in `createBackgroundImage` and `handleUpload`.                                                                                                                                                                                          | read           |

## Forms - actionbars, wrapper, upload

| #   | File                                                        | Bug                                                                                                                                                                                                                                 | Evidence       |
| --- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| 19  | `actionbar/relationalBar.vue:9`, `actionbar/fileBar.vue:14` | The button calls `openSelector()`, which is defined nowhere -> the click throws. Also `removeMultipleEntries = null`.                                                                                                               | checked (grep) |
| 20  | `actionbar/fileBar.vue`                                     | `handleUpload`/`handleDrop` without try/catch -> on a failed upload the spinner keeps turning, no message.                                                                                                                          | read           |
| 21  | `BoneNestedWrapper.vue` (onMounted)                         | Emits positional arguments, all listeners read an object (`data["value"]`) -> the init emit is lost as `undefined`; with a `null` value the `using` defaults get lost (not checked whether the nested ViForm fills them otherwise). | read           |
| 22  | `uploadAdapter.js`                                          | `abort()` uses `this.xhr`, which is never set -> aborting does nothing.                                                                                                                                                             | read           |

## Forms - layouts (`src/forms/layouts/`)

| #   | File                        | Bug                                                                                                                                                                                                              | Evidence           |
| --- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| 30  | `LayloutList2Columns.vue`   | Renders nothing with the default `bones=[]`, because `formState.bones.includes(name)` is required. Columns split by index over all skel keys -> uneven columns with a filter. Typo in the file name ("Laylout"). | read               |
| 31  | `LayloutList2Columns.vue:3` | `v-id` instead of `v-if`: Vue doesn't resolve the directive, only warns, the wrapper always renders.                                                                                                             | checked (compiler) |
| 32  | `LayoutList.vue`            | Iterates `formState.skel` instead of `structure`: bones without a value key are missing, the `bones` prop is ignored.                                                                                            | read               |

## Request layer (`src/request/`)

| #   | File                        | Bug                                                                                                                                                                                                                                                                                                                                         | Evidence             |
| --- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| 23  | `request.js:618-620`        | `invalidatesAll` only deletes entries with the prefix `<base>/<renderer>/<module>/`; with `version`/`lang`, `create_url` builds `/json/v2/...` or `/de/json/...` -> these lists stay stale after add/clone/move. Also `VITE_API_URL ?? origin` (618) vs. `VITE_API_URL ? ... : origin` (61): with an empty string the prefix never matches. | read                 |
| 24  | `cache.js:9-24`             | No guard for a missing `indexedDB` (Node tests, SSR). Edit/delete/add always invalidate -> `afterFetch` throws, the UI reports an error although the server already wrote.                                                                                                                                                                  | read (vueuse source) |
| 25  | `src/user/store.js:100-115` | `logout()` doesn't reset the config store (`useConfigStore().reset()` is called nowhere). The next user gets the module tree of the old modules, filtered by their rights. The server still checks.                                                                                                                                         | read                 |

## DataTable (`src/components/DataTable/`)

| #   | File                                          | Bug                                                                                                                                                                          | Evidence |
| --- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 26  | `ViurDataTable.vue` `onRequest` (~186)        | In server mode `search` and `filters` from `data-request` are dropped -> the built-in search box (`withSearch`) and column filters do nothing. The exposed `search()` works. | checked  |
| 27  | `ViurDataTable.vue` `requestParams` (~175)    | Only the first sort entry is sent as `orderby`; multi-sort shows several arrows, the server sorts by one column.                                                             | checked  |
| 28  | `ViurDataTable.vue` `effectiveColumns` (~140) | Custom `columns` are passed through unchanged -> field visibility is stored, but nothing is hidden.                                                                          | read     |
| 29  | `ViurDataTable.vue`                           | `pageSize` is silently capped at 99. Probably intended because of the ViUR limit, but without feedback.                                                                      | read     |

## Not a bug, but a limit

- Virtual scrolling only measures `row-detail` panels (`DataTable.vue:2568-2589`), all other rows count as `rowHeight` (44 px). Taller custom cell slots shift the scroll offsets.
- `hasModuleAccess` (`configStore.js:122-136`) also evaluates the base name (`order-edit` unlocks `crm.order`). Intended according to the comment.

## State after the bug round (2026-10-14)

Fixed on `main` (with tests, except 16):

| Bugs                                                  | Commit                                                                                                             |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 1, 2, 3 (`importWidgets` removed)                     | `e2a58ea` fix(bones): pick the longest registry prefix and react to late registrations                             |
| 4-9, 12-18                                            | `b6745f1` fix(bones): repair date, numeric, password, select, phone and relational select widgets                  |
| 19, 20, 22                                            | `4f1c327` fix(bones): wire the delete buttons, report failed uploads and make upload abort work                    |
| 30, 31, 32 (the file is now `LayoutList2Columns.vue`) | `75cfe3d` fix(forms): list layouts follow the structure and the bones prop                                         |
| 23, 24                                                | `ef9dabf` fix(request): invalidate module lists in every language and version, keep requests alive without a cache |
| 25                                                    | `1b04d7d` fix(user): drop the admin config of the old session on logout                                            |
| 26, 27, 28, 29 (29 documented only)                   | `c5d4ef6` fix(datatable): search on the server from the search box, sort by one column, hide custom columns        |
| 10                                                    | `e7dc666` fix(bones): resolve a per-country string pattern by the address' country                                 |

- **16** (`codeBone`): fixed, but without a test - `codemirror` is only a peer dependency and not installed in the repo.
- **25**: a rest stays open - if the session expires without `logout()` being called, the old module tree stays until the next logout. That needs `fetchConfig` to compare the user.
- **26**: the search only. Column filters don't exist in server mode on purpose (`filterable: false` in `viurColumns.ts`).

On 10: the diagnosis above was wrong. The only pattern dict viur-core sends is `ZIP_CODE_PATTERNS` on `AddressRelSkel.zip_code`, keyed by **country code**, not by language. Fixed by using the `country` of the same address; the message now comes from `pattern-error` (as viur-core sends it). Two viur-core changes go with it:

- `SelectCountryBone` shows the country names in the request language and sorts by them (the German names were in `languages/de.py`, but never found).
- 10 ZIP code patterns had an unescaped `-` in character classes; browsers (`v` flag) silently drop them, so these countries were never checked.

Deferred:

- **21** - the fix changes the init behaviour of `recordBone` and the address widget (branch `feat/address-bone`, which ignores the init on purpose today). A round of its own.

Dropped:

- **11** - not a bug: `sendData` calls `reportValidity()` on the `<form>`, the Web Awesome inputs are form-associated and already block invalid values. `valid=false` from the widget would silently keep the old value when a required field is cleared.

Also: `vitest.config.js` now compiles `wa-*` as custom elements like the apps (`ece3a8f`), `cache.js` satisfies the await rule (`6c7d2cc`).
