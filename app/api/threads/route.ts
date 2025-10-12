import { NextRequest } from 'next/server'
import { prisma } from 'lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'

import { requireUser } from 'lib/authz'

export async function GET() {
  const gate = await requireUser()
  if ('error' in gate) return gate.error
  try {
    const threads = await prisma.thread.findMany({
      where: { userId: gate.user.id },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, activeModel: true, createdAt: true, updatedAt: true }
    })
    return new Response(JSON.stringify(threads), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Failed to load threads', details: null } }), { status: 500 })
  }
}

const CreateThreadSchema = z.object({
  title: z.string().optional(),
  activeModel: z.string().optional()
})

export async function POST(req: NextRequest) {
  const gate = await requireUser()
  if ('error' in gate) return gate.error
  try {
    const json = await req.json()
    const parsed = CreateThreadSchema.safeParse(json)
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: parsed.error.flatten() } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    const { title, activeModel } = parsed.data
    const created = await prisma.thread.create({
      data: {
        userId: gate.user.id,
        title: title ?? null,
        activeModel: activeModel ?? 'openai:gpt-4o'
      },
      select: { id: true, title: true, activeModel: true, createdAt: true, updatedAt: true }
    })
    return new Response(JSON.stringify(created), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create thread', details: null } }), { status: 500 })
  }
}
