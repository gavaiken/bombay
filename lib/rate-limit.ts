/**
 * Basic rate limiting utility with optional Upstash Redis support
 * Falls back to in-memory rate limiting when Upstash is not configured
 */

// Simple in-memory store for development/fallback
const inMemoryStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  identifier: string; // Usually user ID
  limit: number;       // Max requests
  windowMs: number;    // Time window in milliseconds
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Check if a request should be rate limited
 */
export async function checkRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const { identifier, limit, windowMs } = config;
  const now = Date.now();
  const resetTime = now + windowMs;

  // Try Upstash Redis first if configured
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return checkRateLimitUpstash(config, now, resetTime);
  }

  // Fallback to in-memory rate limiting
  return checkRateLimitMemory(config, now, resetTime);
}

/**
 * Rate limiting using Upstash Redis (production)
 */
async function checkRateLimitUpstash(
  config: RateLimitConfig,
  now: number,
  resetTime: number
): Promise<RateLimitResult> {
  const { identifier, limit, windowMs } = config;
  const key = `rate_limit:${identifier}`;

  try {
    // Use Upstash REST API
    const response = await fetch(
      `${process.env.UPSTASH_REDIS_REST_URL}/incr/${key}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        },
        // Timeout after 1.5 seconds to avoid blocking requests
        signal: AbortSignal.timeout(1500),
      }
    );

    if (!response.ok) {
      throw new Error(`Upstash error: ${response.status}`);
    }

    const data = await response.json();
    const count = data.result;

    // Set expiry on first request
    if (count === 1) {
      await fetch(
        `${process.env.UPSTASH_REDIS_REST_URL}/expire/${key}/${Math.ceil(windowMs / 1000)}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
          },
          signal: AbortSignal.timeout(1500),
        }
      );
    }

    const remaining = Math.max(0, limit - count);
    const success = count <= limit;

    return { success, remaining, resetTime };
  } catch (error) {
    // Fall back to in-memory on Upstash errors
    console.warn('Rate limit Upstash error, falling back to memory:', error);
    return checkRateLimitMemory(config, now, resetTime);
  }
}

/**
 * Rate limiting using in-memory store (development/fallback)
 */
function checkRateLimitMemory(
  config: RateLimitConfig,
  now: number,
  resetTime: number
): RateLimitResult {
  const { identifier, limit } = config;
  
  const entry = inMemoryStore.get(identifier);

  // Clean up expired entries
  if (entry && now >= entry.resetTime) {
    inMemoryStore.delete(identifier);
  }

  const current = inMemoryStore.get(identifier);

  if (!current) {
    // First request in window
    inMemoryStore.set(identifier, { count: 1, resetTime });
    return { success: true, remaining: limit - 1, resetTime };
  }

  // Increment counter
  current.count += 1;
  const remaining = Math.max(0, limit - current.count);
  const success = current.count <= limit;

  return { success, remaining, resetTime: current.resetTime };
}

/**
 * Common rate limit configurations
 */
export const RATE_LIMITS = {
  // Messages per minute per user
  MESSAGES: { limit: 20, windowMs: 60 * 1000 },
  // Threads per hour per user  
  THREADS: { limit: 10, windowMs: 60 * 60 * 1000 },
  // API requests per minute per user
  API_GENERAL: { limit: 100, windowMs: 60 * 1000 },
} as const;

/**
 * Clean up expired in-memory entries (call periodically)
 */
export function cleanupRateLimit() {
  const now = Date.now();
  for (const [key, entry] of inMemoryStore) {
    if (now >= entry.resetTime) {
      inMemoryStore.delete(key);
    }
  }
}

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimit, 5 * 60 * 1000);
}