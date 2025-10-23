import { test, expect } from '@playwright/test'

/**
 * E2E test for model switching on new (unpersisted) threads
 * 
 * This test would have caught the bug where switching models on a new thread
 * before sending the first message would not preserve the selected model.
 * 
 * Bug scenario:
 * 1. User creates a new chat (stub thread with ID starting with 't_')
 * 2. User switches from default model (gpt-4o) to a different model (e.g., Claude)
 * 3. User sends their first message
 * 4. BUG: Message was sent using the default model instead of the selected model
 * 
 * Root cause:
 * - onChangeModel() skipped API call for stub threads but didn't update local state
 * - ensureThread() used stale model state instead of the user's selection
 */

test.describe('Model switching on new threads', () => {
  test('should preserve model selection when switching before first message', async ({ page }) => {
    await page.goto('/')
    
    // Step 1: Create a new thread (stub thread, not yet persisted)
    await page.getByTestId('new-thread').click()
    await expect(page.getByTestId('composer-input')).toBeFocused()
    
    // Step 2: Verify default model is selected
    const modelSwitcher = page.getByTestId('model-switcher')
    await expect(modelSwitcher).toHaveValue('openai:gpt-4o')
    
    // Step 3: Switch to a different model BEFORE sending any message
    // This is the critical step - we're changing models on a stub thread
    await modelSwitcher.selectOption('anthropic:claude-3-5-haiku-20241022')
    await expect(modelSwitcher).toHaveValue('anthropic:claude-3-5-haiku-20241022')
    
    // Step 4: Send the first message (this will persist the thread)
    const composer = page.getByTestId('composer-input')
    await composer.fill('What model are you?')
    await composer.press('Enter')
    
    // Step 5: Wait for the assistant response
    await page.getByTestId('typing-indicator').waitFor({ state: 'visible' })
    await page.getByTestId('typing-indicator').waitFor({ state: 'hidden', timeout: 10000 })
    
    // Step 6: Verify the selected model is still active in the UI
    await expect(modelSwitcher).toHaveValue('anthropic:claude-3-5-haiku-20241022')
    
    // Step 7: Verify the thread was created with the correct model in the database
    const threadData = await page.evaluate(async () => {
      const threads = await fetch('/api/threads', { cache: 'no-store' }).then(r => r.json())
      return threads[0] // First thread (most recent)
    })
    
    expect(threadData.activeModel).toBe('anthropic:claude-3-5-haiku-20241022')
    
    // Step 8: Verify the assistant message was generated using the correct model
    const messageData = await page.evaluate(async (threadId: string) => {
      const response = await fetch(`/api/messages?threadId=${threadId}`, { cache: 'no-store' })
      const data = await response.json()
      const messages = Array.isArray(data) ? data : data.messages
      return messages.filter((m: { role: string }) => m.role === 'assistant')
    }, threadData.id)
    
    expect(messageData.length).toBeGreaterThan(0)
    
    // In E2E stub mode, provider may be 'test', but model should still reflect the selection
    const lastAssistantMsg = messageData[messageData.length - 1]
    if (lastAssistantMsg.model) {
      // When using real providers, verify the exact model was used
      expect(lastAssistantMsg.model).toBe('claude-3-5-haiku-20241022')
    }
  })
  
  test('should handle multiple model switches before first message', async ({ page }) => {
    await page.goto('/')
    
    // Create a new thread
    await page.getByTestId('new-thread').click()
    
    const modelSwitcher = page.getByTestId('model-switcher')
    
    // Switch models multiple times
    await modelSwitcher.selectOption('anthropic:claude-3-5-haiku-20241022')
    await expect(modelSwitcher).toHaveValue('anthropic:claude-3-5-haiku-20241022')
    
    await modelSwitcher.selectOption('openai:gpt-4o-mini')
    await expect(modelSwitcher).toHaveValue('openai:gpt-4o-mini')
    
    // Final selection
    await modelSwitcher.selectOption('anthropic:claude-sonnet-4-20250514')
    await expect(modelSwitcher).toHaveValue('anthropic:claude-sonnet-4-20250514')
    
    // Send message
    await page.getByTestId('composer-input').fill('Hello')
    await page.getByTestId('composer-send').click()
    
    // Wait for response
    await page.getByTestId('typing-indicator').waitFor({ state: 'visible' })
    await page.getByTestId('typing-indicator').waitFor({ state: 'hidden', timeout: 10000 })
    
    // Verify the LAST selected model is preserved
    const threadData = await page.evaluate(async () => {
      const threads = await fetch('/api/threads', { cache: 'no-store' }).then(r => r.json())
      return threads[0]
    })
    
    expect(threadData.activeModel).toBe('anthropic:claude-sonnet-4-20250514')
  })
  
  test('should not lose model selection when typing but not yet sending', async ({ page }) => {
    await page.goto('/')
    
    // Create thread and switch model
    await page.getByTestId('new-thread').click()
    const modelSwitcher = page.getByTestId('model-switcher')
    await modelSwitcher.selectOption('anthropic:claude-3-5-haiku-20241022')
    
    // Start typing (but don't send yet)
    const composer = page.getByTestId('composer-input')
    await composer.fill('This is a long message that I am typing...')
    
    // Wait a bit (simulate user thinking)
    await page.waitForTimeout(500)
    
    // Verify model is still selected
    await expect(modelSwitcher).toHaveValue('anthropic:claude-3-5-haiku-20241022')
    
    // Now send
    await composer.press('Enter')
    
    await page.getByTestId('typing-indicator').waitFor({ state: 'visible' })
    await page.getByTestId('typing-indicator').waitFor({ state: 'hidden', timeout: 10000 })
    
    // Verify model persisted correctly
    const threadData = await page.evaluate(async () => {
      const threads = await fetch('/api/threads', { cache: 'no-store' }).then(r => r.json())
      return threads[0]
    })
    
    expect(threadData.activeModel).toBe('anthropic:claude-3-5-haiku-20241022')
  })
  
  test('should preserve model when switching threads and back before sending', async ({ page }) => {
    await page.goto('/')
    
    // Create first thread with model A
    await page.getByTestId('new-thread').click()
    const modelSwitcher = page.getByTestId('model-switcher')
    await modelSwitcher.selectOption('anthropic:claude-3-5-haiku-20241022')
    
    // Create second thread without sending anything on first
    await page.getByTestId('new-thread').click()
    
    // Get all thread items
    const threadItems = page.getByTestId('thread-item')
    const count = await threadItems.count()
    expect(count).toBeGreaterThanOrEqual(2)
    
    // Switch back to first thread (second in the list, since newest is first)
    await threadItems.nth(1).click()
    
    // Verify model selection was preserved in first thread
    await expect(modelSwitcher).toHaveValue('anthropic:claude-3-5-haiku-20241022')
    
    // Now send a message
    await page.getByTestId('composer-input').fill('Test')
    await page.getByTestId('composer-send').click()
    
    await page.getByTestId('typing-indicator').waitFor({ state: 'visible' })
    await page.getByTestId('typing-indicator').waitFor({ state: 'hidden', timeout: 10000 })
    
    // Verify persistence
    const threads = await page.evaluate(async () => {
      return await fetch('/api/threads', { cache: 'no-store' }).then(r => r.json())
    })
    
    // Find the thread we just sent a message in (should have messages)
    const threadWithMessages = threads.find((t: { activeModel: string }) => 
      t.activeModel === 'anthropic:claude-3-5-haiku-20241022'
    )
    
    expect(threadWithMessages).toBeDefined()
  })
})
