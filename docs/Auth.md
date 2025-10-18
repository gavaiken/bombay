# Authentication Overview

The application uses **Auth.js (NextAuth)** with a Google OAuth 2.0 provider. Configuration lives in [`lib/auth.ts`](../lib/auth.ts) and is shared by both API routes and server components via the exported `auth()` helper.

## Google OAuth configuration

1. **Create Google credentials.** In the Google Cloud Console create an OAuth client (type **Web application**). Configure the following:
   - Authorized JavaScript origins: `http://localhost:3000` for development and `https://bombay.chat` (or your production origin).
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google` and `https://bombay.chat/api/auth/callback/google`.
2. **Environment variables.** Provide `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL`. The `NEXTAUTH_SECRET` must be a long random string so Auth.js can sign and encrypt tokens.
3. **Provider wiring.** [`lib/auth.ts`](../lib/auth.ts) registers the Google provider with `prompt: "consent"` and `access_type: "offline"` to ensure refresh tokens are returned when Google allows it.

## Prisma adapter & persistence

- **Adapter.** Auth.js uses the [`PrismaAdapter`](https://authjs.dev/reference/adapter/prisma) backed by our shared Prisma client. This binds Auth.js to the tables defined in [`prisma/schema.prisma`](../prisma/schema.prisma).
- **Session strategy.** We use `session: { strategy: 'database' }`, so session state is persisted in the `Session` table instead of signed JWTs. The browser still holds the `next-auth.session-token` cookie, but the token maps to a database row.
- **Persisted entities.**
  - `User`: stores `email`, optional `name`, optional `image`, and timestamp metadata. These optional fields are saved when Google includes them in the profile payload.
  - `Account`: records the linkage between our users and Google (`provider`, `providerAccountId`, refresh/access tokens, etc.).
  - `Session`: persists active sign-in sessions keyed by `sessionToken` with an expiration timestamp.
  - `VerificationToken`: unused by Google OAuth but available for magic links if needed.
- **Schema references.** See [`prisma/schema.prisma`](../prisma/schema.prisma) for the canonical definitions of the `User`, `Account`, and `Session` models that Auth.js touches.

The adapter ensures cascaded deletes (defined in the Prisma schema) remove accounts and sessions when a user is deleted, which keeps the auth tables tidy during tests or local resets.

## Session flow

1. A signed-out visitor hits a protected route and is redirected to Google.
2. After consent, Google redirects back to `/api/auth/callback/google`.
3. Auth.js creates/updates rows in `User` and `Account`, then persists a `Session` and issues the `next-auth.session-token` cookie.
4. Subsequent requests call `auth()` which delegates to `getServerSession(authOptions)` and returns the hydrated session with our augmentation described below.
5. Sign-out calls `/api/auth/signout`, which clears the cookie and deletes the corresponding `Session` row.

## Session augmentation & stored metadata

- The session callback merges the database user ID onto `session.user.id` so server components and API routes can query application data directly.
- Google profile data (`name`, `image`, `email`) is written to the `User` table when available. Both `name` and `image` are nullable in the schema to accommodate users without profile data or explicit consent to share it.

## Custom logging hooks

The `logger` option in [`lib/auth.ts`](../lib/auth.ts) forwards Auth.js debug, warn, and error events to our structured logger in [`lib/logger.ts`](../lib/logger.ts):

- `error`: uses `logError` to emit the error and metadata, forwarding to Logtail/Better Stack when configured.
- `warn`: calls `logInfo` with a `nextauth logger warn` message for consistency with other info-level events.
- `debug`: also uses `logInfo` so verbose Auth.js output appears in development logs but can still be shipped upstream.

These hooks give us centralized visibility into authentication behavior without relying solely on console output.

## Testing bypass for E2E

When `E2E_AUTH=1` is present in the environment, `auth()` short-circuits and returns a stub session (`{ user: { email: 'e2e@example.com' } }`). This bypass avoids external OAuth calls during automated end-to-end tests while keeping the rest of the application logic that depends on `auth()` unchanged.

## Security notes

- Google remains the sole identity provider—no passwords are stored in our database.
- Ensure production deployments keep OAuth secrets and the NextAuth secret private and rotate them when necessary.
- Because the session strategy uses the database, leaking a session token would still allow replay, so enforce HTTPS and secure cookies in production deployments.

With this setup, authentication persists across server restarts, shares a single source of truth with the rest of the application data, and offers consistent observability and test ergonomics.
