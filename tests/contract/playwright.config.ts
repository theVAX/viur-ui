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
    command: 'npx histoire dev --config histoire.legacy.config.js',
    cwd: '../..',
    port: 6007,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
