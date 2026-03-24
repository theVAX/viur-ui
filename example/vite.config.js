import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import copy from 'rollup-plugin-copy'

export default defineConfig({
  plugins: [
    copy({
      targets: [
        {
          src: path.join(__dirname, 'node_modules', '@viur', 'shoelace', 'dist', 'assets'),
          dest: path.join(__dirname, 'public', 'shoelace'),
        },
      ],
      hook: 'buildStart',
    }),
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('sl-'),
        },
      },
    }),
  ],
  resolve: {
    alias: {
      '@viur/vue-utils': path.resolve(__dirname, '../src/legacy'),
    },
  },
  optimizeDeps: {
    exclude: ['viur-ui'],
  },
})
