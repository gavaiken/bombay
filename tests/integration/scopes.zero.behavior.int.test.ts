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

describe('S7.1 Zero-scopes behavior', () => {
  let userId: string
  let threadId: string

  beforeAll(async () => {
    const email = `zero-scopes-${Date.now()}@example.com`
    const user = await prisma.user.create({ data: { email } })
    userId = user.id
    process.env.TEST_USER_ID = userId
    const t = await prisma.thread.create({ data: { userId, title: 'Zero Scopes', activeModel: 'openai:gpt-4o' } })
    threadId = t.id
    process.env.NEXT_PUBLIC_SCOPES_ENABLED = '1'
  })

  afterAll(async () => {
    await prisma.message.deleteMany({ where: { threadId } })
    await prisma.thread.delete({ where: { id: threadId } }).catch(() => {})
    await prisma.user.delete({ where: { id: userId } }).catch(() => {})
    delete process.env.NEXT_PUBLIC_SCOPES_ENABLED
    await prisma.$disconnect()
  })

  it('SSE done includes usedScopes: [] when no scopes enabled', async () => {
    const { POST } = await import('../../app/api/messages/route')
    process.env.E2E_STUB_PROVIDER = '1'
    const req = new Request('http://local/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ threadId, content: 'Test' }) })
    const res = await (POST as any)(req)
    const text = await res.text()
    expect(text).toContain('usedScopes')
    expect(text).toContain('[]')
    process.env.E2E_STUB_PROVIDER = '0'
  })
})