import { describe, it, expect } from 'vitest'
import { applyRedaction } from '../../lib/scope-policies'

describe('Scope policies redaction (S7.5)', () => {
  it('masks API keys for work scope', () => {
    const src = 'Key sk-abc123XYZ';
    expect(applyRedaction('work', src)).toContain('sk-***')
  })
  it('masks names in health scope', () => {
    const src = 'John visited clinic';
    const out = applyRedaction('health', src)
    expect(out).toMatch(/\[REDACTED\]/)
  })
})