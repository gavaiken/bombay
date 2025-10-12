import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

vi.mock('lib/authz', () => ({
  requireUser: async () => {
    const id = process.env.TEST_USER_ID
    if (!id) return { error: new Response(JSON.stringify({ error: { code: 'AUTH_REQUIRED', message: 'Not authenticated', details: null } }), { status: 401 }) }
    return { user: { id } }
  }
}))

describe('messages API', () => {
  let userId: string
  let threadId: string

  beforeAll(async () => {
    const email = `int-msg-${Date.now()}@example.com`
    const user = await prisma.user.create({ data: { email } })
    userId = user.id
    process.env.TEST_USER_ID = userId
    const thread = await prisma.thread.create({ data: { userId, title: 'T', activeModel: 'openai:gpt-4o' } })
    threadId = thread.id
  })

  afterAll(async () => {
    await prisma.message.deleteMany({ where: { threadId } })
    await prisma.thread.delete({ where: { id: threadId } }).catch(() => {})
    await prisma.user.delete({ where: { id: userId } }).catch(() => {})
    await prisma.$disconnect()
  })

  it('GET /api/messages returns empty initially', async () => {
const { GET } = await import('../../app/api/messages/route')
    const req = new Request(`http://local/api/messages?threadId=${threadId}`)
    const res = await (GET as any)(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json)).toBe(true)
    expect(json.length).toBe(0)
  })

  it('POST /api/messages?mode=json persists assistant', async () => {
const { POST, GET } = await import('../../app/api/messages/route')
    const req = new Request(`http://local/api/messages?mode=json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId, content: 'Hello' })
    })
    const res = await (POST as any)(req)
    expect(res.status).toBe(200)
    const saved = await res.json()
    expect(saved.role).toBe('assistant')

    // Now GET should return at least the new assistant message (and the user message inserted by POST)
    const res2 = await (GET as any)(new Request(`http://local/api/messages?threadId=${threadId}`))
    const list = await res2.json()
    expect(list.length).toBeGreaterThanOrEqual(1)
    expect(list[list.length - 1].role).toBe('assistant')
  })
})