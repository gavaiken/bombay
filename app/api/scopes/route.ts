export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { requireUser } from 'lib/authz'
import { jsonError } from 'lib/errors'
import { prisma } from 'lib/prisma'
import { SCOPES_REGISTRY, isScopesFeatureEnabled, SENSITIVE_SCOPE_KEYS } from 'lib/scopes'

export async function GET(req: NextRequest) {
  if (!isScopesFeatureEnabled()) {
    return jsonError('NOT_FOUND', 'Feature disabled', 404)
  }
  const gate = await requireUser()
  if (!gate.ok) return gate.error
  const userId = gate.user.id
  try {
    const url = new URL(req.url)
    const threadId = url.searchParams.get('threadId')
    let threadInfo: { id: string; activeScopeKeys: string[] } | null = null
    let consents: Record<string, boolean> | null = null
    if (threadId) {
      const t = await prisma.thread.findFirst({ where: { id: threadId, userId }, select: { id: true, activeScopeKeys: true } })
      if (!t) return jsonError('NOT_FOUND', 'Thread not found', 404)
      const activeScopeKeys = Array.isArray(t.activeScopeKeys) ? t.activeScopeKeys : []
      threadInfo = { id: t.id, activeScopeKeys }
      // Load consents from DB (granted and not revoked)
      const rows = await prisma.scopeConsent.findMany({ where: { threadId: t.id, revokedAt: null }, select: { scopeKey: true } })
      const granted = new Set(rows.map((r) => r.scopeKey))
      consents = Object.fromEntries(SENSITIVE_SCOPE_KEYS.map((k) => [k, granted.has(k)]))
    }
    const registry = SCOPES_REGISTRY.map(({ key, name, sensitive }) => ({ key, name, sensitive }))
    const resp = threadId ? { registry, thread: threadInfo, consents } : { registry }
    return new Response(JSON.stringify(resp), { headers: { 'Content-Type': 'application/json' } })
  } catch {
    return jsonError('INTERNAL_ERROR', 'Failed to load scopes', 500)
  }
}
