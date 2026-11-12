import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  expect: {
    timeout: 15000,
  },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run start -w @pressure-shift/server',
      url: 'http://localhost:3001/health',
      timeout: 30000,
      reuseExistingServer: true,
    },
    {
      command: 'npm run dev -w @pressure-shift/client',
      url: 'http://localhost:3000',
      timeout: 30000,
      reuseExistingServer: true,
    },
  ],
});
