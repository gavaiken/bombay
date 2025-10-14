import { test, expect } from '@playwright/test'

// Additional E2E coverage for R19: mobile responsive thread tray overlay behavior

test('mobile overlay: thread tray opens and closes on small viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  // On mobile, the "Threads" button is visible
  const toggle = page.getByRole('button', { name: 'Threads' })
  await expect(toggle).toBeVisible()

  // Initially, tray is hidden on mobile
  const tray = page.getByTestId('thread-tray')
  await expect(tray).toBeHidden()

  // Open tray
  await toggle.click()
  await expect(tray).toBeVisible()

  // Close via close button
  const closeBtn = page.getByRole('button', { name: 'Close thread tray' })
  await closeBtn.click()
  await expect(tray).toBeHidden()
})