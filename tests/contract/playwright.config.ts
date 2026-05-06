import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:6007',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // Statisches Histoire-Build serviert via 'serve' — vermeidet Vite-Cold-Compile-Races.
    // Build laeuft als pretest:contract Hook in package.json.
    command: 'npx serve .histoire-legacy/dist --listen 6007 --no-clipboard --no-port-switching --config ../../tests/contract/serve.json',
    cwd: '../..',
    port: 6007,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
