import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Mock auth to return our test user id via env
vi.mock('lib/authz', () => ({
  requireUser: async () => {
    const id = process.env.TEST_USER_ID
    if (!id) return { error: new Response(JSON.stringify({ error: { code: 'AUTH_REQUIRED', message: 'Not authenticated', details: null } }), { status: 401 }) }
    return { user: { id } }
  }
}))

describe('threads API', () => {
  let userId: string
  let createdThreadId: string | null = null

  beforeAll(async () => {
    const email = `int-${Date.now()}@example.com`
    const user = await prisma.user.create({ data: { email } })
    userId = user.id
    process.env.TEST_USER_ID = userId
  })

  afterAll(async () => {
    if (createdThreadId) {
      await prisma.message.deleteMany({ where: { threadId: createdThreadId } })
      await prisma.thread.delete({ where: { id: createdThreadId } }).catch(() => {})
    }
    await prisma.user.delete({ where: { id: userId } }).catch(() => {})
    await prisma.$disconnect()
  })

  it('POST /api/threads creates a user thread', async () => {
const { POST } = await import('../../app/api/threads/route')
    const req = new Request('http://local/api/threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Integration Thread' })
    })
    const res = await (POST as any)(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.id).toBeTruthy()
    expect(json.activeModel).toBeTruthy()
    createdThreadId = json.id
  })

  it('GET /api/threads returns user threads', async () => {
const { GET } = await import('../../app/api/threads/route')
    const res = await (GET as any)()
    expect(res.status).toBe(200)
    const list = await res.json()
    expect(Array.isArray(list)).toBe(true)
    expect(list.find((t: any) => t.id === createdThreadId)).toBeTruthy()
  })
})