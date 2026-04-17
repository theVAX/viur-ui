import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "happy-dom",
    setupFiles: ["./tests/setup.js"],
    globals: true,
    exclude: ["node_modules/**", "dist/**", "tests/contract/**"],
    env: {
      VITE_API_URL: "http://api.test",
      VITE_DEFAULT_RENDERER: "json",
    },
  },
})
