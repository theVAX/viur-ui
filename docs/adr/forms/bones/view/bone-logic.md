---
covers: [src.forms.bones.view.boneLogic.boneLogic, src.forms.bones.view.boneLogic.getBoneValue]
status: accepted
---

## Seam

Text of a bone value outside a form (tables, detail pages):

```js
import { boneLogic } from "viur-ui"
const { getBoneValue } = boneLogic(skel, structure, showflags, selectedLang, t)
getBoneValue("created", "date") // "date" | "time" for date bones
```

Returns a string, `"-"` for empty. Multilingual bones are joined with
`", "`; `showflags` prefixes flags from `languageMap`, `selectedLang`
limits to one language. Pass `t` (vue-i18n) for the bool texts.

## Rules

- Render the result as text (`{{ }}`, `v-text`). It has HTML entities
  decoded (`Utils.unescape`), so `v-html` on it is an XSS sink.
- Pass the structure as a dict keyed by bone name; run a v1 list through
  `normalizeStructure` first.

## Traps

- Refs are unwrapped by checking `constructor.name === "RefImpl"`. A
  `computed` (`ComputedRefImpl`) is not unwrapped, and a minifier that
  renames classes probably breaks the check. Pass plain or `reactive`
  objects.
- A numeric `0` renders as `""`, neither `"0"` nor `"-"`.
- A multilingual bone whose value is `null` throws a `TypeError`.
- Without `t`, bool values are the German "Ja" / "Nein".
- Dates use the browser locale, not the app's i18n locale.
- Select values are matched by `toString()`; an unknown value gives `"-"`.

## See also

- `docs/adr/forms.md` - overview of the form building blocks.
