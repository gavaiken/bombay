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

describe('Scopes — threads API includes activeScopeKeys when feature enabled (S1.1)', () => {
  let userId: string
  let threadId: string

  beforeAll(async () => {
    const email = `scopes-thread-${Date.now()}@example.com`
    const user = await prisma.user.create({ data: { email } })
    userId = user.id
    process.env.TEST_USER_ID = userId
    const t = await prisma.thread.create({ data: { userId, title: 'Scopes Thread', activeModel: 'openai:gpt-4o' } })
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

  it('GET /api/threads returns activeScopeKeys array when flag is on', async () => {
    const { GET } = await import('../../app/api/threads/route')
    const res = await (GET as any)()
    expect(res.status).toBe(200)
    const list = await res.json()
    const t = list.find((x: any) => x.id === threadId)
    expect(Array.isArray(t.activeScopeKeys)).toBe(true)
    expect(t.activeScopeKeys.length).toBe(0)
  })
})