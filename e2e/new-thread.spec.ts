import { test, expect } from '@playwright/test'

// R3.2: Create new thread

test('R3.2: create new thread focuses composer and updates title', async ({ page }) => {
  await page.goto('/')
  const newBtn = page.getByTestId('new-thread')
  await newBtn.click()
  const composer = page.getByTestId('composer-input')
  await expect(composer).toBeFocused()
  const title = page.getByTestId('thread-title')
  await expect(title).toHaveText(/New chat|Untitled|bombay/)
})
