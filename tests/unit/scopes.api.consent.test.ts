import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'

vi.mock('lib/authz', () => ({
  requireUser: async () => ({ ok: true, user: { id: 'u1' } })
}))

vi.mock('lib/prisma', () => ({
  prisma: {
    thread: {
      findFirst: async ({ where }: any) => (where.id === 't1' && where.userId === 'u1' ? { id: 't1' } : null)
    },
    scopeConsent: {
      upsert: async () => ({}),
      update: async () => ({})
    }
  }
}))

describe('POST /api/threads/:id/scopes/consent (S2.4)', () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_SCOPES_ENABLED = '1'
  })
  afterAll(() => {
    delete process.env.NEXT_PUBLIC_SCOPES_ENABLED
  })

  it('accepts consent for sensitive scope', async () => {
    const { POST } = await import('../../app/api/threads/[id]/scopes/consent/route')
    const req = new Request('http://local/api/threads/t1/scopes/consent', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scopeKey: 'profile', consent: true })
    })
    const res = await (POST as any)(req, { params: { id: 't1' } })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.consented).toBe(true)
  })

  it('rejects non-sensitive scope consent', async () => {
    const { POST } = await import('../../app/api/threads/[id]/scopes/consent/route')
    const req = new Request('http://local/api/threads/t1/scopes/consent', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scopeKey: 'work', consent: true })
    })
    const res = await (POST as any)(req, { params: { id: 't1' } })
    expect(res.status).toBe(400)
  })
})