import { getServerSession, type NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from 'lib/prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'database' },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  callbacks: {
    redirect: async ({ url, baseUrl }) => {
      // Ensure redirects stay within our domain
      if (url.startsWith("/")) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
    session: async ({ session, user }) => {
      // Add user ID to session (augment at runtime without TS module augmentation)
      if (session.user && user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(session as any).user = { ...session.user, id: user.id }
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  }
}

export function auth() {
  if (process.env.E2E_AUTH === '1') {
    return Promise.resolve({ user: { email: 'e2e@example.com' } } as unknown as import('next-auth').Session)
  }
  return getServerSession(authOptions)
}
