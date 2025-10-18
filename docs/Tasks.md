# Tasks

Below is a sequential list of all tasks required to go from an empty project directory to a complete product. Each task is bite-sized with clear acceptance criteria that can be verified (often by running commands or tests). The development will pause after each task for review before proceeding.

## Urgent — Production Issues (Top Priority)

- [x] U6. Simplify chat header: remove 'models' section and use static model list
  
  Acceptance Criteria:
  - Chat header shows only `chat title` - `model selector` (remove the separate 'models' section)
  - Model selector uses a static list of available models from OpenAI and Anthropic (no API calls)
  - Static model list includes current available models: gpt-4o, gpt-4o-mini, claude-3-5-haiku-20241022, and one other Claude model from current API availability
  - Remove any existing code that fetches models dynamically from providers
  - Verification: Chat header is simplified and model switching works with static list

- [x] U4. PROD sign-in broken (NextAuth/Google) — fix
  
  Acceptance Criteria:
  - Signing in on https://bombay.chat works end-to-end (no generic "something went wrong").
  - Button uses the official NextAuth client signIn() flow; error state shows a readable message.
  - Verification: Manual sign-in on PROD succeeds.

- [x] U5. Persist runtime logs (24h+)
  
  Acceptance Criteria:
  - Server logs are persisted to a 3rd-party sink (e.g., Better Stack Logtail or Sentry) without manual tailing.
  - Add an opt-in env (LOGTAIL_SOURCE_TOKEN or SENTRY_DSN). When present, errors from API routes and NextAuth events are captured.
  - Verification: Trigger a known error and view it in the external system after the fact.

- [x] U1. New chat shows false error
  
  Acceptance Criteria:
  - Creating a local stub thread does not fetch messages from the server; no error bubble appears until an actual failure occurs after a real thread exists.
  - Verified in dev and prod by starting a new chat and seeing no error.

- [x] U2. Duplicate error bubbles
  
  Acceptance Criteria:
  - Only the pink-bordered error bubble is shown in the main chat pane; the secondary gray error box is removed.
  - Verified visually; tests unaffected.

- [x] U3. Thread titles and rename
  
  Acceptance Criteria:
  - Default thread title is a timestamp like "2025-10-10 8:22PM" when created locally.
  - A pencil icon appears on hover in the thread list to rename; clicking opens a prompt and calls PATCH /api/threads/:id { title } for real threads or updates local state for stubs.
  - Verified by creating and renaming a thread in dev and prod.

- [x] P0. Prod: No assistant responses (SSE) after "Agent is typing…"
  
  Acceptance Criteria:
  - Sending a message on https://bombay.chat streams deltas and completes with a final assistant message (OpenAI path).
  - Switching to Anthropic (Claude 3.5 Sonnet/Haiku) also streams and completes.
  - Switching models mid-thread continues to work; replies appear with the new model.
  - Verification: Manual smoke on production; entry added to docs/CHANGELOG.md.

- [x] P1. Prod: Surface provider errors in UI
  
  Acceptance Criteria:
  - When the SSE stream emits an `error` event, the chat pane shows an inline error bubble (role="alert") with a Retry button.
  - Retry re-sends the last user message to the current thread/model.
  - E2E: Extend or add a spec that exercises error UI in stub mode, or an integration test asserts error path (already present) and UI is manually verified.

- [x] P2. Domain flagged by Google Safe Browsing
  
  Acceptance Criteria:
  - Chrome no longer shows the "Dangerous site" interstitial for https://bombay.chat.
  - Steps documented in docs/Deployment.md: verify domain in Search Console, check "Security issues", request review, and keep HTTPS/HSTS.
  - Verification: Load bombay.chat in Chrome clean profile → no warning; note added to docs/CHANGELOG.md.

## Planning & Audit

- [x]  Audit and update plan outlined in Tasks to achieve PRD and Design

    Acceptance Criteria:
    
    - Produce a revised, bite-sized “Next Tasks — Demo MVP Track (Revised)” plan focused on shipping the demo MVP per PRD.md and Design.md.
    - Merge inputs from: current repo state (completed Tasks 1–18), the original plan in this file, and third-party recommendations (without copying verbatim).
    - Ensure the revised plan is small, testable, and sequenced to deliver verifiable increments. Include:
      - Remove the non-streaming validation path (mode=json) from POST /api/messages as tech-debt, with a dedicated task that includes verification steps and doc updates.
      - Finalize and verify Anthropic streaming (end-to-end), or explicitly mark any remaining scope and a validation task.
      - Testing tasks broken down explicitly: integration tests (auth, threads, messages) and E2E tests (login + chat shell, create thread, send message with SSE, model switch mid-thread), each with clear client verification.
      - UI work limited to what the MVP actually requires; add componentization only if necessary for the demo and testability.
      - Developer workflow tasks (seeding, .env templates, docs alignment) called out if gaps remain.
    - For every new/updated task in the revised plan: include concise acceptance criteria and explicit client verification.
    - Do not renumber past completed tasks; keep updates targeted to “Next Tasks — Demo MVP Track (Revised)”.
    - Verification: Opening docs/Tasks.md shows the new revised section with concrete, verifiable tasks aligned to PRD/Design, a dedicated item to remove mode=json, and clearly split testing tasks.

- [x]  **Audit and further breakdown Tasks.md**: Review all tasks for alignment with PRD.md, Design.md, API.md, Database.md, Providers.md, and docs/ui/*. Ensure the next 20 tasks are granular, verifiable steps toward a working demo. Remove or relocate inconsistent items and resolve duplicates.

    **Acceptance Criteria:**
    
    - Next 20 tasks are present as a dedicated section near the top, each with clear, testable acceptance criteria.
    - Duplicated tasks are removed (e.g., duplicate "Environment Templates").
    - The outdated "Feature Implementation — Tasks API" section is removed if inconsistent with the current plan of record (Next.js chat app with threads/messages).
    - Existing later sections remain intact for future work.
    - (Verification: Opening `docs/Tasks.md` shows the new audit task, the new "Next 20 Tasks — Working Demo Track" section, no duplicate env template task, and no Tasks API section.)
    - _Confirmation:_ Task completed - restructured Tasks.md with proper Next 20 Tasks section, removed duplicate Environment Templates task, removed inconsistent Tasks API section, and ensured all tasks align with PRD.md and Design.md requirements.

## Next Tasks — Demo MVP Track (Revised)
R0. Prerequisites: Secrets and Environment

- [x] R0.1 Local secrets readiness
  
  Acceptance Criteria:
  - .env.local contains: NEXTAUTH_SECRET (>=32 chars), NEXTAUTH_URL=http://localhost:3000, GOOGLE_CLIENT_ID/SECRET (localhost), OPENAI_API_KEY, ANTHROPIC_API_KEY, DATABASE_URL (Docker Postgres).
  - Dev server builds and shows Sign in button; we will validate real OAuth in production smoke.
  - Client Verification: You confirm .env.local readiness.

- [x] R0.2 Vercel project + env
  
  Acceptance Criteria:
  - Vercel project connected; env set for Production/Preview: NEXTAUTH_URL (domain), NEXTAUTH_SECRET, GOOGLE_CLIENT_ID/SECRET (prod redirect), OPENAI_API_KEY, ANTHROPIC_API_KEY, DATABASE_URL (managed Postgres).
  - Build on push succeeds with env present.
  - Client Verification: Verified via Vercel CLI (whoami, projects ls, env ls production/preview, deployments status).

- [x] R0.3 Integration test: NextAuth PrismaAdapter createUser
  
  Acceptance Criteria:
  - Add tests/integration/auth.adapter.int.test.ts that uses PrismaAdapter.createUser to create a user with name, image, and emailVerified=null; asserts persistence and cleans up.
  - Include a direct prisma.user.create sanity check with these optional fields.
  - Tests run successfully via npm run test.
- Client Verification: You see the new test passing locally.

- [x] R0.4 UX: Improve message composer layout and affordances
  
  Acceptance Criteria:
  - Composer is not flush against window edge; has comfortable padding and clear separation from transcript.
  - Textarea supports multi-line (Shift+Enter) with visible size/spacing (min height, no cramped gutter).
  - Send button has clear size/contrast; disabled when no input or while typing.
  - Do not change data-testid values (composer, composer-input, composer-send).
  - Client Verification: In dev, composer looks spacious, supports multi-line, and Enter/Shift+Enter behaviors work.

- [x] R0.5 UX: Deduplicate brand/model labels
  
  Acceptance Criteria:
  - Remove redundant "bombay" text label in the left nav (keep brand swatch).
  - Remove the header "Model: …" text so model appears only once via the model-switcher dropdown.
  - Do not change data-testid values (thread-title, model-switcher, brand-swatch).
  - Client Verification: Only one brand label (in header) and single model display (dropdown) are visible.

- [x] R0.6 UX: Main-pane empty state with clear CTA
  
  Acceptance Criteria:
  - When there are no threads, the main chat pane shows an empty state with primary CTA "Start a chat" that creates a new thread and focuses the composer.
  - Keep existing left-rail message if present, but ensure the primary CTA is visible in the main pane.
  - Do not change data-testid values; may reuse `empty-state` for the main pane.
  - Client Verification: With no threads, the main pane shows the CTA; clicking it creates a new thread and focuses the composer.

- [x] R0.7 UX: Brand swatch — overlay brand text for legibility
  
  Acceptance Criteria:
  - In the top-left (thread tray header), overlay the brand text "bombay" on the existing brand swatch gradient, ensuring readable contrast over white and pink segments.
  - Preserve data-testid="brand-swatch"; do not add duplicate brand labels elsewhere.
  - Remove any other swatch instances if present.
  - Client Verification: In dev, the swatch displays lowercase "bombay" centered with legible contrast across the gradient.

- [x] R0.8 UX: Brand swatch relocation (header only)
  
  Acceptance Criteria:
  - Remove swatch from the left chat list header (next to New Chat).
  - Add a single brand swatch in the global header (top-left), with overlaid lowercase "bombay" text for legibility.
  - Keep Sign out on the opposite side (right) of the same header row.
  - Preserve data-testid="brand-swatch" and remove duplicates elsewhere.
  - Client Verification: Swatch appears only once, top-left in header, with readable text.

- [x] R0.9 UX: Auto-create thread on first send
  
  Acceptance Criteria:
  - If the user hits Send with no current thread (or a local stub), create a real server thread via POST /api/threads, update state, and proceed with sending.
  - Do not change any data-testid values.
  - Client Verification: Typing directly into the composer and pressing Send creates a thread and sends successfully.

R1. Technical debt: messages mode=json (pragmatic gating)

- [x] R1.1 Gate mode=json to test-only
  
  Acceptance Criteria:
  - In dev/prod, POST /api/messages?mode=json returns 400; in tests (NODE_ENV=test) path works for integration tests.
  - Docs updated to note test-only status; CHANGELOG entry added.
  - Client Verification: Confirm behavior aligns with plan.

R2. Anthropic streaming end-to-end

- [x] R2.1 Verify/Finalize Anthropic streaming
  
  Acceptance Criteria:
  - anthropic:* models stream deltas; assistant persisted on completion; standardized error envelope on failure.
  - Document verification steps (stub vs real key) in CHANGELOG.
  - Client Verification: Confirm smoke outcome.

R3. E2E testing with Playwright (Mocked auth + MSW)

- [x] R3.1 E2E: Login and shell (mocked auth)
  
  Acceptance Criteria:
  - Test renders core shell/selectors without real Google OAuth.
  - Client Verification: Run npm run test:e2e and confirm green.

- [x] R3.2 E2E: Create new thread
  
  Acceptance Criteria:
  - New Chat appears, composer focuses; list/title update asserted.

- [x] R3.3 E2E: Send message with SSE
  
  Acceptance Criteria:
  - Typing indicator appears; deltas stream; done hides indicator.

- [x] R3.4 E2E: Model switch mid-thread
  
  Acceptance Criteria:
  - Switch model; next message reflects provider/model; assertions pass.

R4. Integration tests augmentation (Vitest)

- [x] R4.1 Auth guard coverage
  
  Acceptance Criteria:
  - 401/403 assertions added across key endpoints.

- [x] R4.2 Streaming envelope sanity
  
  Acceptance Criteria:
  - Minimal sanity coverage for streaming done/error envelope or DB side effect in test mode.

R5. Deployment and production smoke

- [x] R5.1 Vercel deployment with real env
  
  Acceptance Criteria:
  - Vercel deploy is Ready.

- [x] R5.2 Domain + Google OAuth redirects
  
  Acceptance Criteria:
  - Domain live over HTTPS; OAuth redirect configured and functional.

- [x] R5.3 Production smoke (real E2E)
  
  Acceptance Criteria:
  - Login with Google; create thread; send SSE message; optional model switch; results in CHANGELOG.

## Next Tasks — Scopes Feature (PRD + UX)

This section breaks down implementing Scopes per docs/Scopes Feature - PRD.md and docs/Scopes Feature – UX Design.md. Keep changes small, verifiable, and privacy-first.

### Phase S0 — Decisions and Feature Flag

- [x] S0.1 Decide default scope state and initial fixed scopes
  
  Acceptance Criteria:
  - Decide fixed scope set for v1 (e.g., profile, work, personal, health) and default = zero scopes (privacy-first) unless overridden.
  - Decision recorded in docs/Scopes Feature - PRD.md (Open Questions resolved) or a short addendum in docs/CHANGELOG.md.
  - constants/scopes.ts (or equivalent config) exports the fixed registry (key, name, sensitive, policyId).

- [x] S0.2 Sensitive scopes and consent policy
  
  Acceptance Criteria:
  - Mark which scopes are sensitive (e.g., profile, health) and define consent granularity (per-thread, per-scope, one-time per thread).
  - Document policy in docs/Scopes Feature - PRD.md Acceptance Criteria notes.

- [x] S0.3 Feature flag and rollout plan
  
  Acceptance Criteria:
  - NEXT_PUBLIC_SCOPES_ENABLED gates UI; server respects flag (no scope fields when disabled).
  - Preview->Prod rollout plan added to docs/Deployment.md + entry in docs/CHANGELOG.md.

### Phase S1 — Database Schema (Prisma) and Seeds

- [x] S1.1 Add Thread.activeScopeKeys (String[] default [])
  
  Acceptance Criteria:
  - prisma/schema.prisma updated; migration runs; GET/PATCH /api/threads includes activeScopeKeys.
  - docs/Database.md updated with new field and index considerations.

- [x] S1.2 Add ScopeConsent table
  
  Acceptance Criteria:
  - ScopeConsent(id, userId, threadId, scopeKey, grantedAt, revokedAt?) with FK to User/Thread; compound unique (threadId, scopeKey).
  - Migration runs; docs/Database.md updated.

- [x] S1.3 Add Message.metaJson for attribution
  
  Acceptance Criteria:
  - Message.metaJson Json? stores usedScopes: string[] and optional sources meta.
  - Migration runs; API serializers expose usedScopes in SSE done payload.

- [x] S1.4 Seed default scope registry and sample data (dev only)
  
  Acceptance Criteria:
  - Seed adds small sample notes per scope for a dev user to exercise recall and redaction.

### Phase S2 — API Contract and Zod Schemas

- [x] S2.1 Extend Thread API for scopes
  
  Acceptance Criteria:
  - Zod Thread schema includes activeScopeKeys: string[]; UpdateThread allows partial update with activeScopeKeys.
  - PATCH /api/threads/:id validates keys vs registry.

- [x] S2.2 GET /api/scopes
  
  Acceptance Criteria:
  - Returns scope registry; if ?threadId provided, include consent states and activeScopeKeys for that thread.
  - 401/404 enforced; Zod response schema added; docs/API.md updated with examples.

- [x] S2.3 POST /api/threads/:id/scopes
  
  Acceptance Criteria:
  - Body { activeScopeKeys: string[] }; validates allowed keys and required consents; persists to Thread.activeScopeKeys.
  - Returns updated thread; error envelope on violation.

- [x] S2.4 POST /api/threads/:id/scopes/consent
  
  Acceptance Criteria:
  - Body { scopeKey, consent: true }; upserts ScopeConsent(grantedAt) for this thread/scope.
  - Required before enabling any sensitive scope.

- [x] S2.5 SSE done payload includes attribution
  
  Acceptance Criteria:
  - SSE done event adds { usedScopes: string[] } and optional { sources: [...] }.
  - docs/API.md updated; client safely handles missing/empty usedScopes.

### Phase S3 — Scoped Retrieval and Policy Enforcement

- [x] S3.1 RecallProvider interface and stub implementation
  
  Acceptance Criteria:
  - IRecallProvider.getScopedContext(userId, threadId, enabledScopeKeys, query) -> { snippets, usedScopes } with tests for shape.

- [x] S3.2 Enforce enabled-only gating
  
  Acceptance Criteria:
  - Retrieval strictly filters to enabled scopes; unit/integration test ensures disabled scope data is never returned.

- [x] S3.3 Profile as scope injection
  
  Acceptance Criteria:
  - If "profile" enabled, inject compact profile snippet/system message; when disabled, no profile injection.

- [x] S3.4 Scope policies/redaction
  
  Acceptance Criteria:
  - Policy engine applies per-scope regex/redaction rules (e.g., Health: remove names; Work: mask secret-like tokens) before provider calls and UI.
  - Tests show sensitive tokens are masked in prompt and response.

- [x] S3.5 Attribution persistence
  
  Acceptance Criteria:
  - usedScopes recorded in Message.metaJson and included in SSE done; DB row present and retrievable via GET /api/messages.

### Phase S4 — UI: Scope Toggle Bar (Desktop + Mobile)

- [x] S4.1 ScopeToggleBar component
  
  Acceptance Criteria:
  - Chips for each registry scope; data-testids: scope-toggle-bar, scope-chip-{key}; toggle on/off; accessible via keyboard and SR.

- [x] S4.2 Zero-scopes indicator
  
  Acceptance Criteria:
  - When none active, show “No personal data in use”; disappears when any scope enabled; no annotations shown in this state.

- [x] S4.3 Mobile scrollable chips
  
  Acceptance Criteria:
  - Horizontal scroll/wrap on narrow viewports; touch-friendly; preserves selectors and accessibility.

### Phase S5 — UI: Consent, Transparency, Refinement

- [x] S5.1 One-time consent prompt for sensitive scopes
  
  Acceptance Criteria:
  - First ON per thread for sensitive scope shows confirm dialog; Accept logs ScopeConsent and enables; Decline leaves OFF.

- [x] S5.2 Source annotations in assistant messages
  
  Acceptance Criteria:
  - When usedScopes non-empty, render prefix “Recalled from: {Scope(s)} 🛈”; data-testid=scope-annotation; supports multi-scope.

- [ ] S5.3 Quick action: “Exclude {Scope}”
  
  Acceptance Criteria:
  - Inline action disables that scope immediately and updates server; next assistant reply reflects change.

### Phase S6 — State Persistence and Model Switching

- [x] S6.1 Persist per-thread scope state
  
  Acceptance Criteria:
  - Loading a thread restores activeScopeKeys into UI; switching threads updates chips correctly.

- [x] S6.2 Model switch continuity
  
  Acceptance Criteria:
  - Switching provider/model mid-thread keeps current activeScopeKeys; next reply uses same scopes.

### Phase S7 — Behavior and Policy Tests

- [x] S7.1 Zero-scopes behavior
  
  Acceptance Criteria:
  - With all OFF, personal queries produce no recalled data; no scope annotations; assertions verify absence.

- [ ] S7.2 Scoped recall accuracy
  
  Acceptance Criteria:
  - With only Work ON (Personal has matching data), answer uses only Work; usedScopes === ["work"].

- [x] S7.3 Mid-thread toggle effect
  
  Acceptance Criteria:
  - OFF → ask (no recall); enable Health → ask (recall present); disable again → next answer excludes Health.

- [ ] S7.4 Consent prompt behavior
  
  Acceptance Criteria:
  - First enable prompts; accepted once per thread; new thread prompts again.

- [x] S7.5 Policy enforcement
  
  Acceptance Criteria:
  - Redaction rules mask PII/secrets before prompt and UI; tests include seeded sensitive strings.

- [ ] S7.6 No cross-scope leakage
  
  Acceptance Criteria:
  - Disabled scope content never appears even when highly relevant; logs/metrics show only enabled scopes accessed.

### Phase S8 — Observability and Metrics

- [ ] S8.1 Structured logs for scopes
  
  Acceptance Criteria:
  - Log scope_toggled, scope_consent, recall_used with scope keys only (no content); respects existing logging sink.

- [ ] S8.2 Metrics
  
  Acceptance Criteria:
  - Track toggles/session, avg scopes enabled per thread, % zero-scope chats, latency deltas; admin/ops visibility.

### Phase S9 — Documentation and Selectors

- [ ] S9.1 Update docs/API.md
  
  Acceptance Criteria:
  - New endpoints, SSE payload fields, consent flow, examples added.

- [ ] S9.2 Update docs/Database.md
  
  Acceptance Criteria:
  - Document Thread.activeScopeKeys, ScopeConsent, Message.metaJson; migration steps.

- [ ] S9.3 Update docs/ui/selectors.md and Testing.md
  
  Acceptance Criteria:
  - Add selectors for scope-toggle-bar, scope-chip-*, scope-annotation, consent dialog; outline test flows.

### Phase S10 — Performance and Rollout Verification

- [ ] S10.1 Latency budget verification
  
  Acceptance Criteria:
  - Measure added overhead for 0/1/2+ scopes; ≤ ~500ms median delta; record time-to-first-token; CHANGELOG note.

- [ ] S10.2 Progressive rollout
  
  Acceptance Criteria:
  - Enable behind flag in preview; smoke zero/one/multi-scope flows; then enable in production with monitoring.


## Missing Requirements from PRD/Design Review

Based on comprehensive analysis of PRD.md, Design.md, and supporting documentation, the following tasks are needed to fully implement the MVP requirements:

### Security and Performance

- [x] SEC.1 Implement Content Security Policy
  
  Acceptance Criteria:
  - Add CSP header to Next.js configuration matching docs/Security.md specification
  - CSP allows fonts.googleapis.com and fonts.gstatic.com for IBM Plex Mono
  - CSP blocks unsafe inline scripts and restricts connect-src to 'self'
  - Verify no console CSP violations on production site
  - Client Verification: Browser dev tools shows CSP header; no violations in console

- [x] SEC.2 Add input size limits and rate limiting foundation
  
  Acceptance Criteria:
  - Zod schemas enforce max content length (e.g., 4000 chars) for message input
  - Add UPSTASH_REDIS_REST_URL/TOKEN env vars (optional) to .env.example
  - Basic rate limiting utility created (can be no-op if UPSTASH not configured)
  - Large message inputs return 400 VALIDATION_ERROR with helpful message
  - Client Verification: Extremely long messages are rejected with clear error

- [x] PERF.1 Add message history pagination
  
  Acceptance Criteria:
  - GET /api/messages supports ?limit and ?before query parameters
  - Load initial 50 messages, implement "Load earlier messages" button in UI
  - Pagination preserves message order and thread context
  - Long threads don't cause slow page loads or memory issues
  - Client Verification: Threads with 100+ messages load quickly with pagination

### Observability and Logging

- [x] OBS.1 Add structured logging for key events
  
  Acceptance Criteria:
  - Log successful sign-ins, thread creation, and message sending with user ID
  - Log provider API errors with sanitized details (no user content)
  - Log context truncation events with token estimates
  - Use consistent JSON log format with timestamp, level, event, userId fields
  - Client Verification: Production logs show structured events in Logtail

- [x] OBS.2 Add basic usage metrics collection
  
  Acceptance Criteria:
  - Track token usage per user/session in aggregate (no individual message content)
  - Store daily active users and message counts in simple metrics
  - Log model selection frequency and provider response times
  - Export metrics endpoint for admin use (auth-gated)
  - Client Verification: Metrics are collected without affecting performance

### Context Management and AI Features

- [x] CTX.1 Implement context window token estimation
  
  Acceptance Criteria:
  - Add tiktoken dependency for OpenAI token counting
  - Create word-count fallback for Anthropic models
  - Context truncation logs warn when messages are dropped
  - Preserve system message and truncate oldest user/assistant pairs
  - Client Verification: Very long conversations continue working without errors

- [ ] CTX.2 Add conversation handoff optimization
  
  Acceptance Criteria:
  - When switching models mid-thread, include brief context summary
  - System message indicates model switch: "Continuing conversation from [previous model]"
  - New model receives essential context without full history duplication
  - Handoff preserves conversation coherence and user intent
  - Client Verification: Model switches maintain conversation flow naturally

### Enhanced UI/UX Features

- [ ] UI.1 Thread management features
  
  Acceptance Criteria:
  - Add "Delete thread" option in thread list (with confirmation dialog)
  - Implement thread search/filter in left sidebar for users with many threads
  - Add thread export functionality (markdown format)
  - Empty states show helpful onboarding hints
  - Client Verification: Thread management features work smoothly

- [ ] UI.2 Message interaction enhancements
  
  Acceptance Criteria:
  - Add "Copy message" button on assistant messages
  - Implement "Regenerate response" for last assistant message
  - Add basic markdown rendering for code blocks and lists in messages
  - Show message timestamps on hover or in collapsed state
  - Client Verification: Message interactions enhance usability without clutter

- [ ] UI.3 Improved error handling and user feedback
  
  Acceptance Criteria:
  - Add toast notifications for non-critical feedback (thread created, model switched)
  - Implement retry mechanism for failed message sends
  - Show connection status indicator during network issues
  - Graceful degradation when offline (show cached threads, disable sending)
  - Client Verification: Error states are helpful and don't block the user

### Deployment and Production Readiness

- [x] PROD.1 Add health check endpoint
  
  Acceptance Criteria:
  - GET /api/health returns 200 with basic system status
  - Check database connectivity and provider API accessibility
  - Include build timestamp and version info in health response
  - Use health check for uptime monitoring and deployment verification
  - Client Verification: Health endpoint provides useful status information

- [x] PROD.2 Environment validation and startup checks
  
  Acceptance Criteria:
  - Validate all required environment variables at application startup
  - Log clear error messages for missing configuration
  - Check database schema compatibility on startup
  - Verify provider API keys work with test calls
  - Client Verification: Misconfigured deployments fail fast with clear errors

- [ ] PROD.3 Database backup and recovery procedures
  
  Acceptance Criteria:
  - Document database backup strategy in docs/Deployment.md
  - Create database seeding script for disaster recovery
  - Add data export utility for user data portability
  - Test backup/restore procedure in staging environment
  - Client Verification: Database can be backed up and restored successfully

### API Compliance and Standards

- [ ] API.1 Complete API documentation with OpenAPI spec
  
  Acceptance Criteria:
  - Generate OpenAPI 3.0 spec from Zod schemas and route handlers
  - Include authentication requirements and error response formats
  - Document SSE streaming format with example event sequences
  - Add request/response examples for all endpoints
  - Client Verification: API documentation is complete and accurate

- [ ] API.2 API versioning and backward compatibility
  
  Acceptance Criteria:
  - Add API version header support (optional for MVP, foundation for future)
  - Ensure API responses follow consistent envelope format
  - Document breaking change policy for future API updates
  - Add client-side error recovery for API format changes
  - Client Verification: API follows consistent patterns for future evolution

### Foundation MVP Features from PRD

- [x] MVP.1 Model selection exact implementation
  
  Acceptance Criteria:
  - Support exact models from PRD: openai:gpt-4o, openai:gpt-4o-mini, anthropic:claude-3-5-sonnet, anthropic:claude-3-5-haiku
  - Default to GPT-4o on new chats (as specified in PRD)
  - Model selector shows human-friendly names ("GPT-4o", "Claude 3.5 Sonnet")
  - Thread activeModel persists exact provider:model format in database
  - Client Verification: All specified models available and working correctly
  - ✓ Implemented centralized model config, provider routing, validation, API endpoint, comprehensive tests

- [ ] MVP.2 Thread auto-titling from first message
  
  Acceptance Criteria:
  - New threads auto-generate title from first ~50 chars of user's initial message
  - Fallback to timestamp format "2025-10-18 5:22PM" if first message is very short
  - Title generation happens client-side to avoid API calls
  - Thread titles are editable via pencil icon (already implemented)
  - Client Verification: Thread titles are generated automatically and meaningfully

- [ ] MVP.3 Streaming response implementation verification
  
  Acceptance Criteria:
  - SSE streaming works for both OpenAI and Anthropic providers
  - "Assistant is typing..." indicator shows during response generation
  - Response appears progressively (token by token or chunk by chunk)
  - Stream can be cancelled if user navigates away or closes connection
  - Client Verification: Message responses stream naturally, not all-at-once

- [ ] MVP.4 User isolation and data privacy
  
  Acceptance Criteria:
  - All database queries scoped to authenticated user's ID
  - No cross-user data leakage in threads or messages
  - Google OAuth email used as user identifier
  - User data isolated in development, staging, and production
  - Client Verification: Multiple test accounts show completely separate data

- [ ] MVP.5 Basic warning about sensitive data
  
  Acceptance Criteria:
  - Add privacy notice in UI: "Don't share sensitive data. Conversations may be used to improve AI models."
  - Notice appears in composer or onboarding flow
  - Link to basic privacy policy or terms (can be simple markdown page)
  - Warning persists across sessions until acknowledged
  - Client Verification: Users see privacy warning before first message

### Performance and Reliability

- [ ] REL.1 Response latency optimization
  
  Acceptance Criteria:
  - Target 1-5 second average response latency (per PRD requirement)
  - Measure and log "time to first token" from provider APIs
  - Optimize context window to avoid unnecessarily long prompts
  - Cache provider connections to reduce handshake time
  - Client Verification: Typical responses start streaming within 2-3 seconds

- [ ] REL.2 Graceful provider error handling
  
  Acceptance Criteria:
  - Map provider-specific errors to user-friendly messages
  - Suggest model switching when one provider is down
  - Retry failed requests with exponential backoff
  - Show "Assistant is temporarily unavailable" with retry option
  - Client Verification: Provider outages are handled gracefully

- [ ] REL.3 Context window management per PRD spec
  
  Acceptance Criteria:
  - Implement "truncate oldest turns" policy when token limits exceeded
  - Preserve first system message if present
  - Log when context truncation occurs for monitoring
  - Handle both OpenAI and Anthropic context limits appropriately
  - Client Verification: Very long conversations continue working without errors

## Next 20 Tasks — Working Demo Track (Phase-Based)

Based on senior engineering feedback, these tasks are organized into phases that deliver verifiable functionality incrementally. Each phase builds upon the previous one, ensuring clear client verification at every step.

### Phase 1: Foundation and Authentication (Tasks 1-6)

- [x] 1) Setup local PostgreSQL using Docker
    
    **Acceptance Criteria:**
    - Create `docker-compose.yml` file with PostgreSQL service configuration
    - Configure PostgreSQL with database name 'bombay_dev', user 'bombay', and secure password
    - Add Docker database URL to `.env.example` and document in `docs/DEV.md`
    - Verify connection: `docker compose up -d` starts database successfully
    - Prisma can connect to Docker PostgreSQL instance
    - Include instructions for starting/stopping database in development docs
    - **Client Verification:** Database accessible at localhost:5432, Prisma connection test succeeds

- [x] 2) Extend Prisma schema for NextAuth
    
    **Acceptance Criteria:**
    - Add dependencies: next-auth, @next-auth/prisma-adapter
    - Extend prisma/schema.prisma with NextAuth models (Account, Session, VerificationToken) and relation to User
    - Run migration: npx prisma migrate dev -n auth_models
    - prisma generate succeeds
    - **Client Verification:** Database schema includes all auth-related tables

- [x] 3) Configure NextAuth with Google provider
    
    **Acceptance Criteria:**
    - Install Google provider dependencies
    - Create app/api/auth/[...nextauth]/route.ts with Google provider configured from env
    - Wire PrismaAdapter to connect auth to database
    - Add NEXTAUTH_SECRET, NEXTAUTH_URL, GOOGLE_CLIENT_ID/SECRET to .env.example
    - Export a server helper (auth()) to get the current session
    - Sign-in/sign-out endpoints work (HTTP 200/302)
    - **Client Verification:** Can sign in with Google account and see session data

- [x] 4) Create protected route with user display
    
    **Acceptance Criteria:**
    - Add minimal auth UI (Sign in / Sign out) in header
    - Display session.user.email when logged in
    - Protect main chat interface - redirect to sign-in if not authenticated
    - Keyboard/focus accessible; selectors documented if needed
    - **Client Verification:** Client can sign in with Google and see their email displayed

- [x] 5) Implement auth middleware for API routes
    
    **Acceptance Criteria:**
    - Create requireUser() utility that returns current user or 401 with standard error envelope
    - Protect /api/threads, /api/messages routes - refuse unauthenticated access
    - Use standard error envelope: { error: { code, message, details } }
    - **Client Verification:** API routes return 401 when not authenticated

- [x] 6) Database integration for user-specific threads
    
    **Acceptance Criteria:**
    - Modify GET /api/threads to fetch user's threads from Postgres (Prisma)
    - Modify POST /api/threads to create thread for current user; returns thread JSON
    - Zod validation; error envelope on failure; proper user isolation
    - **Client Verification:** Client can create threads that persist after page refresh

### Phase 2: Core Chat Functionality with OpenAI (Tasks 7-11)

- [x] 7) Messages API with database persistence

- [x] 8) OpenAI adapter implementation (non-streaming)
    
    **Acceptance Criteria:**
    - GET /api/messages?threadId=… returns messages for owned thread (order ascending)
    - POST /api/messages creates a user message row; returns created record
    - Proper user/thread ownership validation; 403 if not owned by user
    - **Client Verification:** User messages are saved to database and persist

- [x] 9) Database seeding for development
    
    **Acceptance Criteria:**
    - Create prisma/seed.ts with dev user (from SEED_USER_EMAIL) and sample threads/messages
    - Add npm run db:seed script to package.json
    - Document seeding process in docs/DEV.md
    - Seed data appears via /api endpoints after sign-in
    - **Client Verification:** Fresh database can be seeded with test data for development

- [x] 10) Server-Sent Events streaming for OpenAI
    
    **Acceptance Criteria:**
    - Implement SSE on POST /api/messages route per docs/API.md specification
    - Stream events: 'delta' (token chunks), 'done' (with messageId and usage), 'error'
    - Client-side EventSource handling to display response token-by-token
    - Support for client-initiated cancellation via AbortController
    - **Client Verification:** Client sees AI response appearing progressively, not all at once

- [x] 11) Error handling and API standardization
    
    **Acceptance Criteria:**
    - Implement shared error helper with standard envelope structure
    - Handle OpenAI API errors gracefully - map to generic user messages
    - Add request validation with Zod schemas for all routes
    - Return appropriate HTTP status codes (400 validation, 401 auth, 403 forbidden, 500 server)
    - **Client Verification:** API errors are handled gracefully with user-friendly messages

### Phase 3: Multi-Provider Support and Model Switching (Tasks 12-17)

- [x] 12) Anthropic adapter implementation
    
    **Acceptance Criteria:**
    - Install @anthropic-ai/sdk dependency
    - Add ANTHROPIC_API_KEY to environment variables
    - Create Anthropic adapter implementing ProviderAdapter interface
    - Support claude-3-5-sonnet and claude-3-5-haiku models
    - Error handling and timeout management
    - **Client Verification:** System can route to Anthropic when configured

- [x] 13) Provider routing and model switcher UI
    
    **Acceptance Criteria:**
    - Implement PATCH /api/threads/:id to update activeModel (zod-validated, user-owned)
    - Add model selector dropdown to UI with available models
    - Route requests to OpenAI vs Anthropic based on thread.activeModel
    - Display current model in thread header
    - **Client Verification:** Client can switch between OpenAI and Anthropic models

- [x] 14) Mid-conversation model switching
    
    **Acceptance Criteria:**
    - Preserve conversation context when switching models mid-thread
    - New model receives full message history from database
    - Assistant messages tagged with provider and model used
    - Optional inline indicator when model is switched
    - **Client Verification:** Client can switch models mid-conversation and context is preserved

- [x] 15) Context window truncation logic
    
    **Acceptance Criteria:**
    - Implement context truncation utility per Design.md specification
    - Model-specific token limits (conservative estimates)
    - Preserve system message, truncate oldest user/assistant pairs when needed
    - Unit tests covering long conversation scenarios
    - Works for both OpenAI and Anthropic providers
    - **Client Verification:** Long conversations don't hit context window errors

- [x] 16) Enhanced UI error states and loading
    
    **Acceptance Criteria:**
    - Loading states with aria-busy during async operations
    - Error states with retry buttons for failed requests
    - Empty states when no threads or messages exist
    - Keyboard shortcuts: Cmd/Ctrl+N for new thread, Enter to send, Shift+Enter for newline
    - **Client Verification:** UI feels responsive and handles errors gracefully

- [x] 17) Mobile responsive layout
    
    **Acceptance Criteria:**
    - Thread tray becomes overlay/modal on mobile (<768px)
    - Toggle button to open/close thread tray
    - Chat interface remains fully functional on mobile
    - Touch-friendly interaction targets
    - **Client Verification:** App works well on mobile devices

### Phase 4: Testing and Polish (Tasks 18-20)

- [x] 18) Integration testing suite
    
    **Acceptance Criteria:**
    - Write integration tests for all API endpoints (auth, threads, messages)
    - Test authentication flows (401/403 scenarios)
    - Test provider integration with both OpenAI and Anthropic
    - Test error handling and validation scenarios
    - Tests run via npm script and pass locally
    - **Client Verification:** Comprehensive test coverage ensures reliability

- [x] 19) End-to-end testing with Playwright
    
    **Acceptance Criteria:**
    - Implement Playwright tests covering complete user workflows
    - Test sign-in, thread creation, message sending, model switching
    - Test UI states: loading, error handling, mobile responsive
    - Tests use proper selectors per docs/ui/selectors.md
    - **Client Verification:** Critical user flows are automatically tested

- [x] 20) Code quality and final polish
    
    **Acceptance Criteria:**
    - ESLint and TypeScript checks pass without errors
    - Code formatting with Prettier applied consistently
    - Remove debug statements and commented code
    - Update documentation with final API and usage instructions
    - **Client Verification:** Codebase is clean, well-documented, and production-ready

## Reference Tasks (Completed Foundation Work)

For reference, the following foundation tasks have been completed:

### Project Setup and Configuration
- [x] AGENTS.md created with agent instructions
- [x] CLAUDE.md symlink created for Claude Code compatibility
- [x] Development environment verified (Homebrew, Node.js, Python)
- [x] Git repository initialized and connected to GitHub
- [x] Next.js application scaffolded with TypeScript and Tailwind
- [x] Prisma schema configured per docs/Database.md
- [x] Temporary fixture-backed API routes implemented
- [x] Playwright E2E testing configured
- [x] Environment templates created (.env.example)
- [x] Auth and provider dependencies installed

## Additional Reference Tasks (Future Development)

The following sections contain additional tasks for future development and deployment phases. These are maintained for reference but are superseded by the phase-based approach in the Next 20 Tasks section above.

- [ ]  3) Loading states + aria-busy: Add skeletons/placeholders and `aria-busy="true"` during async fetches for threads/messages.
    
    **Acceptance Criteria:**
    
    - `[data-testid="thread-tray"][aria-busy="true"]` during thread load.
    - Message transcript shows loading placeholder while fetching messages.
    - (Verification: Introduce artificial delay; observe attributes and placeholder elements.)

- [ ]  4) Error states + retry: Show `[data-testid="error-state"]` with message and a retry button on fetch errors for threads/messages.
    
    **Acceptance Criteria:**
    
    - Error component renders on non-2xx responses.
    - Clicking retry re-issues the request and recovers to normal state when successful.
    - (Verification: Force 500 via MSW; click retry; verify recovery.)

- [ ]  5) Mobile layout (thread tray overlay): Convert thread tray to an overlay/modal under 768px with a toggle button.
    
    **Acceptance Criteria:**
    
    - On small viewport, `[data-testid="thread-tray"]` becomes overlay.
    - Toggle opens/closes tray; chat remains usable.
    - (Verification: Resize to mobile width; confirm behavior matches A10.)

- [ ]  6) Keyboard shortcuts: Implement Cmd/Ctrl+N for new thread (focus composer), Enter to send (when non-empty), Shift+Enter to newline.
    
    **Acceptance Criteria:**
    
    - Pressing Cmd/Ctrl+N adds a new thread in UI and focuses `[data-testid="composer-input"]`.
    - Enter sends when composer non-empty; Shift+Enter inserts a newline.
    - (Verification: Manual and Playwright checks per A9.)

- [ ]  7) Accessibility semantics: Ensure semantic structure and ARIA labels align with docs/ui/selectors.md and Accessibility guidance.
    
    **Acceptance Criteria:**
    
    - `role="main"` on chat pane, `role="alert"` on error states.
    - Proper heading hierarchy and `aria-label` on key controls.
    - (Verification: Automated axe scan shows no violations at Level AA; keyboard-only navigation works.)

- [ ]  8) Selector audit: Confirm all `data-testid` match docs/ui/selectors.md and add any missing attributes.
    
    **Acceptance Criteria:**
    
    - Elements include: `app-shell`, `thread-tray`, `thread-list`, `thread-item`, `thread-title`, `model-switcher`, `transcript`, `typing-indicator`, `composer`, `composer-input`, `composer-send`, `brand-swatch`.
    - (Verification: Inspect DOM; ensure presence and correct values.)

- [ ]  9) Dev-only MSW bootstrap: Install and configure MSW (browser worker) to serve fixture data from `docs/ui/fixtures` during development.
    
    **Acceptance Criteria:**
    
    - `msw` dependency added; worker initialized in dev only.
    - Handlers implemented for `GET /api/threads`, `GET /api/messages?threadId=...`, `PATCH /api/threads/:id`.
    - `POST /api/messages` may continue using Next route SSE stub for streaming.
    - (Verification: With `NEXT_PUBLIC_API_MOCKING=1`, network requests show mocked responses.)

- [ ]  10) MSW fixture handlers: Map handlers to JSON fixtures and add realistic delays.
    
    **Acceptance Criteria:**
    
    - Handlers read from `docs/ui/fixtures/*.json`.
    - Delays configurable (e.g., 200–600ms) to exercise loading states.
    - (Verification: Logs show handler hits; UI displays skeletons then data.)

- [ ]  11) Mocking toggle: Add env-controlled toggle (e.g., `NEXT_PUBLIC_API_MOCKING=1`) and document it in docs/DEV.md.
    
    **Acceptance Criteria:**
    
    - Mocking starts automatically in dev when toggle is set.
    - Production builds do not include/initialize the worker.
    - (Verification: Build output excludes MSW; dev includes worker registration.)

- [ ]  12) Playwright: Add initial e2e suite scaffolding `e2e/ui.spec.ts` covering A1 (shell) and B1–B2 (brand font and dark theme vars).
    
    **Acceptance Criteria:**
    
    - `e2e/ui.spec.ts` exists and `npm run test:e2e` executes it.
    - Tests assert presence of core selectors and brand variables.
    - (Verification: Tests pass locally.)

- [ ]  13) Playwright: Add A2 (fixture data loads) using MSW fixtures.
    
    **Acceptance Criteria:**
    
    - Test asserts 5 thread items and exact titles from fixtures.
    - First thread has `data-active="true"`.
    - (Verification: Test passes.)

- [ ]  14) Playwright: Add A3 (thread selection) and A4 (model retention per thread).
    
    **Acceptance Criteria:**
    
    - Clicking different thread updates active state and header title.
    - Model selection persists per thread within session.
    - (Verification: Tests pass.)

- [ ]  15) Playwright: Add A5 (message send flow) using SSE stub.
    
    **Acceptance Criteria:**
    
    - Composer clears and disables during response; typing indicator visible.
    - Assistant message streams in; indicator hides when done.
    - (Verification: Tests pass.)

- [ ]  16) Playwright: Add A6–A8 (empty, loading, error) by toggling MSW responses and delays.
    
    **Acceptance Criteria:**
    
    - Empty state test shows welcome/empty UI.
    - Loading state test observes `aria-busy` and skeletons.
    - Error test shows error state and successful retry.
    - (Verification: Tests pass.)

- [ ]  17) Responsive test A10: Verify mobile overlay behavior of thread tray.
    
    **Acceptance Criteria:**
    
    - Set viewport to mobile; assert tray becomes overlay and is toggleable.
    - (Verification: Test passes.)

- [ ]  18) Brand tests B3–B5: Gradient, accessibility checks, favicon and metadata verification.
    
    **Acceptance Criteria:**
    
    - Gradient background-image present on brand swatch.
    - Contrast checks meet guidance; favicon present and accessible.
    - (Verification: Tests pass.)

- [ ]  19) Developer docs: Update `docs/DEV.md` with MSW usage, mocking toggle, and testing commands.
    
    **Acceptance Criteria:**
    
    - DEV.md includes steps to enable/disable mocks and run E2E.
    - (Verification: File updated; instructions work as written.)

- [ ]  20) Task list hygiene: Remove duplicates and inconsistent sections, and confirm ordering.
    
    **Acceptance Criteria:**
    
    - Duplicate "Environment Templates" entry removed.
    - "Feature Implementation — Tasks API" removed (inconsistent).
    - Next 20 tasks appear in order at top for the agent to execute sequentially.
    - (Verification: `docs/Tasks.md` reflects the new ordering and content.)

## UI Specification Implementation

### LLM-Friendly Mock Setup

- [ ]  **Create UI Specification Structure**: Set up the complete `docs/ui/` folder structure with all machine-readable specifications that Claude Code can use to build the chat interface deterministically.
    
    **Acceptance Criteria:**
    
    - `docs/ui/` directory exists with design tokens, component specs, fixtures, and wireframes
    - `docs/ui/tokens.json` contains color, font, spacing, and other design tokens
    - `docs/ui/components.md` defines component inventory and structure
    - `docs/ui/selectors.md` specifies canonical `data-testid` selectors for testing
    - `docs/ui/states.md` documents component states and behaviors
    - `docs/ui/fixtures/` contains JSON mock data (models.json, threads.json, messages.json, user.json)
    - `docs/ui/wireframes/chat.html` provides copy-ready HTML structure with proper selectors
    - `docs/ui/flows.md` documents user interaction flows and keyboard shortcuts
    - `docs/ui/acceptance.md` defines testable acceptance criteria
    - (Verification: All files exist with comprehensive content. Claude Code can read the specifications and understand the complete UI requirements without ambiguity.)

### Brand System Setup

- [ ]  **Add Brand Tokens**: Update design tokens with bombay brand palette, IBM Plex Mono font, and new design system.
    
    **Acceptance Criteria:**
    
    - `docs/ui/tokens.json` contains bombay brand colors (dark and light themes)
    - Font definition uses IBM Plex Mono as primary font
    - Brand colors include: brand-600 (#E11D74), brand-500 (#FF2E88), brand-300 (#FFA6D1), brand-100 (#FFE4F0)
    - Radius values use 12px (md) and 16px (xl) for bombay's shape language
    - Gradient and elevation tokens include pink-tinted shadows
    - (Verification: JSON file contains keys: `font.mono`, `color.dark.bg`, `color.light.bg`, `gradient.brand` with correct bombay values.)

- [ ]  **Configure Tailwind & CSS Variables**: Set up Tailwind configuration and CSS custom properties for theme switching.
    
    **Acceptance Criteria:**
    
    - `tailwind.config.ts` extends theme with brand color variables and IBM Plex Mono font
    - `app/globals.css` defines CSS variables for dark/light themes with bombay colors
    - Dark theme set as default with `data-theme="dark"` on body
    - CSS variables follow pattern: `--color-bg`, `--color-brand-500`, etc.
    - Custom scrollbar styling with brand accent colors
    - (Verification: Playwright check: `document.body.getAttribute('data-theme') === 'dark'`; CSS var `--color-bg` equals `#0B1220`.)

- [ ]  **Add IBM Plex Mono Font**: Integrate IBM Plex Mono via Google Fonts in Next.js layout.
    
    **Acceptance Criteria:**
    
    - IBM Plex Mono loaded in `app/layout.tsx` with weights 400, 500, 600, 700
    - Font variable `--font-mono` properly configured
    - Body element uses `font-mono` class
    - Font loads with swap display for performance
    - (Verification: Computed `font-family` on `body` contains "IBM Plex Mono".)

- [ ]  **Add Brand Assets**: Create wordmark SVG and favicon with bombay branding.
    
    **Acceptance Criteria:**
    
    - `public/brand/wordmark.svg` contains bombay wordmark with gradient and caret bar
    - `public/favicon.svg` contains monogram-style 'b' in brand colors
    - Favicon properly referenced in layout metadata
    - SVG assets use proper gradient definitions and dark background
    - (Verification: `GET /favicon.svg` returns 200; `<link rel="icon">` present in HTML.)

- [ ]  **Create Brand Guidelines**: Document brand usage rules and component recipes for consistent implementation.
    
    **Acceptance Criteria:**
    
    - `docs/brand.md` contains comprehensive brand guidelines
    - Guidelines specify lowercase "bombay" usage and IBM Plex Mono requirement
    - Tailwind component recipes provided for buttons, panels, and form elements
    - Color accessibility notes and contrast requirements documented
    - Theme implementation details and CSS variable structure explained
    - (Verification: File exists; contains "Always use lowercase" and component recipes.)

- [ ]  **Validate Brand Implementation**: Add brand-specific acceptance tests and verify consistent application.
    
    **Acceptance Criteria:**
    
    - Brand validation tests added to `docs/ui/acceptance.md` (B1-B5)
    - Tests verify IBM Plex Mono font loading and application
    - Tests check CSS custom properties and theme variables
    - Brand gradient and color accessibility validated
    - Favicon and metadata properly configured
    - (Verification: Acceptance criteria B1-B5 added; tests can verify font, colors, and assets.)

- [ ]  **Implement Mock Service Worker (MSW) Setup**: Configure MSW in the Next.js application to serve fixture data and enable UI development before backend exists.
    
    **Acceptance Criteria:**
    
    - MSW is installed and configured in the Next.js project
    - Mock handlers serve data from `docs/ui/fixtures/` files
    - API endpoints match the defined contract: `GET /api/threads`, `GET /api/messages?threadId=...`, `PATCH /api/threads/:id`, `POST /api/messages`
    - Mock responses include proper HTTP status codes and realistic delays
    - Development server works with mocks (no real backend required)
    - (Verification: Frontend runs with `npm run dev`, makes API calls that return fixture data. Network tab shows mocked responses. UI displays sample conversations from fixtures.)

- [ ]  **Add Playwright End-to-End Testing**: Set up Playwright with the basic acceptance test suite to verify UI functionality against the specification.
    
    **Acceptance Criteria:**
    
    - Playwright is installed and configured in the project
    - `e2e/ui.spec.ts` implements the acceptance checks from `docs/ui/acceptance.md`
    - Tests use the canonical selectors from `docs/ui/selectors.md`
    - Test covers: shell rendering, fixture data loading, thread switching, model selection, message sending flow
    - `npm run test:e2e` executes tests against running dev server with mocks
    - All acceptance tests pass, confirming UI meets specification
    - (Verification: Running `npx playwright test` shows all tests passing. Tests successfully locate elements using data-testid selectors and verify expected behaviors.)

### Chat UI Implementation

- [ ]  **Build Chat Interface from Wireframe**: Implement the complete chat UI using the HTML wireframe and design tokens, ensuring all required selectors are present.
    
    **Acceptance Criteria:**
    
    - Chat interface matches the structure from `docs/ui/wireframes/chat.html`
    - All components use design tokens from `docs/ui/tokens.json`
    - Every interactive element has the correct `data-testid` from `docs/ui/selectors.md`
    - Layout is responsive (mobile overlay, desktop sidebar)
    - Visual design uses Tailwind CSS with proper styling
    - Components are properly structured (ThreadTray, ChatPane, Composer, etc.)
    - (Verification: UI renders without errors, visually matches wireframe intent, all acceptance test selectors are found, responsive design works on different screen sizes.)

- [ ]  **Implement State Management and Interactions**: Add React state management and user interactions to make the UI fully functional with mock data.
    
    **Acceptance Criteria:**
    
    - Thread selection switches active conversation and loads messages
    - Model switcher updates thread settings and applies to future messages
    - Message composer handles input, validation, and sending
    - Typing indicators appear during simulated assistant responses
    - Loading and error states display properly
    - Keyboard shortcuts work (Cmd+N for new thread, Enter to send, etc.)
    - All user flows from `docs/ui/flows.md` function correctly
    - (Verification: All Playwright acceptance tests pass. User can interact with every feature. State persists correctly when switching threads. No console errors during normal usage.)

- [ ]  **Add Real-time Message Streaming**: Implement streaming responses for assistant messages to simulate the real chat experience.
    
    **Acceptance Criteria:**
    
    - Assistant messages stream in progressively (not all at once)
    - Typing indicator shows during streaming, disappears when complete
    - User cannot send messages while assistant is responding
    - Streaming works with mock WebSocket or Server-Sent Events
    - Auto-scroll keeps latest content visible during streaming
    - Stream can be cancelled if user navigates away
    - (Verification: Sending a message shows typing indicator, then assistant response appears word-by-word. UI remains responsive during streaming. All streaming edge cases handled gracefully.)

### Progressive Enhancement

- [ ]  **Replace Mocks with Real API Integration**: Swap MSW mocks for actual backend API calls while keeping all selectors and UI behavior unchanged.
    
    Note: Superseded by the detailed "Next 16 Tasks — Auth, DB, and Real API Track" (N1–N16). Keep this as a reference umbrella task only.
    
    **Acceptance Criteria:**
    
    - API client configured to call real backend endpoints
    - Authentication and error handling implemented
    - SSE streaming implemented per docs/API.md
    - Mock responses are replaced but UI behavior stays identical
    - All Playwright tests continue passing with real backend
    - Graceful fallback if backend is unavailable
    - (Verification: UI works with real API, all features functional, no behavior changes from user perspective. Tests pass against real backend. Error states handle API failures appropriately.)

- [ ]  **Performance Optimization and Polish**: Optimize the chat interface for production use with proper loading states, caching, and performance improvements.
    
    **Acceptance Criteria:**
    
    - Message history pagination for long conversations
    - Optimistic updates for better perceived performance
    - Proper loading skeletons and transitions
    - Image/media handling in messages (if applicable)
    - Accessibility improvements (ARIA labels, keyboard navigation)
    - Bundle size optimization and code splitting
    - Service worker for offline functionality (optional)
    - (Verification: Lighthouse scores 90+ for Performance, Accessibility, Best Practices. Large conversations load smoothly. App feels responsive under normal usage patterns.)

## Production Deployment

### API Keys and External Services

- [x]  **Generate AI Provider API Keys**: Request user to create API keys for OpenAI and Anthropic services.
    
    **Acceptance Criteria:**
    
    - **USER ACTION REQUIRED**: Agent prompts user to:
      - Sign up for OpenAI account at https://platform.openai.com
      - Generate API key with appropriate usage limits
      - Sign up for Anthropic account at https://console.anthropic.com  
      - Generate API key for Claude access
      - Store keys securely for environment variable configuration
    - Agent waits for user confirmation that keys have been generated
    - Keys follow format: `sk-...` for OpenAI, `sk-ant-...` for Anthropic
    - (Verification: User confirms API keys are generated and ready for deployment setup.)

### Hosting Platform Setup

- [x]  **Set Up Vercel Account and Project**: Request user to create Vercel account and connect GitHub repository.
    
    **Acceptance Criteria:**
    
    - **USER ACTION REQUIRED**: Agent prompts user to:
      - Sign up for Vercel account at https://vercel.com
      - Connect GitHub account and authorize Vercel access
      - Import the bombay GitHub repository as new Vercel project
      - Configure project settings (Next.js framework auto-detected)
      - Set Node.js version to 18+ in project settings
    - Agent waits for user confirmation that Vercel project is created
    - Initial deployment should succeed (may have missing env vars)
    - (Verification: User confirms Vercel project exists and initial deployment completed.)

- [x]  **Configure Production Environment Variables**: Set up API keys and database connection in Vercel dashboard.
    
    **Acceptance Criteria:**
    
    - **USER ACTION REQUIRED**: Agent prompts user to:
      - Access Vercel project dashboard → Settings → Environment Variables
      - Add production environment variables:
        - `OPENAI_API_KEY` (from previous step)
        - `ANTHROPIC_API_KEY` (from previous step)
        - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (OAuth setup)
        - `NEXTAUTH_SECRET` (generate random 32+ char string)
        - `DATABASE_URL` (managed Postgres connection string)
        - `NEXTAUTH_URL` (https://bombay.chat)
      - Trigger new deployment after environment variables are set
    - All environment variables properly configured for production
    - New deployment succeeds with all services connected
    - (Verification: Environment variables configured, deployment succeeds, app functional on Vercel domain.)

### Domain Configuration

- [x]  **Configure Custom Domain**: Set up bombay.chat domain to point to Vercel deployment.
    
    **Acceptance Criteria:**
    
    - **USER ACTION REQUIRED**: Agent prompts user to:
      - Access Vercel project dashboard → Settings → Domains
      - Add custom domain: bombay.chat
      - Copy DNS configuration values from Vercel (CNAME/A records)
      - Log into Porkbun account at https://porkbun.com
      - Navigate to DNS management for bombay.chat domain
      - Update DNS records to point to Vercel (remove default parking)
      - Wait for DNS propagation (5-60 minutes)
    - SSL certificate automatically provisioned by Vercel
    - Domain resolves to bombay application
    - HTTPS redirect properly configured
    - (Verification: https://bombay.chat loads the application with valid SSL certificate.)

### Database Setup

- [x]  **Set Up Production Database**: Configure managed Postgres database for production use.
    
    **Acceptance Criteria:**
    
    - **USER ACTION REQUIRED**: Agent prompts user to:
      - Choose managed Postgres provider (Neon/Supabase/Vercel Postgres)
      - Create production database instance
      - Configure connection settings (SSL required)
      - Copy database connection string
      - Add `DATABASE_URL` to Vercel environment variables
      - Run Prisma migrations: `npx prisma db push` (or setup auto-migration)
    - Database schema matches development (users, threads, messages tables)
    - Connection secure with SSL/TLS encryption
    - Prisma can successfully connect and query database
    - (Verification: Database connected, tables created, application can read/write data in production.)

### Production Validation

- [ ]  **Test End-to-End Production Flow**: Validate complete application functionality on live domain.
    
    **Acceptance Criteria:**
    
    - Navigate to https://bombay.chat and verify application loads
    - Test Google OAuth sign-in flow works in production
    - Create new chat thread and verify database persistence
    - Send message and verify AI provider integration (OpenAI/Anthropic)
    - Test model switching mid-conversation
    - Verify message history persists across sessions
    - Check SSL certificate validity and security headers
    - Test responsive design on mobile and desktop
    - Verify no console errors or broken functionality
    - (Verification: All core features work correctly on production domain with real user flow.)

### Local Development Setup

- [x]  **Document Local Development Process**: Create clear instructions for running bombay locally.
    
    **Acceptance Criteria:**
    
    - Update README.md with local development section:
      - Prerequisites: Node.js 18+, PostgreSQL (local or remote)
      - Clone repository and install dependencies: `npm install`
      - Set up `.env.local` with development environment variables
      - Initialize database: `npx prisma db push`
      - Start development server: `npm run dev`
      - Access local app at http://localhost:3000
    - Include troubleshooting section for common issues
    - Document how to switch between local and production databases
    - Provide example `.env.local` template with placeholder values
    - (Verification: Following README instructions results in working local development environment.)
