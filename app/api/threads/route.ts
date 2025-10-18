import { NextRequest } from 'next/server'
import { prisma } from 'lib/prisma'

export const runtime = 'nodejs'

import { requireUser } from 'lib/authz'
import { jsonError } from 'lib/errors'
import { CreateThreadSchema } from 'lib/schemas'
import { checkRateLimit, RATE_LIMITS } from 'lib/rate-limit'
import { logEvent, Events } from 'lib/logger'
import { Metrics } from 'lib/metrics'
import { DEFAULT_MODEL } from 'lib/models'

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
    const { isScopesFeatureEnabled, DEFAULT_ACTIVE_SCOPE_KEYS } = await import('lib/scopes')
    const payload = isScopesFeatureEnabled()
      ? threads.map((t) => ({ ...t, activeScopeKeys: [...DEFAULT_ACTIVE_SCOPE_KEYS] }))
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
    const created = await prisma.thread.create({
      data: {
        userId,
        title: title ?? null,
        activeModel: activeModel ?? DEFAULT_MODEL
      },
      select: { id: true, title: true, activeModel: true, createdAt: true, updatedAt: true }
    })
    const { isScopesFeatureEnabled, DEFAULT_ACTIVE_SCOPE_KEYS } = await import('lib/scopes')
    const responseBody = isScopesFeatureEnabled()
      ? { ...created, activeScopeKeys: [...DEFAULT_ACTIVE_SCOPE_KEYS] }
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
