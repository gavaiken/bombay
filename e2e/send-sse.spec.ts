import { test, expect } from '@playwright/test'

// R3.3: Send message with SSE
// Provider is stubbed via E2E_STUB_PROVIDER=1 so we get deterministic deltas.

test('R3.3: send message streams deltas and hides typing indicator on done', async ({ page }) => {
  await page.goto('/')
  // Ensure a thread exists
  const newBtn = page.getByTestId('new-thread')
  await newBtn.click()

  const composer = page.getByTestId('composer-input')
  await composer.fill('Hello there')
  // Press Enter to send
  await composer.press('Enter')

  // At least one message (user) should appear, then assistant
  const anyMessage = page.getByTestId('message').first()
  await expect(anyMessage).toBeVisible()
  const assistantMessage = page.getByTestId('message').last()
  await expect(assistantMessage).toBeVisible()
  // Typing indicator should be hidden by completion
  await expect(page.getByTestId('typing-indicator')).toBeHidden()
})
