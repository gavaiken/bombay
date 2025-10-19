export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireUser } from 'lib/authz'
import { jsonError } from 'lib/errors'
import { prisma } from 'lib/prisma'
import { isScopesFeatureEnabled, isValidScopeKey, SENSITIVE_SCOPE_KEYS, type ScopeKey } from 'lib/scopes'

const BodySchema = z.object({
  activeScopeKeys: z.array(z.string()).min(0)
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
    const { activeScopeKeys } = parsed.data
    // Validate keys
    const invalid = activeScopeKeys.filter((k) => !isValidScopeKey(k))
    if (invalid.length) return jsonError('VALIDATION_ERROR', `Invalid scope keys: ${invalid.join(',')}`, 400)

    const scopeKeys = activeScopeKeys as ScopeKey[]
    // Enforce consent for sensitive scopes: ensure each sensitiveRequested has a non-revoked consent row
    const sensitiveRequested = scopeKeys.filter((k) => SENSITIVE_SCOPE_KEYS.includes(k))
    if (sensitiveRequested.length) {
      try {
        const rows = await prisma.scopeConsent.findMany({
          where: { threadId, scopeKey: { in: sensitiveRequested }, revokedAt: null },
          select: { scopeKey: true }
        })
        const granted = new Set(rows.map((r) => r.scopeKey))
        const missing = sensitiveRequested.filter((k) => !granted.has(k))
        if (missing.length) {
          return jsonError('VALIDATION_ERROR', `Consent required for: ${missing.join(',')}`, 400)
        }
      } catch {
        // If consent table is missing, conservatively reject
        return jsonError('VALIDATION_ERROR', `Consent required for: ${sensitiveRequested.join(',')}`, 400)
      }
    }

    // Ownership check
    const own = await prisma.thread.findFirst({ where: { id: threadId, userId }, select: { id: true } })
    if (!own) return jsonError('NOT_FOUND', 'Thread not found', 404)

    // Try persist if column exists (best-effort).
    try {
      await prisma.thread.update({ where: { id: threadId }, data: { activeScopeKeys: scopeKeys } })
    } catch {
      // ignore if column not present yet
    }

    // Structured log + metrics (S8.1/S8.2)
    const { logEvent, Events } = await import('lib/logger')
    const { Metrics } = await import('lib/metrics')
    await logEvent(Events.SCOPE_TOGGLED, 'info', { userId, threadId, activeCount: activeScopeKeys.length, scopeKeys: activeScopeKeys })
    await Metrics.trackScopeToggle(userId, threadId, activeScopeKeys.length)

    return new Response(JSON.stringify({ id: threadId, activeScopeKeys }), { headers: { 'Content-Type': 'application/json' } })
  } catch {
    return jsonError('INTERNAL_ERROR', 'Failed to update scopes', 500)
  }
}
