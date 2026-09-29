# viur-ui

Vue 3 components and request helpers for [ViUR](https://www.viur.dev).

## Install

```bash
npm install viur-ui
```

Peers: `vue` 3.3+, `pinia`, `vue-i18n`, `@viur/webawesome`, `@vueuse/core`, `vue-router`; for code/text bones also `codemirror`, `@codemirror/language-data`, `ckeditor5`, `@ckeditor/ckeditor5-vue`.

## Vite

```js
import vue from "@vitejs/plugin-vue"

export default {
  plugins: [vue()],
  optimizeDeps: {
    exclude: ["viur-ui"], // ships raw SFCs; pre-bundling duplicates module state in dev
  },
}
```

Env: `VITE_API_URL`, `VITE_DEFAULT_RENDERER` (`json` | `vi`).

## Setup

```js
import "viur-ui/src/webawesomeConfig.js"
import { deTranslations, enTranslations } from "viur-ui"
import { installViurForms } from "viur-ui/src/forms/install.js"

app.use(createPinia())
app.use(createI18n({ legacy: false, locale: "de", messages: { de: deTranslations, en: enTranslations } }))
installViurForms(app) // ViForm, Bone, BoneLabel, … (async)
```

## API

```js
import { useListFetch, useViewFetch, useEditFetch, useConfigStore, notify } from "viur-ui"
```

Full list: [`index.js`](./index.js), types: [`index.d.ts`](./index.d.ts).

## Development

```bash
npm install && npm install --prefix example
npm run story:dev   # Histoire, :6006
npm run test:run    # Vitest
npm run lint
```

## Release

```bash
npm version patch && git push --follow-tags
```

Published by [`release.yml`](./.github/workflows/release.yml) via npm Trusted Publishing. `-alpha` / `-beta` / `-rc` → matching dist-tag, else `latest`.
