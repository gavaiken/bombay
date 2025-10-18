/**
 * Basic usage metrics collection utility
 * Tracks aggregated usage without storing individual message content
 */

import { prisma } from './prisma';

export interface MetricEvent {
  userId?: string;
  event: string;
  value: number;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export interface UsageMetrics {
  totalUsers: number;
  totalMessages: number;
  totalThreads: number;
  dailyActiveUsers: number;
  modelUsage: Record<string, number>;
  providerResponseTimes: Record<string, { avg: number; count: number }>;
  tokenUsage: {
    totalInputTokens: number;
    totalOutputTokens: number;
  };
}

// In-memory metrics store for aggregation (reset on restart)
const metricsStore = {
  dailyUsers: new Set<string>(),
  modelCounts: new Map<string, number>(),
  providerResponseTimes: new Map<string, { total: number; count: number }>(),
  tokenUsage: { input: 0, output: 0 },
};

/**
 * Record a metric event
 */
export async function recordMetric(event: MetricEvent): Promise<void> {
  const { userId, event: eventType, value, metadata, timestamp } = event;
  
  try {
    // For MVP, use in-memory storage only
    // TODO: Add database persistence in future version
    updateInMemoryMetrics(event);
  } catch (error) {
    // Metrics collection should never break the application
    console.warn('Metrics collection error:', error);
  }
}

/**
 * Update in-memory metrics for fast access
 */
function updateInMemoryMetrics(event: MetricEvent): void {
  const { userId, event: eventType, value, metadata } = event;

  switch (eventType) {
    case 'daily_active_user':
      if (userId) {
        metricsStore.dailyUsers.add(userId);
      }
      break;

    case 'model_usage':
      if (metadata?.model) {
        const current = metricsStore.modelCounts.get(metadata.model) || 0;
        metricsStore.modelCounts.set(metadata.model, current + value);
      }
      break;

    case 'provider_response_time':
      if (metadata?.provider && typeof value === 'number') {
        const current = metricsStore.providerResponseTimes.get(metadata.provider) || { total: 0, count: 0 };
        current.total += value;
        current.count += 1;
        metricsStore.providerResponseTimes.set(metadata.provider, current);
      }
      break;

    case 'token_usage':
      if (metadata?.type === 'input') {
        metricsStore.tokenUsage.input += value;
      } else if (metadata?.type === 'output') {
        metricsStore.tokenUsage.output += value;
      }
      break;
  }
}

/**
 * Get current usage metrics
 */
export async function getUsageMetrics(): Promise<UsageMetrics> {
  try {
    // Get persistent counts from database
    const [userCount, messageCount, threadCount] = await Promise.all([
      prisma.user.count(),
      prisma.message.count(),
      prisma.thread.count(),
    ]);

    // Combine with in-memory metrics
    const modelUsage: Record<string, number> = {};
    for (const [model, count] of metricsStore.modelCounts.entries()) {
      modelUsage[model] = count;
    }

    const providerResponseTimes: Record<string, { avg: number; count: number }> = {};
    for (const [provider, data] of metricsStore.providerResponseTimes.entries()) {
      providerResponseTimes[provider] = {
        avg: data.count > 0 ? data.total / data.count : 0,
        count: data.count,
      };
    }

    return {
      totalUsers: userCount,
      totalMessages: messageCount,
      totalThreads: threadCount,
      dailyActiveUsers: metricsStore.dailyUsers.size,
      modelUsage,
      providerResponseTimes,
      tokenUsage: {
        totalInputTokens: metricsStore.tokenUsage.input,
        totalOutputTokens: metricsStore.tokenUsage.output,
      },
    };
  } catch (error) {
    console.warn('Error fetching metrics:', error);
    // Return basic metrics on error
    return {
      totalUsers: 0,
      totalMessages: 0,
      totalThreads: 0,
      dailyActiveUsers: metricsStore.dailyUsers.size,
      modelUsage: {},
      providerResponseTimes: {},
      tokenUsage: {
        totalInputTokens: metricsStore.tokenUsage.input,
        totalOutputTokens: metricsStore.tokenUsage.output,
      },
    };
  }
}

/**
 * Convenience functions for common metrics
 */
export const Metrics = {
  // Track daily active user
  trackActiveUser: (userId: string) =>
    recordMetric({
      userId,
      event: 'daily_active_user',
      value: 1,
    }),

  // Track message sent
  trackMessage: async (userId: string, model: string) => {
    await recordMetric({
      userId,
      event: 'message_sent',
      value: 1,
      metadata: { model },
    });
    // Also track as active user
    await recordMetric({
      userId,
      event: 'daily_active_user',
      value: 1,
    });
  },

  // Track model usage
  trackModelUsage: (model: string) =>
    recordMetric({
      event: 'model_usage',
      value: 1,
      metadata: { model },
    }),

  // Track provider response time
  trackResponseTime: (provider: string, timeMs: number) =>
    recordMetric({
      event: 'provider_response_time',
      value: timeMs,
      metadata: { provider },
    }),

  // Track token usage
  trackTokens: (inputTokens: number, outputTokens: number) =>
    Promise.all([
      recordMetric({
        event: 'token_usage',
        value: inputTokens,
        metadata: { type: 'input' },
      }),
      recordMetric({
        event: 'token_usage',
        value: outputTokens,
        metadata: { type: 'output' },
      }),
    ]),

  // Track thread creation
  trackThreadCreated: async (userId: string, model: string) => {
    await recordMetric({
      userId,
      event: 'thread_created',
      value: 1,
      metadata: { model },
    });
    // Also track as active user
    await recordMetric({
      userId,
      event: 'daily_active_user',
      value: 1,
    });
  },
};

/**
 * Reset daily metrics (call this on daily cron or app restart)
 */
export function resetDailyMetrics(): void {
  metricsStore.dailyUsers.clear();
  // Keep model counts and response times as they're useful across days
}

/**
 * Reset all metrics (for testing)
 */
export function resetAllMetrics(): void {
  metricsStore.dailyUsers.clear();
  metricsStore.modelCounts.clear();
  metricsStore.providerResponseTimes.clear();
  metricsStore.tokenUsage.input = 0;
  metricsStore.tokenUsage.output = 0;
}
