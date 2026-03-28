# Legacy vs. Neu — Vergleich & Contract Tests

**Datum:** 2026-03-28
**Branch:** feat/legacy-comparison-and-contract-tests
**Status:** Spec — bereit zur Implementierung

## Ziel

Während der Migration von `@viur/shoelace` (Shoelace, `sl-*`) zu `@viur/webawesome` (WebAwesome, `wa-*`) sicherstellen, dass alle Schichten des Form-Systems identisch **verhalten** (Events, Props, State). Pixel-genaues visuelles Matching ist nicht das Ziel — Shoelace und WebAwesome sehen bewusst unterschiedlich aus.

Zweck ist ausschließlich die **Entwicklungszeit**. Die reguläre `histoire.config.js` und der Docs-Build bleiben unverändert und enthalten kein Legacy-Material.

---

## Scope — alle Schichten

```
ViForm
  └── Layout (LayoutList / LayoutCategory / LayloutList2Columns)
        └── Bone (bone.vue)
              ├── bone-label
              ├── [BoneWidget] (stringBone, booleanBone, selectBone, …)
              ├── wrapper-multiple / wrapper-nested
              └── actionbar (defaultBar, fileBar, relationalBar)
```

Alle sechs Schichten werden visuell und funktional verglichen.

---

## Architektur

### Zwei Histoire-Configs

| Config | Zweck | Shoelace | WebAwesome | Stories |
|---|---|---|---|---|
| `histoire.config.js` | Dokumentation (unverändert) | nein | ja | `stories/bones/**` |
| `histoire.legacy.config.js` | Dev-Werkzeug | ja | ja | `stories/legacy/**` |

Die Legacy-Config lädt beide Bibliotheken gleichzeitig. Da sie unterschiedliche Tag-Prefixes verwenden (`sl-*` vs. `wa-*`), gibt es keine CSS- oder Custom-Element-Konflikte.

### Playwright Contract Tests

Jede Spec läuft parametrisiert über beide Panels. Legacy-Panel etabliert den Vertrag (muss grün sein). Neu-Panel muss denselben Vertrag erfüllen.

```
tests/contract/
  playwright.config.ts          # startet histoire.legacy automatisch via webServer
  bone-widgets/                 # eine Spec pro Bone
  bone-wrapper/                 # bone-label, error-display, wrapper-multiple, wrapper-nested
  viForm/                       # init, validation
  layouts/                      # layout-list, layout-category
  actionbars/                   # default-bar, file-bar, relational-bar
```

---

## Neue Dateien

### `histoire.legacy.config.js`

- `storyMatch: ['stories/legacy/**/*.story.vue']`
- `setupFile: './stories/legacy/setup.js'`
- `isCustomElement: tag => tag.startsWith('wa-') || tag.startsWith('sl-')`
- `vite.server.port: 6007` — fester Port, damit Playwright ihn zuverlässig findet
- Vite-Alias: `@viur/vue-utils → src/legacy` (identisch zur bestehenden Config)
- Vite-Alias: `@ckeditor`, `ckeditor5`, `codemirror`, `@codemirror/language-data`, `@viur/webawesome`, `logics-js` (identisch)

### `src/legacy/shoelaceConfig.js` (neu)

Analog zu `src/webawesomeConfig.js` — importiert alle Shoelace-Komponenten aus `@viur/shoelace`, die von den Legacy-Bones benötigt werden:
`sl-input`, `sl-select`, `sl-checkbox`, `sl-radio-group`, `sl-tab-group`, `sl-tab`, `sl-tab-panel`, `sl-tooltip`, `sl-alert`, `sl-icon`, `sl-color-picker`, `sl-textarea`

### `stories/legacy/setup.js`

```js
import '../../src/webawesomeConfig.js'
import '../../src/legacy/shoelaceConfig.js'
// Pinia + i18n (identisch zu stories/setup.js)
// Registrierung globaler Legacy-Komponenten:
//   Bone (neu, aus src/forms/bones/bone.vue) als 'Bone'
//   LegacyBone (aus src/legacy/bones/edit/bone.vue) als 'LegacyBone'
//   bone-label, wrapper-multiple, wrapper-nested (aus src/legacy/...)
//   vue-draggable-plus
```

### `stories/legacy/CompareWrapper.vue`

Zeigt beide Implementierungen nebeneinander im Playground:

- **Props:** `boneName`, `boneType`, `structure`, `skel`, `errors`, `languages`, `label`
- **Links:** Legacy-Panel (`data-testid="legacy-panel"`) — nutzt `LegacyBone` + `getBoneWidget` aus `src/legacy/bones/edit/index.js`
- **Rechts:** Neu-Panel (`data-testid="new-panel"`) — nutzt `Bone` + `getBoneWidget` aus `src/forms/bones/index.js`
- **Controls:** `readonly`, `required`, `multiple` — steuern beide Panels gleichzeitig
- **Event-Log:** beide Panels fangen `change`-Events ab und schreiben sie in ein `<div data-testid="legacy-event-log">` / `<div data-testid="new-event-log">` im DOM — kein Histoire-internes `logEvent`, damit Playwright darauf zugreifen kann

Für ViForm-Vergleiche gibt es ein `CompareFormWrapper.vue` (analog, nutzt `ViForm` legacy vs. neu).

### Story-Struktur `stories/legacy/`

```
stories/legacy/
  setup.js
  CompareWrapper.vue
  CompareFormWrapper.vue
  Bones/
    StringBone.story.vue
    BooleanBone.story.vue
    ColorBone.story.vue
    DateBone.story.vue
    EmailBone.story.vue
    FileBone.story.vue
    KeyBone.story.vue
    NumericBone.story.vue
    PasswordBone.story.vue
    PhoneBone.story.vue
    RawBone.story.vue
    RecordBone.story.vue
    RelationalBone.story.vue
    SelectBone.story.vue
    SpatialBone.story.vue
    TextBone.story.vue
    CodeBone.story.vue
  ViForm.story.vue
  Layouts/
    LayoutList.story.vue
    LayoutCategory.story.vue
    LayoutList2Columns.story.vue
  Wrappers/
    WrapperMultiple.story.vue
    WrapperNested.story.vue
  Actionbars/
    DefaultBar.story.vue
    FileBar.story.vue
    RelationalBar.story.vue
```

Jede Bone-Story hat dieselben Varianten wie die entsprechende Story in `stories/bones/` (Default, Readonly, Multiple, Required+Fehler, Multilang, Playground) — der Playground nutzt `CompareWrapper`.

---

## Playwright Contract Tests

### `tests/contract/playwright.config.ts`

```ts
webServer: {
  command: 'npm run histoire:legacy',
  port: 6007,
  reuseExistingServer: !process.env.CI,
}
baseURL: 'http://localhost:6007'
```

Nur Chromium. Kein CI-Setup initial, kann später ergänzt werden.

### Test-Pattern

```ts
// Jede Spec parametrisiert über beide Panels
const panels = ['legacy', 'new'] as const

for (const panel of panels) {
  test.describe(`StringBone [${panel}]`, () => {
    test('feuert change-Event beim Tippen', async ({ page }) => {
      // Histoire-Story-URL: Format abhängig von Konfiguration, muss beim Implementieren geprüft werden
      await page.goto('/') // navigiert zur Playground-Variante der StringBone-Story
      const wrap = page.locator(`[data-testid="${panel}-panel"]`)
      await wrap.locator('input').fill('Test')
      const log = page.locator(`[data-testid="${panel}-event-log"]`)
      await expect(log).toContainText('change')
      await expect(log).toContainText('Test')
    })
  })
}
```

### Was pro Schicht getestet wird

**BoneWidgets:**
- `change`-Event wird beim Tippen/Klicken gefeuert
- Initial-`change`-Event beim Mount (mit originalem Wert)
- Input ist `disabled` wenn `readonly: true`
- `data-user-invalid` gesetzt wenn Fehler übergeben

**Bone Wrapper (bone.vue + bone-label):**
- Label-Text entspricht `structure[boneName].descr`
- Required-Marker `*` sichtbar wenn `required: true`
- Kein Label sichtbar wenn `label: 'hide'`
- Fehler-Klasse / Attribut gesetzt bei `errors`

**wrapper-multiple:**
- Hinzufügen-Button vorhanden
- Löschen entfernt Eintrag (Anzahl stimmt)
- `change`-Event bei Reihenfolgeänderung (Drag)

**wrapper-nested (RecordBone):**
- Sub-Bones werden gerendert
- `change`-Events propagieren korrekt

**Layouts:**
- Alle Bones des skel werden gerendert
- LayoutCategory gruppiert korrekt nach Kategorien

**ViForm:**
- Rendert alle Bones mit structure + skel
- Feuert `change`-Event wenn ein Bone sich ändert
- Zeigt Fehler-State nach fehlgeschlagener Validation

**Actionbars:**
- DefaultBar: vorhanden und sichtbar
- FileBar: Upload-Button vorhanden
- RelationalBar: Hinzufügen-Button vorhanden

---

## NPM Scripts (Ergänzungen zu `package.json`)

```json
"histoire:legacy": "histoire dev --config histoire.legacy.config.js",
"test:contract": "playwright test --config tests/contract/playwright.config.ts"
```

---

## Implementierungsreihenfolge

1. `shoelaceConfig.js` + `histoire.legacy.config.js` + `stories/legacy/setup.js`
2. `CompareWrapper.vue` + `CompareFormWrapper.vue`
3. Alle Bone-Stories in `stories/legacy/Bones/`
4. `tests/contract/playwright.config.ts` + bone-widget Specs (StringBone als Referenz)
5. Restliche Bone-Widget-Specs (alle 17 Bones)
6. ViForm-, Layout-, Wrapper-, Actionbar-Stories + Specs
7. `.gitignore`: `.superpowers/` eintragen

---

## Nicht in Scope

- Visuelles Screenshot-Diffing (Playwright `toHaveScreenshot`) — Shoelace und WebAwesome sehen bewusst unterschiedlich aus, nur Verhalten muss übereinstimmen
- CI-Integration — kann später ergänzt werden
- Änderungen an `histoire.config.js` oder `stories/bones/`
