# Local Development

## Prereqs
- Node 18+
- Docker and Docker Compose (for local PostgreSQL)
- Postgres (local or cloud) - or use Docker setup below

## Setup

### Option 1: Docker PostgreSQL (Recommended for fully local dev)
1) `npm install`
2) Create `.env.docker` from template and set a strong password
   - `cp .env.docker.example .env.docker` then edit `POSTGRES_PASSWORD`
   - Note: `.env.docker` is git-ignored and should never be committed
3) Start PostgreSQL database: `docker compose up -d`
   - This creates a PostgreSQL container with database `bombay_dev`
   - Database will be available at `localhost:5432`
   - Data persists in Docker volume `postgres_data`
4) Create `.env.local` by copying `.env.example` (DATABASE_URL already configured for Docker)
   - NEXTAUTH_SECRET: generate with `openssl rand -base64 32`
   - NEXTAUTH_URL: `http://localhost:3000`
   - GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET: Google Cloud Console → Credentials (Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`)
   - OPENAI_API_KEY / ANTHROPIC_API_KEY: provider dashboards
5) `npx prisma db push` (or `npx prisma migrate dev` once auth models are added)
6) `npm run dev` → http://localhost:3000

### Option 2: Local/Cloud PostgreSQL (Neon, Supabase, etc.)
1) `npm install`
2) Ensure PostgreSQL is running locally or use cloud provider
3) Create `.env.local` by copying `.env.example` and updating DATABASE_URL
   - DATABASE_URL: your Postgres connection string
   - For Neon, create a dedicated dev branch and copy the pooled connection string (keep `sslmode=require`).
   - Other variables same as above
4) `npx prisma db push` (or `npx prisma migrate dev` once auth models are added)
5) `npm run dev` → http://localhost:3000

## Production (Vercel)
- Store all secrets in Vercel Project → Settings → Environment Variables (never in git)
- Set for Production and Preview:
  - NEXTAUTH_URL (e.g., https://bombay.chat)
  - NEXTAUTH_SECRET (generate as above)
  - GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (add callback `https://bombay.chat/api/auth/callback/google`)
  - DATABASE_URL (Vercel Postgres or Neon)
  - OPENAI_API_KEY / ANTHROPIC_API_KEY
- Optional: `vercel env pull .env.local` to sync env locally

If you use Neon in production, create a dedicated database branch (e.g., `main` for production and `dev` for local). Paste the Neon connection string into Vercel’s `DATABASE_URL` and update the matching branch URL in `.env.local` so Prisma migrations run against the same schema. Re-run `vercel env pull .env.local` or manually copy values whenever secrets change to keep local development in sync.

## Useful Scripts
- `dev` – start the Next.js dev server
- `build` / `start` – production build/run
- `lint` – Next.js ESLint checks
- `test` – Vitest unit/integration suite
- `test:e2e` – Playwright (local mocks)
- `test:e2e:prod` – Playwright against `playwright.prod.config.ts`
- `test:e2e:prod:headed` – headed Playwright run with production config
- `test:e2e:prod:auth-setup` – manual auth session seeding for Playwright
- `test:e2e:prod:authenticated` – Playwright authenticated suite with production config
- `db:seed` – run Prisma seed script

## Docker Database Commands
- `docker compose up -d` – start PostgreSQL in background
- `docker compose down` – stop and remove containers
- `docker compose logs postgres` – view database logs
- `docker compose exec postgres psql -U bombay -d bombay_dev` – connect to database
