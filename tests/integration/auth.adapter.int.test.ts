import { describe, it, expect, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { PrismaAdapter } from '@next-auth/prisma-adapter'

const prisma = new PrismaClient()

describe('NextAuth PrismaAdapter.createUser()', () => {
  let createdUserId: string | null = null

  afterAll(async () => {
    if (createdUserId) {
      // onDelete: Cascade is configured on relations; deleting user cleans related rows
      await prisma.user.delete({ where: { id: createdUserId } }).catch(() => {})
    }
    await prisma.$disconnect()
  })

  it('creates a user with optional fields (name, image, emailVerified)', async () => {
    const adapter = PrismaAdapter(prisma)
    const email = `adapter-int+${Date.now()}@example.com`

    // createUser should accept optional fields and persist them
    const user = await adapter.createUser!({
      email,
      name: 'Adapter Test',
      image: 'https://example.com/avatar.png',
      emailVerified: null
    } as any)

    expect(user).toBeTruthy()
    createdUserId = user.id

    const found = await prisma.user.findUnique({ where: { email } })
    expect(found).toBeTruthy()
    expect(found?.name).toBe('Adapter Test')
    expect(found?.image).toBe('https://example.com/avatar.png')
    expect(found?.email).toBe(email)
  })

  it('schema allows prisma.user.create with optional fields', async () => {
    const email = `schema-int+${Date.now()}@example.com`
    const u = await prisma.user.create({
      data: { email, name: 'Schema Test', image: 'x', emailVerified: null }
    })
    expect(u.email).toBe(email)
    // cleanup
    await prisma.user.delete({ where: { id: u.id } })
  })
})