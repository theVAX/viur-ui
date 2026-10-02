import { defineConfig } from "vitest/config"
import vue from "@vitejs/plugin-vue"

export default defineConfig({
  plugins: [vue()],
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
