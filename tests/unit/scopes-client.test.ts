import { describe, it, expect } from 'vitest'
import { computeNextActiveScopes, shouldPromptConsent } from '../../lib/scopes-client'

describe('Scopes client helpers (S4.1–S5.1)', () => {
  it('computes next active scopes correctly', () => {
    expect(computeNextActiveScopes([], 'work', true)).toEqual(['work'])
    expect(computeNextActiveScopes(['work'], 'work', false)).toEqual([])
    expect(new Set(computeNextActiveScopes(['work'], 'personal', true))).toEqual(new Set(['work', 'personal']))
  })

  it('prompts consent only for sensitive and missing consent', () => {
    const consents = { profile: true } as Record<string, boolean>
    expect(shouldPromptConsent({ key: 'profile', name: 'Profile', sensitive: true }, consents)).toBe(false)
    expect(shouldPromptConsent({ key: 'health', name: 'Health', sensitive: true }, consents)).toBe(true)
    expect(shouldPromptConsent({ key: 'work', name: 'Work', sensitive: false }, consents)).toBe(false)
  })
})