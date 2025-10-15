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
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: '**/auth-setup.ts',
      teardown: 'cleanup'
    },
    // Cleanup project
    {
      name: 'cleanup',
      testMatch: '**/auth-cleanup.ts'
    },
    // Unauthenticated tests (existing)
    { 
      name: 'unauthenticated', 
      testIgnore: '**/authenticated-*.spec.ts',
      use: { 
        ...devices['Desktop Chrome'],
        navigationTimeout: 30_000
      }
    },
    // Authenticated tests (require setup)
    {
      name: 'authenticated',
      testMatch: '**/authenticated-*.spec.ts',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        navigationTimeout: 30_000
      }
    }
  ]
});
