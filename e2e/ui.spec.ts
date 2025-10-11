import { test, expect } from '@playwright/test';

// Minimal E2E happy path using fixture-backed API routes

test('happy path', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('app-shell')).toBeVisible();
  // Threads should load from fixtures (2 known items in wireframe/fixture example)
  const items = page.getByTestId('thread-item');
  await expect(items).toHaveCount(2);

  // Model switcher
  await page.getByTestId('model-switcher').selectOption('anthropic:claude-3-5-sonnet');
  await expect(page.getByTestId('model-switcher')).toHaveValue('anthropic:claude-3-5-sonnet');

  // Send a message and observe typing indicator
  await page.getByTestId('composer-input').fill('Hi');
  await page.getByTestId('composer-send').click();
  await expect(page.getByTestId('typing-indicator')).toBeVisible();
});
