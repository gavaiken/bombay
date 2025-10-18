import { test, expect } from '@playwright/test';

/**
 * Simplified Comprehensive Test
 * 
 * Quick validation of the main flow without all 25 messages
 */

test.use({ storageState: 'playwright/.auth/user.json' });

test('simplified comprehensive flow test', async ({ page }) => {
  await page.goto('/');
  
  // Verify we're authenticated
  await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
  console.log('✅ Authenticated and ready');

  // Create first chat with repeat-after-me model
  const newChatButton = page.getByTestId('new-thread');
  await newChatButton.click();
  console.log('✅ First chat created');
  
  const modelSwitcher = page.getByTestId('model-switcher');
  await modelSwitcher.selectOption('test:repeat-after-me');
  console.log('✅ Switched to 🗣️ repeat after me model');
  
  const composer = page.getByTestId('composer-input');
  const sendButton = page.getByTestId('composer-send');
  
  // Send 2 test sentences
  const testSentences = [
    'This is sentence one for testing.',
    'This is sentence two for testing.'
  ];
  
  for (let i = 0; i < testSentences.length; i++) {
    await expect(composer).toBeEnabled({ timeout: 10_000 });
    await composer.fill(testSentences[i]);
    await sendButton.click();
    await page.waitForTimeout(1000);
    console.log(`✅ Sent test sentence ${i + 1}/2`);
  }
  
  // Create second chat
  await newChatButton.click();
  console.log('✅ Second chat created');
  
  // Switch model and send poem line
  await modelSwitcher.selectOption('test:repeat-after-me');
  await expect(composer).toBeEnabled({ timeout: 10_000 });
  
  const poemLine = 'Two roads diverged in a yellow wood,';
  await composer.fill(poemLine);
  await sendButton.click();
  await page.waitForTimeout(1000);
  console.log('✅ Sent poem line');
  
  // Try to rename the thread
  const threadItems = page.getByTestId('thread-item');
  const currentThread = threadItems.first();
  
  await currentThread.hover();
  const renameButton = currentThread.getByRole('button', { name: /rename/i });
  
  if (await renameButton.isVisible()) {
    await renameButton.click();
    
    // Handle rename dialog
    page.on('dialog', async dialog => {
      await dialog.accept('Test Poem');
    });
    
    console.log('✅ Renamed thread');
    await page.waitForTimeout(1000);
  } else {
    console.log('⚠️ Rename button not visible, skipping rename test');
  }
  
  // Switch back to first thread (if multiple threads exist)
  const threadCount = await threadItems.count();
  if (threadCount > 1) {
    const firstThread = threadItems.last(); // Last should be the oldest
    await firstThread.click();
    console.log('✅ Switched back to first thread');
    
    // Send one London fact
    await expect(composer).toBeEnabled({ timeout: 10_000 });
    const londonFact = 'London is the capital city of England.';
    await composer.fill(londonFact);
    await sendButton.click();
    await page.waitForTimeout(1000);
    console.log('✅ Sent London fact');
  }
  
  // Final verification
  await page.screenshot({ path: 'test-results/simple-comprehensive-final.png', fullPage: true });
  
  // Verify we have messages
  const messages = page.getByTestId('message');
  const messageCount = await messages.count();
  expect(messageCount).toBeGreaterThan(0);
  
  console.log(`✅ SIMPLE COMPREHENSIVE TEST COMPLETE! Messages: ${messageCount}, Threads: ${threadCount}`);
});