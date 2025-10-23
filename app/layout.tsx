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
      <body className={`${plex.variable} font-mono min-h-screen flex flex-col`} data-theme="dark">
        <header className="flex items-center justify-between border-b p-3">
          <div className="flex items-center gap-2">
            <div
              data-testid="brand-swatch"
              aria-label="bombay brand"
              className="relative h-5 w-16 rounded-sm overflow-hidden"
              style={{ background: 'var(--gradient-brand)' }}
            >
              <span
                className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs font-mono lowercase text-black"
                style={{ textShadow: '0 1px 0 rgba(255,255,255,0.6)' }}
              >
                bombay
              </span>
            </div>
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
              // eslint-disable-next-line @next/next/no-html-link-for-pages
              <a href="/api/auth/signin" className="rounded-md border border-border px-2 py-1 focus:outline-none focus:ring-4 focus:ring-pink-400/40" aria-label="Sign in">
                Sign in
              </a>
            )}
          </nav>
      </header>
        <div className="flex-1 min-h-0 flex flex-col">
          {children}
        </div>
      </body>
    </html>
  )
}
