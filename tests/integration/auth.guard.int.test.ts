import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// We mock lib/authz to control auth outcomes via TEST_USER_ID env var
vi.mock('lib/authz', () => ({
  requireUser: async () => {
    const id = process.env.TEST_USER_ID
    if (!id) return { ok: false, error: new Response(JSON.stringify({ error: { code: 'AUTH_REQUIRED', message: 'Not authenticated', details: null } }), { status: 401, headers: { 'Content-Type': 'application/json' } }) }
    return { ok: true, user: { id } }
  }
}))

describe('R4.1 Auth guard coverage', () => {
  let userAId: string
  let userBId: string
  let userAThreadId: string

  beforeAll(async () => {
    const a = await prisma.user.create({ data: { email: `guard-a-${Date.now()}@example.com` } })
    const b = await prisma.user.create({ data: { email: `guard-b-${Date.now()}@example.com` } })
    userAId = a.id
    userBId = b.id
    const t = await prisma.thread.create({ data: { userId: userAId, title: 'A Thread', activeModel: 'openai:gpt-4o' } })
    userAThreadId = t.id
  })

  afterAll(async () => {
    await prisma.message.deleteMany({ where: { threadId: userAThreadId } })
    await prisma.thread.delete({ where: { id: userAThreadId } }).catch(() => {})
    await prisma.user.delete({ where: { id: userAId } }).catch(() => {})
    await prisma.user.delete({ where: { id: userBId } }).catch(() => {})
    await prisma.$disconnect()
  })

  it('GET /api/threads returns 401 when unauthenticated', async () => {
    delete process.env.TEST_USER_ID
    const { GET } = await import('../../app/api/threads/route')
    const res = await (GET as any)()
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json?.error?.code).toBe('AUTH_REQUIRED')
  })

  it('POST /api/threads returns 401 when unauthenticated', async () => {
    delete process.env.TEST_USER_ID
    const { POST } = await import('../../app/api/threads/route')
    const req = new Request('http://local/api/threads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Nope' }) })
    const res = await (POST as any)(req)
    expect(res.status).toBe(401)
  })

  it('GET /api/messages returns 401 when unauthenticated', async () => {
    delete process.env.TEST_USER_ID
    const { GET } = await import('../../app/api/messages/route')
    const req = new Request(`http://local/api/messages?threadId=${userAThreadId}`)
    const res = await (GET as any)(req)
    expect(res.status).toBe(401)
  })

  it('GET /api/messages returns 403 when thread not owned by user', async () => {
    process.env.TEST_USER_ID = userBId
    const { GET } = await import('../../app/api/messages/route')
    const req = new Request(`http://local/api/messages?threadId=${userAThreadId}`)
    const res = await (GET as any)(req)
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json?.error?.code).toBe('FORBIDDEN')
  })

  it('POST /api/messages returns 403 when thread not owned by user', async () => {
    process.env.TEST_USER_ID = userBId
    const { POST } = await import('../../app/api/messages/route')
    const req = new Request('http://local/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ threadId: userAThreadId, content: 'Hi' }) })
    const res = await (POST as any)(req)
    expect(res.status).toBe(403)
  })

  it('PATCH /api/threads/:id returns 401 when unauthenticated', async () => {
    delete process.env.TEST_USER_ID
    const { PATCH } = await import('../../app/api/threads/[id]/route')
    const req = new Request(`http://local/api/threads/${userAThreadId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activeModel: 'openai:gpt-4o-mini' }) })
    const res = await (PATCH as any)(req, { params: { id: userAThreadId } })
    expect(res.status).toBe(401)
  })

  it('PATCH /api/threads/:id returns 404 when thread not owned by user', async () => {
    process.env.TEST_USER_ID = userBId
    const { PATCH } = await import('../../app/api/threads/[id]/route')
    const req = new Request(`http://local/api/threads/${userAThreadId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activeModel: 'openai:gpt-4o-mini' }) })
    const res = await (PATCH as any)(req, { params: { id: userAThreadId } })
    expect(res.status).toBe(404)
  })
})