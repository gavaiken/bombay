# Test Strategy: Model Switching on Stub Threads

## The Bug

When users create a new chat and switch models **before sending their first message**, the selected model was not preserved. The message was sent using the default model (gpt-4o) instead of the user's selection.

## Why Existing Tests Missed It

The existing E2E test (`e2e/model-switch.spec.ts`) tested model switching **mid-conversation**:
1. Create thread
2. Switch model
3. Send message ← Thread already persisted at this point
4. Verify model used

This test passed because once a thread is persisted (has an ID from the database), the PATCH `/api/threads/:id` endpoint correctly updates the `activeModel` field.

## What Was Missing

The bug only occurred on **stub threads** (unpersisted threads with ID format `t_<timestamp>`):
1. Create new thread → stub thread created with ID like `t_1729674000000`
2. Switch model → `onChangeModel()` skips API call for stubs
3. Send first message → `ensureThread()` creates server thread using stale model state
4. **Bug**: Model selection lost

## E2E Test That Would Have Caught It

See `e2e/model-switch-stub-thread.spec.ts` for the complete test suite.

### Test 1: Basic stub thread model switching
```typescript
test('should preserve model selection when switching before first message', async ({ page }) => {
  // 1. Create new thread (stub)
  await page.getByTestId('new-thread').click()
  
  // 2. Switch model BEFORE sending anything
  await page.getByTestId('model-switcher').selectOption('anthropic:claude-3-5-haiku-20241022')
  
  // 3. Send first message (triggers thread creation)
  await page.getByTestId('composer-input').fill('What model are you?')
  await page.getByTestId('composer-send').click()
  
  // 4. Wait for response
  await page.getByTestId('typing-indicator').waitFor({ state: 'hidden' })
  
  // 5. Verify model was preserved in database
  const thread = await page.evaluate(async () => {
    const threads = await fetch('/api/threads').then(r => r.json())
    return threads[0]
  })
  
  expect(thread.activeModel).toBe('anthropic:claude-3-5-haiku-20241022')
  
  // 6. Verify assistant message used correct model
  const messages = await page.evaluate(async (threadId) => {
    const data = await fetch(`/api/messages?threadId=${threadId}`).then(r => r.json())
    return Array.isArray(data) ? data : data.messages
  }, thread.id)
  
  const assistantMsg = messages.find(m => m.role === 'assistant')
  expect(assistantMsg.model).toBe('claude-3-5-haiku-20241022')
})
```

### Key Assertions

1. **UI State**: Verify model switcher shows correct value
2. **Database State**: Verify `thread.activeModel` matches user's selection
3. **Message Attribution**: Verify assistant message has correct `provider` and `model`

### Test Coverage

The comprehensive test suite covers:

1. **Basic case**: Switch model once before first message
2. **Multiple switches**: Switch several times, verify last selection wins
3. **Type-without-sending**: Switch model, type message, wait, then send
4. **Thread navigation**: Switch threads, verify model selection persists per-thread

## Why These Tests Are Effective

### 1. Tests the actual user flow
- Matches exactly what users do: create → configure → send
- Doesn't rely on internal implementation details

### 2. Verifies persistence
- Checks database state via API, not just UI state
- Ensures model selection survives the stub → persisted transition

### 3. Tests the critical moment
- The bug occurred during `ensureThread()` when creating the server thread
- Test explicitly triggers this by sending the first message after switching

### 4. Multiple verification points
```
UI → Local State → API Call → Database → Message Generation
 ✓      ✓             ✓          ✓            ✓
```

## Running the Tests

```bash
# Run all model switching tests
npx playwright test model-switch-stub-thread

# Run specific test
npx playwright test model-switch-stub-thread -g "preserve model selection"

# Run with UI mode for debugging
npx playwright test model-switch-stub-thread --ui
```

## Integration with CI/CD

These tests should run:
- ✅ On every PR
- ✅ Before deployment to production
- ✅ As part of the full E2E suite

## Test Environment Setup

The tests work in both modes:
- **Stub mode** (`E2E_STUB_PROVIDER=1`): Tests UI state and database persistence
- **Real providers**: Also verifies actual model invocation

## Future Improvements

Consider adding:
1. **Visual regression tests**: Screenshot the model switcher state
2. **API-level tests**: Direct API calls to test `ensureThread()` logic
3. **Unit tests**: Test the `onChangeModel()` and `ensureThread()` functions in isolation (already added in `tests/unit/model-switching.test.ts`)

## Related Tests

- `e2e/model-switch.spec.ts` - Model switching on persisted threads
- `e2e/new-thread.spec.ts` - Basic thread creation
- `tests/unit/model-switching.test.ts` - Unit tests for the fix logic
- `tests/integration/context.handoff.int.test.ts` - Context handoff between models

## Lessons Learned

1. **Test edge cases around persistence boundaries**: Stub vs. persisted state
2. **Verify data flow end-to-end**: UI → State → API → Database → Response
3. **Test user timing**: Actions taken in sequence matter (order-dependent bugs)
4. **Don't assume state synchronization**: Local state and server state can diverge
