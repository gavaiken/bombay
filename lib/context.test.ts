/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { buildPromptWithTruncation } from './context'

type Msg = { role: 'system'|'user'|'assistant'; contentText: string }

function mk(role: 'user'|'assistant', text: string): Msg { return { role, contentText: text } as any }

describe('buildPromptWithTruncation', () => {
  it('drops oldest pairs when over limit and preserves first system', () => {
    const prior = [
      { role: 'system', contentText: 'rules' },
      mk('user','a'.repeat(20000)),
      mk('assistant','b'.repeat(20000)),
      mk('user','c'.repeat(20000)),
      mk('assistant','d'.repeat(20000)),
    ] as any
    const out = buildPromptWithTruncation({ model: 'gpt-4o', prior, currentUserText: 'now' })
    expect(out[0].role).toBe('system')
    // Expect that at least one earliest non-system message was dropped
    // and that last user message remains
    expect(out[out.length - 1].content).toBe('now')
  })
})