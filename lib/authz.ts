import { prisma } from 'lib/prisma'
import { auth } from 'lib/auth'

import { jsonError } from 'lib/errors'

export async function requireUser() {
  const session = await auth()
  const email = session?.user?.email || null
  if (!email) {
    return { error: jsonError('AUTH_REQUIRED', 'Not authenticated', 401) }
  }
  let user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    if (process.env.E2E_AUTH === '1') {
      // E2E convenience: auto-provision test user to avoid external OAuth dependency
      try {
        user = await prisma.user.upsert({
          where: { email },
          create: { email, name: 'E2E User' },
          update: {}
        })
      } catch {
        // Race condition: user may have been created by a concurrent request
        user = await prisma.user.findUnique({ where: { email } })
      }
    } else {
      return { error: jsonError('AUTH_REQUIRED', 'Not authenticated', 401) }
    }
  }
  return { user }
}
