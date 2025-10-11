# Local Development

## Prereqs
- Node 18+
- Postgres (local or cloud)

## Setup
1) `npm install`
2) Create `.env.local` by copying `.env.example` and filling values
   - NEXTAUTH_SECRET: generate with `openssl rand -base64 32`
   - NEXTAUTH_URL: `http://localhost:3000`
   - GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET: Google Cloud Console → Credentials (Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`)
   - DATABASE_URL: local Postgres connection string
   - OPENAI_API_KEY / ANTHROPIC_API_KEY: provider dashboards
3) `npx prisma db push` (or `npx prisma migrate dev` once auth models are added)
4) `npm run dev` → http://localhost:3000

## Production (Vercel)
- Store all secrets in Vercel Project → Settings → Environment Variables (never in git)
- Set for Production and Preview:
  - NEXTAUTH_URL (e.g., https://bombay.chat)
  - NEXTAUTH_SECRET (generate as above)
  - GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (add callback `https://bombay.chat/api/auth/callback/google`)
  - DATABASE_URL (Vercel Postgres or Neon)
  - OPENAI_API_KEY / ANTHROPIC_API_KEY
- Optional: `vercel env pull .env.local` to sync env locally

## Useful Scripts
- `dev` – start Next dev
- `build` / `start` – production build/run
- `lint` – ESLint
- `format` – Prettier check or write
- `test` – unit/integration
- `test:e2e` – Playwright (with mocks)
