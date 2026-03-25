import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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
  resolve: {
    alias: {
      '@viur/vue-utils': path.resolve(__dirname, 'tests/__mocks__/viur-vue-utils'),
    },
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.js', '.storybook/vitest.setup.js'],
    globals: true,
    exclude: ['**/node_modules/**', '**/dist/**', '**/.worktrees/**', '**/tests/e2e/**'],
    env: {
      VITE_API_URL: 'http://api.test',
      VITE_DEFAULT_RENDERER: 'json',
    },
  },
})