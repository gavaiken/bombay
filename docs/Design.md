# Design Document

---

## **TL;DR**

- **Goal:** Web MVP that lets users sign in with Google, create persistent chat threads, and **switch between OpenAI and Anthropic models mid-thread** while preserving context (same messages array).
- **Architecture:** Single **Next.js (App Router) + TypeScript** monolith with **API routes** (Node runtime), **Postgres + Prisma**, **Auth.js (NextAuth)** for Google sign-in, **SSE** streaming.
- **Why this stack:** Extremely **LLM-friendly** (lots of examples), fast to ship, minimal glue, clean path to extend later.
- **Non-goals:** Tools/function-calling, images/voice, BYOK-per-user, microservices, mobile apps.

---

## **Objectives**

1. **Seamless model/provider switching:** Continue the same thread with a different model; user perceives uninterrupted context.
2. **Persistent chat threads:** Left tray with threads stored in DB; history reloads on login.
3. **Simple, robust auth:** Google OAuth sign-in; per-user data isolation.
4. **Minimal but strong architecture:** Monolith, server-rendered pages where helpful, SSE for streaming.
5. **LLM-first development:** Typed contracts (TS + Prisma + Zod), simple patterns, tiny adapter interface for providers.

---

## **Scope**

### **In-scope (MVP)**

- Google sign-in (Auth.js)
- Left sidebar with **thread list** (+ New Chat)
- Chat view (messages, markdown, code blocks)
- Model selector (exact models; e.g., openai:gpt-4o, anthropic:claude-3.5)
- Mid-thread **switch**: subsequent assistant replies use new model with full prior context
- **Persistence**: Postgres + Prisma for users/threads/messages
- **Streaming** replies (SSE)
- Context window **rolling truncation** (keep most recent; preserve first system)

### **Out of scope (MVP)**

- Tool/function calling
- Attachments (images/files), voice
- User-supplied API keys (BYOK per user)
- Advanced model params (temperature, top_p)
- Team/RBAC, sharing threads
- Mobile/desktop native apps
- Microservices / multi-repo

---

## **User Stories**

- **US1:** As a user, I can sign in with Google and see my own threads.
- **US2:** I can create a new chat thread and converse with the assistant.
- **US3:** I can pick the **exact model** for a thread and **switch mid-thread**.
- **US4:** My chat history persists and reloads after I log back in.
- **US5:** If an error occurs, I see a friendly inline message.

---

## **Success Criteria**

- Switching from OpenAI → Anthropic (and back) mid-thread yields coherent replies that reference prior turns.
- Threads persist; reload shows the full history.
- SSE streaming works; average “first token” < ~2s on typical prompts.
- No secrets in the browser; provider keys never leak.
- Clear current model indicator per thread; assistant messages labeled with provider/model.

---

## **Architecture Overview**

- **Monolith:** Next.js (Node runtime for API routes)
- **Adapters:** Tiny provider modules: OpenAI + Anthropic
- **Persistence:** Postgres via Prisma
- **Auth:** Auth.js (Google)
- **Streaming:** SSE → browser
- **Hosting:** Vercel (or Cloud Run/App Runner) + managed Postgres + Secrets Manager

**Flow (text diagram):**

```
[Browser]
  ├─ Auth: Google OAuth → [Next.js Auth.js] → session cookie
  ├─ REST: /api/threads, /api/threads/:id, PATCH /:id (switch model)
  └─ SSE: POST /api/threads/:id/message → stream tokens

[Next.js API (Node runtime)]
  ├─ Auth middleware (session)
  ├─ Prisma ORM → Postgres
  ├─ Provider adapters:
  │    • openai.chat()  (stream)
  │    • anthropic.chat() (stream)
  └─ Context policy (truncate if needed), usage logging

[Postgres]
  • users, threads, messages (with provider/model, usage_json)
```

---

## **Technical Stack (Final)**

**Framework & Language**

- Next.js (App Router) + **TypeScript**
- Node runtime for all API routes (⚠️ not Edge)

**UI**

- Tailwind CSS
- Optional: shadcn/ui primitives
- react-markdown + rehype/prism for code highlighting

**State & Data Fetching**

- React Query (or SWR) for client data
- Minimal client state: active thread, streaming status, model picker

**Validation & Types**

- **Zod** for request/response schemas
- Prisma-generated TS types for models

**Auth**

- Auth.js (NextAuth) — **Google provider**, HTTP-only cookie session

**DB & ORM**

- **Postgres** (Neon/Supabase/Railway/Cloud SQL/RDS)
- **Prisma** ORM + migrations

**AI Providers**

- OpenAI official Node SDK
- Anthropic official Node SDK
- Small adapter interface (async iterator for streaming)

**Streaming**

- **SSE** (Server-Sent Events) to the browser

**Secrets**

- Provider keys in env; server-only
- Cloud Secrets Manager at deploy time

**Observability**

- pino logs
- Sentry (optional MVP+)
- Basic usage metrics persisted per assistant message

**Rate Limiting (MVP+)**

- Upstash Redis token bucket (optional for demo; recommended soon after)

---

## **Data Model (Prisma Sketch)**

```
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  createdAt DateTime @default(now())
  threads   Thread[]
}

model Thread {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  title       String?
  activeModel String    // e.g. "openai:gpt-4o" or "anthropic:claude-3-5"
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  messages    Message[]
}

enum Role {
  system
  user
  assistant
}

model Message {
  id          String    @id @default(cuid())
  threadId    String
  thread      Thread    @relation(fields: [threadId], references: [id])
  role        Role
  contentText String
  provider    String?   // set for assistant (e.g., "openai" | "anthropic")
  model       String?   // exact model id used for this assistant message
  usageJson   Json?
  createdAt   DateTime  @default(now())

  @@index([threadId, createdAt])
}
```

---

## **API Surface (Minimal)**

- GET /api/threads → list threads for current user
- POST /api/threads → create thread { title?, activeModel? }
- GET /api/threads/:id → fetch thread + messages
- PATCH /api/threads/:id → update { activeModel } (switch model)
- POST /api/threads/:id/message → **SSE** stream reply
    - events: "delta" (token text), "done" { messageId, usage }, "error" { message }

**Notes**

- All routes require auth.
- Zod validate all payloads.
- Node runtime enforced: export const runtime = 'nodejs'.

---

## **Provider Adapter Interface**

```
export interface ProviderAdapter {
  name: 'openai' | 'anthropic';
  chat(opts: {
    model: string;             // exact model id
    system?: string;           // optional system prompt
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
    stream: true;
    abortSignal?: AbortSignal;
  }): AsyncIterable<string>;   // yields text deltas
}
```

- **openaiAdapter.chat**: Maps to Chat Completions/Responses stream → yields .delta text.
- **anthropicAdapter.chat**: Maps to Messages stream → yields content block deltas.
- **Adapter picker**: getAdapter(activeModel) by prefix (openai: / anthropic:).

---

## **Context Window Policy (MVP)**

- Maintain per-model **max tokens** + **headroom** config.
- Build prompt as: [system?] + prior messages + new user message.
- **Preflight estimate** (tiktoken rough for OpenAI; count-words fallback for Anthropic).
- If over limit: **drop oldest (user,assistant) pairs** until under limit; **preserve first system** if present.
- Persist provider-reported usage on assistant message.

*Future (not MVP):* handoff **summary message** when trimming; store rotating summaries.

---

## **Streaming Design (SSE)**

**Server flow**

1. Insert user message (optimistic).
2. Call adapter; stream deltas.
3. Flush SSE "delta" events to client (newline-delimited).
4. On finish: insert assistant message with provider, model, usageJson.
5. Emit "done" with { messageId, usage }.
6. On error: emit "error" with safe message; log server error.

**Client flow**

- Open EventSource on send → append "delta" chunks → close on "done" → finalise message row in UI.
- Support **cancel**: closing EventSource triggers AbortController to provider request.

---

## **Auth & Sessions**

- **Auth.js (NextAuth)** with **Google** provider.
- Session: HTTP-only secure cookie; SameSite=Lax.
- Server helpers to get userId in API routes.
- Protect all /api/* and /app/* (if using App Router layouts).

---

## **UI/UX Notes**

- **Layout:** Sidebar (threads) + main chat pane.
- **Model switcher:** Dropdown in header (shows activeModel); PATCH thread on change. Optional inline system note “Switched to …”.
- **Labels:** Show small tag on assistant bubbles: e.g., “GPT-4o” / “Claude 3.5”.
- **Markdown:** Render from assistant; safe code blocks with copy.
- **Errors:** Inline assistant-style error bubble (“Provider busy; please retry”).

---

## **Security & Privacy**

- HTTPS only; HSTS.
- No secrets in client; provider calls server-side only.
- Sanitize/validate inputs (Zod), limit payload sizes.
- **Per-user isolation** on all DB queries.
- Minimal PII (email); no training on user data.
- Log redaction: on error, never log full message bodies.

---

## **Rate Limiting & Quotas (MVP→Soon)**

- (Optional in demo) **Upstash Redis** token bucket per user.
- Simple hard cap envs: max messages/day per user; max tokens/turn guardrails.

---

## **Observability**

- **pino** structured logs (provider, model, latency_ms, input_tokens, output_tokens, status).
- Basic usage rollups per-thread (optional).
- **Sentry** (MVP+) for server/client error tracking.

---

## **Deployment Strategy**

### **Production Domain & Hosting**

- **Domain**: bombay.chat (purchased via porkbun.com)
- **Primary hosting**: Vercel for Next.js deployment
- **Database**: Managed Postgres (Neon/Supabase/Vercel Postgres)
- **CDN**: Vercel Edge Network
- **SSL/TLS**: Automatic via Vercel + custom domain

### **Deployment Flow**

1. **GitHub Integration**: Vercel auto-deploys from main branch
2. **DNS Configuration**: Point bombay.chat to Vercel via Porkbun DNS management
3. **Environment Variables**: API keys and secrets via Vercel dashboard
4. **Database Setup**: Postgres connection string in production environment

### **Local Development**

- **Prerequisites**: Node.js 18+, PostgreSQL (local or remote)
- **Setup**: `npm install`, `npx prisma db push`, `npm run dev`
- **Environment**: `.env.local` with development API keys
- **Hot reload**: Next.js dev server with fast refresh

## **Hosting & Environments**

**Primary deployment (chosen)**

- **Vercel** for Next.js (Node runtime for API, SSE compatible)
- **Custom domain**: bombay.chat via Porkbun DNS
- **Database**: Managed Postgres (Neon/Supabase/Vercel Postgres)
- **Vercel env vars** for secrets management

**Alt (GCP-preferred)**

- Cloud Run (containerized Next.js)
- Cloud SQL (Postgres) + SQL Auth Proxy
- Secret Manager

**Alt (AWS-preferred)**

- App Runner or ECS Fargate
- RDS Postgres
- Secrets Manager

---

## **.env Example**

```
# Auth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# Providers (server-only)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Optional
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## **Risks & Mitigations**

- **Context overflow:** Implement rolling truncation; warn in logs when trimming occurs.
- **Provider errors/429s:** One backoff retry; show friendly message; suggest switching model.
- **Latency spikes:** Stream ASAP; show “assistant is typing”; allow cancel.
- **Cost overrun (shared keys):** Add per-user throttle; track usage; env-based hard caps.
- **SSE proxies:** Keep Node runtime; test on chosen host (Vercel supports).

---

## **Open Questions (Resolve Before Build)**

- **Initial model list:** Exact IDs for OpenAI/Anthropic to expose in dropdown.
- **Default model on new thread:** Last used vs configured default?
- **Thread titles:** Auto-name from first user message vs untitled placeholder.
- **Error copy:** Standardize user-facing error messages.

---

## **Milestones (High-Level)**

1. **M1 — Project & Auth**
    - Next.js app scaffold, Tailwind, Auth.js (Google), protected routes
2. **M2 — DB & Models**
    - Prisma schema/migrations; thread/message CRUD; list + load thread
3. **M3 — OpenAI Path**
    - OpenAI adapter + SSE route; persist assistant messages + usage
4. **M4 — Anthropic Path**
    - Anthropic adapter + SSE; model selector; mid-thread switch semantics
5. **M5 — Context Policy & Polish**
    - Rolling truncation; error handling; assistant labels; basic logging
6. **M6 — Deploy**
    - Prod env, secrets, database, smoke test, demo script

---

## **Future Work (Deliberately Deferred)**

- **Tool/function calling** abstraction; uniform tool schema
- **Handoff summaries & long-term memory** (summarize old turns)
- **Advanced controls** (temperature, max tokens, JSON mode)
- **Additional providers** (Google Gemini, DeepSeek) via new adapters
- **BYOK per user** (encrypted key vault, per-user budgets)
- **Thread management** (rename, delete, archive, search)
- **Compare mode** (A/B side-by-side responses)
- **Teams & RBAC** (orgs, roles, shared threads)
- **Mobile apps** (React Native or Flutter)
- **Analytics** (PostHog), **Error tracking** (Sentry), **Rate limiting** (Upstash) fully enabled

---

## **Appendix: Request & Response Shapes**

**POST /api/threads/:id/message (client → server, non-SSE prelude)**

```
{
  "content": "Explain how context windows work."
}
```

**SSE events (server → client)**

```
event: delta
data: "Context windows let a model..."

event: delta
data: " ..process a limited number of tokens..."

event: done
data: {"messageId":"msg_123","usage":{"input_tokens":732,"output_tokens":161}}
```

---

This document is structured for easy copy/paste into Notion. If you want, I can also produce a companion **LLM scaffolding prompt** for Claude to generate the repo (files, Prisma schema, API routes, adapters, SSE client) following this design exactly.