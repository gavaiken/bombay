# bombay – AI Agent Execution Guide

This repo uses an AI coding agent (e.g., Claude Code, Warp Agent). The agent must:

1) Read docs/Tasks.md and take the next unchecked task (or approved batch).
2) Use docs/PRD.md and docs/Design.md as the source of truth.
3) Implement exactly what the task asks; keep changes small and focused.
4) Verify the task’s acceptance criteria (via tests or direct checks), commit, push, and pause.
5) Wait for the human operator to check the box in Tasks.md before proceeding.

## Guardrails
- Never commit secrets. Only read env names from docs/ENV.md.
- Do not change `data-testid` values or brand token keys.
- Follow API contracts in docs/API.md and DB schema in docs/Database.md.
- For HTTP errors, use the error envelope in docs/API.md.
- Provider calls are server-side only; never expose API keys to the browser.
- If docs and code/tests disagree, trust tests and live behavior. Report the discrepancy and propose doc updates.

## Development context
- UI structure & selectors: docs/ui/structure.md, docs/ui/selectors.md.
- Brand rules: docs/brand.md and docs/ui/tokens.json.
- Testing plan: docs/Testing.md.
- Deployment: docs/Deployment.md.

Operating loop: “Read task → implement → verify → commit → push → pause”.

## Warp/GPT-5 Agent Addendum (execution & verification)

- Batching (with user approval): You may batch up to 5 small, related tasks. Pause after any large task or when input is needed. Summarize and verify each batch before proceeding.
- Verification-first: Every task or batch must be verified by running tests and/or directly exercising the app. Prefer automated checks; supplement with manual checks as needed.
- Commit & push cadence: Commit and push after each small task. For a batch, still make one commit per task and push each commit immediately. Do not batch unrelated changes into a single commit.
- Periodic manual verification: At least once every 10 tasks, request the user’s manual verification (e.g., run the demo or tests and confirm expected outcomes). Wait for explicit confirmation before continuing.
- Task list upkeep: At the end of each task/batch, update docs/Tasks.md as needed to add follow-on items. Keep the “Next 20 Tasks” small and verifiable. Do not rewrite the entire file—make targeted updates.
- Pause on ambiguity: If acceptance criteria are unclear or prerequisites are missing, stop and ask a concise question before making assumptions.
- Change transparency: Keep commits minimal and focused. Include a brief description referencing the task ID, a summary of deltas, and how verification was performed. Avoid large, unreviewed leaps.
- Contract fidelity: Maintain selector contracts (docs/ui/selectors.md), brand tokens (docs/ui/tokens.json), and accessibility guidance. Never silently change these contracts.
- Security & secrets: Never log or expose secrets. Keep provider calls on the server only.
