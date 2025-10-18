import type { Message } from '@prisma/client'
import { logEvent, Events } from './logger'
import { Metrics } from './metrics'

// Import tiktoken for accurate OpenAI token counting
let tiktoken: any = null;
try {
  tiktoken = require('tiktoken');
} catch (error) {
  console.warn('tiktoken not available, falling back to word count estimation');
}

/**
 * Accurate token counting for OpenAI models using tiktoken
 */
function countTokensOpenAI(text: string, model: string): number {
  if (!tiktoken) {
    return estimateTokensWordCount(text);
  }
  
  try {
    // Get encoding for the specific model
    const encoding = model.includes('gpt-4') 
      ? tiktoken.encoding_for_model('gpt-4') 
      : tiktoken.encoding_for_model('gpt-3.5-turbo');
    
    const tokens = encoding.encode(text);
    encoding.free(); // Free memory
    return tokens.length;
  } catch (error) {
    console.warn(`tiktoken error for model ${model}, falling back to word count:`, error);
    return estimateTokensWordCount(text);
  }
}

/**
 * Word-based token estimation for Anthropic models
 * Claude uses a different tokenization scheme, but word count is a reasonable approximation
 */
function countTokensAnthropic(text: string): number {
  // Anthropic models roughly: 1 token ≈ 3.5 characters or 0.75 words
  const words = text.split(/\s+/).length;
  return Math.ceil(words / 0.75);
}

/**
 * Fallback word-count based token estimation
 */
function estimateTokensWordCount(text: string): number {
  const words = text.split(/\s+/).length;
  // General approximation: 1 token ≈ 0.75 words
  return Math.ceil(words / 0.75);
}

/**
 * Main token counting function that routes to the appropriate method
 */
export function countTokens(text: string, model: string): number {
  if (model.startsWith('gpt-') || model.includes('openai')) {
    return countTokensOpenAI(text, model);
  } else if (model.includes('claude') || model.includes('anthropic')) {
    return countTokensAnthropic(text);
  } else {
    return estimateTokensWordCount(text);
  }
}

// Updated context window limits based on actual model specifications
const MODEL_LIMITS: Record<string, { maxTokens: number; headroom: number }> = {
  // OpenAI models - conservative limits to ensure reliability
  'gpt-4o': { maxTokens: 120000, headroom: 8000 },
  'gpt-4o-mini': { maxTokens: 120000, headroom: 8000 },
  'gpt-4': { maxTokens: 8000, headroom: 1000 },
  'gpt-3.5-turbo': { maxTokens: 16000, headroom: 2000 },
  
  // Anthropic Claude models - very large context windows
  'claude-3-5-sonnet': { maxTokens: 200000, headroom: 10000 },
  'claude-3-5-haiku': { maxTokens: 200000, headroom: 10000 },
  'claude-3': { maxTokens: 200000, headroom: 10000 },
  
  // Default fallback
  'default': { maxTokens: 8000, headroom: 1000 }
}

export type ProviderMessage = { role: 'system'|'user'|'assistant'; content: string }

export async function buildPromptWithTruncation(opts: {
  model: string
  prior: Message[]
  currentUserText?: string
  userId?: string
}): Promise<ProviderMessage[]> {
  const key = opts.model
  const lim = MODEL_LIMITS[key] || MODEL_LIMITS['default']
  const max = lim.maxTokens - lim.headroom

  const base: ProviderMessage[] = opts.prior.map((m) => ({
    role: m.role as 'system'|'user'|'assistant',
    content: m.contentText
  }))
  if (opts.currentUserText) base.push({ role: 'user', content: opts.currentUserText })

  // Count tokens using proper token counting
  const sys = base.length && base[0].role === 'system' ? base[0] : null
  const rest = sys ? base.slice(1) : base.slice(0)
  
  let total = base.reduce((acc, m) => acc + countTokens(m.content, opts.model), 0)
  let droppedCount = 0;
  
  while (total > max && rest.length > 0) {
    // Drop oldest from the front of rest
    const dropped = rest.shift()!
    const droppedTokens = countTokens(dropped.content, opts.model);
    total -= droppedTokens;
    droppedCount++;
  }
  
  // Log context truncation if messages were dropped
  if (droppedCount > 0) {
    console.warn(`Context truncation: dropped ${droppedCount} messages (${total} tokens remaining, limit: ${max})`);
    
    // Log structured event
    await logEvent(Events.CONTEXT_TRUNCATED, 'warn', {
      userId: opts.userId,
      model: opts.model,
      droppedMessages: droppedCount,
      remainingTokens: total,
      tokenLimit: max
    });
    
    // Track metrics
    await Metrics.trackActiveUser(opts.userId || 'unknown');
  }
  
  const result = sys ? [sys, ...rest] : rest
  
  // Track token usage in metrics
  if (opts.userId) {
    const finalTokenCount = result.reduce((acc, m) => acc + countTokens(m.content, opts.model), 0);
    await Metrics.trackTokens(finalTokenCount, 0); // Input tokens only for now
  }
  
  return result
}

export async function buildScopedContext(opts: {
  model: string
  prior: Message[]
  currentUserText?: string
  userId: string
  threadId: string
  enabledScopeKeys: string[]
}): Promise<{ messages: ProviderMessage[]; usedScopes: string[] }> {
  // Build base prompt (truncation without extra context)
  const base = await buildPromptWithTruncation({ model: opts.model, prior: opts.prior, currentUserText: opts.currentUserText, userId: opts.userId })
  // If no scopes enabled, return base
  if (!opts.enabledScopeKeys || opts.enabledScopeKeys.length === 0) {
    return { messages: base, usedScopes: [] }
  }
  const { recallProvider } = await import('./recall')
  const recall = await recallProvider.getScopedContext({ userId: opts.userId, threadId: opts.threadId, enabledScopeKeys: opts.enabledScopeKeys, query: opts.currentUserText })
  const contextLines = recall.snippets.map((s) => `(${s.scopeKey}) ${s.content}`)
  const preface: ProviderMessage = { role: 'system', content: `Use only the following scopes: ${opts.enabledScopeKeys.join(', ')}.` }
  const memory: ProviderMessage = { role: 'system', content: `Scoped context:\n${contextLines.join('\n')}` }
  const messages: ProviderMessage[] = [preface, memory, ...base]
  return { messages, usedScopes: recall.usedScopes }
}
