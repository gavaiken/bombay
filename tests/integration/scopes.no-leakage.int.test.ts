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

describe('S7.6 No cross-scope leakage', () => {
  let userId: string
  let threadId: string

  beforeAll(async () => {
    const email = `no-leak-${Date.now()}@example.com`
    const user = await prisma.user.create({ data: { email } })
    userId = user.id
    process.env.TEST_USER_ID = userId
    const t = await prisma.thread.create({ data: { userId, title: 'NoLeak', activeModel: 'openai:gpt-4o' } })
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

  it('disabled scope content never appears; usedScopes excludes disabled scopes', async () => {
    // Enable only work, not personal
    const { POST: PostScopes } = await import('../../app/api/threads/[id]/scopes/route')
    const res1 = await (PostScopes as any)(new Request('http://local/api/threads/x/scopes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activeScopeKeys: ['work'] })
    }), { params: { id: threadId } })
    expect(res1.status).toBe(200)

    vi.resetModules()
    process.env.E2E_STUB_PROVIDER = '1'
    const { POST } = await import('../../app/api/messages/route')
    const req = new Request('http://local/api/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ threadId, content: 'Personal question about gift for mom' })
    })
    const res = await (POST as any)(req)
    const text = await res.text()
    process.env.E2E_STUB_PROVIDER = '0'
    const m = text.match(/data: (\{.*\})/g)?.pop()
    expect(m).toBeTruthy()
    const payload = m ? JSON.parse(m.replace(/^data: /, '')) : null
    expect(Array.isArray(payload.usedScopes)).toBe(true)
    // Should not include 'personal' since it was not enabled
    expect(payload.usedScopes.includes('personal')).toBe(false)
  })
})
