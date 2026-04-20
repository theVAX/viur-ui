# Legacy vs. Neu — Vergleich & Contract Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zwei-Config-System aufsetzen: `histoire.legacy.config.js` zeigt alle Form-Schichten als Split-View (Legacy Shoelace ↔ Neu WebAwesome), Playwright Contract Tests sichern funktionale Parität ab.

**Architecture:** Eine Histoire-Instanz lädt beide Bibliotheken. `CompareWrapper.vue` rendert jede Schicht in einem Legacy-Panel (`sl-*`) und einem Neu-Panel (`wa-*`) nebeneinander. Playwright-Specs laufen parametrisiert gegen beide Panels — Legacy muss zuerst grün werden (Vertrags-Baseline), Neu-Panel zeigt offene Deltas.

**Tech Stack:** Vue 3, Histoire, `@viur/shoelace` (sl-*), `@viur/webawesome` (wa-*), Playwright (Chromium only)

---

## Datei-Übersicht

| Neu | Verantwortung |
|---|---|
| `src/legacy/shoelaceConfig.js` | Lädt alle benötigten Shoelace-Komponenten |
| `histoire.legacy.config.js` | Dev-only Histoire-Config für Split-View |
| `stories/legacy/setup.js` | Pinia, i18n, globale Komponenten für legacy config |
| `stories/legacy/CompareWrapper.vue` | Split-View für Bone-Ebene (alle Props, Event-Log im DOM) |
| `stories/legacy/CompareFormWrapper.vue` | Split-View für ViForm-Ebene |
| `stories/legacy/Bones/*.story.vue` | 17 Bone-Stories (StringBone als Referenz, dann 16 weitere) |
| `stories/legacy/ViForm.story.vue` | ViForm-Vergleich |
| `stories/legacy/Layouts/*.story.vue` | 3 Layout-Stories |
| `stories/legacy/Wrappers/*.story.vue` | 2 Wrapper-Stories |
| `stories/legacy/Actionbars/*.story.vue` | 3 Actionbar-Stories |
| `tests/contract/playwright.config.ts` | Playwright-Config, startet histoire.legacy via webServer |
| `tests/contract/bone-widgets/*.spec.ts` | 17 Bone-Widget-Specs (je eine pro Bone) |
| `tests/contract/bone-wrapper/*.spec.ts` | bone-label, errors, wrapper-multiple, wrapper-nested |
| `tests/contract/layouts/*.spec.ts` | layout-list, layout-category |
| `tests/contract/actionbars/*.spec.ts` | default-bar, file-bar, relational-bar |
| `tests/contract/viForm/*.spec.ts` | init, validation |

| Modifiziert | Änderung |
|---|---|
| `package.json` | Scripts `histoire:legacy` und `test:contract` |
| `.gitignore` | `.superpowers/` eintragen |
| `stories/public/shoelace/` | Shoelace-Assets hineinkopieren (einmalig) |

---

## Task 1: Shoelace-Assets + shoelaceConfig.js

**Files:**
- Create: `src/legacy/shoelaceConfig.js`
- Modify: `stories/public/shoelace/` (Assets hineinkopieren)

- [ ] **Schritt 1: Shoelace-Assets in stories/public/ kopieren**

```bash
mkdir -p stories/public/shoelace
cp -r node_modules/@viur/shoelace/dist/assets stories/public/shoelace/assets
```

Prüfen ob Assets da sind:
```bash
ls stories/public/shoelace/assets/icons | head -5
```
Erwartet: Dateinamen wie `activity.svg`, `alarm.svg`, …

- [ ] **Schritt 2: `src/legacy/shoelaceConfig.js` erstellen**

Inhalt aus `example/src/shoelaceConfig.js` kopieren — diese Datei existiert bereits und ist vollständig:

```bash
cp example/src/shoelaceConfig.js src/legacy/shoelaceConfig.js
```

Prüfen ob die Datei korrekt kopiert wurde:

```bash
head -5 src/legacy/shoelaceConfig.js
```

Erwartet: `import "@viur/shoelace/dist/themes/viur.css"`

- [ ] **Schritt 3: Commit**

```bash
git add src/legacy/shoelaceConfig.js stories/public/shoelace/
git commit -m "feat(legacy-compare): add Shoelace assets and config"
```

---

## Task 2: histoire.legacy.config.js

**Files:**
- Create: `histoire.legacy.config.js`

- [ ] **Schritt 1: Datei erstellen**

```js
import { defineConfig } from 'histoire'
import { HstVue } from '@histoire/plugin-vue'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [HstVue()],
  setupFile: './stories/legacy/setup.js',
  storyMatch: ['stories/legacy/**/*.story.vue'],
  vite: {
    publicDir: 'stories/public',
    server: {
      port: 6007,
    },
    plugins: [
      {
        name: 'histoire-mock-request',
        enforce: 'pre',
        resolveId(id) {
          if (/\/request\/index\.js$/.test(id)) {
            return path.resolve(__dirname, 'stories/mocks/request.js')
          }
        },
      },
      vue({
        template: {
          compilerOptions: {
            // Beide Web-Component-Bibliotheken erlauben
            isCustomElement: (tag) => tag.startsWith('wa-') || tag.startsWith('sl-'),
          },
        },
      }),
    ],
    resolve: {
      alias: [
        { find: '@viur/vue-utils', replacement: path.resolve(__dirname, 'src/legacy') },
        { find: '@ckeditor/ckeditor5-vue', replacement: path.resolve(__dirname, 'example/node_modules/@ckeditor/ckeditor5-vue') },
        { find: 'ckeditor5', replacement: path.resolve(__dirname, 'example/node_modules/ckeditor5') },
        { find: 'codemirror', replacement: path.resolve(__dirname, 'example/node_modules/codemirror') },
        { find: '@codemirror/language-data', replacement: path.resolve(__dirname, 'example/node_modules/@codemirror/language-data') },
        { find: '@viur/webawesome', replacement: path.resolve(__dirname, 'example/node_modules/@viur/webawesome') },
        { find: 'logics-js', replacement: path.resolve(__dirname, 'example/node_modules/logics-js') },
      ],
      dedupe: ['vue', 'pinia', 'vue-i18n', '@vueuse/core', 'vue-draggable-plus'],
    },
  },
})
```

- [ ] **Schritt 2: Testen ob die Config valide ist (noch keine Stories)**

```bash
npx histoire dev --config histoire.legacy.config.js
```

Erwartet: Server startet auf Port 6007, leere Sidebar (keine Stories). Mit Ctrl+C beenden.

- [ ] **Schritt 3: Commit**

```bash
git add histoire.legacy.config.js
git commit -m "feat(legacy-compare): add histoire.legacy.config.js"
```

---

## Task 3: stories/legacy/setup.js

**Files:**
- Create: `stories/legacy/setup.js`

- [ ] **Schritt 1: Datei erstellen**

```js
import '../../src/webawesomeConfig.js'
import '../../src/legacy/shoelaceConfig.js'

import { defineSetupVue3 } from '@histoire/plugin-vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import de from '../../src/translations/de.js'
import en from '../../src/translations/en.js'

// Neue Bone-Komponenten
import Bone from '../../src/forms/bones/bone.vue'
import BoneLabel from '../../src/forms/bones/boneLabel.vue'
import WrapperMultiple from '../../src/forms/bones/wrapper_multiple.vue'
import WrapperNested from '../../src/forms/bones/wrapper_nested.vue'

// Legacy Bone-Komponenten
import LegacyBone from '../../src/legacy/bones/edit/bone.vue'
import LegacyBoneLabel from '../../src/legacy/bones/edit/boneLabel.vue'
import LegacyWrapperMultiple from '../../src/legacy/bones/edit/wrapper_multiple.vue'
import LegacyWrapperNested from '../../src/legacy/bones/edit/wrapper_nested.vue'

export const setupVue3 = defineSetupVue3(({ app }) => {
  // Neue Komponenten global registrieren
  app.component('Bone', Bone)
  app.component('bone-label', BoneLabel)
  app.component('wrapper-multiple', WrapperMultiple)
  app.component('wrapper-nested', WrapperNested)

  // Legacy-Komponenten global registrieren (mit Prefix zur Unterscheidung)
  app.component('LegacyBone', LegacyBone)
  app.component('legacy-bone-label', LegacyBoneLabel)
  app.component('legacy-wrapper-multiple', LegacyWrapperMultiple)
  app.component('legacy-wrapper-nested', LegacyWrapperNested)

  app.use(createPinia())
  app.use(
    createI18n({
      legacy: false,
      locale: 'de',
      fallbackLocale: 'en',
      messages: { de, en },
    })
  )
})
```

> **Hinweis:** Sowohl legacy `bone.vue` als auch neue `bone.vue` registrieren `bone-label`, `wrapper-multiple`, `wrapper-nested` intern. Da Vue globale Komponenten bevorzugt, müssen diese als globale Komponenten registriert werden. Wenn Konflikte entstehen (Vue warnt über doppelte Registrierung), die internen Importe in `src/legacy/bones/edit/bone.vue` prüfen und ggf. anpassen.

- [ ] **Schritt 2: histoire.legacy.config.js starten und Konsole prüfen**

```bash
npx histoire dev --config histoire.legacy.config.js
```

Erwartet: Kein `[Vue warn]` wegen fehlender Komponenten. Mit Ctrl+C beenden.

- [ ] **Schritt 3: Commit**

```bash
git add stories/legacy/setup.js
git commit -m "feat(legacy-compare): add stories/legacy/setup.js with dual component registration"
```

---

## Task 4: CompareWrapper.vue

**Files:**
- Create: `stories/legacy/CompareWrapper.vue`

Dieser Wrapper rendert Legacy (links) und Neu (rechts) nebeneinander mit denselben Props. Der Event-Log wird als DOM-Element gespeichert (kein Histoire `logEvent`), damit Playwright ihn auslesen kann.

- [ ] **Schritt 1: Datei erstellen**

```vue
<template>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding: 1rem; max-width: 1200px;">

    <!-- Legacy Panel -->
    <div>
      <div style="font-size: 0.75rem; font-weight: bold; color: #f97316; margin-bottom: 0.5rem; text-transform: uppercase;">
        Legacy (Shoelace)
      </div>
      <div data-testid="legacy-panel">
        <LegacyBone
          :is="legacyBoneComponent"
          :name="boneName"
          :structure="structure"
          :skel="skel"
          :errors="errors"
          :label="label"
          :languages="languages"
          @change="onLegacyChange"
        />
      </div>
      <div
        data-testid="legacy-event-log"
        style="margin-top: 0.5rem; font-size: 0.7rem; font-family: monospace; background: #111; color: #aaa; padding: 0.5rem; border-radius: 4px; min-height: 2rem; max-height: 8rem; overflow-y: auto;"
      >
        <div v-for="(ev, i) in legacyEvents" :key="i">{{ ev }}</div>
      </div>
    </div>

    <!-- Neu Panel -->
    <div>
      <div style="font-size: 0.75rem; font-weight: bold; color: #3b82f6; margin-bottom: 0.5rem; text-transform: uppercase;">
        Neu (WebAwesome)
      </div>
      <div data-testid="new-panel">
        <Bone
          :is="newBoneComponent"
          :name="boneName"
          :structure="structure"
          :skel="skel"
          :errors="errors"
          :label="label"
          :languages="languages"
          @change="onNewChange"
        />
      </div>
      <div
        data-testid="new-event-log"
        style="margin-top: 0.5rem; font-size: 0.7rem; font-family: monospace; background: #111; color: #aaa; padding: 0.5rem; border-radius: 4px; min-height: 2rem; max-height: 8rem; overflow-y: auto;"
      >
        <div v-for="(ev, i) in newEvents" :key="i">{{ ev }}</div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, markRaw, ref } from 'vue'
import { getBoneWidget as getLegacyBoneWidget } from '@viur/vue-utils/bones/edit/index.js'
import { getBoneWidget as getNewBoneWidget } from '../../src/forms/bones/index.js'

const props = defineProps({
  boneName: { type: String, required: true },
  boneType: { type: String, required: true },
  structure: { type: Object, required: true },
  skel: { type: Object, default: () => ({}) },
  errors: { type: Array, default: () => [] },
  label: { type: String, default: 'normal' },
  languages: { type: Array, default: null },
})

const legacyBoneComponent = computed(() => markRaw(getLegacyBoneWidget(props.boneType)))
const newBoneComponent = computed(() => markRaw(getNewBoneWidget(props.boneType)))

const legacyEvents = ref([])
const newEvents = ref([])

function onLegacyChange(...args) {
  legacyEvents.value.push(JSON.stringify(args))
}

function onNewChange(...args) {
  newEvents.value.push(JSON.stringify(args))
}
</script>
```

- [ ] **Schritt 2: Commit**

```bash
git add stories/legacy/CompareWrapper.vue
git commit -m "feat(legacy-compare): add CompareWrapper.vue with dual panel and DOM event log"
```

---

## Task 5: Erste Bone-Story — StringBone (Referenz-Implementierung)

**Files:**
- Create: `stories/legacy/Bones/StringBone.story.vue`

Diese Story ist das Muster für alle anderen 16 Bones. Sie nutzt dieselben Fixtures wie `stories/bones/StringBone.story.vue`.

- [ ] **Schritt 1: Datei erstellen**

```vue
<script setup>
import CompareWrapper from '../CompareWrapper.vue'
import { createStructure } from '../../fixtures/string.js'
</script>

<template>
  <Story title="Legacy Bones/StringBone">

    <Variant title="Default" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="title"
        bone-type="str"
        :structure="createStructure()"
        :skel="{ title: 'Beispieltext' }"
      />
    </Variant>

    <Variant title="Readonly" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="title"
        bone-type="str"
        :structure="createStructure({ readonly: true })"
        :skel="{ title: 'Nur lesen' }"
      />
    </Variant>

    <Variant title="Required + Fehler" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="title"
        bone-type="str"
        :structure="createStructure({ required: true })"
        :skel="{ title: '' }"
        :errors="[{ fieldPath: ['title'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant title="Multiple" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="title"
        bone-type="str"
        :structure="createStructure({ multiple: true })"
        :skel="{ title: ['Wert 1', 'Wert 2'] }"
      />
    </Variant>

    <Variant title="Multilang" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="title"
        bone-type="str"
        :structure="createStructure({ languages: ['de', 'en'] })"
        :skel="{ title: { de: 'Deutsch', en: 'English' } }"
        :languages="['de', 'en']"
      />
    </Variant>

    <Variant
      title="Playground"
      :init-state="() => ({ structure: createStructure(), showError: false })"
    >
      <template #default="{ state }">
        <CompareWrapper
          bone-name="title"
          bone-type="str"
          :structure="state.structure"
          :skel="{ title: 'Beispieltext' }"
          :errors="state.showError ? [{ fieldPath: ['title'], errorMessage: 'field_not_set', severity: 3 }] : []"
        />
      </template>
      <template #controls="{ state }">
        <HstCheckbox v-model="state.structure.title.readonly" title="Readonly" />
        <HstCheckbox v-model="state.structure.title.required" title="Required" />
        <HstCheckbox v-model="state.showError" title="Mit Fehler" />
      </template>
    </Variant>

  </Story>
</template>
```

- [ ] **Schritt 2: Histoire starten und Story visuell prüfen**

```bash
npx histoire dev --config histoire.legacy.config.js
```

Öffne http://localhost:6007 → "Legacy Bones/StringBone" → "Playground". Prüfen:
- Links: `sl-input` (Shoelace-Stil)
- Rechts: `wa-input` (WebAwesome-Stil)
- Beide reagieren auf Readonly/Required-Controls gleichzeitig
- Event-Log unter beiden Panels füllt sich beim Tippen

Mit Ctrl+C beenden.

- [ ] **Schritt 3: Commit**

```bash
git add stories/legacy/Bones/StringBone.story.vue
git commit -m "feat(legacy-compare): add StringBone story as reference implementation"
```

---

## Task 6: Playwright installieren + playwright.config.ts

**Files:**
- Create: `tests/contract/playwright.config.ts`
- Modify: `package.json` (scripts hinzufügen)

- [ ] **Schritt 1: Playwright installieren**

```bash
npm install --save-dev @playwright/test
npx playwright install chromium
```

- [ ] **Schritt 2: `tests/contract/playwright.config.ts` erstellen**

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:6007',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npx histoire dev --config histoire.legacy.config.js',
    port: 6007,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
```

- [ ] **Schritt 3: Scripts in package.json eintragen**

In `package.json` unter `"scripts"` folgende zwei Zeilen ergänzen:

```json
"histoire:legacy": "histoire dev --config histoire.legacy.config.js",
"test:contract": "playwright test --config tests/contract/playwright.config.ts"
```

- [ ] **Schritt 4: Commit**

```bash
git add tests/contract/playwright.config.ts package.json
git commit -m "feat(legacy-compare): add Playwright config and npm scripts"
```

---

## Task 7: Erste Contract-Spec — StringBone

**Files:**
- Create: `tests/contract/bone-widgets/string-bone.spec.ts`

Zuerst gegen das Legacy-Panel prüfen (muss grün sein = Baseline). Danach dieselben Tests gegen das Neu-Panel — initial können diese rot sein, das zeigt offene Deltas.

- [ ] **Schritt 1: Histoire-URL für die Playground-Variante herausfinden**

```bash
npx histoire dev --config histoire.legacy.config.js &
sleep 5
curl -s http://localhost:6007 | head -5
```

Im Browser http://localhost:6007 öffnen → StringBone → Playground → URL in der Adressleiste notieren. Format ist `/?storyId=<id>&variantId=<id>`. Beispiel: `/?storyId=legacy-bones-stringbone--playground`. Die genaue URL für den nächsten Schritt verwenden.

```bash
kill %1
```

- [ ] **Schritt 2: `tests/contract/bone-widgets/string-bone.spec.ts` erstellen**

Den `STORY_URL` Wert aus Schritt 1 eintragen:

```ts
import { test, expect } from '@playwright/test'

// URL der Playground-Variante aus histoire.legacy.config.js
// Format: /?storyId=<story-id>&variantId=<variant-id>
// Im Browser http://localhost:6007 prüfen und hier eintragen:
const STORY_URL = '/?storyId=legacy-bones-stringbone--playground'

const panels = ['legacy', 'new'] as const

for (const panel of panels) {
  test.describe(`StringBone [${panel}]`, () => {

    test('feuert initial change-Event beim Mount', async ({ page }) => {
      await page.goto(STORY_URL)
      const log = page.locator(`[data-testid="${panel}-event-log"]`)
      // Initial-Event wird in onMounted emittiert
      await expect(log).not.toBeEmpty()
    })

    test('feuert change-Event beim Tippen', async ({ page }) => {
      await page.goto(STORY_URL)
      const panelEl = page.locator(`[data-testid="${panel}-panel"]`)
      await panelEl.locator('input').fill('Testinhalt')
      const log = page.locator(`[data-testid="${panel}-event-log"]`)
      await expect(log).toContainText('Testinhalt')
    })

    test('input ist disabled bei readonly', async ({ page }) => {
      // Readonly-Variante direkt laden
      const readonlyUrl = STORY_URL.replace('playground', 'readonly')
      await page.goto(readonlyUrl)
      const panelEl = page.locator(`[data-testid="${panel}-panel"]`)
      const input = panelEl.locator('input')
      await expect(input).toBeDisabled()
    })

    test('event-log enthält boneName als erstes Argument', async ({ page }) => {
      await page.goto(STORY_URL)
      const panelEl = page.locator(`[data-testid="${panel}-panel"]`)
      await panelEl.locator('input').fill('x')
      const log = page.locator(`[data-testid="${panel}-event-log"]`)
      // change(name, value, lang, index, valid) — erstes Arg ist boneName "title"
      await expect(log).toContainText('"title"')
    })

  })
}
```

- [ ] **Schritt 3: Tests gegen Legacy-Panel laufen lassen (müssen grün sein)**

```bash
npm run test:contract -- --grep "StringBone \[legacy\]"
```

Erwartet: alle 4 Tests grün. Wenn ein Test rot ist → Test-Erwartung anpassen, NICHT die Legacy-Komponente.

- [ ] **Schritt 4: Tests gegen Neu-Panel laufen lassen (zeigen offene Deltas)**

```bash
npm run test:contract -- --grep "StringBone \[new\]"
```

Erwartet: Tests grün oder rot. Rote Tests zeigen, was noch angepasst werden muss. Noch nichts fixen — das ist der Arbeitsauftrag für die eigentliche Migration.

- [ ] **Schritt 5: Alle Tests zusammen**

```bash
npm run test:contract -- --grep "StringBone"
```

- [ ] **Schritt 6: Commit**

```bash
git add tests/contract/bone-widgets/string-bone.spec.ts
git commit -m "test(contract): add StringBone baseline contract spec"
```

---

## Task 8: Alle restlichen 16 Bone-Stories

**Files:**
- Create: `stories/legacy/Bones/BooleanBone.story.vue`
- Create: `stories/legacy/Bones/ColorBone.story.vue`
- Create: `stories/legacy/Bones/DateBone.story.vue`
- Create: `stories/legacy/Bones/EmailBone.story.vue`
- Create: `stories/legacy/Bones/FileBone.story.vue`
- Create: `stories/legacy/Bones/KeyBone.story.vue`
- Create: `stories/legacy/Bones/NumericBone.story.vue`
- Create: `stories/legacy/Bones/PasswordBone.story.vue`
- Create: `stories/legacy/Bones/PhoneBone.story.vue`
- Create: `stories/legacy/Bones/RawBone.story.vue`
- Create: `stories/legacy/Bones/RecordBone.story.vue`
- Create: `stories/legacy/Bones/RelationalBone.story.vue`
- Create: `stories/legacy/Bones/SelectBone.story.vue`
- Create: `stories/legacy/Bones/SpatialBone.story.vue`
- Create: `stories/legacy/Bones/TextBone.story.vue`
- Create: `stories/legacy/Bones/CodeBone.story.vue`

Das Muster ist identisch zu Task 5. Jede Story importiert die entsprechende Fixture und verwendet `CompareWrapper`.

Fixture-Importe und bone-type-Werte pro Bone:

| Story-Datei | Fixture-Import | boneType | boneName |
|---|---|---|---|
| BooleanBone.story.vue | `../../fixtures/boolean.js` | `'bool'` | `'active'` |
| ColorBone.story.vue | `../../fixtures/color.js` | `'color'` | `'farbe'` |
| DateBone.story.vue | `../../fixtures/date.js` | `'date'` | `'datum'` |
| EmailBone.story.vue | `../../fixtures/email.js` | `'str.email'` | `'email'` |
| FileBone.story.vue | `../../fixtures/file.js` | `'relational.tree.leaf.file.file'` | `'bild'` |
| KeyBone.story.vue | `../../fixtures/key.js` | `'key'` | `'key'` |
| NumericBone.story.vue | `../../fixtures/numeric.js` | `'numeric'` | `'preis'` |
| PasswordBone.story.vue | `../../fixtures/password.js` | `'password'` | `'passwort'` |
| PhoneBone.story.vue | `../../fixtures/phone.js` | `'str.phone'` | `'telefon'` |
| RawBone.story.vue | `../../fixtures/raw.js` | `'raw'` | `'daten'` |
| RecordBone.story.vue | `../../fixtures/record.js` | `'record'` | `'adresse'` |
| RelationalBone.story.vue | `../../fixtures/relational.js` | `'relational'` | `'autor'` |
| SelectBone.story.vue | `../../fixtures/select.js` | `'select'` | `'kategorie'` |
| SpatialBone.story.vue | `../../fixtures/spatial.js` | `'spatial'` | `'position'` |
| TextBone.story.vue | `../../fixtures/text.js` | `'text'` | `'inhalt'` |
| CodeBone.story.vue | (keine eigene Fixture, nutze `raw` mit `type: 'raw.code.python'`) | `'raw.code.python'` | `'code'` |

- [ ] **Schritt 1: BooleanBone.story.vue erstellen (Beispiel für das Muster)**

```vue
<script setup>
import CompareWrapper from '../CompareWrapper.vue'
import { createStructure } from '../../fixtures/boolean.js'
</script>

<template>
  <Story title="Legacy Bones/BooleanBone">

    <Variant title="Default" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="active"
        bone-type="bool"
        :structure="createStructure()"
        :skel="{ active: true }"
      />
    </Variant>

    <Variant title="Readonly" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="active"
        bone-type="bool"
        :structure="createStructure({ readonly: true })"
        :skel="{ active: false }"
      />
    </Variant>

    <Variant title="Required + Fehler" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="active"
        bone-type="bool"
        :structure="createStructure({ required: true })"
        :skel="{ active: null }"
        :errors="[{ fieldPath: ['active'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant
      title="Playground"
      :init-state="() => ({ structure: createStructure(), showError: false })"
    >
      <template #default="{ state }">
        <CompareWrapper
          bone-name="active"
          bone-type="bool"
          :structure="state.structure"
          :skel="{ active: true }"
          :errors="state.showError ? [{ fieldPath: ['active'], errorMessage: 'field_not_set', severity: 3 }] : []"
        />
      </template>
      <template #controls="{ state }">
        <HstCheckbox v-model="state.structure.active.readonly" title="Readonly" />
        <HstCheckbox v-model="state.structure.active.required" title="Required" />
        <HstCheckbox v-model="state.showError" title="Mit Fehler" />
      </template>
    </Variant>

  </Story>
</template>
```

- [ ] **Schritt 2: Alle anderen 15 Story-Dateien nach demselben Muster erstellen**

Das Muster aus Schritt 1 für jede Zeile aus der Tabelle oben wiederholen. `boneName` ist der erste Schlüssel im `skel`-Objekt aus der jeweiligen Fixture — im Zweifel das Fixture lesen (`cat stories/fixtures/<name>.js`).

Bei Bones ohne `multiple`-Support (z.B. KeyBone, SpatialBone) die Multiple-Variante weglassen.

- [ ] **Schritt 3: Histoire starten und alle Stories prüfen**

```bash
npx histoire dev --config histoire.legacy.config.js
```

Alle 17 Bones in der Sidebar prüfen — beide Panels sollen rendern ohne Konsolen-Fehler.

- [ ] **Schritt 4: Commit**

```bash
git add stories/legacy/Bones/
git commit -m "feat(legacy-compare): add all 17 bone comparison stories"
```

---

## Task 9: Alle restlichen 16 Bone-Widget-Specs

**Files:**
- Create: `tests/contract/bone-widgets/boolean-bone.spec.ts`
- Create: `tests/contract/bone-widgets/color-bone.spec.ts`
- Create: `tests/contract/bone-widgets/date-bone.spec.ts`
- Create: `tests/contract/bone-widgets/email-bone.spec.ts`
- Create: `tests/contract/bone-widgets/file-bone.spec.ts`
- Create: `tests/contract/bone-widgets/key-bone.spec.ts`
- Create: `tests/contract/bone-widgets/numeric-bone.spec.ts`
- Create: `tests/contract/bone-widgets/password-bone.spec.ts`
- Create: `tests/contract/bone-widgets/phone-bone.spec.ts`
- Create: `tests/contract/bone-widgets/raw-bone.spec.ts`
- Create: `tests/contract/bone-widgets/record-bone.spec.ts`
- Create: `tests/contract/bone-widgets/relational-bone.spec.ts`
- Create: `tests/contract/bone-widgets/select-bone.spec.ts`
- Create: `tests/contract/bone-widgets/spatial-bone.spec.ts`
- Create: `tests/contract/bone-widgets/text-bone.spec.ts`
- Create: `tests/contract/bone-widgets/code-bone.spec.ts`

Das Muster ist identisch zu Task 7. Jede Spec prüft:
1. Initial-Event beim Mount
2. `disabled` bei readonly
3. `boneName` als erstes Argument im Event-Log

Für Bones die keine Text-Eingabe haben (BooleanBone, ColorBone, SelectBone, etc.) den "Tippen"-Test durch einen passenden Klick-Test ersetzen.

- [ ] **Schritt 1: boolean-bone.spec.ts erstellen (Beispiel für nicht-text-basierte Bones)**

```ts
import { test, expect } from '@playwright/test'

// URL im Browser http://localhost:6007 prüfen und anpassen
const STORY_URL = '/?storyId=legacy-bones-booleanbone--playground'

const panels = ['legacy', 'new'] as const

for (const panel of panels) {
  test.describe(`BooleanBone [${panel}]`, () => {

    test('feuert initial change-Event beim Mount', async ({ page }) => {
      await page.goto(STORY_URL)
      const log = page.locator(`[data-testid="${panel}-event-log"]`)
      await expect(log).not.toBeEmpty()
    })

    test('input ist disabled bei readonly', async ({ page }) => {
      const readonlyUrl = STORY_URL.replace('playground', 'readonly')
      await page.goto(readonlyUrl)
      const panelEl = page.locator(`[data-testid="${panel}-panel"]`)
      // BooleanBone rendert als checkbox oder ähnliches
      const interactable = panelEl.locator('input, [role="checkbox"], wa-checkbox, sl-checkbox').first()
      await expect(interactable).toBeDisabled()
    })

    test('event-log enthält boneName als erstes Argument', async ({ page }) => {
      await page.goto(STORY_URL)
      const log = page.locator(`[data-testid="${panel}-event-log"]`)
      await expect(log).toContainText('"active"')
    })

  })
}
```

- [ ] **Schritt 2: Alle anderen 15 Specs nach demselben Muster erstellen**

`boneName` und `STORY_URL` für jede Spec anpassen (aus der Tabelle in Task 8).

- [ ] **Schritt 3: Alle Legacy-Panel-Tests laufen lassen (müssen grün sein)**

```bash
npm run test:contract -- --grep "\[legacy\]"
```

Erwartet: alle Legacy-Tests grün. Rote Tests → Spec-Erwartung korrigieren.

- [ ] **Schritt 4: Commit**

```bash
git add tests/contract/bone-widgets/
git commit -m "test(contract): add all 17 bone-widget contract specs"
```

---

## Task 10: Bone-Wrapper-Stories + Specs (bone-label, errors)

**Files:**
- Create: `stories/legacy/Wrappers/BoneLabel.story.vue`
- Create: `stories/legacy/Wrappers/ErrorDisplay.story.vue`
- Create: `tests/contract/bone-wrapper/bone-label.spec.ts`
- Create: `tests/contract/bone-wrapper/error-display.spec.ts`

- [ ] **Schritt 1: BoneLabel.story.vue erstellen**

```vue
<script setup>
import CompareWrapper from '../CompareWrapper.vue'
import { createStructure } from '../../fixtures/string.js'
</script>

<template>
  <Story title="Legacy Wrappers/BoneLabel">

    <Variant title="Normal" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="title"
        bone-type="str"
        label="normal"
        :structure="createStructure()"
        :skel="{ title: 'Test' }"
      />
    </Variant>

    <Variant title="Required" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="title"
        bone-type="str"
        label="normal"
        :structure="createStructure({ required: true })"
        :skel="{ title: 'Test' }"
      />
    </Variant>

    <Variant title="Label hidden" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="title"
        bone-type="str"
        label="hide"
        :structure="createStructure()"
        :skel="{ title: 'Test' }"
      />
    </Variant>

    <Variant title="Label top" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="title"
        bone-type="str"
        label="top"
        :structure="createStructure()"
        :skel="{ title: 'Test' }"
      />
    </Variant>

  </Story>
</template>
```

- [ ] **Schritt 2: ErrorDisplay.story.vue erstellen**

```vue
<script setup>
import CompareWrapper from '../CompareWrapper.vue'
import { createStructure } from '../../fixtures/string.js'
</script>

<template>
  <Story title="Legacy Wrappers/ErrorDisplay">

    <Variant title="Kein Fehler" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="title"
        bone-type="str"
        :structure="createStructure()"
        :skel="{ title: '' }"
      />
    </Variant>

    <Variant title="Mit Fehler" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="title"
        bone-type="str"
        :structure="createStructure({ required: true })"
        :skel="{ title: '' }"
        :errors="[{ fieldPath: ['title'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

  </Story>
</template>
```

- [ ] **Schritt 3: bone-label.spec.ts erstellen**

```ts
import { test, expect } from '@playwright/test'

const NORMAL_URL = '/?storyId=legacy-wrappers-bonelabel--normal'
const REQUIRED_URL = '/?storyId=legacy-wrappers-bonelabel--required'
const HIDDEN_URL = '/?storyId=legacy-wrappers-bonelabel--label-hidden'

const panels = ['legacy', 'new'] as const

for (const panel of panels) {
  test.describe(`BoneLabel [${panel}]`, () => {

    test('zeigt descr-Text als Label', async ({ page }) => {
      await page.goto(NORMAL_URL)
      const panelEl = page.locator(`[data-testid="${panel}-panel"]`)
      // "Titel" ist der descr-Wert aus der String-Fixture
      await expect(panelEl.locator('label, .label-bone')).toContainText('Titel')
    })

    test('zeigt * bei required', async ({ page }) => {
      await page.goto(REQUIRED_URL)
      const panelEl = page.locator(`[data-testid="${panel}-panel"]`)
      await expect(panelEl).toContainText('*')
    })

    test('kein Label bei label=hide', async ({ page }) => {
      await page.goto(HIDDEN_URL)
      const panelEl = page.locator(`[data-testid="${panel}-panel"]`)
      await expect(panelEl.locator('label, .label-bone')).toHaveCount(0)
    })

  })
}
```

- [ ] **Schritt 4: error-display.spec.ts erstellen**

```ts
import { test, expect } from '@playwright/test'

const NO_ERROR_URL = '/?storyId=legacy-wrappers-errordisplay--kein-fehler'
const ERROR_URL = '/?storyId=legacy-wrappers-errordisplay--mit-fehler'

const panels = ['legacy', 'new'] as const

for (const panel of panels) {
  test.describe(`ErrorDisplay [${panel}]`, () => {

    test('kein Fehler-Element ohne Fehler', async ({ page }) => {
      await page.goto(NO_ERROR_URL)
      const panelEl = page.locator(`[data-testid="${panel}-panel"]`)
      await expect(panelEl.locator('.error-msg, [data-user-invalid]')).toHaveCount(0)
    })

    test('Fehler-Element bei übergebenen errors', async ({ page }) => {
      await page.goto(ERROR_URL)
      const panelEl = page.locator(`[data-testid="${panel}-panel"]`)
      // Entweder .error-msg oder data-user-invalid auf dem Input
      const hasError = await panelEl.locator('.error-msg, [data-user-invalid="true"]').count()
      expect(hasError).toBeGreaterThan(0)
    })

  })
}
```

- [ ] **Schritt 5: Legacy-Tests laufen lassen (müssen grün sein)**

```bash
npm run test:contract -- --grep "BoneLabel \[legacy\]|ErrorDisplay \[legacy\]"
```

- [ ] **Schritt 6: Commit**

```bash
git add stories/legacy/Wrappers/ tests/contract/bone-wrapper/
git commit -m "feat(legacy-compare): add bone-label and error-display stories and specs"
```

---

## Task 11: WrapperMultiple + WrapperNested Stories + Specs

**Files:**
- Create: `stories/legacy/Wrappers/WrapperMultiple.story.vue`
- Create: `stories/legacy/Wrappers/WrapperNested.story.vue`
- Create: `tests/contract/bone-wrapper/wrapper-multiple.spec.ts`
- Create: `tests/contract/bone-wrapper/wrapper-nested.spec.ts`

- [ ] **Schritt 1: WrapperMultiple.story.vue erstellen**

```vue
<script setup>
import CompareWrapper from '../CompareWrapper.vue'
import { createStructure } from '../../fixtures/string.js'
</script>

<template>
  <Story title="Legacy Wrappers/WrapperMultiple">

    <Variant title="Mit 2 Einträgen" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="title"
        bone-type="str"
        :structure="createStructure({ multiple: true })"
        :skel="{ title: ['Erster Eintrag', 'Zweiter Eintrag'] }"
      />
    </Variant>

    <Variant title="Leer (kein Eintrag)" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="title"
        bone-type="str"
        :structure="createStructure({ multiple: true })"
        :skel="{ title: [] }"
      />
    </Variant>

    <Variant title="Readonly" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="title"
        bone-type="str"
        :structure="createStructure({ multiple: true, readonly: true })"
        :skel="{ title: ['Eintrag 1'] }"
      />
    </Variant>

  </Story>
</template>
```

- [ ] **Schritt 2: WrapperNested.story.vue erstellen**

```vue
<script setup>
import CompareWrapper from '../CompareWrapper.vue'
import { createStructure } from '../../fixtures/record.js'
</script>

<template>
  <Story title="Legacy Wrappers/WrapperNested">

    <Variant title="Default" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="adresse"
        bone-type="record"
        :structure="createStructure()"
        :skel="{ adresse: {} }"
      />
    </Variant>

  </Story>
</template>
```

- [ ] **Schritt 3: wrapper-multiple.spec.ts erstellen**

```ts
import { test, expect } from '@playwright/test'

const TWO_ENTRIES_URL = '/?storyId=legacy-wrappers-wrappermultiple--mit-2-eintraegen'
const EMPTY_URL = '/?storyId=legacy-wrappers-wrappermultiple--leer-kein-eintrag'

const panels = ['legacy', 'new'] as const

for (const panel of panels) {
  test.describe(`WrapperMultiple [${panel}]`, () => {

    test('rendert 2 Einträge', async ({ page }) => {
      await page.goto(TWO_ENTRIES_URL)
      const panelEl = page.locator(`[data-testid="${panel}-panel"]`)
      // Jeder Eintrag ist ein input
      await expect(panelEl.locator('input')).toHaveCount(2)
    })

    test('zeigt Hinzufügen-Button', async ({ page }) => {
      await page.goto(EMPTY_URL)
      const panelEl = page.locator(`[data-testid="${panel}-panel"]`)
      // Actionbar mit Add-Button vorhanden
      const addBtn = panelEl.locator('button, wa-button, sl-button').filter({ hasText: /add|hinzu|plus|\+/i }).first()
      await expect(addBtn).toBeVisible()
    })

  })
}
```

- [ ] **Schritt 4: wrapper-nested.spec.ts erstellen**

```ts
import { test, expect } from '@playwright/test'

const STORY_URL = '/?storyId=legacy-wrappers-wrappernested--default'

const panels = ['legacy', 'new'] as const

for (const panel of panels) {
  test.describe(`WrapperNested [${panel}]`, () => {

    test('rendert Sub-Bones des Records', async ({ page }) => {
      await page.goto(STORY_URL)
      const panelEl = page.locator(`[data-testid="${panel}-panel"]`)
      // Record-Bone rendert mind. einen Input für Sub-Bones
      await expect(panelEl.locator('input')).toHaveCount(1) // Anzahl ggf. nach Fixture anpassen
    })

  })
}
```

- [ ] **Schritt 5: Legacy-Tests laufen lassen**

```bash
npm run test:contract -- --grep "WrapperMultiple \[legacy\]|WrapperNested \[legacy\]"
```

- [ ] **Schritt 6: Commit**

```bash
git add stories/legacy/Wrappers/ tests/contract/bone-wrapper/
git commit -m "feat(legacy-compare): add wrapper-multiple and wrapper-nested stories and specs"
```

---

## Task 12: Layout-Stories + Specs

**Files:**
- Create: `stories/legacy/Layouts/LayoutList.story.vue`
- Create: `stories/legacy/Layouts/LayoutCategory.story.vue`
- Create: `stories/legacy/Layouts/LayoutList2Columns.story.vue`
- Create: `tests/contract/layouts/layout-list.spec.ts`
- Create: `tests/contract/layouts/layout-category.spec.ts`

Für die Layout-Stories brauchen wir minimale `structure`- und `skel`-Daten mit 2-3 Bones. Kein `CompareWrapper` hier — stattdessen direkt `ViForm` legacy vs. neu (da Layouts Teil von ViForm sind).

- [ ] **Schritt 1: geteilte Fixtures für ViForm-Stories anlegen**

Die Struktur aus `example/src/App.vue` (`localStructure` + `localSkel`) direkt übernehmen — sie deckt bereits alle wichtigen Bone-Typen ab (str, numeric, bool, select, date, text, record) und hat realistische Kategorien für LayoutCategory-Tests.

Erstelle `stories/legacy/fixtures/viFormFixtures.js`:

```js
// Aus example/src/App.vue übernommen — deckt str, numeric, bool, select, date, text, record ab
export const multiStructure = {
  key: {
    type: 'key',
    descr: 'Key',
    visible: true,
    required: false,
    readonly: true,
    multiple: false,
    languages: null,
    params: { category: 'Meta' },
  },
  name: {
    type: 'str',
    descr: 'Name',
    visible: true,
    required: true,
    readonly: false,
    multiple: false,
    languages: null,
    params: { category: 'Profil' },
  },
  email: {
    type: 'str.email',
    descr: 'E-Mail',
    visible: true,
    required: true,
    readonly: false,
    multiple: false,
    languages: null,
    params: { category: 'Profil' },
  },
  age: {
    type: 'numeric',
    descr: 'Alter',
    visible: true,
    required: false,
    readonly: false,
    multiple: false,
    languages: null,
    params: { category: 'Profil' },
  },
  isActive: {
    type: 'bool',
    descr: 'Aktiv',
    visible: true,
    required: false,
    readonly: false,
    multiple: false,
    languages: null,
    params: { category: 'Zugang' },
  },
  role: {
    type: 'select',
    descr: 'Rolle',
    visible: true,
    required: true,
    readonly: false,
    multiple: false,
    languages: null,
    values: { admin: 'Admin', editor: 'Editor', user: 'User' },
    params: { category: 'Zugang' },
  },
  birthday: {
    type: 'date',
    descr: 'Geburtstag',
    visible: true,
    required: false,
    readonly: false,
    multiple: false,
    languages: null,
    date: true,
    time: false,
    params: { category: 'Persoenlich' },
  },
  bio: {
    type: 'text',
    descr: 'Kurzprofil',
    visible: true,
    required: false,
    readonly: false,
    multiple: false,
    languages: null,
    params: { category: 'Persoenlich' },
  },
  address: {
    type: 'record',
    descr: 'Adresse',
    visible: true,
    required: false,
    readonly: false,
    multiple: false,
    languages: null,
    using: {
      street: {
        type: 'str',
        descr: 'Strasse',
        visible: true,
        required: false,
        readonly: false,
        multiple: false,
        languages: null,
        params: {},
      },
      city: {
        type: 'str',
        descr: 'Ort',
        visible: true,
        required: false,
        readonly: false,
        multiple: false,
        languages: null,
        params: {},
      },
    },
    params: { category: 'Adresse' },
  },
}

export const multiSkel = {
  key: 'demo-user-1',
  name: 'Max Mustermann',
  email: 'max@example.org',
  age: 30,
  isActive: true,
  role: 'editor',
  birthday: '1994-08-16',
  bio: 'Vergleichsansicht Legacy vs. Neu.',
  address: { street: 'Beispielstrasse 5', city: 'Brussels' },
}
```

- [ ] **Schritt 2: LayoutList.story.vue erstellen**

Hinweis: Layouts sind Teil von ViForm — die Stories müssen `ViForm` legacy vs. neu direkt rendern, nicht über `CompareWrapper`. Dazu brauchen wir eine spezifische Implementierung die beide ViForm-Versionen mit demselben Layout nebeneinander zeigt.

```vue
<script setup>
import { multiStructure, multiSkel } from '../fixtures/viFormFixtures.js'

// Legacy ViForm
import LegacyViForm from '@viur/vue-utils/forms/ViForm.vue'
import LegacyLayoutList from '@viur/vue-utils/forms/layouts/LayoutList.vue'

// Neue ViForm
import NewViForm from '../../../src/forms/ViForm.vue'
import NewLayoutList from '../../../src/forms/layouts/LayoutList.vue'

const structure = multiStructure
const skel = multiSkel
</script>

<template>
  <Story title="Legacy Layouts/LayoutList">
    <Variant title="Drei Bones" :auto-props-disabled="true">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding: 1rem;">

        <div>
          <div style="font-size: 0.75rem; font-weight: bold; color: #f97316; margin-bottom: 0.5rem;">LEGACY</div>
          <div data-testid="legacy-panel">
            <LegacyViForm
              :structure="structure"
              :skel="skel"
              :layout="LegacyLayoutList"
              module="test"
              action="edit"
            />
          </div>
        </div>

        <div>
          <div style="font-size: 0.75rem; font-weight: bold; color: #3b82f6; margin-bottom: 0.5rem;">NEU</div>
          <div data-testid="new-panel">
            <NewViForm
              :structure="structure"
              :skel="skel"
              :layout="NewLayoutList"
              module="test"
              action="edit"
            />
          </div>
        </div>

      </div>
    </Variant>
  </Story>
</template>
```

- [ ] **Schritt 3: LayoutCategory.story.vue + LayoutList2Columns.story.vue nach demselben Muster erstellen**

`LayoutCategory` mit `LegacyLayoutCategory` / `NewLayoutCategory`, `LayoutList2Columns` entsprechend.

- [ ] **Schritt 4: layout-list.spec.ts erstellen**

```ts
import { test, expect } from '@playwright/test'

const STORY_URL = '/?storyId=legacy-layouts-layoutlist--drei-bones'
const panels = ['legacy', 'new'] as const

for (const panel of panels) {
  test.describe(`LayoutList [${panel}]`, () => {

    test('rendert alle 3 Bones', async ({ page }) => {
      await page.goto(STORY_URL)
      const panelEl = page.locator(`[data-testid="${panel}-panel"]`)
      // Alle 3 Bone-Labels sollen sichtbar sein
      await expect(panelEl).toContainText('Titel')
      await expect(panelEl).toContainText('Beschreibung')
      await expect(panelEl).toContainText('Nummer')
    })

    test('rendert 3 Inputs', async ({ page }) => {
      await page.goto(STORY_URL)
      const panelEl = page.locator(`[data-testid="${panel}-panel"]`)
      await expect(panelEl.locator('input')).toHaveCount(3)
    })

  })
}
```

- [ ] **Schritt 5: layout-category.spec.ts erstellen**

```ts
import { test, expect } from '@playwright/test'

const STORY_URL = '/?storyId=legacy-layouts-layoutcategory--drei-bones'
const panels = ['legacy', 'new'] as const

for (const panel of panels) {
  test.describe(`LayoutCategory [${panel}]`, () => {

    test('zeigt Kategorie-Gruppen', async ({ page }) => {
      await page.goto(STORY_URL)
      const panelEl = page.locator(`[data-testid="${panel}-panel"]`)
      // "Basis" und "Inhalt" sind die cat-Werte aus der Fixture
      await expect(panelEl).toContainText('Basis')
      await expect(panelEl).toContainText('Inhalt')
    })

  })
}
```

- [ ] **Schritt 6: Legacy-Tests laufen lassen**

```bash
npm run test:contract -- --grep "Layout.*\[legacy\]"
```

- [ ] **Schritt 7: Commit**

```bash
git add stories/legacy/Layouts/ stories/legacy/fixtures/ tests/contract/layouts/
git commit -m "feat(legacy-compare): add layout stories and specs"
```

---

## Task 13: Actionbar-Stories + Specs

**Files:**
- Create: `stories/legacy/Actionbars/DefaultBar.story.vue`
- Create: `stories/legacy/Actionbars/FileBar.story.vue`
- Create: `stories/legacy/Actionbars/RelationalBar.story.vue`
- Create: `tests/contract/actionbars/default-bar.spec.ts`
- Create: `tests/contract/actionbars/file-bar.spec.ts`
- Create: `tests/contract/actionbars/relational-bar.spec.ts`

Actionbars brauchen `boneState` via `provide` — am einfachsten via `CompareWrapper` mit den passenden Bone-Typen.

- [ ] **Schritt 1: DefaultBar.story.vue — nutzt StringBone (hat defaultBar)**

```vue
<script setup>
import CompareWrapper from '../CompareWrapper.vue'
import { createStructure } from '../../fixtures/string.js'
</script>

<template>
  <Story title="Legacy Actionbars/DefaultBar">
    <Variant title="StringBone mit defaultBar" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="title"
        bone-type="str"
        :structure="createStructure({ multiple: true })"
        :skel="{ title: ['Eintrag 1'] }"
      />
    </Variant>
  </Story>
</template>
```

- [ ] **Schritt 2: FileBar.story.vue — nutzt FileBone**

```vue
<script setup>
import CompareWrapper from '../CompareWrapper.vue'
import { createStructure } from '../../fixtures/file.js'
</script>

<template>
  <Story title="Legacy Actionbars/FileBar">
    <Variant title="FileBone mit fileBar" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="bild"
        bone-type="relational.tree.leaf.file.file"
        :structure="createStructure()"
        :skel="{ bild: null }"
      />
    </Variant>
  </Story>
</template>
```

- [ ] **Schritt 3: RelationalBar.story.vue — nutzt RelationalBone**

```vue
<script setup>
import CompareWrapper from '../CompareWrapper.vue'
import { createStructure } from '../../fixtures/relational.js'
</script>

<template>
  <Story title="Legacy Actionbars/RelationalBar">
    <Variant title="RelationalBone mit relationalBar" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="autor"
        bone-type="relational"
        :structure="createStructure()"
        :skel="{ autor: null }"
      />
    </Variant>
  </Story>
</template>
```

- [ ] **Schritt 4: default-bar.spec.ts erstellen**

```ts
import { test, expect } from '@playwright/test'

const STORY_URL = '/?storyId=legacy-actionbars-defaultbar--stringbone-mit-defaultbar'
const panels = ['legacy', 'new'] as const

for (const panel of panels) {
  test.describe(`DefaultBar [${panel}]`, () => {

    test('Actionbar ist vorhanden und sichtbar', async ({ page }) => {
      await page.goto(STORY_URL)
      const panelEl = page.locator(`[data-testid="${panel}-panel"]`)
      // Actionbar enthält mindestens einen Button
      await expect(panelEl.locator('button, wa-button, sl-button').first()).toBeVisible()
    })

  })
}
```

- [ ] **Schritt 5: file-bar.spec.ts erstellen**

```ts
import { test, expect } from '@playwright/test'

const STORY_URL = '/?storyId=legacy-actionbars-filebar--filebone-mit-filebar'
const panels = ['legacy', 'new'] as const

for (const panel of panels) {
  test.describe(`FileBar [${panel}]`, () => {

    test('Upload-Button ist vorhanden', async ({ page }) => {
      await page.goto(STORY_URL)
      const panelEl = page.locator(`[data-testid="${panel}-panel"]`)
      const uploadBtn = panelEl.locator('button, wa-button, sl-button').filter({ hasText: /upload|hochladen|datei|file/i }).first()
      await expect(uploadBtn).toBeVisible()
    })

  })
}
```

- [ ] **Schritt 6: relational-bar.spec.ts erstellen**

```ts
import { test, expect } from '@playwright/test'

const STORY_URL = '/?storyId=legacy-actionbars-relationalbar--relationalbone-mit-relationalbar'
const panels = ['legacy', 'new'] as const

for (const panel of panels) {
  test.describe(`RelationalBar [${panel}]`, () => {

    test('Hinzufügen-Button ist vorhanden', async ({ page }) => {
      await page.goto(STORY_URL)
      const panelEl = page.locator(`[data-testid="${panel}-panel"]`)
      const addBtn = panelEl.locator('button, wa-button, sl-button').filter({ hasText: /add|hinzu|suche|search|\+/i }).first()
      await expect(addBtn).toBeVisible()
    })

  })
}
```

- [ ] **Schritt 7: Legacy-Tests laufen lassen**

```bash
npm run test:contract -- --grep "Bar \[legacy\]"
```

- [ ] **Schritt 8: Commit**

```bash
git add stories/legacy/Actionbars/ tests/contract/actionbars/
git commit -m "feat(legacy-compare): add actionbar stories and specs"
```

---

## Task 14: CompareFormWrapper.vue + ViForm.story.vue

**Files:**
- Create: `stories/legacy/CompareFormWrapper.vue`
- Create: `stories/legacy/ViForm.story.vue`

- [ ] **Schritt 1: CompareFormWrapper.vue erstellen**

```vue
<template>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding: 1rem; max-width: 1200px;">

    <div>
      <div style="font-size: 0.75rem; font-weight: bold; color: #f97316; margin-bottom: 0.5rem; text-transform: uppercase;">
        Legacy ViForm (Shoelace)
      </div>
      <div data-testid="legacy-panel">
        <LegacyViForm
          v-bind="formProps"
          @change="onLegacyChange"
        />
      </div>
      <div data-testid="legacy-event-log"
        style="margin-top: 0.5rem; font-size: 0.7rem; font-family: monospace; background: #111; color: #aaa; padding: 0.5rem; border-radius: 4px; min-height: 2rem; max-height: 8rem; overflow-y: auto;">
        <div v-for="(ev, i) in legacyEvents" :key="i">{{ ev }}</div>
      </div>
    </div>

    <div>
      <div style="font-size: 0.75rem; font-weight: bold; color: #3b82f6; margin-bottom: 0.5rem; text-transform: uppercase;">
        Neue ViForm (WebAwesome)
      </div>
      <div data-testid="new-panel">
        <NewViForm
          v-bind="formProps"
          @change="onNewChange"
        />
      </div>
      <div data-testid="new-event-log"
        style="margin-top: 0.5rem; font-size: 0.7rem; font-family: monospace; background: #111; color: #aaa; padding: 0.5rem; border-radius: 4px; min-height: 2rem; max-height: 8rem; overflow-y: auto;">
        <div v-for="(ev, i) in newEvents" :key="i">{{ ev }}</div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import LegacyViForm from '@viur/vue-utils/forms/ViForm.vue'
import NewViForm from '../../src/forms/ViForm.vue'

const props = defineProps({
  structure: { type: Object, required: true },
  skel: { type: Object, required: true },
  module: { type: String, default: 'test' },
  action: { type: String, default: 'edit' },
})

const formProps = computed(() => ({
  structure: props.structure,
  skel: props.skel,
  module: props.module,
  action: props.action,
}))

const legacyEvents = ref([])
const newEvents = ref([])

function onLegacyChange(...args) {
  legacyEvents.value.push(JSON.stringify(args))
}
function onNewChange(...args) {
  newEvents.value.push(JSON.stringify(args))
}
</script>
```

- [ ] **Schritt 2: ViForm.story.vue erstellen**

```vue
<script setup>
import CompareFormWrapper from './CompareFormWrapper.vue'
import { multiStructure, multiSkel } from './fixtures/viFormFixtures.js'
</script>

<template>
  <Story title="Legacy ViForm/ViForm">

    <Variant title="Drei Bones" :auto-props-disabled="true">
      <CompareFormWrapper
        :structure="multiStructure"
        :skel="multiSkel"
      />
    </Variant>

  </Story>
</template>
```

- [ ] **Schritt 3: Visuell prüfen**

```bash
npx histoire dev --config histoire.legacy.config.js
```

"Legacy ViForm/ViForm" → "Drei Bones" öffnen. Beide Forms sollen rendern. Mit Ctrl+C beenden.

- [ ] **Schritt 4: Commit**

```bash
git add stories/legacy/CompareFormWrapper.vue stories/legacy/ViForm.story.vue
git commit -m "feat(legacy-compare): add CompareFormWrapper and ViForm story"
```

---

## Task 15: ViForm-Specs

**Files:**
- Create: `tests/contract/viForm/init.spec.ts`
- Create: `tests/contract/viForm/validation.spec.ts`

- [ ] **Schritt 1: init.spec.ts erstellen**

```ts
import { test, expect } from '@playwright/test'

const STORY_URL = '/?storyId=legacy-viform-viform--drei-bones'
const panels = ['legacy', 'new'] as const

for (const panel of panels) {
  test.describe(`ViForm Init [${panel}]`, () => {

    test('rendert alle Bone-Labels', async ({ page }) => {
      await page.goto(STORY_URL)
      const panelEl = page.locator(`[data-testid="${panel}-panel"]`)
      await expect(panelEl).toContainText('Titel')
      await expect(panelEl).toContainText('Beschreibung')
      await expect(panelEl).toContainText('Nummer')
    })

    test('feuert initial change-Events', async ({ page }) => {
      await page.goto(STORY_URL)
      const log = page.locator(`[data-testid="${panel}-event-log"]`)
      await expect(log).not.toBeEmpty()
    })

    test('rendert 3 Inputs', async ({ page }) => {
      await page.goto(STORY_URL)
      const panelEl = page.locator(`[data-testid="${panel}-panel"]`)
      await expect(panelEl.locator('input')).toHaveCount(3)
    })

  })
}
```

- [ ] **Schritt 2: validation.spec.ts erstellen**

Hinweis: Fehler-Validierung in ViForm hängt vom Backend-Response ab. In der Story können wir Fehler über Props simulieren, indem wir die ViForm mit einem `errors`-Prop rendern.

```ts
import { test, expect } from '@playwright/test'

// Diese Story muss noch erstellt werden (Task 14 erweitern):
// Variant "Mit Fehler" in ViForm.story.vue hinzufügen mit errors-Prop
const ERROR_URL = '/?storyId=legacy-viform-viform--mit-fehler'
const panels = ['legacy', 'new'] as const

for (const panel of panels) {
  test.describe(`ViForm Validation [${panel}]`, () => {

    test('zeigt Fehler-Element wenn errors übergeben', async ({ page }) => {
      await page.goto(ERROR_URL)
      const panelEl = page.locator(`[data-testid="${panel}-panel"]`)
      const errorEl = panelEl.locator('.error-msg, [data-user-invalid="true"]').first()
      await expect(errorEl).toBeVisible()
    })

  })
}
```

> **Hinweis:** Für den Validation-Test muss in `ViForm.story.vue` eine Variante "Mit Fehler" ergänzt werden:
> ```vue
> <Variant title="Mit Fehler" :auto-props-disabled="true">
>   <CompareFormWrapper
>     :structure="{ ...multiStructure, name: { ...multiStructure.name, required: true } }"
>     :skel="multiSkel"
>     :errors="[{ fieldPath: ['name'], errorMessage: 'field_not_set', severity: 3 }]"
>   />
> </Variant>
> ```
> `CompareFormWrapper` muss ein `errors`-Prop akzeptieren und es an beide ViForm-Instanzen weiterreichen.

- [ ] **Schritt 3: Legacy-Tests laufen lassen**

```bash
npm run test:contract -- --grep "ViForm.*\[legacy\]"
```

- [ ] **Schritt 4: Commit**

```bash
git add tests/contract/viForm/
git commit -m "test(contract): add ViForm init and validation specs"
```

---

## Task 16: Cleanup + .gitignore

**Files:**
- Modify: `.gitignore`

- [ ] **Schritt 1: .superpowers/ in .gitignore eintragen**

```bash
echo ".superpowers/" >> .gitignore
git add .gitignore
git commit -m "chore: add .superpowers/ to .gitignore"
```

- [ ] **Schritt 2: Alle Tests zusammen laufen lassen**

```bash
npm run test:contract
```

Output prüfen:
- Legacy-Panel-Tests: alle grün (sind die Baseline)
- Neu-Panel-Tests: grüne zeigen Parität, rote zeigen offene Deltas in der Migration

- [ ] **Schritt 3: Finaler Commit falls nötig**

```bash
git status
# Falls noch unstaged files → committen
git add -A
git commit -m "chore(legacy-compare): finalize setup"
```
