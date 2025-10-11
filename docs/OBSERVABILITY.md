# Observability (MVP)

## What we log (server)
- requestId, userId, threadId
- route, status, duration_ms
- provider, model
- usage: input_tokens, output_tokens (when available)
- error.code (if any)

## Where
- Console logs (Vercel captures). Future: Sentry/Logflare.

## Minimal metrics
- Messages per day per provider/model
- Avg latency per provider/model
- Error rate by code

## Sampling
- Info logs sampled (e.g., 1:10) if noisy; errors always logged.

## PII
- Never log message content; only metadata & counts.
