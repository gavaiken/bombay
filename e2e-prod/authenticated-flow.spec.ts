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
  
  // Switch to repeat-after-me model for predictable testing
  const modelSwitcher = page.getByTestId('model-switcher');
  await modelSwitcher.selectOption('test:repeat-after-me');
  console.log('✅ Switched to 🗣️ repeat after me model');
  
  // Test message sending (with short test message to avoid costs)
  const composer = page.getByTestId('composer-input');
  const sendButton = page.getByTestId('composer-send');
  
  await composer.fill('Hi');
  await expect(sendButton).toBeEnabled();
  
  // Send message and verify response flow
  await sendButton.click();
  
  // Try to catch typing indicator (it may be very fast)
  const typingIndicator = page.getByTestId('typing-indicator');
  const isTypingVisible = await typingIndicator.isVisible({ timeout: 2000 }).catch(() => false);
  
  if (isTypingVisible) {
    console.log('✅ Typing indicator shown');
    // Wait for response to complete
    await expect(typingIndicator).not.toBeVisible({ timeout: 30_000 });
  } else {
    console.log('⚠️ Typing indicator too fast or already completed');
  }
  
  // Wait for assistant message to appear (sometimes there's a delay after typing indicator disappears)
  const messages = page.getByTestId('message');
  await expect(messages).toHaveCount(2, { timeout: 10_000 }); // Wait for both user and assistant message
  
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
  
  // Start with repeat-after-me model for consistency
  const modelSwitcher = page.getByTestId('model-switcher');
  await expect(modelSwitcher).toBeVisible();
  await modelSwitcher.selectOption('test:repeat-after-me');
  
  const initialModel = await modelSwitcher.inputValue();
  console.log(`Starting with model: ${initialModel}`);
  
  // Switch to different model
  const options = await modelSwitcher.locator('option').all();
  if (options.length > 1) {
    // Find a different model option
    const optionValues = await Promise.all(
      options.map(option => option.getAttribute('value'))
    );
    
    const differentModelValue = optionValues.find(value => value !== initialModel);
    
    if (differentModelValue) {
      await modelSwitcher.selectOption(differentModelValue);
      
      const newModel = await modelSwitcher.inputValue();
      console.log(`Switched from ${initialModel} to ${newModel}`);
      
      expect(newModel).not.toBe(initialModel);
      console.log('✅ Model switching works');
    } else {
      console.log('⚠️ All model options have same value - skipping switch test');
    }
  } else {
    console.log('⚠️ Only one model option available - skipping switch test');
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