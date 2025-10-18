import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { recordMetric, getUsageMetrics, Metrics, resetDailyMetrics, resetAllMetrics } from 'lib/metrics';

describe('Metrics Collection Tests', () => {
  beforeEach(() => {
    // Reset all metrics before each test
    resetAllMetrics();
  });

  test('should record and track daily active users', async () => {
    await Metrics.trackActiveUser('user-1');
    await Metrics.trackActiveUser('user-2');
    await Metrics.trackActiveUser('user-1'); // Duplicate should not increase count

    const metrics = await getUsageMetrics();
    expect(metrics.dailyActiveUsers).toBe(2);
  });

  test('should track model usage counts', async () => {
    await Metrics.trackModelUsage('openai:gpt-4o');
    await Metrics.trackModelUsage('openai:gpt-4o');
    await Metrics.trackModelUsage('anthropic:claude-3-5-sonnet');

    const metrics = await getUsageMetrics();
    expect(metrics.modelUsage['openai:gpt-4o']).toBe(2);
    expect(metrics.modelUsage['anthropic:claude-3-5-sonnet']).toBe(1);
  });

  test('should track provider response times and calculate averages', async () => {
    await Metrics.trackResponseTime('openai', 1200);
    await Metrics.trackResponseTime('openai', 800);
    await Metrics.trackResponseTime('anthropic', 1500);

    const metrics = await getUsageMetrics();
    expect(metrics.providerResponseTimes['openai'].avg).toBe(1000); // (1200 + 800) / 2
    expect(metrics.providerResponseTimes['openai'].count).toBe(2);
    expect(metrics.providerResponseTimes['anthropic'].avg).toBe(1500);
    expect(metrics.providerResponseTimes['anthropic'].count).toBe(1);
  });

  test('should track token usage', async () => {
    await Metrics.trackTokens(150, 75);
    await Metrics.trackTokens(200, 100);

    const metrics = await getUsageMetrics();
    expect(metrics.tokenUsage.totalInputTokens).toBe(350);
    expect(metrics.tokenUsage.totalOutputTokens).toBe(175);
  });

  test('should track message sending with model info', async () => {
    await Metrics.trackMessage('user-1', 'openai:gpt-4o');
    await Metrics.trackMessage('user-2', 'anthropic:claude-3-5-sonnet');

    const metrics = await getUsageMetrics();
    expect(metrics.dailyActiveUsers).toBe(2);
  });

  test('should track thread creation with model info', async () => {
    await Metrics.trackThreadCreated('user-1', 'openai:gpt-4o');
    await Metrics.trackThreadCreated('user-2', 'anthropic:claude-3-5-sonnet');

    const metrics = await getUsageMetrics();
    expect(metrics.dailyActiveUsers).toBe(2);
  });

  test('should handle metric recording errors gracefully', async () => {
    // Test with invalid data - should not throw
    await expect(recordMetric({
      event: 'invalid_event',
      value: NaN
    })).resolves.not.toThrow();

    const metrics = await getUsageMetrics();
    expect(metrics).toBeDefined();
  });

  test('should reset daily metrics correctly', async () => {
    await Metrics.trackActiveUser('user-1');
    await Metrics.trackActiveUser('user-2');
    
    let metrics = await getUsageMetrics();
    expect(metrics.dailyActiveUsers).toBe(2);

    resetDailyMetrics();

    metrics = await getUsageMetrics();
    expect(metrics.dailyActiveUsers).toBe(0);
  });

  test('should maintain model counts across daily resets', async () => {
    await Metrics.trackModelUsage('openai:gpt-4o');
    await Metrics.trackModelUsage('anthropic:claude-3-5-sonnet');

    let metrics = await getUsageMetrics();
    expect(metrics.modelUsage['openai:gpt-4o']).toBe(1);
    expect(metrics.modelUsage['anthropic:claude-3-5-sonnet']).toBe(1);

    // Only reset daily metrics (not model counts)
    resetDailyMetrics();

    metrics = await getUsageMetrics();
    // Model counts should persist across daily resets
    expect(metrics.modelUsage['openai:gpt-4o']).toBe(1);
    expect(metrics.modelUsage['anthropic:claude-3-5-sonnet']).toBe(1);
    // But daily users should be reset
    expect(metrics.dailyActiveUsers).toBe(0);
  });

  test('should handle empty metrics gracefully', async () => {
    const metrics = await getUsageMetrics();
    
    expect(metrics).toBeDefined();
    expect(metrics.dailyActiveUsers).toBe(0);
    expect(typeof metrics.totalUsers).toBe('number');
    expect(typeof metrics.totalMessages).toBe('number');
    expect(typeof metrics.totalThreads).toBe('number');
    expect(metrics.modelUsage).toBeDefined();
    expect(metrics.providerResponseTimes).toBeDefined();
    expect(metrics.tokenUsage).toBeDefined();
  });

  test('should include proper structure in usage metrics', async () => {
    await Metrics.trackActiveUser('user-1');
    await Metrics.trackModelUsage('openai:gpt-4o');
    await Metrics.trackResponseTime('openai', 1000);
    await Metrics.trackTokens(100, 50);

    const metrics = await getUsageMetrics();

    // Check structure
    expect(metrics).toHaveProperty('totalUsers');
    expect(metrics).toHaveProperty('totalMessages');
    expect(metrics).toHaveProperty('totalThreads');
    expect(metrics).toHaveProperty('dailyActiveUsers');
    expect(metrics).toHaveProperty('modelUsage');
    expect(metrics).toHaveProperty('providerResponseTimes');
    expect(metrics).toHaveProperty('tokenUsage');

    expect(metrics.tokenUsage).toHaveProperty('totalInputTokens');
    expect(metrics.tokenUsage).toHaveProperty('totalOutputTokens');

    // Verify types
    expect(typeof metrics.totalUsers).toBe('number');
    expect(typeof metrics.dailyActiveUsers).toBe('number');
    expect(typeof metrics.modelUsage).toBe('object');
    expect(typeof metrics.providerResponseTimes).toBe('object');
    expect(typeof metrics.tokenUsage).toBe('object');
  });

  test('should update in-memory metrics for different event types', async () => {
    // Test all supported event types
    await recordMetric({
      userId: 'user-1',
      event: 'daily_active_user',
      value: 1
    });

    await recordMetric({
      event: 'model_usage',
      value: 1,
      metadata: { model: 'test-model' }
    });

    await recordMetric({
      event: 'provider_response_time',
      value: 500,
      metadata: { provider: 'test-provider' }
    });

    await recordMetric({
      event: 'token_usage',
      value: 100,
      metadata: { type: 'input' }
    });

    await recordMetric({
      event: 'token_usage',
      value: 50,
      metadata: { type: 'output' }
    });

    const metrics = await getUsageMetrics();
    expect(metrics.dailyActiveUsers).toBe(1);
    expect(metrics.modelUsage['test-model']).toBe(1);
    expect(metrics.providerResponseTimes['test-provider'].avg).toBe(500);
    expect(metrics.tokenUsage.totalInputTokens).toBe(100);
    expect(metrics.tokenUsage.totalOutputTokens).toBe(50);
  });
});