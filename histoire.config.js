import { defineConfig } from 'histoire'
import { HstVue } from '@histoire/plugin-vue'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [HstVue()],
  setupFile: './stories/setup.js',
  vite: {
    publicDir: 'stories/public',
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
        '@viur/vue-utils': path.resolve(__dirname, 'src/legacy'),
      },
      dedupe: ['vue', 'pinia', 'vue-i18n', '@vueuse/core'],
    },
    optimizeDeps: {
      exclude: [],
    },
  },
})
