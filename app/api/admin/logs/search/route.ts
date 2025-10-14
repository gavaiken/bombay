export const runtime = 'nodejs'

import { requireUser } from 'lib/authz'
import { jsonError } from 'lib/errors'

function getToken() {
  const raw = process.env.BETTERSTACK_TELEMETRY_API_TOKEN || ''
  const token = raw.replace(/[\r\n]/g, '').trim()
  return token || null
}

export async function GET(request: Request) {
  const gate = await requireUser()
  if (!('ok' in gate) || !gate.ok) return (gate as unknown as { error: Response }).error

  const url = new URL(request.url)
  const hours = Math.max(1, Math.min(168, parseInt(url.searchParams.get('hours') || '24', 10)))
  const limit = Math.max(1, Math.min(500, parseInt(url.searchParams.get('limit') || '100', 10)))
  const q = url.searchParams.get('q') || 'level:error OR status:500'

  const token = getToken()
  if (!token) return jsonError('VALIDATION_ERROR', 'BETTERSTACK_TELEMETRY_API_TOKEN not configured', 400)

  const to = new Date()
  const from = new Date(to.getTime() - hours * 3600 * 1000)

  try {
    const apiUrl = new URL('https://api.betterstack.com/api/v2/logs/search')
    apiUrl.searchParams.set('query', q)
    apiUrl.searchParams.set('from', from.toISOString())
    apiUrl.searchParams.set('to', to.toISOString())
    apiUrl.searchParams.set('limit', String(limit))

    const res = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    })
    if (!res.ok) {
      const text = await res.text()
      return jsonError('PROVIDER_ERROR', `Better Stack API error (${res.status})`, 502, text)
    }
    const data = await res.json()
    return new Response(JSON.stringify({ meta: { from: from.toISOString(), to: to.toISOString(), q, limit }, data }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (e) {
    return jsonError('INTERNAL_ERROR', 'Failed to query Better Stack', 500)
  }
}