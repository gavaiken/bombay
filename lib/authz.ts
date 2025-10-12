import { prisma } from 'lib/prisma'
import { auth } from 'lib/auth'

function jsonError(code: string, message: string, status: number) {
  return new Response(
    JSON.stringify({ error: { code, message, details: null } }),
    { status, headers: { 'Content-Type': 'application/json' } }
  )
}

export async function requireUser() {
  const session = await auth()
  const email = session?.user?.email || null
  if (!email) {
    return { error: jsonError('AUTH_REQUIRED', 'Not authenticated', 401) }
  }
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return { error: jsonError('AUTH_REQUIRED', 'Not authenticated', 401) }
  }
  return { user }
}