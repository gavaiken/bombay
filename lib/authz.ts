import { prisma } from 'lib/prisma'
import { auth } from 'lib/auth'

import { jsonError } from 'lib/errors'

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