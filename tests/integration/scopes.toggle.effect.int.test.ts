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

describe('S7.3 Mid-thread toggle effect and S5.3 quick exclude', () => {
  let userId: string
  let threadId: string

  beforeAll(async () => {
    const email = `toggle-${Date.now()}@example.com`
    const user = await prisma.user.create({ data: { email } })
    userId = user.id
    process.env.TEST_USER_ID = userId
    const t = await prisma.thread.create({ data: { userId, title: 'Toggle Thread', activeModel: 'openai:gpt-4o' } })
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

  it('enable work → usedScopes contains work; then disable → usedScopes empty', async () => {
    // enable work
    await (await import('../../app/api/threads/[id]/scopes/route')).POST(
      new Request(`http://local/api/threads/${threadId}/scopes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activeScopeKeys: ['work'] }) }),
      { params: { id: threadId } }
    )
    // Send and expect usedScopes includes work
    process.env.E2E_STUB_PROVIDER = '1'
    let { POST } = await import('../../app/api/messages/route')
    let res = await (POST as any)(new Request('http://local/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ threadId, content: 'Test1' }) }))
    let text = await res.text()
    expect(text).toContain('usedScopes')
    expect(text).toContain('work')

    // disable work
    await (await import('../../app/api/threads/[id]/scopes/route')).POST(
      new Request(`http://local/api/threads/${threadId}/scopes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activeScopeKeys: [] }) }),
      { params: { id: threadId } }
    )

    // Send again and expect no usedScopes
    ;({ POST } = await import('../../app/api/messages/route'))
    res = await (POST as any)(new Request('http://local/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ threadId, content: 'Test2' }) }))
    text = await res.text()
    expect(text).toContain('usedScopes')
    expect(text).toContain('[]')
    process.env.E2E_STUB_PROVIDER = '0'
  })
})