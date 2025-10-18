import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

vi.mock('lib/authz', () => ({
  requireUser: async () => {
    const id = process.env.TEST_USER_ID
    if (!id) return { ok: false, error: new Response(JSON.stringify({ error: { code: 'AUTH_REQUIRED', message: 'Not authenticated', details: null } }), { status: 401 }) }
    return { ok: true, user: { id } }
  }
}))

describe('S7.4 Consent prompt behavior (server enforcement)', () => {
  let userId: string
  let t1: string
  let t2: string

  beforeAll(async () => {
    const email = `consent-${Date.now()}@example.com`
    const user = await prisma.user.create({ data: { email } })
    userId = user.id
    process.env.TEST_USER_ID = userId
    const a = await prisma.thread.create({ data: { userId, title: 'T1', activeModel: 'openai:gpt-4o' } })
    t1 = a.id
    const b = await prisma.thread.create({ data: { userId, title: 'T2', activeModel: 'openai:gpt-4o' } })
    t2 = b.id
    process.env.NEXT_PUBLIC_SCOPES_ENABLED = '1'
  })

  afterAll(async () => {
    await prisma.scopeConsent.deleteMany({ where: { threadId: { in: [t1, t2] } } }).catch(() => {})
    await prisma.message.deleteMany({ where: { threadId: { in: [t1, t2] } } })
    await prisma.thread.delete({ where: { id: t1 } }).catch(() => {})
    await prisma.thread.delete({ where: { id: t2 } }).catch(() => {})
    await prisma.user.delete({ where: { id: userId } }).catch(() => {})
    delete process.env.NEXT_PUBLIC_SCOPES_ENABLED
    await prisma.$disconnect()
  })

  it('rejects enabling sensitive scope without consent; succeeds after consent; prompts again per thread', async () => {
    const { POST: PostScopes } = await import('../../app/api/threads/[id]/scopes/route')
    const { POST: PostConsent } = await import('../../app/api/threads/[id]/scopes/consent/route')

    // Attempt to enable health (sensitive) on t1 without consent
    const r1 = await (PostScopes as any)(new Request('http://local/api/threads/x/scopes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activeScopeKeys: ['health'] })
    }), { params: { id: t1 } })
    expect(r1.status).toBe(400)

    // Give consent for t1
    const c1 = await (PostConsent as any)(new Request('http://local/api/threads/x/scopes/consent', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scopeKey: 'health', consent: true })
    }), { params: { id: t1 } })
    expect(c1.status).toBe(200)

    // Now enabling should succeed
    const r2 = await (PostScopes as any)(new Request('http://local/api/threads/x/scopes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activeScopeKeys: ['health'] })
    }), { params: { id: t1 } })
    expect(r2.status).toBe(200)

    // On a different thread, without consent, should reject again
    const r3 = await (PostScopes as any)(new Request('http://local/api/threads/x/scopes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activeScopeKeys: ['health'] })
    }), { params: { id: t2 } })
    expect(r3.status).toBe(400)
  })
})
