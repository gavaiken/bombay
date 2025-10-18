import { NextRequest } from 'next/server'
import { prisma } from 'lib/prisma'

export const runtime = 'nodejs'

import { requireUser } from 'lib/authz'
import { jsonError } from 'lib/errors'
import { CreateThreadSchema } from 'lib/schemas'
import { checkRateLimit, RATE_LIMITS } from 'lib/rate-limit'

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

export async function POST(req: NextRequest) {
  const gate = await requireUser()
  if (!gate.ok) return gate.error
  const userId = gate.user.id
  try {
    // Check rate limiting
    const rateLimit = await checkRateLimit({
      identifier: userId,
      ...RATE_LIMITS.THREADS
    })
    
    if (!rateLimit.success) {
      return jsonError('RATE_LIMITED', 'Too many threads created. Please wait before creating another.', 429)
    }
    
    const json = await req.json()
    const parsed = CreateThreadSchema.safeParse(json)
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]
      return jsonError('VALIDATION_ERROR', firstError.message, 400)
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
