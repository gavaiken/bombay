# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## High-Level Code Architecture

This project is a monolithic Next.js application built with TypeScript. It's designed to be a web-based chat application that allows users to interact with multiple AI models from different providers like OpenAI and Anthropic.

-   **Frontend:** The frontend is built with React and Tailwind CSS. The UI is structured using Next.js App Router. Key components include `ThreadTray` for listing conversations, `Transcript` for displaying messages, and `ChatComposer` for user input.
-   **Backend:** The backend is implemented using Next.js API routes with a Node.js runtime. It handles user authentication, database operations, and communication with AI providers.
-   **Database:** PostgreSQL is used as the database, with Prisma as the ORM. The schema includes tables for `User`, `Thread`, and `Message`.
-   **Authentication:** User authentication is handled by Auth.js (NextAuth) with Google as the OAuth provider.
-   **AI Integration:** The application integrates with AI providers through a system of adapters. Each provider (e.g., OpenAI, Anthropic) has its own adapter that implements a common `ProviderAdapter` interface. This allows for seamless switching between models mid-conversation.
-   **Streaming:** Server-Sent Events (SSE) are used to stream AI model responses to the client for a real-time chat experience.

## Common Development Commands

-   **Install Dependencies:**
    ```bash
    npm install
    ```
-   **Run Development Server:**
    ```bash
    npm run dev
    ```
-   **Build for Production:**
    ```bash
    npm run build
    ```
-   **Run Production Server:**
    ```bash
    npm start
    ```
-   **Lint Code:**
    ```bash
    npm run lint
    ```
-   **Run End-to-End Tests:**
    ```bash
    npm run test:e2e
    ```
-   **Initialize/Update Database Schema:**
    ```bash
    npx prisma db push
    ```

## AI Agent Execution Guide

This repo uses an AI coding agent (e.g., Claude Code, Warp Agent). The agent must:

1.  Read docs/Tasks.md and take the next unchecked task (or approved batch).
2.  Use docs/PRD.md and docs/Design.md as the source of truth.
3.  Implement exactly what the task asks; keep changes small and focused.
4.  Verify the task’s acceptance criteria (via tests or direct checks), commit, push, and pause.
5.  Wait for the human operator to check the box in Tasks.md before proceeding.

### Guardrails

-   Never commit secrets. Only read env names from docs/ENV.md.
-   Do not change `data-testid` values or brand token keys.
-   Follow API contracts in docs/API.md and DB schema in docs/Database.md.
-   For HTTP errors, use the error envelope in docs/API.md.
-   Provider calls are server-side only; never expose API keys to the browser.
-   If docs and code/tests disagree, trust tests and live behavior. Report the discrepancy and propose doc updates.

### Development context

-   UI structure & selectors: docs/ui/structure.md, docs/ui/selectors.md.
-   Brand rules: docs/brand.md and docs/ui/tokens.json.
-   Testing plan: docs/Testing.md.
-   Deployment: docs/Deployment.md.

Operating loop: “Read task → implement → verify → commit → push → pause”.

### Warp/GPT-5 Agent Addendum (execution & verification)

-   Batching (with user approval): You may batch up to 5 small, related tasks. Pause after any large task or when input is needed. Summarize and verify each batch before proceeding.
-   Verification-first: Every task or batch must be verified by running tests and/or directly exercising the app. Prefer automated checks; supplement with manual checks as needed.
-   Commit & push cadence: Commit and push after each small task. For a batch, still make one commit per task and push each commit immediately. Do not batch unrelated changes into a single commit.
-   Periodic manual verification: At least once every 10 tasks, request the user’s manual verification (e.g., run the demo or tests and confirm expected outcomes). Wait for explicit confirmation before continuing.
-   Task list upkeep: At the end of each task/batch, update docs/Tasks.md as needed to add follow-on items. Keep the “Next 20 Tasks” small and verifiable. Do not rewrite the entire file—make targeted updates.
-   Pause on ambiguity: If acceptance criteria are unclear or prerequisites are missing, stop and ask a concise question before making assumptions.
-   Change transparency: Keep commits minimal and focused. Include a brief description referencing the task ID, a summary of deltas, and how verification was performed. Avoid large, unreviewed leaps.
-   Contract fidelity: Maintain selector contracts (docs/ui/selectors.md), brand tokens (docs/ui/tokens.json), and accessibility guidance. Never silently change these contracts.
-   Security & secrets: Never log or expose secrets. Keep provider calls on the server only.
