# Testing

Bombay uses a layered testing strategy so that fast unit checks, server integrations, and full user flows can be exercised independently. This document explains each layer, how the tooling is configured, and when to run a given suite.

## Test layers at a glance

| Layer | Tooling | Command | Typical cadence |
| --- | --- | --- | --- |
| Unit & integration | [Vitest](https://vitest.dev/) | `npm test` | Run locally while developing server logic or utilities |
| Local end-to-end | [Playwright](https://playwright.dev/) | `npm run test:e2e` | Run before opening a pull request to validate UI flows against the mocked backend |
| Production smoke | Playwright + production config | `npx playwright test --config playwright.prod.config.ts` | Run selectively against https://bombay.chat after deploys or when validating live behaviour |

## Vitest: unit & integration coverage

Vitest is configured through [`vitest.config.ts`](../vitest.config.ts). Tests run in a Node environment and automatically attempt to source a Postgres connection string from `.env.docker` when `DATABASE_URL` is not already set, which keeps Prisma-backed tests isolated from development data.【F:vitest.config.ts†L1-L30】

Use `npm test` to execute the suite. Co-locate test files next to the code they cover, or inside `__tests__` directories. Tests can import API route handlers, Prisma helpers, or other modules directly. When a test needs to exercise provider behaviour, inject fakes instead of calling real adapters; the API routes expose deterministic branches for this purpose (see below).

## Deterministic providers and auth for tests

Local integration and E2E flows avoid real OAuth and model calls by relying on two environment toggles:

- `E2E_AUTH=1` short-circuits authentication helpers so that any request is treated as an authenticated user during tests.【F:lib/authz.ts†L18-L29】【F:lib/auth.ts†L56-L87】
- `E2E_STUB_PROVIDER=1` forces the messages API to take a deterministic branch that streams a canned response (`"Okay — working on it…"`). This path also records the assistant message in the database so downstream assertions remain realistic.【F:app/api/messages/route.ts†L110-L168】

These flags are injected automatically by the Playwright configuration (see next section), but they can also be set manually when invoking API route handlers inside Vitest.

## Playwright: local end-to-end tests

[`playwright.config.ts`](../playwright.config.ts) drives the local E2E suite under `e2e/`. The configuration starts the development server with `npm run dev`, reuses any existing server to keep iteration fast, and sets `E2E_AUTH=1` and `E2E_STUB_PROVIDER=1` in the spawned process so that tests run deterministically without live providers.【F:playwright.config.ts†L1-L20】

Run the suite with `npm run test:e2e`. Tests target the local app on `http://localhost:3000` and should assert against deterministic copy produced by the stubbed provider branch. Use the `data-testid` selectors documented in `docs/ui/selectors.md` when authoring new scenarios.

## Playwright: production smoke tests

For validations against the deployed application, use [`playwright.prod.config.ts`](../playwright.prod.config.ts). This config points at `https://bombay.chat`, does not start a local server, and runs targeted specs from `e2e-prod/` with retries, trace capture, screenshots, and videos enabled for debugging live issues.【F:playwright.prod.config.ts†L1-L41】 Because no stubbing is active, these runs require manual sign-in or valid credentials and will exercise real provider calls.

Execute production smoke tests with:

```bash
npx playwright test --config playwright.prod.config.ts
```

Use this suite sparingly—typically after deployment or when triaging a production-only regression.

## When to run each layer

1. **During feature development:** run `npm test` frequently to cover pure utilities, API validation helpers, and adapter behaviour.
2. **Before submitting a pull request:** run `npm run test:e2e` to ensure UI flows work end-to-end using deterministic auth and provider stubs.
3. **Post-deploy or during incident response:** run `npx playwright test --config playwright.prod.config.ts` for a smoke pass against the live site.

This cadence balances fast local feedback with confidence that real-world interactions remain stable.
