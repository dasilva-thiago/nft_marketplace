import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e', fullyParallel: true, forbidOnly: Boolean(process.env.CI), retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }], ['list']], outputDir: 'playwright-results',
  use: { baseURL: 'http://127.0.0.1:5173', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'chromium-mobile', use: { ...devices['Desktop Chrome'], isMobile: true, hasTouch: true, viewport: { width: 390, height: 844 } } },
  ],
  webServer: { command: 'pnpm dev', url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI, env: { VITE_ENABLE_MOCKS: 'true' } },
});
