import { defineConfig, devices } from '@playwright/test';

/**
 * Production Playwright Configuration
 * 
 * This config targets https://bombay.chat for real E2E testing.
 * No mocked auth - tests require manual sign-in or real OAuth flow.
 * 
 * Usage:
 *   npx playwright test --config playwright.prod.config.ts
 *   npx playwright test --config playwright.prod.config.ts --headed
 */
export default defineConfig({
  timeout: 60_000,
  testDir: 'e2e-prod',
  retries: 1,
  use: {
    baseURL: 'https://bombay.chat',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  // No webServer - testing against live production site
  projects: [
    { 
      name: 'chromium-prod', 
      use: { 
        ...devices['Desktop Chrome'],
        // Slower navigation for production testing
        navigationTimeout: 30_000
      } 
    }
  ]
});