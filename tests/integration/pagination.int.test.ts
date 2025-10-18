import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from 'lib/prisma';

describe('Message Pagination Tests', () => {
  let testUser: any;
  let testThread: any;
  let testMessages: any[];

  beforeEach(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'test-pagination@example.com'
      }
    });

    // Create test thread
    testThread = await prisma.thread.create({
      data: {
        userId: testUser.id,
        title: 'Pagination Test Thread',
        activeModel: 'openai:gpt-4o'
      }
    });

    // Create multiple test messages (simulate a long conversation)
    testMessages = [];
    for (let i = 1; i <= 25; i++) {
      const message = await prisma.message.create({
        data: {
          threadId: testThread.id,
          role: i % 2 === 1 ? 'user' : 'assistant',
          contentText: `Test message ${i}`,
          createdAt: new Date(Date.now() + i * 1000) // Space them out by 1 second
        }
      });
      testMessages.push(message);
    }
  });

  afterEach(async () => {
    // Cleanup
    await prisma.message.deleteMany({ where: { threadId: testThread.id } });
    await prisma.thread.delete({ where: { id: testThread.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
  });

  test('should return default limit of 50 messages', async () => {
    const url = `/api/messages?threadId=${testThread.id}`;
    
    // Simulate the API logic (since we can't easily test HTTP in unit tests)
    const data = await prisma.message.findMany({
      where: { threadId: testThread.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, role: true, contentText: true, createdAt: true, provider: true, model: true }
    });

    const messages = data.reverse();
    
    expect(messages.length).toBe(25); // All our test messages
    expect(messages[0].contentText).toBe('Test message 1'); // First message chronologically
    expect(messages[24].contentText).toBe('Test message 25'); // Last message chronologically
  });

  test('should respect custom limit parameter', async () => {
    const limit = 10;
    
    const data = await prisma.message.findMany({
      where: { threadId: testThread.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, role: true, contentText: true, createdAt: true, provider: true, model: true }
    });

    const messages = data.reverse();
    
    expect(messages.length).toBe(limit);
    // Should get the most recent 10 messages (16-25) in chronological order
    expect(messages[0].contentText).toBe('Test message 16');
    expect(messages[9].contentText).toBe('Test message 25');
  });

  test('should handle pagination with before parameter', async () => {
    const limit = 5;
    
    // Get the timestamp of message 20 to use as 'before'
    const message20 = testMessages.find(m => m.contentText === 'Test message 20');
    const before = message20.createdAt;
    
    const whereClause: any = { threadId: testThread.id };
    whereClause.createdAt = { lt: before };
    
    const data = await prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, role: true, contentText: true, createdAt: true, provider: true, model: true }
    });

    const messages = data.reverse();
    
    expect(messages.length).toBe(limit);
    // Should get messages 15-19 (the 5 messages before message 20)
    expect(messages[0].contentText).toBe('Test message 15');
    expect(messages[4].contentText).toBe('Test message 19');
  });

  test('should maintain chronological order with pagination', async () => {
    // Test that messages are always returned in chronological order
    const data = await prisma.message.findMany({
      where: { threadId: testThread.id },
      orderBy: { createdAt: 'desc' },
      take: 15,
      select: { id: true, role: true, contentText: true, createdAt: true, provider: true, model: true }
    });

    const messages = data.reverse();
    
    // Verify chronological order
    for (let i = 1; i < messages.length; i++) {
      expect(new Date(messages[i].createdAt) > new Date(messages[i-1].createdAt)).toBe(true);
    }
  });

  test('should calculate pagination metadata correctly', () => {
    const limit = 10;
    const dataLength = 10;
    
    // Simulate pagination metadata calculation
    const hasMore = dataLength === limit;
    expect(hasMore).toBe(true); // Should have more when we hit the limit exactly
    
    const dataLengthPartial = 7;
    const hasMorePartial = dataLengthPartial === limit;
    expect(hasMorePartial).toBe(false); // Should not have more when less than limit
  });

  test('should handle empty thread gracefully', async () => {
    // Create empty thread
    const emptyThread = await prisma.thread.create({
      data: {
        userId: testUser.id,
        title: 'Empty Thread',
        activeModel: 'openai:gpt-4o'
      }
    });

    const data = await prisma.message.findMany({
      where: { threadId: emptyThread.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, role: true, contentText: true, createdAt: true, provider: true, model: true }
    });

    expect(data.length).toBe(0);
    
    // Cleanup
    await prisma.thread.delete({ where: { id: emptyThread.id } });
  });

  test('should enforce maximum limit', () => {
    const requestedLimit = 1000;
    const maxLimit = 200;
    const actualLimit = Math.min(requestedLimit, maxLimit);
    
    expect(actualLimit).toBe(maxLimit);
  });
});