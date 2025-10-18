import { describe, test, expect, beforeEach } from 'vitest';
import { buildPromptWithTruncation, countTokens } from 'lib/context';
import type { Message } from '@prisma/client';
import { resetAllMetrics } from 'lib/metrics';

describe('Context Management Tests', () => {
  beforeEach(() => {
    resetAllMetrics();
  });

  // Helper to create mock messages
  function createMessage(
    role: 'system' | 'user' | 'assistant',
    content: string,
    id: string = Math.random().toString()
  ): Message {
    return {
      id,
      threadId: 'test-thread',
      role,
      contentText: content,
      provider: null,
      model: null,
      usageJson: null,
      createdAt: new Date(),
    } as Message;
  }

  describe('Token Counting', () => {
    test('should count tokens for OpenAI models', () => {
      const text = 'Hello world, this is a test message for token counting.';
      const count = countTokens(text, 'gpt-4o');
      
      // Should return a reasonable token count (not just character-based)
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThan(50); // Reasonable upper bound for this text
    });

    test('should count tokens for Anthropic models', () => {
      const text = 'Hello world, this is a test message for token counting.';
      const count = countTokens(text, 'claude-3-5-sonnet');
      
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThan(50);
    });

    test('should use fallback for unknown models', () => {
      const text = 'Hello world, this is a test message.';
      const count = countTokens(text, 'unknown-model');
      
      expect(count).toBeGreaterThan(0);
    });

    test('should handle empty text', () => {
      const count = countTokens('', 'gpt-4o');
      expect(count).toBe(0);
    });

    test('should handle very long text', () => {
      const longText = 'word '.repeat(1000);
      const count = countTokens(longText, 'gpt-4o');
      
      expect(count).toBeGreaterThan(500);
      expect(count).toBeLessThan(2000);
    });
  });

  describe('Context Truncation', () => {
    test('should not truncate short conversations', async () => {
      const messages: Message[] = [
        createMessage('user', 'Hello'),
        createMessage('assistant', 'Hi there!'),
        createMessage('user', 'How are you?'),
      ];

      const result = await buildPromptWithTruncation({
        model: 'gpt-4o',
        prior: messages,
        currentUserText: 'What can you do?',
        userId: 'test-user'
      });

      // All messages should be preserved, plus the new user message
      expect(result).toHaveLength(4);
      expect(result[0].content).toBe('Hello');
      expect(result[3].content).toBe('What can you do?');
    });

    test('should preserve system message during truncation', async () => {
      const shortText = 'Hi';
      const longText = 'word '.repeat(50); // Make it long enough to potentially cause truncation
      
      const messages: Message[] = [
        createMessage('system', 'You are a helpful assistant.'),
        ...Array.from({ length: 20 }, (_, i) => [
          createMessage('user', `${longText} Question ${i}`),
          createMessage('assistant', `${longText} Answer ${i}`)
        ]).flat()
      ];

      // Use a smaller context window for testing
      const result = await buildPromptWithTruncation({
        model: 'gpt-4', // Smaller context window
        prior: messages,
        currentUserText: 'Final question',
        userId: 'test-user'
      });

      // System message should always be first
      expect(result[0].role).toBe('system');
      expect(result[0].content).toBe('You are a helpful assistant.');
      
      // Should include the new user message at the end
      expect(result[result.length - 1].content).toBe('Final question');
    });

    test('should truncate from oldest when context limit exceeded', async () => {
      // Create very long messages to exceed even GPT-4's context window
      const longContent = 'This is a very long message that contains many words and will use up a lot of tokens. '.repeat(200);
      
      const messages: Message[] = [
        createMessage('user', `First message: ${longContent}`),
        createMessage('assistant', `First response: ${longContent}`),
        createMessage('user', `Second message: ${longContent}`),
        createMessage('assistant', `Second response: ${longContent}`),
        createMessage('user', `Third message: ${longContent}`),
        createMessage('assistant', `Third response: ${longContent}`),
      ];

      // Use smaller context window to force truncation
      const result = await buildPromptWithTruncation({
        model: 'gpt-4', // 8k context window with 1k headroom = 7k usable
        prior: messages,
        currentUserText: `Final message: ${longContent}`, // Another long message
        userId: 'test-user'
      });

      // Should have fewer messages than the original due to truncation
      expect(result.length).toBeLessThan(messages.length + 1);
      
      // Should not include the first (oldest) messages
      expect(result.some(m => m.content.includes('First message'))).toBe(false);
    });

    test('should handle conversation with only system message', async () => {
      const messages: Message[] = [
        createMessage('system', 'You are a helpful assistant.'),
      ];

      const result = await buildPromptWithTruncation({
        model: 'gpt-4o',
        prior: messages,
        currentUserText: 'Hello',
        userId: 'test-user'
      });

      expect(result).toHaveLength(2);
      expect(result[0].role).toBe('system');
      expect(result[1].role).toBe('user');
    });

    test('should handle conversation without system message', async () => {
      const messages: Message[] = [
        createMessage('user', 'Hello'),
        createMessage('assistant', 'Hi there!'),
      ];

      const result = await buildPromptWithTruncation({
        model: 'gpt-4o',
        prior: messages,
        currentUserText: 'How are you?',
        userId: 'test-user'
      });

      expect(result).toHaveLength(3);
      expect(result[0].role).toBe('user');
      expect(result[0].content).toBe('Hello');
    });

    test('should handle empty conversation', async () => {
      const messages: Message[] = [];

      const result = await buildPromptWithTruncation({
        model: 'gpt-4o',
        prior: messages,
        currentUserText: 'Hello',
        userId: 'test-user'
      });

      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('user');
      expect(result[0].content).toBe('Hello');
    });

    test('should work without currentUserText', async () => {
      const messages: Message[] = [
        createMessage('user', 'Hello'),
        createMessage('assistant', 'Hi there!'),
      ];

      const result = await buildPromptWithTruncation({
        model: 'gpt-4o',
        prior: messages,
        userId: 'test-user'
      });

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('Hello');
      expect(result[1].content).toBe('Hi there!');
    });

    test('should work without userId', async () => {
      const messages: Message[] = [
        createMessage('user', 'Hello'),
      ];

      const result = await buildPromptWithTruncation({
        model: 'gpt-4o',
        prior: messages,
        currentUserText: 'Hi'
      });

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('Hello');
      expect(result[1].content).toBe('Hi');
    });
  });

  describe('Different Model Types', () => {
    test('should handle OpenAI models with appropriate context windows', async () => {
      const messages: Message[] = [
        createMessage('user', 'Test message'),
      ];

      const resultGPT4o = await buildPromptWithTruncation({
        model: 'gpt-4o',
        prior: messages,
        currentUserText: 'Hi',
        userId: 'test-user'
      });

      expect(resultGPT4o).toHaveLength(2);
    });

    test('should handle Anthropic models with large context windows', async () => {
      const messages: Message[] = [
        createMessage('user', 'Test message'),
      ];

      const resultClaude = await buildPromptWithTruncation({
        model: 'claude-3-5-sonnet',
        prior: messages,
        currentUserText: 'Hi',
        userId: 'test-user'
      });

      expect(resultClaude).toHaveLength(2);
    });

    test('should handle unknown models with fallback limits', async () => {
      const messages: Message[] = [
        createMessage('user', 'Test message'),
      ];

      const result = await buildPromptWithTruncation({
        model: 'unknown-model',
        prior: messages,
        currentUserText: 'Hi',
        userId: 'test-user'
      });

      expect(result).toHaveLength(2);
    });
  });

  describe('Message Structure', () => {
    test('should return correct message structure', async () => {
      const messages: Message[] = [
        createMessage('system', 'System prompt'),
        createMessage('user', 'User message'),
        createMessage('assistant', 'Assistant response'),
      ];

      const result = await buildPromptWithTruncation({
        model: 'gpt-4o',
        prior: messages,
        currentUserText: 'New message',
        userId: 'test-user'
      });

      expect(result).toHaveLength(4);
      
      // Check structure of each message
      result.forEach(msg => {
        expect(msg).toHaveProperty('role');
        expect(msg).toHaveProperty('content');
        expect(['system', 'user', 'assistant']).toContain(msg.role);
        expect(typeof msg.content).toBe('string');
      });
    });
  });
});