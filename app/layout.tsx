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
  },
  themeColor: '#0B1220'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${plex.variable} font-mono`} data-theme="dark">
        {children}
      </body>
    </html>
  )
}