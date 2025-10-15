import { test, expect } from '@playwright/test';

/**
 * Authenticated Production Tests
 * 
 * These tests run against the authenticated production interface
 * Requires auth-setup.ts to have run first to establish session
 */

test.use({ storageState: 'playwright/.auth/user.json' });

test('authenticated: full chat flow', async ({ page }) => {
  await page.goto('/');
  
  // Verify we're authenticated
  await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
  await expect(page.getByTestId('brand-swatch')).toBeVisible();
  
  // Test core authenticated functionality
  await expect(page.getByTestId('composer')).toBeVisible();
  await expect(page.getByTestId('model-switcher')).toBeVisible();
  
  // Create new thread
  const newChatButton = page.getByTestId('new-thread');
  if (await newChatButton.isVisible()) {
    await newChatButton.click();
    console.log('✅ New chat created');
  }
  
  // Test message sending (with short test message to avoid costs)
  const composer = page.getByTestId('composer-input');
  const sendButton = page.getByTestId('composer-send');
  
  await composer.fill('Hi');
  await expect(sendButton).toBeEnabled();
  
  // Send message and verify response flow
  await sendButton.click();
  
  // Verify typing indicator appears
  await expect(page.getByTestId('typing-indicator')).toBeVisible();
  console.log('✅ Typing indicator shown');
  
  // Wait for response (with timeout)
  await expect(page.getByTestId('typing-indicator')).not.toBeVisible({ timeout: 30_000 });
  
  // Verify assistant message appears
  const messages = page.getByTestId('message');
  const messageCount = await messages.count();
  expect(messageCount).toBeGreaterThanOrEqual(2); // User + Assistant
  
  console.log(`✅ Message flow complete (${messageCount} messages)`);
  
  // Take screenshot for evidence
  await page.screenshot({ path: 'test-results/authenticated-chat-flow.png', fullPage: true });
});

test('authenticated: model switching', async ({ page }) => {
  await page.goto('/');
  
  // Verify we're authenticated
  await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
  
  // Test model switching
  const modelSwitcher = page.getByTestId('model-switcher');
  await expect(modelSwitcher).toBeVisible();
  
  const initialModel = await modelSwitcher.inputValue();
  console.log(`Initial model: ${initialModel}`);
  
  // Switch to different model
  const options = await modelSwitcher.locator('option').all();
  if (options.length > 1) {
    await modelSwitcher.selectOption({ index: 1 });
    
    const newModel = await modelSwitcher.inputValue();
    console.log(`Switched to model: ${newModel}`);
    
    expect(newModel).not.toBe(initialModel);
    console.log('✅ Model switching works');
  }
  
  await page.screenshot({ path: 'test-results/authenticated-model-switch.png', fullPage: true });
});

test('authenticated: thread persistence', async ({ page }) => {
  await page.goto('/');
  
  // Verify we're authenticated  
  await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
  
  // Check if threads exist
  const threadList = page.getByTestId('thread-list');
  const threadItems = threadList.getByTestId('thread-item');
  
  const threadCount = await threadItems.count();
  console.log(`Found ${threadCount} existing threads`);
  
  if (threadCount > 0) {
    // Test thread selection
    const firstThread = threadItems.first();
    await firstThread.click();
    
    // Verify thread loads
    await expect(page.getByTestId('transcript')).toBeVisible();
    console.log('✅ Thread selection works');
    
    // Test rename functionality
    await firstThread.hover();
    const renameButton = firstThread.getByRole('button', { name: /rename/i });
    
    if (await renameButton.isVisible()) {
      console.log('✅ Rename functionality available');
    }
  }
  
  await page.screenshot({ path: 'test-results/authenticated-thread-persistence.png', fullPage: true });
});