# Security Profile

## HTTPS & Cookies
- HTTPS only in prod; HSTS.
- NextAuth cookie: HTTP-only, Secure, SameSite=Lax.

## Content Security Policy

We use a nonce-based CSP so that Next.js inline bootstrap scripts can execute without allowing arbitrary inline JS.

```
default-src 'self';
script-src 'self' 'nonce-<generated-per-request>' 'strict-dynamic';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data:;
connect-src 'self';
frame-src 'none';
```

- The nonce is generated per request in `middleware.ts` and attached to all framework scripts by Next.js.
- This avoids `'unsafe-inline'` for scripts while allowing the framework’s critical inline runtime to run.

(Provider calls occur server-side; browser doesn’t contact provider APIs.)

## CSRF
- No state changes via GET.
- SameSite=Lax cookie blocks cross-site POSTs. All APIs require session.

## Validation & Isolation
- Zod on every body (see docs/API.md).
- DB queries always scoped to `session.userId`.

## Rate Limiting (MVP-ready)
- Optional Upstash: `UPSTASH_REDIS_REST_URL/TOKEN`.
- Enforce per-user message quotas if needed; return 429 RATE_LIMITED.

## Markdown Safety
- Render via react-markdown without raw HTML; see docs/CONTENT.md.
