# Local Development

## Prereqs
- Node 18+
- Postgres (local or cloud)

## Setup
1) `npm install`
2) Create `.env.local` (see docs/ENV.md for keys)
3) `npx prisma db push`
4) `npm run dev` → http://localhost:3000

## Useful Scripts
- `dev` – start Next dev
- `build` / `start` – production build/run
- `lint` – ESLint
- `format` – Prettier check or write
- `test` – unit/integration
- `test:e2e` – Playwright (with mocks)
