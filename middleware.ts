import { NextResponse, type NextRequest } from 'next/server'

// Generate a cryptographically strong base64 nonce (Edge runtime-compatible)
function generateNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  // btoa is available in the Edge runtime
  return btoa(binary)
}

export default function middleware(request: NextRequest) {
  const nonce = generateNonce()
  const isDev = process.env.NODE_ENV !== 'production'

  // Build nonce-based CSP per docs/Security.md
  // In development, Next.js requires 'unsafe-eval' for Fast Refresh
  const scriptSrc = isDev
    ? `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'`
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`
  
  const fontSrc = isDev
    ? "font-src 'self' https://fonts.gstatic.com data:"
    : "font-src 'self' https://fonts.gstatic.com"

  const csp = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    fontSrc,
    "img-src 'self' data:",
    "connect-src 'self'",
    "frame-src 'none'",
  ].join('; ')

  // Propagate nonce to the request so Next.js can attach it to framework scripts
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  const response = NextResponse.next({ request: { headers: requestHeaders } })

  // Set CSP on the response
  response.headers.set('Content-Security-Policy', csp)

  return response
}

// Exclude static assets from middleware to avoid unnecessary work
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}
