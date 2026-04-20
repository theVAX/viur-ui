# agent.md – Project Rules

## Rolle

Du bist ein Coding-Agent in diesem Repository.  
Dein Ziel ist es, Änderungen konsistent zum bestehenden Projektstil umzusetzen:

- minimale, saubere Diffs
- keine unnötigen Refactors
- vorhandene Patterns respektieren
- Entscheidungen nachvollziehbar treffen

---

## Stack & Kontext

- Vue 3
- JavaScript (kein TypeScript)
- `<script setup>`
- Komponenten-lokaler State ist Standard
- `provide` / `inject` wird häufig genutzt

---

## Zentrale Architekturregel: Single Reactive State pro Komponente

Jede Komponente besitzt **genau ein** reaktives State-Objekt:

```js
const state = reactive({ ... })
```

### Alle Variablen der Komponente liegen in state:

- UI-Flags (loading, error, open, activeTab, etc.)
- Daten (items, form, filters, pagination, etc.)
- temporäre Werte, Selection, interne Zustände
- computed / derived values

Keine losen ref() oder State-Variablen außerhalb von state:

- ❌ `const loading = ref(false)`
- ❌ `const filtered = computed(...)`

- ✅ `state.loading`
- ✅ `state.filtered = computed(...)`

### Erlaubte Ausnahmen (kein Komponenten-State)

Diese dürfen außerhalb stehen, zählen aber nicht als State:

- defineProps, defineEmits, defineExpose
- useRoute, useRouter
- inject(...) / provide(...) Handles
- Pinia Store Instanzen
- reine Helper-Funktionen ohne eigenen Zustand
- ListRequest / ListHandler Instanzen und zugehörige Funktionen
- Externe API-Handler und Service-Objekte
- DOM refs

## Computed / Derived Values

- Computed Properties werden immer als Property am state definiert
- Keine freien computed() neben dem state
- Computed sind read-only
- Kein Schreiben in computed

### Standard-Pattern

```js
const state = reactive({
  query: "",
  items: [],
  filteredItems: computed(() => {
    const q = (state.query || "").trim().toLowerCase()
    return q ? state.items.filter((i) => (i.name || "").toLowerCase().includes(q)) : state.items
  }),
})
```

## Provide / Inject Regeln

- inject immer früh im `<script setup>` deklarieren
- Bestehende Injection-Keys strikt übernehmen
- provide nur mit stabilen, zusammenhängenden Objekten

❌ **Nicht erlaubt**:

- einzelne lose refs providen, wenn sie logisch zum state gehören

## Struktur von `<script setup>`

Bevorzugte Reihenfolge:

1. Imports
2. defineProps / defineEmits
3. inject, Router, andere Hooks
4. const state = reactive({ ... })
5. Computed im state
6. Watcher (nur wenn nötig)
7. Actions / Mutations / Async-Funktionen
8. Lifecycle (onMounted, etc.)
9. provide(...)

## Mutationen & Async

```js
async function loadItems() {
  state.loading = true
  state.error = null
  try {
    state.items = await api.fetchItems()
  } catch (err) {
    state.error = err?.message || String(err)
  } finally {
    state.loading = false
  }
}
```

## Async Pattern

Immer async/await mit try-catch verwenden. KEINE .then()-Verkettung.

- Obligatorisch try/catch für jede asynchrone Operation
- Status-Flags im state setzen (loading/error)
- Saubere Bereinigung im finally-Block
- .then()-Ketten sind nicht erlaubt

```js
// ❌ NICHT ERLAUBT
api.fetchData()
  .then(result => {
    state.data = result
  })
  .catch(err => {
    console.error(err)
  })

// ✅ KORREKT
async function loadData() {
  state.loading = true
  state.error = null
  try {
    state.data = await api.fetchData()
  } catch (err) {
    state.error = err?.message || String(err)
  } finally {
    state.loading = false
  }
}
```

## Props-Definition

Jede Prop muss `type` und entweder `default` oder `required: true` besitzen. Kurzsyntax ist verboten.

```js
// ❌ NICHT ERLAUBT
const props = defineProps({
  open: Boolean,
  label: String,
})

// ✅ KORREKT
const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
    required: true,
  },
})
```

---

## Code-Style

- keine unnötigen Umbenennungen oder Strukturänderungen
- duplizierte Logik ab 2× → Helper extrahieren
- defensiv mit null / undefined umgehen
- keine Secrets / API-Keys im Code

## Arbeitsweise

- Zuerst bestehende Patterns der Datei übernehmen
- Änderungen so klein wie möglich halten
- Wenn eine Regel mit bestehendem Code kollidiert:
  - Konsistenz des Repos hat Vorrang
  - Abweichung kurz begründen

## Antwortformat (für Continue)

- 1–3 Bulletpoints: was geändert wurde
- betroffene Dateien nennen
- kurze Begründung
- keine langen Essays
