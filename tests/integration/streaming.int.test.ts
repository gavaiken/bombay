import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Mock authz to simulate an authenticated user
vi.mock('lib/authz', () => ({
  requireUser: async () => {
    const id = process.env.TEST_USER_ID
    if (!id) return { ok: false, error: new Response(JSON.stringify({ error: { code: 'AUTH_REQUIRED', message: 'Not authenticated', details: null } }), { status: 401 }) }
    return { ok: true, user: { id } }
  }
}))

describe('R4.2 Streaming envelope sanity', () => {
  let userId: string
  let threadId: string

  beforeAll(async () => {
    const email = `stream-${Date.now()}@example.com`
    const user = await prisma.user.create({ data: { email } })
    userId = user.id
    process.env.TEST_USER_ID = userId
    const t = await prisma.thread.create({ data: { userId, title: 'Stream Thread', activeModel: 'openai:gpt-4o' } })
    threadId = t.id
  })

  afterAll(async () => {
    await prisma.message.deleteMany({ where: { threadId } })
    await prisma.thread.delete({ where: { id: threadId } }).catch(() => {})
    await prisma.user.delete({ where: { id: userId } }).catch(() => {})
    await prisma.$disconnect()
  })

  it('emits delta and done events over SSE', async () => {
    const { POST } = await import('../../app/api/messages/route')
    const req = new Request('http://local/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId, content: 'Hello streaming' })
    })
    const res = await (POST as any)(req)
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('event: delta')
    expect(text).toContain('event: done')
    expect(text).toContain('data: {"messageId"')
  })

  it('emits error event when provider throws', async () => {
    vi.resetModules()
    // Re-mock providers to force an error during streaming
    vi.doMock('lib/providers', () => ({
      getAdapterForModel: () => ({
        name: 'openai',
        chatStreaming: async function* () {
          throw new Error('boom')
        }
      })
    }))
    const { POST } = await import('../../app/api/messages/route')
    const req = new Request('http://local/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId, content: 'trigger error' })
    })
    const res = await (POST as any)(req)
    const text = await res.text()
    expect(text).toContain('event: error')
    expect(text).toContain('PROVIDER_ERROR')
  })
})