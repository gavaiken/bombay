export type LogLevel = 'info' | 'error' | 'warn'

const LOGTAIL_URL = 'https://in.logtail.com'

function getToken(): string | null {
  const raw = process.env.LOGTAIL_SOURCE_TOKEN || process.env.BETTERSTACK_SOURCE_TOKEN || ''
  const token = raw.replace(/[\r\n]/g, '').trim()
  return token || null
}

async function send(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const token = getToken()
  if (!token) return
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 1500)
    await fetch(LOGTAIL_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ dt: new Date().toISOString(), level, message, context }),
      signal: ctrl.signal
    }).catch(() => {})
    clearTimeout(t)
  } catch {}
}

export async function logError(message: string, context?: Record<string, unknown>) {
  console.error(message, context || {})
  await send('error', message, context)
}

export async function logInfo(message: string, context?: Record<string, unknown>) {
  console.log(message, context || {})
  await send('info', message, context)
}

export async function logWarn(message: string, context?: Record<string, unknown>) {
  console.warn(message, context || {})
  await send('warn', message, context)
}

// Structured event logging for key application events
export interface EventContext {
  userId?: string;
  threadId?: string;
  provider?: string;
  model?: string;
  tokenCount?: number;
  latencyMs?: number;
  userAgent?: string;
  ip?: string;
  usedScopes?: string[];
  scopeKeys?: string[];
  scopeKey?: string;
  activeCount?: number;
  consent?: boolean;
  droppedMessages?: number;
  remainingTokens?: number;
  tokenLimit?: number;
}

export async function logEvent(
  event: string,
  level: LogLevel = 'info',
  context?: EventContext
) {
  const logData = {
    event,
    timestamp: new Date().toISOString(),
    level,
    ...context
  };
  
  // Console output for development
  const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  logFn(`[${event}]`, logData);
  
  await send(level, `Event: ${event}`, logData);
}

// Convenience methods for common events
export const Events = {
  USER_SIGNED_IN: 'user.signed_in',
  USER_SIGNED_OUT: 'user.signed_out',
  THREAD_CREATED: 'thread.created',
  THREAD_UPDATED: 'thread.updated',
  MESSAGE_SENT: 'message.sent',
  MESSAGE_RECEIVED: 'message.received',
  PROVIDER_ERROR: 'provider.error',
  CONTEXT_TRUNCATED: 'context.truncated',
  RATE_LIMITED: 'rate.limited',
  API_ERROR: 'api.error',
  // Scopes-related events (S8.1)
  SCOPE_TOGGLED: 'scope.toggled',
  SCOPE_CONSENT: 'scope.consent',
  RECALL_USED: 'recall.used',
} as const;

export type EventType = typeof Events[keyof typeof Events];
