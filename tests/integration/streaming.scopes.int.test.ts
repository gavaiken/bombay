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

describe('S2.5 — SSE includes usedScopes in done event', () => {
  let userId: string
  let threadId: string

  beforeAll(async () => {
    const email = `stream-scopes-${Date.now()}@example.com`
    const user = await prisma.user.create({ data: { email } })
    userId = user.id
    process.env.TEST_USER_ID = userId
    const t = await prisma.thread.create({ data: { userId, title: 'Streaming Scopes', activeModel: 'openai:gpt-4o' } })
    threadId = t.id
  })

  afterAll(async () => {
    await prisma.message.deleteMany({ where: { threadId } })
    await prisma.thread.delete({ where: { id: threadId } }).catch(() => {})
    await prisma.user.delete({ where: { id: userId } }).catch(() => {})
    await prisma.$disconnect()
  })

  it('done event payload contains usedScopes field', async () => {
    const { POST } = await import('../../app/api/messages/route')
    // Force stub provider to avoid external dependencies
    process.env.E2E_STUB_PROVIDER = '1'
    const req = new Request('http://local/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId, content: 'Hello' })
    })
    const res = await (POST as any)(req)
    const text = await res.text()
    expect(text).toContain('event: done')
    expect(text).toContain('usedScopes')
    delete process.env.E2E_STUB_PROVIDER
  })
})