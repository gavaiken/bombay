import { describe, it, expect } from 'vitest'
import { recallProvider } from '../../lib/recall'

describe('RecallProvider stub (S3.1–S3.4)', () => {
  it('returns empty when no scopes enabled', async () => {
    const res = await recallProvider.getScopedContext({ userId: 'u', threadId: 't', enabledScopeKeys: [] })
    expect(res.usedScopes).toEqual([])
    expect(res.snippets.length).toBe(0)
  })

  it('gates snippets by enabled scopes and applies redaction', async () => {
    const res = await recallProvider.getScopedContext({ userId: 'u', threadId: 't', enabledScopeKeys: ['work', 'health', 'profile'] })
    const scopes = new Set(res.usedScopes)
    expect(scopes.has('work')).toBe(true)
    expect(scopes.has('health')).toBe(true)
    expect(scopes.has('profile')).toBe(true)
    const work = res.snippets.find(s => s.scopeKey === 'work')!
    expect(work.content).not.toContain('sk-123456')
    expect(work.content).toContain('sk-***')
    const health = res.snippets.find(s => s.scopeKey === 'health')!
    expect(health.content).toMatch(/\[REDACTED\]/)
  })
})