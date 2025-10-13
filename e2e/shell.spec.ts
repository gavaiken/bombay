import { test, expect } from '@playwright/test'

// R3.1: Login and shell (mocked auth)
// Auth is mocked via E2E_AUTH=1 in playwright.config.ts webServer.env

test('R3.1: shell renders with mocked auth', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('app-shell')).toBeVisible()
  await expect(page.getByTestId('thread-tray')).toBeVisible()
  await expect(page.getByTestId('chat-pane')).toBeVisible()
  await expect(page.getByTestId('composer')).toBeVisible()
})
