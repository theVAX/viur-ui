# Bones Testing & Storybook — Design Spec

**Date:** 2026-03-25
**Package:** `viur-ui` (root)
**Status:** Draft

---

## Übersicht

Einführung von Storybook (Dokumentation + interaktive Sandbox), Vitest (Component-Tests) und Playwright (E2E-Tests) in das `viur-ui`-Package. Ziel ist vollständige Abdeckung aller Bone-Komponenten mit minimalem Boilerplate durch gemeinsam genutzte Test-Fixtures (Portable Stories). **Alle neuen Dateien in JS (kein TypeScript).**

---

## Kontext

### Was sind Bones?

Bones sind Vue 3-Komponenten in `src/forms/bones/`, die ViUR-Datentypen (String, Boolean, Date, File, Relation etc.) als interaktive Formularfelder rendern. Es gibt ~22 eigenständige Bone-Komponenten (Blatt-Bones), alle **flach** in einem Verzeichnis:

- **Text/Input:** stringBone, emailBone, phoneBone, passwordBone, keyBone, rawBone
- **Rich Text:** textBone (CKEditor)
- **Numerisch:** numericBone, dateBone, spatialBone
- **Auswahl:** selectBone, selectBoneChoose, booleanBone, booleanBoneSelect, booleanBoneChoose, colorBone
- **Komplex:** relationalBone, relationalBoneSelect, fileBone, recordBone, codeBone, jsonBone
- **Wrapper:** wrapper_multiple.vue, wrapper_nested.vue

> **Hinweis:** `bone.vue`, `boneLabel.vue`, `boneActions.vue`, `filterBone.vue`, `actionbar/`- und `assistant/`-Unterverzeichnisse sind keine eigenständigen Test-Targets.

### Technische Besonderheiten

- **`inject("boneState")`:** Alle Bones lesen Konfiguration über Vue's Dependency Injection. Das vollständige `boneState`-Objekt enthält u.a. `readonly`, `multiple`, `isEmpty`, `required`, `label`, `params`, `defaultLanguage`, `maxlength`, `minlength`, `errorMessages`, `bonestructure`. Fehlendes `errorMessages` führt zu `TypeError` beim Rendern.
- **`inject("formatString")`:** Funktion zur Anzeige-Formatierung relationaler Werte (relationalBone, relationalBoneSelect, relationalBar).
- **`inject("mainformState")` / `inject("bonePath")`:** Für Nested-Form-Bones (recordBone, wrapper_nested, relationalBone).
- **`inject("addMultipleEntry")` / `inject("removeMultipleEntries")` / `inject("updateValue")`:** Für Multiple-Wrapper und Action Bars.
- **`@viur/webawesome` Web Components:** UI-Elemente (`<wa-input>`, `<wa-button>`, `<wa-switch>` etc.) sind Custom Elements aus dem `@viur/webawesome`-Package. Die Komponenten werden über `src/webawesomeConfig.js` registriert.
- **vue-i18n:** Alle User-facing Strings über `useI18n()` / `$t()`. Translations liegen als `.js`-Module vor (`src/translations/de.js`, `src/translations/en.js`).

---

## Gewählter Ansatz: Storybook-zentriert mit Portable Stories (Track A)

Stories sind die **einzige Quelle** für Test-Fixtures. Vitest importiert Stories direkt via Portable Stories (`composeStories`). Playwright testet gegen das laufende Storybook.

**Track A (manual Vitest + happy-dom)** wird verwendet — **nicht** `@storybook/experimental-addon-test`, da dieses inkompatibel mit `happy-dom` ist und einen anderen Integrations-Ansatz verfolgt (Vitest Browser Mode).

```text
viur-ui/
├── .storybook/
│   ├── main.js            → Storybook-Config (Vite-Builder, Addons, staticDirs)
│   ├── preview.js         → Global Setup (i18n, boneState-Decorator, WebAwesome)
│   └── vitest.setup.js    → Portable-Stories-Bridge (setProjectAnnotations)
├── vitest.config.js       → erweitern: vue-Plugin + Storybook setupFiles
├── playwright.config.js
│
├── src/forms/bones/
│   ├── storyHelpers.js    → createBoneStory() Factory-Helper
│   ├── stringBone.vue
│   ├── stringBone.stories.js   → Story = Docs + Test-Fixture (co-located)
│   ├── stringBone.test.js      → importiert Story, läuft in Vitest
│   └── ... (~22 Bones, gleiche Struktur)
│
└── tests/e2e/
    ├── boolean.spec.js    → Playwright E2E gegen Storybook
    └── string.spec.js
```

---

## Architektur-Details

### 1. Storybook-Konfiguration

**`.storybook/main.js`**

```js
export default {
  stories: ['../src/forms/bones/**/*.stories.js'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    // NICHT @storybook/experimental-addon-test — inkompatibel mit Track A
  ],
  framework: {
    name: '@storybook/vue3-vite',
    options: {
      // WebAwesome wa-* Tags als Custom Elements deklarieren (keine Vue-Warnung)
      vuePluginOptions: {
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag.startsWith('wa-'),
          },
        },
      },
    },
  },
  // WebAwesome Assets unter /webawesome servieren
  staticDirs: [
    { from: '../node_modules/@viur/webawesome/dist/assets', to: '/webawesome/assets' },
  ],
}
```

**`.storybook/preview.js`**

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

// i18n als App-Plugin installieren (einzige korrekte Methode in Storybook 8 / Vue 3)
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
        errorMessages:   [],   // kritisch: fehlt → TypeError beim Rendern
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

> **Hinweis:** `webawesomeConfig.js` importiert alle `wa-*` Custom Elements und setzt den Base Path. Es reicht, diese Datei einmalig in `preview.js` zu importieren.

---

### 2. Story-Pattern

**`src/forms/bones/storyHelpers.js`** — gemeinsamer Factory-Helper:

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

**Bone-Story (Beispiel `booleanBone.stories.js`):**

```js
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

**Mindest-Stories pro Bone:**

| Story | Zweck |
| --- | --- |
| `Default` | Leer, editierbar — Smoke-Test |
| `WithValue` | Bone mit befülltem Wert |
| `Readonly` | Readonly-Modus korrekt |
| `Multiple` | (falls Bone multiple unterstützt) |

~4 Stories × ~22 Bones = **~88 Stories**

---

### 3. Vitest-Konfiguration (Portable Stories / Track A)

Die bestehende `vitest.config.js` wird **erweitert** (nicht ersetzt) — sie definiert bereits `happy-dom` und `VITE_API_URL`.

**`vitest.config.js` (aktualisiert):**

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

**`.storybook/vitest.setup.js`:**

```js
import { setProjectAnnotations } from '@storybook/vue3'
import * as globalAnnotations from './preview.js'

setProjectAnnotations(globalAnnotations)
```

**Scope von Vitest-Tests (happy-dom Limitation):**

> happy-dom unterstützt Custom Elements / Shadow DOM nur eingeschränkt. WebAwesome-Komponenten (`wa-switch`, `wa-input` etc.) registrieren sich als unbekannte Elemente und feuern keine WebAwesome-spezifischen Events. Vitest-Tests beschränken sich daher auf:
>
> - **Smoke-Tests:** Komponente mountet ohne Fehler
> - **Attribut-Prüfungen:** Host-Element-Attribute (z.B. `disabled` auf `wa-switch`, `wa-input`) werden korrekt reflektiert
>
> Interaction-Tests (Klicks, `wa-change`-Events) gehören in Playwright E2E-Tests.

**Test-Pattern (Beispiel `booleanBone.test.js`):**

```js
import { mount } from '@vue/test-utils'
import { composeStories } from '@storybook/vue3'
import * as stories from './booleanBone.stories.js'

// Storybook 8: composeStories gibt Story-Komponenten zurück — kein Default()-Aufruf
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

---

### 4. Playwright-Konfiguration

**`playwright.config.js`:**

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

**E2E-Test-Pattern:**

```js
// tests/e2e/boolean.spec.js
import { test, expect } from '@playwright/test'

test.describe('BooleanBone', () => {
  test('User kann Switch aktivieren', async ({ page }) => {
    await page.goto('/iframe.html?id=bones-booleanbone--default&viewMode=story')
    const sw = page.locator('wa-switch')
    await sw.click()
    await expect(sw).toHaveAttribute('checked')
  })

  test('Readonly — Switch ist disabled', async ({ page }) => {
    await page.goto('/iframe.html?id=bones-booleanbone--readonly&viewMode=story')
    await expect(page.locator('wa-switch')).toHaveAttribute('disabled')
  })
})
```

---

### 5. Storybook-Sidebar-Kategorisierung

Alle Bones liegen flach — die Sidebar spiegelt das wider:

```text
Bones/
├── BooleanBone
├── BooleanBoneChoose
├── BooleanBoneSelect
├── ColorBone
├── CodeBone
├── DateBone
├── EmailBone
├── FileBone
├── JsonBone
├── KeyBone
├── NumericBone
├── PasswordBone
├── PhoneBone
├── RawBone
├── RecordBone
├── RelationalBone
├── RelationalBoneSelect
├── SelectBone
├── SelectBoneChoose
├── SpatialBone
├── StringBone
├── TextBone
└── Wrapper/
    ├── Multiple
    └── Nested
```

---

### 6. npm-Scripts (Ergänzung zu `package.json`)

```json
{
  "scripts": {
    "storybook":       "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "test":            "vitest",
    "test:run":        "vitest run",
    "test:e2e":        "playwright test",
    "test:all":        "vitest run && playwright test"
  }
}
```

> `test` und `test:run` existieren bereits — nur `storybook`, `build-storybook`, `test:e2e`, `test:all` sind neu.

---

## Neue Dependencies

`vitest`, `happy-dom` und `vue` sind bereits in `devDependencies` vorhanden. Nur die Storybook- und Test-Utils-Pakete kommen neu hinzu:

```json
{
  "devDependencies": {
    "@storybook/vue3-vite":          "^8.0.0",
    "@storybook/addon-essentials":   "^8.0.0",
    "@storybook/addon-interactions": "^8.0.0",
    "@vue/test-utils":               "^2.0.0",
    "@playwright/test":              "^1.40.0",
    "@vitejs/plugin-vue":            "^5.0.0"
  }
}
```

Installation direkt im Package-Root (kein Monorepo):

```bash
npm install --save-dev \
  @storybook/vue3-vite@^8 \
  @storybook/addon-essentials@^8 \
  @storybook/addon-interactions@^8 \
  @vue/test-utils@^2 \
  @playwright/test@^1.40 \
  @vitejs/plugin-vue@^5
```

---

## Workflow

```text
Dev-Alltag:
  npm run storybook     → Bone live ausprobieren, Args tunen, Doku lesen

Vor Commit / CI:
  npm run test:run      → Vitest (Smoke + Attribut-Tests, ~Sekunden)
  npm run test:e2e      → Playwright gegen Storybook (Interaction-Tests, langsamer)
```

---

## Abgelehnte Alternativen

| Ansatz | Warum abgelehnt |
| --- | --- |
| Vitest + Storybook getrennt | doppelter boneState-Setup-Code |
| Storybook + Playwright only (kein Vitest) | keine isolierten Smoke-Tests |
| `@storybook/experimental-addon-test` (Track B) | inkompatibel mit happy-dom; ersetzt composeStories durch Vitest Browser Mode — anderer Ansatz, nicht kombinierbar mit Track A |
| TypeScript | Projekt-Konvention: alles in JS |

---

## Änderungen gegenüber vi-vue-utils Spec

| Alt (vi-vue-utils) | Neu (viur-ui) |
| --- | --- |
| `packages/vi-vue-utils/src/` | `viur-ui/` (root) |
| `bones/edit/default/` (Unterordner) | `src/forms/bones/` (flach) |
| `@viur/shoelace` / `sl-*` | `@viur/webawesome` / `wa-*` |
| Shoelace `setBasePath` in preview.js | `webawesomeConfig.js` import |
| `staticDirs` → `/shoelace/assets` | `staticDirs` → `/webawesome/assets` |
| Monorepo `--workspace` npm install | direktes `npm install` im Root |
| vitest.config.js neu erstellen | bestehende vitest.config.js erweitern |
| `provide('mainformState')` fehlte | jetzt im Decorator enthalten |
