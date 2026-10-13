import { defineConfig } from "vitest/config"
import vue from "@vitejs/plugin-vue"

export default defineConfig({
  // Same as the apps: Web Awesome tags are custom elements, not Vue components.
  plugins: [vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith("wa-") } } })],
  test: {
    environment: "happy-dom",
    setupFiles: ["./tests/setup.js"],
    globals: true,
    exclude: ["**/node_modules/**", "**/dist/**"],
    env: {
      VITE_API_URL: "http://api.test",
      VITE_DEFAULT_RENDERER: "json",
    },
  },
})
