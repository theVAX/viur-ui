# Bones Testing & Storybook — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Storybook 8 + Vitest (Portable Stories) + Playwright im `viur-ui` Package einrichten, alle ~22 Bone-Komponenten mit Stories und Tests abdecken.

**Architecture:** Storybook als zentraler Hub — Stories dienen gleichzeitig als Dokumentation, interaktive Sandbox und Test-Fixtures für Vitest (via Portable Stories / `composeStories`). Playwright testet Interaktionen gegen das laufende Storybook. Alle neuen Dateien in JS (kein TypeScript).

**Tech Stack:** Storybook 8 (`@storybook/vue3-vite`), Vitest 2 (bereits vorhanden), `@vue/test-utils`, happy-dom (bereits vorhanden), `@playwright/test`

**Spec:** `docs/specs/2026-03-25-bones-testing-storybook-design.md`

---

## Dateiübersicht

Alle Pfade relativ zu `viur-ui/` (= Package-Root).

```text
viur-ui/
├── .storybook/
│   ├── main.js              NEU — Storybook config (Vite, Addons, staticDirs)
│   ├── preview.js           NEU — boneState decorator, i18n, WebAwesome
│   └── vitest.setup.js      NEU — setProjectAnnotations für Portable Stories
├── vitest.config.js         ÄNDERN — vue-Plugin + Storybook setupFile ergänzen
├── playwright.config.js     NEU
│
├── src/forms/bones/
│   ├── storyHelpers.js      NEU — createBoneStory() Factory
│   ├── booleanBone.stories.js        NEU
│   ├── booleanBone.test.js           NEU
│   ├── booleanBoneChoose.stories.js  NEU
│   ├── booleanBoneChoose.test.js     NEU
│   ├── booleanBoneSelect.stories.js  NEU
│   ├── booleanBoneSelect.test.js     NEU
│   ├── stringBone.stories.js         NEU
│   ├── stringBone.test.js            NEU
│   ├── emailBone.stories.js          NEU
│   ├── emailBone.test.js             NEU
│   ├── keyBone.stories.js            NEU
│   ├── keyBone.test.js               NEU
│   ├── passwordBone.stories.js       NEU
│   ├── passwordBone.test.js          NEU
│   ├── phoneBone.stories.js          NEU
│   ├── phoneBone.test.js             NEU
│   ├── colorBone.stories.js          NEU
│   ├── colorBone.test.js             NEU
│   ├── numericBone.stories.js        NEU
│   ├── numericBone.test.js           NEU
│   ├── dateBone.stories.js           NEU
│   ├── dateBone.test.js              NEU
│   ├── spatialBone.stories.js        NEU
│   ├── spatialBone.test.js           NEU
│   ├── textBone.stories.js           NEU
│   ├── textBone.test.js              NEU
│   ├── selectBone.stories.js         NEU
│   ├── selectBone.test.js            NEU
│   ├── selectBoneChoose.stories.js   NEU
│   ├── selectBoneChoose.test.js      NEU
│   ├── relationalBone.stories.js     NEU
│   ├── relationalBone.test.js        NEU
│   ├── relationalBoneSelect.stories.js  NEU
│   ├── relationalBoneSelect.test.js     NEU
│   ├── fileBone.stories.js           NEU
│   ├── fileBone.test.js              NEU
│   ├── recordBone.stories.js         NEU
│   ├── recordBone.test.js            NEU
│   ├── rawBone.stories.js            NEU
│   ├── rawBone.test.js               NEU
│   ├── codeBone.stories.js           NEU
│   ├── codeBone.test.js              NEU
│   ├── jsonBone.stories.js           NEU
│   ├── jsonBone.test.js              NEU
│   ├── wrapper_multiple.stories.js   NEU
│   ├── wrapper_multiple.test.js      NEU
│   ├── wrapper_nested.stories.js     NEU
│   └── wrapper_nested.test.js        NEU
│
└── tests/e2e/
    ├── boolean.spec.js      NEU — Playwright E2E
    └── string.spec.js       NEU — Playwright E2E
```

---

## Task 1: Dependencies installieren

- [ ] **Schritt 1: Storybook initialisieren**

Ausführen im Package-Root `viur-ui/`:

```bash
npx storybook@latest init --type vue3 --builder vite --skip-install --no-dev
```

> Dies erzeugt `.storybook/main.js` und `.storybook/preview.js` als Ausgangspunkt — diese werden in Task 2 vollständig überschrieben.

- [ ] **Schritt 1b: Generierte Beispieldateien aufräumen**

```bash
rm -rf stories
```

> `storybook init` erzeugt ggf. einen `stories/`-Ordner mit Demo-Komponenten — wird nicht benötigt.

- [ ] **Schritt 2: Fehlende Dependencies installieren**

```bash
npm install --save-dev \
  @storybook/vue3-vite@^8 \
  @storybook/addon-essentials@^8 \
  @storybook/addon-interactions@^8 \
  @vue/test-utils@^2 \
  @playwright/test@^1.40 \
  @vitejs/plugin-vue@^5
```

> `vitest`, `happy-dom` und `vue` sind bereits in `devDependencies` — nicht erneut installieren.

- [ ] **Schritt 3: Playwright Browser installieren**

```bash
npx playwright install chromium
```

- [ ] **Schritt 4: Scripts in `package.json` ergänzen**

Folgende Scripts hinzufügen (bestehende `test` und `test:run` bleiben unverändert):

```json
"storybook":       "storybook dev -p 6006",
"build-storybook": "storybook build",
"test:e2e":        "playwright test",
"test:all":        "vitest run && playwright test"
```

---

## Task 2: Storybook konfigurieren

- [ ] **Schritt 1: `.storybook/main.js` schreiben**

```js
export default {
  stories: ['../src/forms/bones/**/*.stories.js'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/vue3-vite',
    options: {
      vuePluginOptions: {
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag.startsWith('wa-'),
          },
        },
      },
    },
  },
  staticDirs: [
    { from: '../node_modules/@viur/webawesome/dist/assets', to: '/webawesome/assets' },
  ],
}
```

- [ ] **Schritt 2: `.storybook/preview.js` schreiben**

```js
import { provide } from 'vue'
import { createI18n } from 'vue-i18n'
import '../src/webawesomeConfig.js'
import de_translations from '../src/translations/de.js'
import en_translations from '../src/translations/en.js'

const i18n = createI18n({
  locale: 'de',
  messages: { de: de_translations, en: en_translations },
  legacy: false,
})

export const setup = (app) => {
  app.use(i18n)
}

export const decorators = [
  (story, context) => ({
    setup() {
      provide('boneState', {
        readonly:        context.args.readonly ?? false,
        multiple:        context.args.multiple ?? false,
        isEmpty:         context.args.isEmpty ?? false,
        required:        context.args.required ?? false,
        label:           'normal',
        params:          {},
        defaultLanguage: 'de',
        maxlength:       undefined,
        minlength:       undefined,
        errorMessages:   [],
        bonestructure:   context.args.bone ?? {},
      })
      provide('formatString', (skel) => skel?.name ?? String(skel ?? ''))
      provide('mainformState', { skel: {}, errors: {} })
      provide('bonePath', [])
    },
    template: '<story />',
  }),
]
```

- [ ] **Schritt 3: Storybook starten und prüfen**

```bash
npm run storybook
```

Erwartetes Ergebnis: Storybook öffnet sich auf `http://localhost:6006`. Noch keine Stories sichtbar (kommt in Task 4).

---

## Task 3: Vitest und Playwright konfigurieren

- [ ] **Schritt 1: `vitest.config.js` erweitern**

Die bestehende Datei um `plugins` und das zweite `setupFile` ergänzen:

```js
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('wa-'),
        },
      },
    }),
  ],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.js', '.storybook/vitest.setup.js'],
    globals: true,
    env: {
      VITE_API_URL: 'http://api.test',
      VITE_DEFAULT_RENDERER: 'json',
    },
  },
})
```

- [ ] **Schritt 2: `.storybook/vitest.setup.js` schreiben**

```js
import { setProjectAnnotations } from '@storybook/vue3'
import * as globalAnnotations from './preview.js'

setProjectAnnotations(globalAnnotations)
```

- [ ] **Schritt 3: `playwright.config.js` schreiben**

```js
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:6006',
  },
  webServer: {
    command: 'npm run storybook',
    url: 'http://localhost:6006',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
})
```

- [ ] **Schritt 4: Vitest ohne Stories prüfen**

```bash
npm run test:run
```

Erwartetes Ergebnis: Bestehende Tests laufen weiterhin durch — kein Fehler durch neue setupFile.

---

## Task 4: storyHelpers.js + booleanBone (erstes Muster)

- [ ] **Schritt 1: `src/forms/bones/storyHelpers.js` schreiben**

```js
/**
 * Erzeugt eine Standard-Storybook-Meta-Konfiguration für einen Bone.
 * @param {object} component  → Vue-Komponente
 * @param {object} defaults   → { type, value, bone }
 */
export function createBoneStory(component, defaults = {}) {
  return {
    component,
    argTypes: {
      readonly: { control: 'boolean' },
      multiple: { control: 'boolean' },
      isEmpty:  { control: 'boolean' },
      required: { control: 'boolean' },
    },
    args: {
      name:  'testField',
      value: defaults.value ?? null,
      bone:  { type: defaults.type ?? 'string', params: {}, ...(defaults.bone ?? {}) },
    },
  }
}
```

- [ ] **Schritt 2: Failing test schreiben**

```js
// src/forms/bones/booleanBone.test.js
import { mount } from '@vue/test-utils'
import { composeStories } from '@storybook/vue3'
import * as stories from './booleanBone.stories.js'

const { Default, Readonly } = composeStories(stories)

describe('booleanBone', () => {
  test('mountet ohne Fehler und rendert wa-switch', () => {
    const wrapper = mount(Default)
    expect(wrapper.find('wa-switch').exists()).toBe(true)
  })

  test('hat disabled-Attribut im Readonly-Modus', () => {
    const wrapper = mount(Readonly)
    expect(wrapper.find('wa-switch').attributes('disabled')).toBeDefined()
  })
})
```

- [ ] **Schritt 3: Test laufen lassen — muss FEHLSCHLAGEN**

```bash
npm run test:run -- src/forms/bones/booleanBone.test.js
```

Erwartetes Ergebnis: FAIL — `Cannot find module './booleanBone.stories.js'`

- [ ] **Schritt 4: Story schreiben**

```js
// src/forms/bones/booleanBone.stories.js
import BooleanBone from './booleanBone.vue'
import { createBoneStory } from './storyHelpers.js'

export default {
  ...createBoneStory(BooleanBone, { type: 'bool', value: false }),
  title: 'Bones/BooleanBone',
}

export const Default  = {}
export const True     = { args: { value: true } }
export const Readonly = { args: { readonly: true, value: true } }
```

- [ ] **Schritt 5: Test laufen lassen — muss BESTEHEN**

```bash
npm run test:run -- src/forms/bones/booleanBone.test.js
```

Erwartetes Ergebnis: PASS (2 Tests grün)

- [ ] **Schritt 6: Story in Storybook prüfen**

Storybook starten und unter `Bones/BooleanBone` prüfen:
- Default: Leerer Switch
- True: Switch aktiviert
- Readonly: Switch disabled
- Controls Panel zeigt `readonly`, `multiple`, `isEmpty`, `required`

---

## Task 5: Simple Input Bones (stringBone, emailBone, keyBone, passwordBone, phoneBone)

Alle 5 Bones rendern `<wa-input>`.

- [ ] **Schritt 1: Tests schreiben (alle 5)**

```js
// stringBone.test.js
import { mount } from '@vue/test-utils'
import { composeStories } from '@storybook/vue3'
import * as stories from './stringBone.stories.js'

const { Default, Readonly } = composeStories(stories)

describe('stringBone', () => {
  test('rendert wa-input', () => {
    const wrapper = mount(Default)
    expect(wrapper.find('wa-input').exists()).toBe(true)
  })
  test('hat disabled-Attribut im Readonly-Modus', () => {
    const wrapper = mount(Readonly)
    expect(wrapper.find('wa-input').attributes('disabled')).toBeDefined()
  })
})
```

Gleiche Struktur für `emailBone.test.js`, `keyBone.test.js`, `passwordBone.test.js`, `phoneBone.test.js`.

- [ ] **Schritt 2: Tests laufen — müssen FEHLSCHLAGEN**

- [ ] **Schritt 3: Stories schreiben**

```js
// stringBone.stories.js
import StringBone from './stringBone.vue'
import { createBoneStory } from './storyHelpers.js'
export default { ...createBoneStory(StringBone, { type: 'str', value: '' }), title: 'Bones/StringBone' }
export const Default   = {}
export const WithValue = { args: { value: 'Beispieltext' } }
export const Readonly  = { args: { readonly: true, value: 'Nur lesen' } }
```

```js
// emailBone.stories.js
import EmailBone from './emailBone.vue'
import { createBoneStory } from './storyHelpers.js'
export default { ...createBoneStory(EmailBone, { type: 'str', value: '' }), title: 'Bones/EmailBone' }
export const Default   = {}
export const WithValue = { args: { value: 'test@example.com' } }
export const Readonly  = { args: { readonly: true, value: 'test@example.com' } }
```

```js
// keyBone.stories.js
import KeyBone from './keyBone.vue'
import { createBoneStory } from './storyHelpers.js'
export default { ...createBoneStory(KeyBone, { type: 'key', value: '' }), title: 'Bones/KeyBone' }
export const Default  = {}
export const Readonly = { args: { readonly: true, value: 'abc123' } }
```

```js
// passwordBone.stories.js
import PasswordBone from './passwordBone.vue'
import { createBoneStory } from './storyHelpers.js'
export default { ...createBoneStory(PasswordBone, { type: 'str', value: '' }), title: 'Bones/PasswordBone' }
export const Default  = {}
export const Readonly = { args: { readonly: true } }
```

```js
// phoneBone.stories.js
import PhoneBone from './phoneBone.vue'
import { createBoneStory } from './storyHelpers.js'
export default { ...createBoneStory(PhoneBone, { type: 'str', value: '' }), title: 'Bones/PhoneBone' }
export const Default   = {}
export const WithValue = { args: { value: '+49 30 12345678' } }
export const Readonly  = { args: { readonly: true, value: '+49 30 12345678' } }
```

- [ ] **Schritt 4: Tests laufen — müssen BESTEHEN**

---

## Task 6: numericBone, dateBone, spatialBone

- [ ] **Schritt 1: Tests schreiben**

```js
// numericBone.test.js
import { mount } from '@vue/test-utils'
import { composeStories } from '@storybook/vue3'
import * as stories from './numericBone.stories.js'
const { Default, Readonly } = composeStories(stories)
describe('numericBone', () => {
  test('rendert wa-input', () => {
    expect(mount(Default).find('wa-input').exists()).toBe(true)
  })
  test('hat disabled im Readonly-Modus', () => {
    expect(mount(Readonly).find('wa-input').attributes('disabled')).toBeDefined()
  })
})
```

```js
// dateBone.test.js / spatialBone.test.js — Smoke-Tests
import { mount } from '@vue/test-utils'
import { composeStories } from '@storybook/vue3'
import * as stories from './dateBone.stories.js'
const { Default } = composeStories(stories)
describe('dateBone', () => {
  test('mountet ohne Fehler', () => { expect(() => mount(Default)).not.toThrow() })
})
```

- [ ] **Schritt 2: Tests laufen — müssen FEHLSCHLAGEN**

- [ ] **Schritt 3: Stories schreiben**

```js
// numericBone.stories.js
import NumericBone from './numericBone.vue'
import { createBoneStory } from './storyHelpers.js'
export default { ...createBoneStory(NumericBone, { type: 'numeric', value: null }), title: 'Bones/NumericBone' }
export const Default   = {}
export const WithValue = { args: { value: 42 } }
export const Readonly  = { args: { readonly: true, value: 42 } }
```

```js
// dateBone.stories.js
import DateBone from './dateBone.vue'
import { createBoneStory } from './storyHelpers.js'
export default { ...createBoneStory(DateBone, { type: 'date', value: null }), title: 'Bones/DateBone' }
export const Default  = {}
export const WithDate = { args: { value: '2026-03-25' } }
export const Readonly = { args: { readonly: true, value: '2026-03-25' } }
```

```js
// spatialBone.stories.js
import SpatialBone from './spatialBone.vue'
import { createBoneStory } from './storyHelpers.js'
export default { ...createBoneStory(SpatialBone, { type: 'spatial', value: null }), title: 'Bones/SpatialBone' }
export const Default  = {}
export const Readonly = { args: { readonly: true } }
```

- [ ] **Schritt 4: Tests laufen — müssen BESTEHEN**

---

## Task 7: colorBone

- [ ] **Schritt 1: Test schreiben**

```js
// colorBone.test.js
import { mount } from '@vue/test-utils'
import { composeStories } from '@storybook/vue3'
import * as stories from './colorBone.stories.js'
const { Default } = composeStories(stories)
describe('colorBone', () => {
  test('mountet ohne Fehler', () => { expect(() => mount(Default)).not.toThrow() })
})
```

- [ ] **Schritt 2: Test laufen — muss FEHLSCHLAGEN**

- [ ] **Schritt 3: Story schreiben**

```js
// colorBone.stories.js
import ColorBone from './colorBone.vue'
import { createBoneStory } from './storyHelpers.js'
export default { ...createBoneStory(ColorBone, { type: 'str', value: '' }), title: 'Bones/ColorBone' }
export const Default   = {}
export const WithColor = { args: { value: '#ff5500' } }
export const Readonly  = { args: { readonly: true, value: '#ff5500' } }
```

- [ ] **Schritt 4: Test laufen — muss BESTEHEN**

---

## Task 8: textBone (CKEditor)

> textBone verwendet CKEditor 5, das in happy-dom nicht vollständig rendert. Der Test prüft nur ob die Komponente ohne Fehler mountet.

- [ ] **Schritt 1: Test schreiben**

```js
// textBone.test.js
import { mount } from '@vue/test-utils'
import { composeStories } from '@storybook/vue3'
import * as stories from './textBone.stories.js'
const { Default } = composeStories(stories)
describe('textBone', () => {
  test('mountet ohne Fehler', () => {
    expect(() => mount(Default)).not.toThrow()
  })
})
```

- [ ] **Schritt 2: Test laufen — muss FEHLSCHLAGEN**

- [ ] **Schritt 3: Story schreiben**

```js
// textBone.stories.js
import TextBone from './textBone.vue'
import { createBoneStory } from './storyHelpers.js'
export default { ...createBoneStory(TextBone, { type: 'text', value: '' }), title: 'Bones/TextBone' }
export const Default  = {}
export const WithText = { args: { value: '<p>Beispieltext</p>' } }
export const Readonly = { args: { readonly: true, value: '<p>Nur lesen</p>' } }
```

- [ ] **Schritt 4: Test laufen — muss BESTEHEN**

---

## Task 9: Select Bones (selectBone, selectBoneChoose, booleanBoneChoose, booleanBoneSelect)

Select-Bones brauchen `bone.values` (die Auswahloptionen) in den Story-Args.

- [ ] **Schritt 1: Tests schreiben (alle 4 als Smoke-Tests)**

```js
// selectBone.test.js
import { mount } from '@vue/test-utils'
import { composeStories } from '@storybook/vue3'
import * as stories from './selectBone.stories.js'
const { Default } = composeStories(stories)
describe('selectBone', () => {
  test('mountet ohne Fehler', () => { expect(() => mount(Default)).not.toThrow() })
})
```

Gleiche Struktur für `selectBoneChoose.test.js`, `booleanBoneChoose.test.js`, `booleanBoneSelect.test.js`.

- [ ] **Schritt 2: Tests laufen — müssen FEHLSCHLAGEN**

- [ ] **Schritt 3: Stories schreiben**

```js
// selectBone.stories.js
import SelectBone from './selectBone.vue'
import { createBoneStory } from './storyHelpers.js'
const SELECT_BONE = { type: 'select', values: { opt_a: 'Option A', opt_b: 'Option B', opt_c: 'Option C' } }
export default { ...createBoneStory(SelectBone, { type: 'select', value: null, bone: SELECT_BONE }), title: 'Bones/SelectBone' }
export const Default  = {}
export const Selected = { args: { value: 'opt_a' } }
export const Readonly = { args: { readonly: true, value: 'opt_b' } }
```

```js
// selectBoneChoose.stories.js
import SelectBoneChoose from './selectBoneChoose.vue'
import { createBoneStory } from './storyHelpers.js'
const SELECT_BONE = { type: 'select', values: { opt_a: 'Option A', opt_b: 'Option B' } }
export default { ...createBoneStory(SelectBoneChoose, { type: 'select', value: null, bone: SELECT_BONE }), title: 'Bones/SelectBoneChoose' }
export const Default  = {}
export const Readonly = { args: { readonly: true, value: 'opt_a' } }
```

```js
// booleanBoneChoose.stories.js
import BooleanBoneChoose from './booleanBoneChoose.vue'
import { createBoneStory } from './storyHelpers.js'
export default { ...createBoneStory(BooleanBoneChoose, { type: 'bool', value: null }), title: 'Bones/BooleanBoneChoose' }
export const Default  = {}
export const True     = { args: { value: true } }
export const Readonly = { args: { readonly: true, value: true } }
```

```js
// booleanBoneSelect.stories.js
import BooleanBoneSelect from './booleanBoneSelect.vue'
import { createBoneStory } from './storyHelpers.js'
export default { ...createBoneStory(BooleanBoneSelect, { type: 'bool', value: null }), title: 'Bones/BooleanBoneSelect' }
export const Default  = {}
export const True     = { args: { value: true } }
export const Readonly = { args: { readonly: true, value: true } }
```

- [ ] **Schritt 4: Tests laufen — müssen BESTEHEN**

---

## Task 10: Relational Bones (relationalBone, relationalBoneSelect)

> relationalBone lädt Einträge vom ViUR-Backend. In Storybook wird kein echtes Backend benötigt — die Story zeigt nur statische Zustände.

- [ ] **Schritt 1: relationalBone.vue lesen**

Prüfen: Wie werden Daten geladen (fetch, store, inject)? Die Story muss ggf. Datenladung mocken.

- [ ] **Schritt 2: Tests schreiben**

```js
// relationalBone.test.js
import { mount } from '@vue/test-utils'
import { composeStories } from '@storybook/vue3'
import * as stories from './relationalBone.stories.js'
const { Default } = composeStories(stories)
describe('relationalBone', () => {
  test('mountet ohne Fehler', () => { expect(() => mount(Default)).not.toThrow() })
})
```

Gleiche Struktur für `relationalBoneSelect.test.js`.

- [ ] **Schritt 3: Tests laufen — müssen FEHLSCHLAGEN**

- [ ] **Schritt 4: Stories schreiben**

```js
// relationalBone.stories.js
import RelationalBone from './relationalBone.vue'
import { createBoneStory } from './storyHelpers.js'
const RELATIONAL_BONE = { type: 'relational', module: 'product', format: '$(name)', params: {} }
export default { ...createBoneStory(RelationalBone, { type: 'relational', value: null, bone: RELATIONAL_BONE }), title: 'Bones/RelationalBone' }
export const Default  = {}
export const Readonly = { args: { readonly: true, value: { dest: { key: 'abc', name: 'Produkt A' } } } }
```

```js
// relationalBoneSelect.stories.js
import RelationalBoneSelect from './relationalBoneSelect.vue'
import { createBoneStory } from './storyHelpers.js'
const RELATIONAL_BONE = { type: 'relational', module: 'product', format: '$(name)', params: {} }
export default { ...createBoneStory(RelationalBoneSelect, { type: 'relational', value: null, bone: RELATIONAL_BONE }), title: 'Bones/RelationalBoneSelect' }
export const Default  = {}
export const Readonly = { args: { readonly: true, value: { dest: { key: 'abc', name: 'Produkt A' } } } }
```

- [ ] **Schritt 5: Tests laufen — müssen BESTEHEN**

---

## Task 11: fileBone

> fileBone führt Upload-Requests durch. In Storybook werden diese nicht ausgeführt — die Story zeigt UI-Zustände.

- [ ] **Schritt 1: Test schreiben**

```js
// fileBone.test.js
import { mount } from '@vue/test-utils'
import { composeStories } from '@storybook/vue3'
import * as stories from './fileBone.stories.js'
const { Default, WithFile } = composeStories(stories)
describe('fileBone', () => {
  test('mountet ohne Fehler', () => { expect(() => mount(Default)).not.toThrow() })
  test('mountet mit Datei-Wert', () => { expect(() => mount(WithFile)).not.toThrow() })
})
```

- [ ] **Schritt 2: Test laufen — muss FEHLSCHLAGEN**

- [ ] **Schritt 3: Story schreiben**

```js
// fileBone.stories.js
import FileBone from './fileBone.vue'
import { createBoneStory } from './storyHelpers.js'
const FILE_VALUE = { dest: { key: 'file123', name: 'bild.jpg', mimetype: 'image/jpeg', downloadUrl: '/static/bild.jpg' } }
export default { ...createBoneStory(FileBone, { type: 'file', value: null }), title: 'Bones/FileBone' }
export const Default  = {}
export const WithFile = { args: { value: FILE_VALUE } }
export const Readonly = { args: { readonly: true, value: FILE_VALUE } }
```

- [ ] **Schritt 4: Test laufen — muss BESTEHEN**

---

## Task 12: rawBone, codeBone, jsonBone

> Diese Bones verwenden CodeMirror bzw. JsonEditorVue. In happy-dom als Smoke-Tests behandelt.

- [ ] **Schritt 1: Tests schreiben**

```js
// rawBone.test.js
import { mount } from '@vue/test-utils'
import { composeStories } from '@storybook/vue3'
import * as stories from './rawBone.stories.js'
const { Default } = composeStories(stories)
describe('rawBone', () => {
  test('mountet ohne Fehler', () => { expect(() => mount(Default)).not.toThrow() })
})
```

Gleiche Struktur für `codeBone.test.js` und `jsonBone.test.js`.

- [ ] **Schritt 2: Tests laufen — müssen FEHLSCHLAGEN**

- [ ] **Schritt 3: Stories schreiben**

```js
// rawBone.stories.js
import RawBone from './rawBone.vue'
import { createBoneStory } from './storyHelpers.js'
export default { ...createBoneStory(RawBone, { type: 'raw', value: '' }), title: 'Bones/RawBone' }
export const Default  = {}
export const Readonly = { args: { readonly: true, value: 'raw content' } }
```

```js
// codeBone.stories.js
import CodeBone from './codeBone.vue'
import { createBoneStory } from './storyHelpers.js'
export default { ...createBoneStory(CodeBone, { type: 'str', value: '' }), title: 'Bones/CodeBone' }
export const Default  = {}
export const WithCode = { args: { value: 'const x = 1' } }
export const Readonly = { args: { readonly: true, value: 'const x = 1' } }
```

```js
// jsonBone.stories.js
import JsonBone from './jsonBone.vue'
import { createBoneStory } from './storyHelpers.js'
export default { ...createBoneStory(JsonBone, { type: 'json', value: null }), title: 'Bones/JsonBone' }
export const Default  = {}
export const WithJson = { args: { value: { key: 'value' } } }
export const Readonly = { args: { readonly: true, value: { key: 'value' } } }
```

- [ ] **Schritt 4: Tests laufen — müssen BESTEHEN**

---

## Task 13: recordBone

> recordBone ist ein komplexer Bone der Sub-Bones einbettet. Vor dem Schreiben der Story `recordBone.vue` lesen.

- [ ] **Schritt 1: recordBone.vue lesen** — verstehen welche Props/Context erwartet werden.

- [ ] **Schritt 2: Test schreiben**

```js
// recordBone.test.js
import { mount } from '@vue/test-utils'
import { composeStories } from '@storybook/vue3'
import * as stories from './recordBone.stories.js'
const { Default } = composeStories(stories)
describe('recordBone', () => {
  test('mountet ohne Fehler', () => { expect(() => mount(Default)).not.toThrow() })
})
```

- [ ] **Schritt 3: Test laufen — muss FEHLSCHLAGEN**

- [ ] **Schritt 4: Story schreiben**

```js
// recordBone.stories.js
import RecordBone from './recordBone.vue'
import { createBoneStory } from './storyHelpers.js'
const RECORD_BONE = {
  type: 'record',
  using: {
    title: { type: 'str', descr: 'Titel', required: false },
  },
}
export default { ...createBoneStory(RecordBone, { type: 'record', value: null, bone: RECORD_BONE }), title: 'Bones/RecordBone' }
export const Default  = {}
export const Readonly = { args: { readonly: true } }
```

- [ ] **Schritt 5: Test laufen — muss BESTEHEN**

---

## Task 14: Wrapper Bones (wrapper_multiple, wrapper_nested)

- [ ] **Schritt 1: wrapper_multiple.vue und wrapper_nested.vue lesen** — Slots/Props/Injects verstehen.

- [ ] **Schritt 2: Tests schreiben**

```js
// wrapper_multiple.test.js
import { mount } from '@vue/test-utils'
import { composeStories } from '@storybook/vue3'
import * as stories from './wrapper_multiple.stories.js'
const { Default } = composeStories(stories)
describe('wrapper_multiple', () => {
  test('mountet ohne Fehler', () => { expect(() => mount(Default)).not.toThrow() })
})
```

```js
// wrapper_nested.test.js
import { mount } from '@vue/test-utils'
import { composeStories } from '@storybook/vue3'
import * as stories from './wrapper_nested.stories.js'
const { Default } = composeStories(stories)
describe('wrapper_nested', () => {
  test('mountet ohne Fehler', () => { expect(() => mount(Default)).not.toThrow() })
})
```

- [ ] **Schritt 3: Tests laufen — müssen FEHLSCHLAGEN**

- [ ] **Schritt 4: Stories schreiben**

```js
// wrapper_multiple.stories.js
import WrapperMultiple from './wrapper_multiple.vue'
import { createBoneStory } from './storyHelpers.js'
export default { ...createBoneStory(WrapperMultiple, { type: 'str', value: [] }), title: 'Bones/Wrapper/Multiple' }
export const Default  = { args: { multiple: true } }
export const Readonly = { args: { multiple: true, readonly: true } }
```

```js
// wrapper_nested.stories.js
import WrapperNested from './wrapper_nested.vue'
import { createBoneStory } from './storyHelpers.js'
export default { ...createBoneStory(WrapperNested, { type: 'record', value: null }), title: 'Bones/Wrapper/Nested' }
export const Default  = {}
export const Readonly = { args: { readonly: true } }
```

- [ ] **Schritt 5: Tests laufen — müssen BESTEHEN**

---

## Task 15: Alle Tests — Gesamtcheck

- [ ] **Schritt 1: Alle Vitest-Tests laufen**

```bash
npm run test:run
```

Erwartetes Ergebnis: Alle Tests PASS, ~44+ Tests grün

- [ ] **Schritt 2: Storybook-Build prüfen**

```bash
npm run build-storybook
```

Erwartetes Ergebnis: Kein Build-Fehler, `storybook-static/` erstellt

---

## Task 16: Playwright E2E Tests

- [ ] **Schritt 1: `tests/e2e/boolean.spec.js` schreiben**

```js
import { test, expect } from '@playwright/test'

test.describe('BooleanBone', () => {
  test('Switch ist sichtbar', async ({ page }) => {
    await page.goto('/iframe.html?id=bones-booleanbone--default&viewMode=story')
    await expect(page.locator('wa-switch')).toBeVisible()
  })

  test('Switch hat disabled-Attribut im Readonly-Modus', async ({ page }) => {
    await page.goto('/iframe.html?id=bones-booleanbone--readonly&viewMode=story')
    await expect(page.locator('wa-switch')).toHaveAttribute('disabled')
  })

  test('User kann Switch aktivieren', async ({ page }) => {
    await page.goto('/iframe.html?id=bones-booleanbone--default&viewMode=story')
    const sw = page.locator('wa-switch')
    await sw.click()
    await expect(sw).toHaveAttribute('checked')
  })
})
```

- [ ] **Schritt 2: `tests/e2e/string.spec.js` schreiben**

```js
import { test, expect } from '@playwright/test'

test.describe('StringBone', () => {
  test('Input ist sichtbar', async ({ page }) => {
    await page.goto('/iframe.html?id=bones-stringbone--default&viewMode=story')
    await expect(page.locator('wa-input')).toBeVisible()
  })

  test('Input ist disabled im Readonly-Modus', async ({ page }) => {
    await page.goto('/iframe.html?id=bones-stringbone--readonly&viewMode=story')
    await expect(page.locator('wa-input')).toHaveAttribute('disabled')
  })
})
```

- [ ] **Schritt 3: E2E Tests laufen**

```bash
npm run test:e2e
```

Erwartetes Ergebnis: Alle E2E-Tests PASS

---

## Finale Prüfliste

- [ ] `npm run test:run` — alle Vitest-Tests grün
- [ ] `npm run build-storybook` — Build erfolgreich
- [ ] `npm run test:e2e` — Playwright-Tests grün
- [ ] Storybook zeigt alle Bones unter `Bones/` in der Sidebar
- [ ] Controls-Panel zeigt `readonly`, `multiple`, `isEmpty`, `required` für jede Story
