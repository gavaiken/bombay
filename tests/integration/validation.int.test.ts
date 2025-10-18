import { describe, test, expect } from 'vitest';
import { SendMessageSchema, CreateThreadSchema, VALIDATION_LIMITS } from 'lib/schemas';
import { checkRateLimit, RATE_LIMITS } from 'lib/rate-limit';

describe('Input Validation Tests', () => {
  test('should reject messages exceeding maximum length', () => {
    const longMessage = 'a'.repeat(VALIDATION_LIMITS.MAX_MESSAGE_CONTENT_LENGTH + 1);
    const result = SendMessageSchema.safeParse({
      threadId: 'cltest123',
      content: longMessage
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('4000 characters or less');
    }
  });

  test('should accept messages within length limit', () => {
    const validMessage = 'a'.repeat(VALIDATION_LIMITS.MAX_MESSAGE_CONTENT_LENGTH);
    const result = SendMessageSchema.safeParse({
      threadId: 'cltest123',
      content: validMessage
    });

    expect(result.success).toBe(true);
  });

  test('should reject empty or whitespace-only messages', () => {
    const emptyResult = SendMessageSchema.safeParse({
      threadId: 'cltest123',
      content: ''
    });
    expect(emptyResult.success).toBe(false);

    const whitespaceResult = SendMessageSchema.safeParse({
      threadId: 'cltest123',
      content: '   \n  \t  '
    });
    expect(whitespaceResult.success).toBe(false);
  });

  test('should reject invalid thread ID format', () => {
    const result = SendMessageSchema.safeParse({
      threadId: 'invalid-id',
      content: 'Valid message'
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('Invalid thread ID format');
    }
  });

  test('should reject thread titles exceeding maximum length', () => {
    const longTitle = 'a'.repeat(VALIDATION_LIMITS.MAX_THREAD_TITLE_LENGTH + 1);
    const result = CreateThreadSchema.safeParse({
      title: longTitle
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('200 characters or less');
    }
  });

  test('should accept valid thread creation data', () => {
    const result = CreateThreadSchema.safeParse({
      title: 'Valid thread title',
      activeModel: 'openai:gpt-4o'
    });

    expect(result.success).toBe(true);
  });
});

describe('Rate Limiting Tests', () => {
  test('should allow requests within rate limit', async () => {
    const result = await checkRateLimit({
      identifier: 'test-user-1',
      limit: 5,
      windowMs: 60000
    });

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  test('should block requests exceeding rate limit', async () => {
    const config = {
      identifier: 'test-user-2',
      limit: 2,
      windowMs: 60000
    };

    // Make requests up to the limit
    await checkRateLimit(config);
    await checkRateLimit(config);
    
    // Third request should be blocked
    const result = await checkRateLimit(config);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  test('should reset rate limit after window expires', async () => {
    const config = {
      identifier: 'test-user-3',
      limit: 1,
      windowMs: 100 // Very short window for testing
    };

    // First request should succeed
    const first = await checkRateLimit(config);
    expect(first.success).toBe(true);

    // Second request should be blocked
    const second = await checkRateLimit(config);
    expect(second.success).toBe(false);

    // Wait for window to reset
    await new Promise(resolve => setTimeout(resolve, 150));

    // Third request should succeed again
    const third = await checkRateLimit(config);
    expect(third.success).toBe(true);
  });

  test('should use correct rate limit configurations', () => {
    expect(RATE_LIMITS.MESSAGES.limit).toBe(20);
    expect(RATE_LIMITS.MESSAGES.windowMs).toBe(60 * 1000);
    
    expect(RATE_LIMITS.THREADS.limit).toBe(10);
    expect(RATE_LIMITS.THREADS.windowMs).toBe(60 * 60 * 1000);
    
    expect(RATE_LIMITS.API_GENERAL.limit).toBe(100);
    expect(RATE_LIMITS.API_GENERAL.windowMs).toBe(60 * 1000);
  });
});