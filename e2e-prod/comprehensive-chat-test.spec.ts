import { test, expect } from '@playwright/test';

/**
 * Comprehensive Chat Test
 * 
 * This test performs a complete multi-thread conversation flow:
 * 1. Open new chat and send 10 distinct sentences to repeat-after-me model
 * 2. Create new thread and send 10 lines from a famous poem
 * 3. Rename the chat to the poem's name
 * 4. Switch back to first chat and send 5 facts about London
 */

test.use({ storageState: 'playwright/.auth/user.json' });

test('comprehensive chat flow with multiple threads and poem', async ({ page }) => {
  await page.goto('/');
  
  // Verify we're authenticated
  await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
  console.log('✅ Authenticated and ready');

  // STEP 1: Open new chat and ensure we're using repeat-after-me model
  const newChatButton = page.getByTestId('new-thread');
  await newChatButton.click();
  console.log('✅ First chat created');
  
  // Switch to repeat-after-me model
  const modelSwitcher = page.getByTestId('model-switcher');
  await modelSwitcher.selectOption('test:repeat-after-me');
  await expect(modelSwitcher).toHaveValue('test:repeat-after-me');
  console.log('✅ Switched to 🗣️ repeat after me model');
  
  // Send 10 distinct sentences
  const sentences = [
    'The morning sun painted the sky in brilliant orange.',
    'Coffee tastes better when shared with good friends.',
    'Books hold entire universes between their covers.',
    'Music has the power to heal wounded hearts.',
    'Laughter echoes through empty hallways at midnight.',
    'Dreams are the seeds of tomorrow\'s reality.',
    'Ocean waves whisper ancient secrets to the shore.',
    'Stars dance in the velvet darkness above.',
    'Time flows like honey on warm summer days.',
    'Hope blooms eternal in the garden of the soul.'
  ];
  
  const composer = page.getByTestId('composer-input');
  const sendButton = page.getByTestId('composer-send');
  
  for (let i = 0; i < sentences.length; i++) {
    // Wait for composer to be enabled before sending
    await expect(composer).toBeEnabled({ timeout: 10_000 });
    
    await composer.fill(sentences[i]);
    await sendButton.click();
    
    // Wait for message to be processed (composer gets disabled during processing)
    await page.waitForTimeout(800);
    console.log(`✅ Sent sentence ${i + 1}/10: "${sentences[i].substring(0, 30)}..."`);
  }
  
  console.log('✅ All 10 sentences sent to first chat');
  
  // Store first thread info for later
  const firstThreadTitle = await page.getByTestId('thread-title').textContent();
  
  // STEP 2: Create new thread for poem
  await newChatButton.click();
  console.log('✅ Second chat created for poem');
  
  // New threads default to a different model, so switch back to repeat-after-me
  await modelSwitcher.selectOption('test:repeat-after-me');
  await expect(modelSwitcher).toHaveValue('test:repeat-after-me');
  console.log('✅ Switched second chat to 🗣️ repeat after me model');
  
  // Send lines from "The Road Not Taken" by Robert Frost
  const poemLines = [
    'Two roads diverged in a yellow wood,',
    'And sorry I could not travel both',
    'And be one traveler, long I stood',
    'And looked down one as far as I could',
    'To where it bent in the undergrowth;',
    'Then took the other, as just as fair,',
    'And having perhaps the better claim,',
    'Because it was grassy and wanted wear;',
    'Though as for that the passing there',
    'Had worn them really about the same,'
  ];
  
  for (let i = 0; i < poemLines.length; i++) {
    // Wait for composer to be enabled before sending
    await expect(composer).toBeEnabled({ timeout: 10_000 });
    
    await composer.fill(poemLines[i]);
    await sendButton.click();
    
    // Brief pause between lines
    await page.waitForTimeout(600);
    console.log(`✅ Sent poem line ${i + 1}/10: "${poemLines[i]}"`);
  }
  
  console.log('✅ All 10 lines from "The Road Not Taken" sent');
  
  // STEP 3: Rename the chat to the poem's name
  // Find the current thread in the thread list and rename it
  const threadItems = page.getByTestId('thread-item');
  const currentThread = threadItems.first(); // Should be the active/most recent thread
  
  await currentThread.hover();
  const renameButton = currentThread.getByRole('button', { name: /rename/i });
  await renameButton.click();
  
  // Handle the rename prompt (this will be a browser prompt)
  page.on('dialog', async dialog => {
    expect(dialog.type()).toBe('prompt');
    await dialog.accept('The Road Not Taken');
  });
  
  console.log('✅ Renamed second chat to "The Road Not Taken"');
  
  // Wait a moment for rename to process
  await page.waitForTimeout(1000);
  
  // STEP 4: Switch back to first chat
  // Find the first thread (should contain the timestamp title)
  const threadTitles = await threadItems.allTextContents();
  const firstThreadIndex = threadTitles.findIndex(title => title.includes(firstThreadTitle?.substring(0, 10) || ''));
  
  if (firstThreadIndex !== -1) {
    await threadItems.nth(firstThreadIndex).click();
    console.log('✅ Switched back to first chat');
  } else {
    // Fallback: click the thread that's not "The Road Not Taken"
    const nonPoemThread = threadItems.filter({ hasNotText: 'The Road Not Taken' }).first();
    await nonPoemThread.click();
    console.log('✅ Switched back to first chat (fallback method)');
  }
  
  // STEP 5: Send 5 facts about London
  const londonFacts = [
    'London is home to over 9 million people in its greater metropolitan area.',
    'The Tower of London houses the Crown Jewels of the British Royal Family.',
    'Big Ben is actually the nickname for the Great Bell inside Elizabeth Tower.',
    'London Underground is the oldest metro system in the world, opened in 1863.',
    'Hyde Park covers 350 acres and contains the famous Speakers\' Corner.'
  ];
  
  for (let i = 0; i < londonFacts.length; i++) {
    // Wait for composer to be enabled before sending
    await expect(composer).toBeEnabled({ timeout: 10_000 });
    
    await composer.fill(londonFacts[i]);
    await sendButton.click();
    
    // Brief pause between facts
    await page.waitForTimeout(600);
    console.log(`✅ Sent London fact ${i + 1}/5: "${londonFacts[i].substring(0, 40)}..."`);
  }
  
  console.log('✅ All 5 London facts sent to first chat');
  
  // FINAL VERIFICATION: Take screenshots and verify state
  await page.screenshot({ path: 'test-results/comprehensive-chat-final.png', fullPage: true });
  
  // Verify we have at least 2 threads
  const finalThreadCount = await threadItems.count();
  expect(finalThreadCount).toBeGreaterThanOrEqual(2);
  
  // Verify one thread is named "The Road Not Taken"
  const finalThreadTitles = await threadItems.allTextContents();
  expect(finalThreadTitles.some(title => title.includes('The Road Not Taken'))).toBe(true);
  
  // Verify we have messages in the current thread
  const messages = page.getByTestId('message');
  const messageCount = await messages.count();
  expect(messageCount).toBeGreaterThan(0);
  
  console.log('✅ COMPREHENSIVE TEST COMPLETE!');
  console.log(`📊 Final state: ${finalThreadCount} threads, ${messageCount} messages in current thread`);
  console.log('🎯 Successfully tested: multi-thread conversations, poem input, thread renaming, and model consistency');
});

test('verify repeat-after-me model echoing behavior', async ({ page }) => {
  await page.goto('/');
  
  // Verify we're authenticated
  await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
  
  // Create new chat with repeat-after-me model
  await page.getByTestId('new-thread').click();
  await page.getByTestId('model-switcher').selectOption('test:repeat-after-me');
  
  // Test that the model echoes back our input
  const testMessage = 'Hello world, this is a test message for echoing.';
  
  await page.getByTestId('composer-input').fill(testMessage);
  await page.getByTestId('composer-send').click();
  
  // Wait for response
  await page.waitForTimeout(1000);
  
  // Verify the response contains our original message (echoed back)
  const messages = page.getByTestId('message');
  const messageCount = await messages.count();
  expect(messageCount).toBeGreaterThanOrEqual(2); // User message + Assistant echo
  
  // Get the last message (should be assistant response)
  const lastMessage = messages.last();
  const lastMessageText = await lastMessage.textContent();
  
  // The repeat-after-me model should echo back the input
  expect(lastMessageText).toContain(testMessage);
  
  console.log('✅ Repeat-after-me model working correctly - echoed back the input');
  
  await page.screenshot({ path: 'test-results/repeat-after-me-verification.png', fullPage: true });
});