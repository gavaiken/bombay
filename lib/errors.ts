export type ErrorCode = 'AUTH_REQUIRED' | 'VALIDATION_ERROR' | 'NOT_FOUND' | 'FORBIDDEN' | 'PROVIDER_ERROR' | 'INTERNAL_ERROR'

export function jsonError(code: ErrorCode, message: string, status: number, details: unknown = null) {
  return new Response(
    JSON.stringify({ error: { code, message, details } }),
    { status, headers: { 'Content-Type': 'application/json' } }
  )
}