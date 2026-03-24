# viur-ui

Official UI Components for Vue 3.

## Installation

```bash
npm install viur-ui
```

**Requires:** Vue 3.3+, Vite with `@vitejs/plugin-vue`

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
