import { defineConfig } from 'histoire'
import { HstVue } from '@histoire/plugin-vue'
import vue from '@vitejs/plugin-vue'

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
      dedupe: ['vue', 'pinia', 'vue-i18n', '@vueuse/core'],
    },
    optimizeDeps: {
      exclude: [],
    },
  },
})
