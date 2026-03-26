---
name: Storybook configuration fixes
description: Key fixes applied to make Storybook 8 + Vue 3 + vue-i18n v11 work in viur-ui
type: project
---

## Fix 1: @vitejs/plugin-vue must be explicit in viteFinal

`vuePluginOptions` in `framework.options` is IGNORED by `@storybook/vue3-vite` v8. The Vue plugin must be added explicitly in `viteFinal`:

```js
async viteFinal(config) {
  return mergeConfig(config, {
    plugins: [vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith('wa-') } } })],
  })
}
```

## Fix 2: $t not available in component templates

`setup(app)` in preview.js may receive a different app instance than the one rendering stories. Setting globalProperties or mixins on it doesn't reliably propagate.

**Fix**: In the decorator's `setup()`, use `getCurrentInstance()` to get the actual rendering app:

```js
import { getCurrentInstance } from 'vue'

export const decorators = [
  (story, context) => ({
    setup() {
      const instance = getCurrentInstance()
      if (instance) {
        const app = instance.appContext.app
        if (!app.config.globalProperties.$t) {
          app.config.globalProperties.$t = (key, ...args) => i18n.global.t(key, ...args)
        }
      }
      // ...provide calls...
    },
    template: '<story />',
  }),
]
```

**Why:** `setup(app)` is called with a "global" app config object, but stories may be rendered in a fresh app instance. The decorator runs inside the actual render context.

## Fix 3: Optional peer deps (codemirror, ckeditor5)

`codemirror` and `ckeditor5` are optional peer deps. In Storybook dev mode, missing packages cause Vite to substitute `/@id/__vite-optional-peer-dep:*` stubs with no named exports.

**Fix A**: Install codemirror as devDependency (recommended for stories that actually use the editor):
```
npm install --save-dev codemirror @codemirror/language-data --legacy-peer-deps
```

**Fix B**: For packages that remain optional (ckeditor5), use `resolve.alias` in `viteFinal` pointing to mock files in `.storybook/__mocks__/`. String aliases match exact import paths; list sub-path aliases BEFORE the base package alias:

```js
alias: [
  { find: 'ckeditor5/dist/translations/de.js', replacement: mock('ckeditor5-translations-de.js') },
  { find: 'ckeditor5/dist/ckeditor5.css',       replacement: mock('empty.css') },
  { find: 'ckeditor5',                           replacement: mock('ckeditor5.js') },
  { find: '@ckeditor/ckeditor5-vue',             replacement: mock('ckeditor5-vue.js') },
]
```

**Why:** `resolve.alias` is processed in `vite:pre-alias` (earliest possible), before Vite's optional peer dep substitution. Virtual module plugins (`resolveId` hook) run too late.
