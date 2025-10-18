import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { logEvent, logError, logInfo, logWarn, Events } from 'lib/logger';

// Mock console methods to capture output
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn
};

describe('Structured Logging Tests', () => {
  let consoleLogs: any[] = [];
  let consoleErrors: any[] = [];
  let consoleWarns: any[] = [];

  beforeEach(() => {
    // Mock console methods to capture logs
    consoleLogs = [];
    consoleErrors = [];
    consoleWarns = [];
    
    console.log = vi.fn((...args) => consoleLogs.push(args));
    console.error = vi.fn((...args) => consoleErrors.push(args));
    console.warn = vi.fn((...args) => consoleWarns.push(args));
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
  });

  test('should log structured events with correct format', async () => {
    const eventContext = {
      userId: 'user-123',
      threadId: 'thread-456',
      provider: 'openai',
      model: 'gpt-4o'
    };

    await logEvent(Events.MESSAGE_SENT, 'info', eventContext);

    // Check console output
    expect(consoleLogs).toHaveLength(1);
    expect(consoleLogs[0][0]).toBe(`[${Events.MESSAGE_SENT}]`);
    
    const logData = consoleLogs[0][1];
    expect(logData.event).toBe(Events.MESSAGE_SENT);
    expect(logData.level).toBe('info');
    expect(logData.userId).toBe('user-123');
    expect(logData.threadId).toBe('thread-456');
    expect(logData.provider).toBe('openai');
    expect(logData.model).toBe('gpt-4o');
    expect(logData.timestamp).toBeDefined();
  });

  test('should handle error level events correctly', async () => {
    await logEvent(Events.PROVIDER_ERROR, 'error', {
      userId: 'user-123',
      provider: 'anthropic'
    });

    expect(consoleErrors).toHaveLength(1);
    expect(consoleErrors[0][0]).toBe(`[${Events.PROVIDER_ERROR}]`);
    
    const logData = consoleErrors[0][1];
    expect(logData.level).toBe('error');
    expect(logData.event).toBe(Events.PROVIDER_ERROR);
  });

  test('should handle warning level events correctly', async () => {
    await logEvent(Events.RATE_LIMITED, 'warn', {
      userId: 'user-123',
      threadId: 'thread-456'
    });

    expect(consoleWarns).toHaveLength(1);
    expect(consoleWarns[0][0]).toBe(`[${Events.RATE_LIMITED}]`);
    
    const logData = consoleWarns[0][1];
    expect(logData.level).toBe('warn');
    expect(logData.event).toBe(Events.RATE_LIMITED);
  });

  test('should log basic info messages', async () => {
    await logInfo('Test info message', { key: 'value' });

    expect(consoleLogs).toHaveLength(1);
    expect(consoleLogs[0][0]).toBe('Test info message');
    expect(consoleLogs[0][1]).toEqual({ key: 'value' });
  });

  test('should log error messages', async () => {
    await logError('Test error message', { error: 'details' });

    expect(consoleErrors).toHaveLength(1);
    expect(consoleErrors[0][0]).toBe('Test error message');
    expect(consoleErrors[0][1]).toEqual({ error: 'details' });
  });

  test('should log warning messages', async () => {
    await logWarn('Test warning message', { warning: 'details' });

    expect(consoleWarns).toHaveLength(1);
    expect(consoleWarns[0][0]).toBe('Test warning message');
    expect(consoleWarns[0][1]).toEqual({ warning: 'details' });
  });

  test('should handle events without context', async () => {
    await logEvent(Events.USER_SIGNED_IN, 'info');

    expect(consoleLogs).toHaveLength(1);
    
    const logData = consoleLogs[0][1];
    expect(logData.event).toBe(Events.USER_SIGNED_IN);
    expect(logData.level).toBe('info');
    expect(logData.timestamp).toBeDefined();
  });

  test('should include all defined event types', () => {
    const expectedEvents = [
      'user.signed_in',
      'user.signed_out',
      'thread.created',
      'thread.updated',
      'message.sent',
      'message.received',
      'provider.error',
      'context.truncated',
      'rate.limited',
      'api.error'
    ];

    const actualEvents = Object.values(Events);
    
    expectedEvents.forEach(event => {
      expect(actualEvents).toContain(event);
    });
    
    expect(actualEvents).toHaveLength(expectedEvents.length);
  });

  test('should default to info level when no level specified', async () => {
    await logEvent(Events.THREAD_CREATED);

    expect(consoleLogs).toHaveLength(1);
    
    const logData = consoleLogs[0][1];
    expect(logData.level).toBe('info');
  });

  test('should handle context with various data types', async () => {
    const context = {
      userId: 'user-123',
      tokenCount: 150,
      latencyMs: 1200,
      userAgent: 'Mozilla/5.0...',
      ip: '192.168.1.1'
    };

    await logEvent(Events.MESSAGE_RECEIVED, 'info', context);

    const logData = consoleLogs[0][1];
    expect(logData.userId).toBe('user-123');
    expect(logData.tokenCount).toBe(150);
    expect(logData.latencyMs).toBe(1200);
    expect(logData.userAgent).toBe('Mozilla/5.0...');
    expect(logData.ip).toBe('192.168.1.1');
  });
});