# viur-ui

Official UI Components for Vue 3.

## Installation

```bash
npm install viur-ui
```

**Requires:** Vue 3.3+, Vite with `@vitejs/plugin-vue`

## Development

### Histoire (Component Stories)

```bash
# Neue Bones (WebAwesome) — http://localhost:6006
npm run story:dev

# Legacy-Vergleich: Alt (Shoelace) vs. Neu (WebAwesome) — http://localhost:6007
npm run histoire:legacy
```

### Tests

```bash
# Unit-Tests (Vitest, watch mode)
npm run test

# Unit-Tests einmalig ausführen
npm run test:run

# Contract Tests (Playwright gegen laufenden Histoire-Server auf :6007)
npm run test:contract
```

> Die Contract Tests starten den Legacy-Histoire-Server automatisch, falls er noch nicht läuft.

**Ersteinrichtung Playwright:** Nach `npm install` oder nach einem Playwright-Update müssen die Browser einmalig installiert werden:

```bash
npx playwright install chromium
```

## Vite Configuration

Add to your `vite.config.js` so Vite processes the `.vue` files from this package:

```js
import vue from '@vitejs/plugin-vue'

export default {
  plugins: [vue()],
  optimizeDeps: {
    exclude: ['viur-ui']
  }
}
```

## Usage

### Named import via index

```js
import { HelloWorld } from 'viur-ui'
```

### Direct path import

```js
import HelloWorld from 'viur-ui/src/components/HelloWorld.vue'
```

## Components

| Component | Description |
|-----------|-------------|
| `HelloWorld` | Renders "Hello World" |
