import { NextRequest } from 'next/server'
import { prisma } from 'lib/prisma'
import type { Prisma } from '@prisma/client'

export const runtime = 'nodejs'

import { requireUser } from 'lib/authz'
import { jsonError } from 'lib/errors'
import { CreateThreadSchema } from 'lib/schemas'
import { checkRateLimit, RATE_LIMITS } from 'lib/rate-limit'
import { logEvent, Events } from 'lib/logger'
import { Metrics } from 'lib/metrics'
import { DEFAULT_MODEL } from 'lib/models'

type ThreadRow = { id: string; title: string | null; activeModel: string; createdAt: Date; updatedAt: Date; activeScopeKeys?: string[] }

export async function GET() {
  const gate = await requireUser()
  if (!gate.ok) return gate.error
  const userId = gate.user.id
  try {
    const { isScopesFeatureEnabled } = await import('lib/scopes')
    const scopesOn = isScopesFeatureEnabled()

    // Build select shape conditionally to avoid querying non-existent columns in older DBs
    const baseSelect: Prisma.ThreadSelect = { id: true, title: true, activeModel: true, createdAt: true, updatedAt: true }
    const selectWithScopes: Prisma.ThreadSelect = { ...baseSelect, activeScopeKeys: true }

    let threads: ThreadRow[] = []
    try {
      const rows = await prisma.thread.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        select: scopesOn ? selectWithScopes : baseSelect,
      })
      threads = rows as unknown as ThreadRow[]
    } catch {
      // Fallback: if column missing (e.g., P2022), retry without it
      const rows = await prisma.thread.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        select: baseSelect,
      })
      threads = rows as unknown as ThreadRow[]
    }

    const payload: ThreadRow[] = scopesOn
      ? threads.map((t) => {
          const keys = Array.isArray(t.activeScopeKeys) ? t.activeScopeKeys : []
          return { ...t, activeScopeKeys: keys }
        })
      : threads

    return new Response(JSON.stringify(payload), {
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

    const { isScopesFeatureEnabled } = await import('lib/scopes')
    const scopesOn = isScopesFeatureEnabled()

    // Create thread
    const selectShape: Prisma.ThreadSelect = scopesOn
      ? { id: true, title: true, activeModel: true, activeScopeKeys: true, createdAt: true, updatedAt: true }
      : { id: true, title: true, activeModel: true, createdAt: true, updatedAt: true }

    const createdRow = await prisma.thread.create({
      data: {
        userId,
        title: title ?? null,
        activeModel: activeModel ?? DEFAULT_MODEL
      },
      select: selectShape
    })

    const created = createdRow as unknown as ThreadRow

    const responseBody: ThreadRow = scopesOn
      ? { ...created, activeScopeKeys: Array.isArray(created.activeScopeKeys) ? created.activeScopeKeys : [] }
      : created
    
    // Log thread creation
    await logEvent(Events.THREAD_CREATED, 'info', {
      userId,
      threadId: created.id,
      model: created.activeModel
    });
    
    // Track metrics
    await Metrics.trackActiveUser(userId);
    await Metrics.trackThreadCreated(userId, created.activeModel);
    
    return new Response(JSON.stringify(responseBody), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return jsonError('INTERNAL_ERROR', 'Failed to create thread', 500)
  }
}
