export type LogLevel = 'info' | 'error' | 'warn'

const LOGTAIL_URL = 'https://in.logtail.com'

function getToken(): string | null {
  const raw = process.env.LOGTAIL_SOURCE_TOKEN || process.env.BETTERSTACK_SOURCE_TOKEN || ''
  const token = raw.replace(/[\r\n]/g, '').trim()
  return token || null
}

async function send(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const token = getToken()
  if (!token) return
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 1500)
    await fetch(LOGTAIL_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ dt: new Date().toISOString(), level, message, context }),
      signal: ctrl.signal
    }).catch(() => {})
    clearTimeout(t)
  } catch {}
}

export async function logError(message: string, context?: Record<string, unknown>) {
  console.error(message, context || {})
  await send('error', message, context)
}

export async function logInfo(message: string, context?: Record<string, unknown>) {
  console.log(message, context || {})
  await send('info', message, context)
}