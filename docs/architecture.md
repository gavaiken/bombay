# Architecture Overview

Bombay Chat delivers a multi-provider AI chat experience that aligns with the goals captured in [docs/PRD.md](./PRD.md), namely rapid provider switching, secure data handling, and production readiness.

## Major Subsystems

- **Client Experience (Next.js App Router)** — The UI in `app/` renders the chat workspace, thread tray, and composer with Tailwind CSS. Streaming replies, scope chips, and consent flows come from the interaction design detailed in [docs/Design.md](./Design.md).
- **Application Runtime (Next.js API Routes)** — Server routes under `app/api/` handle authentication, message persistence, provider orchestration, and Server-Sent Events streaming. They apply business rules from the PRD to keep scope-aware context intact while switching models.
- **Data Layer (Prisma + Neon PostgreSQL)** — Prisma models map conversations, messages, and consent artifacts onto a managed Neon PostgreSQL instance. Schema and lifecycle expectations are tracked in [docs/Database.md](./Database.md) and reinforced by [docs/Testing.md](./Testing.md).
- **AI Provider Integrations** — Adapters in `lib/providers/` normalize Anthropic, OpenAI, and the in-house test model, allowing the runtime to swap models mid-thread without losing continuity.
- **Authentication & GitHub Integration** — Auth.js mediates Google OAuth for end users, while GitHub is integrated for repository workflows and Vercel deployments, enabling preview builds and automated checks on pull requests.
- **Operations & Observability** — Production traffic runs on Vercel (`next.config.mjs`, `playwright.prod.config.ts`) at [https://bombay.chat](https://bombay.chat). Structured logs flow to Betterstack (see [docs/OBSERVABILITY.md](./OBSERVABILITY.md)), complementing metrics and alerting defined in [docs/Deployment.md](./Deployment.md).

## Cross-Cutting Concerns

- **Deployment Pipeline** — Vercel builds from GitHub, runs automated Playwright and Vitest suites, then promotes successful builds to the production domain. Environment configuration covers Neon Postgres credentials and AI provider secrets; see [docs/Deployment.md](./Deployment.md).
- **Quality Assurance** — [docs/Testing.md](./Testing.md) enumerates end-to-end, integration, and policy tests that validate scope behavior, consent prompts, and provider correctness prior to release.
- **Future Enhancements** — Feature backlogs and sequencing live in [docs/Tasks.md](./Tasks.md); consult them alongside the PRD when scoping changes to the subsystems above.

For deeper dives on the product vision, architecture decisions, and release processes, start with:

- [Product Requirements](./PRD.md)
- [System Design Deep Dive](./Design.md)
- [Deployment Playbooks](./Deployment.md)
- [Testing Strategy](./Testing.md)
