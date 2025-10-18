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

describe('GET /api/scopes (S2.2)', () => {
  let userId: string
  let threadId: string

  beforeAll(async () => {
    const email = `scopes-api-${Date.now()}@example.com`
    const user = await prisma.user.create({ data: { email } })
    userId = user.id
    process.env.TEST_USER_ID = userId
    const t = await prisma.thread.create({ data: { userId, title: 'Scopes API Thread', activeModel: 'openai:gpt-4o' } })
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

  it('returns registry and thread info with default consents', async () => {
    const { GET } = await import('../../app/api/scopes/route')
    const req = new Request(`http://local/api/scopes?threadId=${threadId}`)
    const res = await (GET as any)(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json.registry)).toBe(true)
    expect(json.thread.id).toBe(threadId)
    expect(Array.isArray(json.thread.activeScopeKeys)).toBe(true)
    expect(typeof json.consents.profile).toBe('boolean')
  })
})