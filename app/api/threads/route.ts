import { NextRequest } from 'next/server'
import { prisma } from 'lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'

import { requireUser } from 'lib/authz'

export async function GET() {
  const gate = await requireUser()
  if (!gate.ok) return gate.error
  const userId = gate.user.id
  try {
    const threads = await prisma.thread.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, activeModel: true, createdAt: true, updatedAt: true }
    })
    return new Response(JSON.stringify(threads), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (e) {
    return jsonError('INTERNAL_ERROR', 'Failed to load threads', 500)
  }
}

const CreateThreadSchema = z.object({
  title: z.string().optional(),
  activeModel: z.string().optional()
})

import { jsonError } from 'lib/errors'

export async function POST(req: NextRequest) {
  const gate = await requireUser()
  if (!gate.ok) return gate.error
  const userId = gate.user.id
  try {
    const json = await req.json()
    const parsed = CreateThreadSchema.safeParse(json)
    if (!parsed.success) {
      return jsonError('VALIDATION_ERROR', 'Invalid request data', 400, parsed.error.flatten())
    }
    const { title, activeModel } = parsed.data
    const created = await prisma.thread.create({
      data: {
        userId,
        title: title ?? null,
        activeModel: activeModel ?? 'openai:gpt-4o'
      },
      select: { id: true, title: true, activeModel: true, createdAt: true, updatedAt: true }
    })
    return new Response(JSON.stringify(created), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return jsonError('INTERNAL_ERROR', 'Failed to create thread', 500)
  }
}
