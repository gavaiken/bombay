import './globals.css'
import { IBM_Plex_Mono } from 'next/font/google'

const plex = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  display: 'swap'
})

export const metadata = {
  title: 'bombay',
  description: 'multi-model chat',
  icons: { 
    icon: '/favicon.svg' 
  }
}

export const viewport = {
  themeColor: '#0B1220'
}

import { auth } from 'lib/auth'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${plex.variable} font-mono`} data-theme="dark">
        <header className="flex items-center justify-between border-b p-3">
          <div className="flex items-center gap-2">
            <div aria-label="bombay brand" className="h-4 w-12 rounded-sm" style={{ background: 'var(--gradient-brand)' }} />
            <span className="text-text/60 text-xs">bombay</span>
          </div>
          <nav>
            {session?.user?.email ? (
              <form action="/api/auth/signout" method="post">
                <span className="mr-3 text-xs" aria-label="Signed in user email">{session.user.email}</span>
                <button type="submit" className="rounded-md border border-border px-2 py-1 focus:outline-none focus:ring-4 focus:ring-pink-400/40" aria-label="Sign out">
                  Sign out
                </button>
              </form>
            ) : (
              <a href="/api/auth/signin" className="rounded-md border border-border px-2 py-1 focus:outline-none focus:ring-4 focus:ring-pink-400/40" aria-label="Sign in">
                Sign in
              </a>
            )}
          </nav>
        </header>
        {children}
      </body>
    </html>
  )
}
