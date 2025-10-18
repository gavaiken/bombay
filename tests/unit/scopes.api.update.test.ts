import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'

vi.mock('lib/authz', () => ({
  requireUser: async () => ({ ok: true, user: { id: 'u1' } })
}))

vi.mock('lib/prisma', () => ({
  prisma: {
    thread: {
      findFirst: async ({ where }: any) => (where.id === 't1' && where.userId === 'u1' ? { id: 't1' } : null),
      update: async () => ({ id: 't1' })
    }
  }
}))

describe('POST /api/threads/:id/scopes (S2.3)', () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_SCOPES_ENABLED = '1'
  })
  afterAll(() => {
    delete process.env.NEXT_PUBLIC_SCOPES_ENABLED
  })

  it('accepts non-sensitive scope keys and returns updated payload', async () => {
    const { POST } = await import('../../app/api/threads/[id]/scopes/route')
    const req = new Request('http://local/api/threads/t1/scopes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activeScopeKeys: ['work', 'personal'] })
    })
    const res = await (POST as any)(req, { params: { id: 't1' } })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.id).toBe('t1')
    expect(json.activeScopeKeys).toEqual(['work', 'personal'])
  })

  it('rejects when sensitive scopes included without consent', async () => {
    const { POST } = await import('../../app/api/threads/[id]/scopes/route')
    const req = new Request('http://local/api/threads/t1/scopes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activeScopeKeys: ['health'] })
    })
    const res = await (POST as any)(req, { params: { id: 't1' } })
    expect(res.status).toBe(400)
  })
})