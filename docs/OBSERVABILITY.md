# Observability

This document collects everything engineers (and AI agents) need to know about
how we capture logs, metrics, and debugging signals for the production and
preview environments. It complements the `README.md`, which stays focused on
development setup. If the observability footprint grows much larger we can fold
the highlights into the README and keep this file for deeper operational
details.

---

## Better Stack / Logtail logging

### Runtime behaviour

The application emits structured JSON log events through `lib/logger.ts`. Each
call writes to stdout/stderr (so logs always exist locally or on Vercel) and, if
a Better Stack/Logtail source token is configured, forwards the payload to
`https://in.logtail.com`.

| Function | Typical usage |
| --- | --- |
| `logInfo(message, context?)` | High-level lifecycle messages, sampled if noisy |
| `logWarn(message, context?)` | Recoverable issues that deserve attention |
| `logError(message, context?)` | Failures – always emitted |
| `logEvent(event, level?, context?)` | Structured business events (see below) |

All helper functions accept an optional `context` object so downstream sinks can
filter on fields like `userId`, `threadId`, `provider`, or `model`.

### Required environment variables

| Variable | Purpose |
| --- | --- |
| `LOGTAIL_SOURCE_TOKEN` | Preferred env var for the Logtail/BSS source token. |
| `BETTERSTACK_SOURCE_TOKEN` | Fallback name if the deployment already uses the Better Stack prefix. |
| `BETTERSTACK_CONNECT_HOST` | Host for the Better Stack Connect (ClickHouse) endpoint used by `scripts/bs_logs.py`. |
| `BETTERSTACK_CONNECT_USER` | Basic-auth user for Connect. |
| `BETTERSTACK_CONNECT_PASS` | Basic-auth password for Connect. |
| `BETTERSTACK_TABLE_PREFIX` | Prefix for the remote/table names in Better Stack. |

These values should live in the appropriate `.env` files (or Vercel project
environment variables). Tokens are automatically trimmed of stray whitespace or
newlines before being used.

### Inspecting logs with `scripts/bs_logs.py`

`scripts/bs_logs.py` is a thin client around the Better Stack Connect API. Key
flags:

```bash
# tail the latest 100 production lambda logs at warning level or above
python scripts/bs_logs.py --limit 100 --only-source lambda --min-level warning --env production

# fetch all logs within a window (omit --limit) and emit JSON for scripting
python scripts/bs_logs.py --since "2025-01-01T00:00:00Z" --before "2025-01-01T06:00:00Z" --json

# open the built-in manual for complete usage documentation
python scripts/bs_logs.py --man
```

The script applies most filters client-side, so it over-fetches when a filter is
present to honour `--limit`. It exits with an actionable error if any of the
required `BETTERSTACK_*` variables are missing.

---

## Structured events (`lib/logger.ts`)

`logEvent` enriches logs with consistent `event` identifiers so dashboards can
group related occurrences. The `Events` export enumerates the canonical values:

- `user.signed_in`, `user.signed_out`
- `thread.created`, `thread.updated`
- `message.sent`, `message.received`
- `provider.error`, `api.error`, `rate.limited`
- `context.truncated`
- Scopes features: `scope.toggled`, `scope.consent`, `recall.used`

Each event stores a timestamp, log level, and any supplied context (user, thread
or provider identifiers, model names, latency/token counts, user agent, IP,
etc.). Because the events are JSON objects, Better Stack filters and dashboards
can slice by these attributes without schema migrations.

---

## In-memory metrics (`lib/metrics.ts`)

Metrics complement logs for aggregate health checks. The module tracks counts in
memory (resetting on deploy) and merges them with persistent aggregates from
Prisma when `getUsageMetrics()` runs.

Key counters:

- **Engagement** – unique daily users (`trackActiveUser`), thread creation, and
  message volume.
- **Model usage** – per-model invocation counts via `trackModelUsage`.
- **Latency** – provider response time averages today (TTFT wiring exists via
  `trackTTFT`, but aggregation still needs to be hooked up in
  `updateInMemoryMetrics`).
- **Token accounting** – total input/output tokens across responses.
- **Scopes features** – number of toggles, per-thread active scope counts,
  percentage of zero-scope threads, and recall usage.

Helper methods encapsulate the event names so callers do not need to manipulate
the store directly. Failures are swallowed with a console warning to prevent
metrics collection from affecting user flows.

---

## Accessing production signals

- **Better Stack Logs** – Use the hosted Logtail UI for real-time tailing, saved
  searches, and alerts. Filters recognise the structured context fields emitted
  by `lib/logger.ts`. The Better Stack Connect endpoint (via
  `scripts/bs_logs.py`) is the CLI-friendly path for ad-hoc queries.
- **Dashboards** – The Better Stack dashboard "Chat Operations" (link shared in
  the team runbook) charts event counts and latency percentiles sourced from the
  same structured logs. Metrics from `lib/metrics.ts` are currently surfaced via
  an internal admin page; if we promote them to an external dashboard, update
  this section with the URL and owner.

If you need historical investigations beyond the in-memory window, rely on the
Better Stack retention period. Structured events include `threadId` and `userId`
so you can pivot around a conversation quickly.

---

## Where should this live?

For now, keeping a dedicated `docs/OBSERVABILITY.md` is useful: it is scoped to
operational responders, and AI agents can discover it alongside other `docs/*`
materials. If we notice duplication with the README, consider copying a short
"Operational Runbook" blurb into `README.md` that links back here, or replacing
this file with inline module-level doc comments (e.g. JSDoc on `lib/logger.ts`)
once the logging surface stabilises. Until then, this standalone reference keeps
runtime guidance easy to find without overloading the onboarding guide.
