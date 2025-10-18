export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireUser } from 'lib/authz'
import { jsonError } from 'lib/errors'
import { prisma } from 'lib/prisma'
import { isScopesFeatureEnabled, isValidScopeKey, SENSITIVE_SCOPE_KEYS } from 'lib/scopes'

const BodySchema = z.object({
  activeScopeKeys: z.array(z.string()).min(0)
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
    const { activeScopeKeys } = parsed.data
    // Validate keys
    const invalid = activeScopeKeys.filter((k) => !isValidScopeKey(k))
    if (invalid.length) return jsonError('VALIDATION_ERROR', `Invalid scope keys: ${invalid.join(',')}`, 400)

    // Enforce consent for sensitive scopes (stubbed: require consent by rejecting if any sensitive present)
    const sensitiveRequested = activeScopeKeys.filter((k) => SENSITIVE_SCOPE_KEYS.includes(k as any))
    if (sensitiveRequested.length) {
      return jsonError('VALIDATION_ERROR', `Consent required for: ${sensitiveRequested.join(',')}`, 400)
    }

    // Ownership check
    const tid = context.params.id
    const own = await prisma.thread.findFirst({ where: { id: tid, userId }, select: { id: true } })
    if (!own) return jsonError('NOT_FOUND', 'Thread not found', 404)

    // Try persist if column exists (best-effort).
    try {
      await prisma.thread.update({ where: { id: tid }, data: { activeScopeKeys } as any })
    } catch {
      // ignore if column not present yet
    }
    return new Response(JSON.stringify({ id: tid, activeScopeKeys }), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return jsonError('INTERNAL_ERROR', 'Failed to update scopes', 500)
  }
}