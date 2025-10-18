export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireUser } from 'lib/authz'
import { jsonError } from 'lib/errors'
import { prisma } from 'lib/prisma'
import { isScopesFeatureEnabled, isValidScopeKey, requiresConsent } from 'lib/scopes'

const BodySchema = z.object({
  scopeKey: z.string(),
  consent: z.boolean()
})

export async function POST(req: NextRequest, context: { params: { id: string } }) {
  if (!isScopesFeatureEnabled()) return jsonError('NOT_FOUND', 'Feature disabled', 404)
  const gate = await requireUser()
  if (!('user' in gate)) return (gate as any).error
  const userId = (gate as any).user.id as string
  try {
    const body = await req.json()
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) return jsonError('VALIDATION_ERROR', 'Invalid body', 400)
    const { scopeKey, consent } = parsed.data

    if (!isValidScopeKey(scopeKey)) return jsonError('VALIDATION_ERROR', 'Invalid scope key', 400)
    if (!requiresConsent(scopeKey as any)) return jsonError('VALIDATION_ERROR', 'Scope does not require consent', 400)

    // Ownership check
    const tid = context.params.id
    const own = await prisma.thread.findFirst({ where: { id: tid, userId }, select: { id: true } })
    if (!own) return jsonError('NOT_FOUND', 'Thread not found', 404)

    // Best-effort persist
    try {
      if (consent) {
        await prisma.scopeConsent.upsert({
          where: { threadId_scopeKey: { threadId: tid, scopeKey } } as any,
          update: { revokedAt: null },
          create: { userId, threadId: tid, scopeKey, grantedAt: new Date(), revokedAt: null }
        } as any)
      } else {
        await prisma.scopeConsent.update({
          where: { threadId_scopeKey: { threadId: tid, scopeKey } } as any,
          data: { revokedAt: new Date() }
        } as any)
      }
    } catch {
      // ignore if table not present
    }

    // Structured log + metrics (S8.1/S8.2)
    const { logEvent, Events } = await import('lib/logger')
    await logEvent(Events.SCOPE_CONSENT, 'info', { userId, threadId: tid, scopeKey, consent })

    return new Response(JSON.stringify({ id: tid, scopeKey, consented: consent }), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return jsonError('INTERNAL_ERROR', 'Failed to record consent', 500)
  }
}