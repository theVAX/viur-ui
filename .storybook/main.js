import { mergeConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const mock = (file) => path.resolve(__dirname, '__mocks__', file)

const SRC_REQUEST_MOCK_ID = '\0storybook-mock:src/request'
const srcRequestPath = path.resolve(__dirname, '../src/request/index.js')

function mockSrcRequest() {
  return {
    name: 'storybook-mock-src-request',
    enforce: 'pre',
    resolveId(id, importer) {
      if (!importer) return null
      const resolved = path.resolve(path.dirname(importer.replace(/\?.*$/, '')), id)
      if (resolved === srcRequestPath) return SRC_REQUEST_MOCK_ID
    },
    load(id) {
      if (id !== SRC_REQUEST_MOCK_ID) return null
      return `export * from '${mock('request.js').replace(/\\/g, '/')}'`
    },
  }
}

export default {
  stories: ['../stories/**/*.stories.js'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
  async viteFinal(config) {
    return mergeConfig(config, {
      plugins: [
        mockSrcRequest(),
        vue({
          template: {
            compilerOptions: {
              isCustomElement: (tag) => tag.startsWith('wa-'),
            },
          },
        }),
      ],
      resolve: {
        dedupe: ['vue', 'vue-i18n', '@vue/runtime-core', '@vue/reactivity'],
        alias: [
          { find: '@ckeditor/ckeditor5-vue',                 replacement: mock('ckeditor5-vue.js') },
          { find: 'ckeditor5/dist/translations/de.js',       replacement: mock('ckeditor5-translations-de.js') },
          { find: 'ckeditor5/dist/ckeditor5.css',            replacement: mock('empty.css') },
          { find: 'ckeditor5',                               replacement: mock('ckeditor5.js') },
        ],
      },
      build: {
        rollupOptions: {
          external: [
            '@viur/vue-utils',
            /@viur\/vue-utils\/.*/,
            'codemirror',
            /^@codemirror\/.*/,
            'ckeditor5',
            /^@ckeditor\/.*/,
          ],
        },
      },
    })
  },
}
