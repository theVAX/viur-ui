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
        '@ckeditor/ckeditor5-vue': path.resolve(__dirname, 'example/node_modules/@ckeditor/ckeditor5-vue'),
        'ckeditor5': path.resolve(__dirname, 'example/node_modules/ckeditor5'),
        'codemirror': path.resolve(__dirname, 'example/node_modules/codemirror'),
        '@codemirror/language-data': path.resolve(__dirname, 'example/node_modules/@codemirror/language-data'),
        'vue': path.resolve(__dirname, 'example/node_modules/vue'),
        'pinia': path.resolve(__dirname, 'example/node_modules/pinia'),
        'vue-i18n': path.resolve(__dirname, 'example/node_modules/vue-i18n'),
        '@vueuse/core': path.resolve(__dirname, 'example/node_modules/@vueuse/core'),
        '@viur/webawesome': path.resolve(__dirname, 'example/node_modules/@viur/webawesome'),
        'vue-draggable-plus': path.resolve(__dirname, 'example/node_modules/vue-draggable-plus'),
        'logics-js': path.resolve(__dirname, 'example/node_modules/logics-js'),
      },
      dedupe: ['vue', 'pinia', 'vue-i18n', '@vueuse/core', 'vue-draggable-plus'],
    },
    optimizeDeps: {
      exclude: [],
    },
  },
})
