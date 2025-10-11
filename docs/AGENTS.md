# bombay – AI Agent Execution Guide

This repo uses an AI coding agent (e.g., Claude Code). The agent must:

1) Read docs/Tasks.md and take the next unchecked task only.
2) Use docs/PRD.md and docs/Design.md as the source of truth.
3) Implement exactly what the task asks; do not bundle tasks.
4) Verify the task’s acceptance criteria, commit, push, and stop.
5) Wait for the human operator to check the box in Tasks.md before proceeding.

## Guardrails
- Never commit secrets. Only read env names from docs/ENV.md.
- Do not change `data-testid` values or brand token keys.
- Follow API contracts in docs/API.md and DB schema in docs/Database.md.
- For HTTP errors, use the error envelope in docs/API.md.
- Provider calls are server-side only; never expose API keys to the browser.

## Development context
- UI structure & selectors: docs/ui/structure.md, docs/ui/selectors.md.
- Brand rules: docs/brand.md and docs/ui/tokens.json.
- Testing plan: docs/Testing.md.
- Deployment: docs/Deployment.md.

Operating loop: “Read task → implement → verify → commit → push → pause”.
