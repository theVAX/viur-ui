import { defineConfig } from "histoire"
import { HstVue } from "@histoire/plugin-vue"
import vue from "@vitejs/plugin-vue"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [HstVue()],
  setupFile: "./stories/legacy/setup.js",
  storyMatch: ["stories/legacy/**/*.story.vue"],
  outDir: ".histoire-legacy/dist",
  vite: {
    publicDir: "stories/public",
    server: {
      port: 6007,
    },
    plugins: [
      {
        name: "histoire-mock-request",
        enforce: "pre",
        resolveId(id) {
          if (/\/request\/index\.js$/.test(id)) {
            return path.resolve(__dirname, "stories/mocks/request.js")
          }
        },
      },
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag.startsWith("wa-") || tag.startsWith("sl-"),
          },
        },
      }),
    ],
    resolve: {
      alias: [
        { find: "@viur/vue-utils", replacement: path.resolve(__dirname, "src/legacy") },
        {
          find: "@ckeditor/ckeditor5-vue",
          replacement: path.resolve(__dirname, "example/node_modules/@ckeditor/ckeditor5-vue"),
        },
        { find: "ckeditor5", replacement: path.resolve(__dirname, "example/node_modules/ckeditor5") },
        { find: "codemirror", replacement: path.resolve(__dirname, "example/node_modules/codemirror") },
        {
          find: "@codemirror/language-data",
          replacement: path.resolve(__dirname, "example/node_modules/@codemirror/language-data"),
        },
        { find: "@viur/webawesome", replacement: path.resolve(__dirname, "example/node_modules/@viur/webawesome") },
        { find: "logics-js", replacement: path.resolve(__dirname, "example/node_modules/logics-js") },
      ],
      dedupe: [
        "vue",
        "pinia",
        "vue-i18n",
        "@vueuse/core",
        "vue-draggable-plus",
        "codemirror",
        "@codemirror/state",
        "@codemirror/view",
        "@codemirror/language",
        "@codemirror/language-data",
        "ckeditor5",
        "@ckeditor/ckeditor5-vue",
      ],
    },
  },
})
