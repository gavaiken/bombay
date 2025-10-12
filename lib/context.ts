import type { Message } from '@prisma/client'

// Rough token estimator: ~4 chars per token (very rough)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

const MODEL_LIMITS: Record<string, { maxTokens: number; headroom: number }> = {
  'gpt-4o': { maxTokens: 8000, headroom: 500 },
  'gpt-4o-mini': { maxTokens: 8000, headroom: 500 },
  'claude-3-5-sonnet': { maxTokens: 8000, headroom: 500 },
  'claude-3-5-haiku': { maxTokens: 8000, headroom: 500 }
}

export type ProviderMessage = { role: 'system'|'user'|'assistant'; content: string }

export function buildPromptWithTruncation(opts: {
  model: string
  prior: Message[]
  currentUserText?: string
}): ProviderMessage[] {
  const key = opts.model
  const lim = MODEL_LIMITS[key] || { maxTokens: 8000, headroom: 500 }
  const max = lim.maxTokens - lim.headroom

  const base: ProviderMessage[] = opts.prior.map((m) => ({
    role: m.role as 'system'|'user'|'assistant',
    content: m.contentText
  }))
  if (opts.currentUserText) base.push({ role: 'user', content: opts.currentUserText })

  // Count tokens from the end; keep system at position 0 if present
  const sys = base.length && base[0].role === 'system' ? base[0] : null
  const rest = sys ? base.slice(1) : base.slice(0)
  let total = base.reduce((acc, m) => acc + estimateTokens(m.content), 0)
  while (total > max && rest.length > 0) {
    // drop oldest from the front of rest
    const dropped = rest.shift()!
    total -= estimateTokens(dropped.content)
  }
  const result = sys ? [sys, ...rest] : rest
  return result
}