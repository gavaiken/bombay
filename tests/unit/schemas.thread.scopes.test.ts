import { describe, it, expect } from 'vitest'
import { ThreadSchema, UpdateThreadSchema } from '../../lib/schemas'

describe('Thread schema with scopes (S2.1)', () => {
  it('parses thread with activeScopeKeys when present', () => {
    const obj = {
      id: 'ckv1234567890123456789012',
      title: 'T',
      activeModel: 'openai:gpt-4o',
      activeScopeKeys: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    expect(ThreadSchema.parse(obj)).toBeTruthy()
  })

  it('UpdateThreadSchema allows updating activeScopeKeys', () => {
    const body = { activeScopeKeys: ['work', 'profile'] }
    expect(UpdateThreadSchema.parse(body)).toBeTruthy()
  })
})