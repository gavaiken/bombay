export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireUser } from 'lib/authz'
import { jsonError } from 'lib/errors'
import { prisma } from 'lib/prisma'
import { isScopesFeatureEnabled, isValidScopeKey, requiresConsent, type ScopeKey } from 'lib/scopes'
import type { Prisma } from '@prisma/client'

const BodySchema = z.object({
  scopeKey: z.string(),
  consent: z.boolean()
})

type ThreadRouteContext = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: ThreadRouteContext) {
  if (!isScopesFeatureEnabled()) return jsonError('NOT_FOUND', 'Feature disabled', 404)
  const gate = await requireUser()
  if (!gate.ok) return gate.error
  const userId = gate.user.id
  const { id: threadId } = await params
  try {
    const body = await req.json()
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) return jsonError('VALIDATION_ERROR', 'Invalid body', 400)
    const { scopeKey, consent } = parsed.data

    if (!isValidScopeKey(scopeKey)) return jsonError('VALIDATION_ERROR', 'Invalid scope key', 400)
    const typedScopeKey = scopeKey as ScopeKey
    if (!requiresConsent(typedScopeKey)) return jsonError('VALIDATION_ERROR', 'Scope does not require consent', 400)

    // Ownership check
    const own = await prisma.thread.findFirst({ where: { id: threadId, userId }, select: { id: true } })
    if (!own) return jsonError('NOT_FOUND', 'Thread not found', 404)

    // Best-effort persist
    try {
      const where: Prisma.ScopeConsentWhereUniqueInput = { threadId_scopeKey: { threadId, scopeKey: typedScopeKey } }
      if (consent) {
        await prisma.scopeConsent.upsert({
          where,
          update: { revokedAt: null },
          create: { userId, threadId, scopeKey: typedScopeKey, grantedAt: new Date(), revokedAt: null }
        })
      } else {
        await prisma.scopeConsent.update({
          where,
          data: { revokedAt: new Date() }
        })
      }
    } catch {
      // ignore if table not present
    }

    // Structured log + metrics (S8.1/S8.2)
    const { logEvent, Events } = await import('lib/logger')
    await logEvent(Events.SCOPE_CONSENT, 'info', { userId, threadId, scopeKey: typedScopeKey, consent })

    return new Response(JSON.stringify({ id: threadId, scopeKey: typedScopeKey, consented: consent }), { headers: { 'Content-Type': 'application/json' } })
  } catch {
    return jsonError('INTERNAL_ERROR', 'Failed to record consent', 500)
  }
}
