Supported AI Providers and Models

Bombay.chat is designed to work with multiple AI model providers. In the MVP, we have integrated OpenAI and Anthropic as the two providers. The available models are aligned with our fixtures and UI:

- openai:gpt-4o — primary OpenAI model (fast, high quality)
- openai:gpt-4o-mini — smaller, faster, cost-effective
- anthropic:claude-3-5-sonnet — advanced Claude 3.5 model
- anthropic:claude-3-5-haiku — lighter, faster Claude 3.5

These identifiers are stored in the database (Thread.activeModel and Message.model) and used to route to the correct provider. The format is "provider:model".

Provider Adapter Interface

We abstract differences with an adapter interface:

export interface ProviderAdapter {
  name: 'openai' | 'anthropic';
  chat(opts: {
    model: string;             // e.g. "gpt-4o" or "claude-3-5-sonnet"
    system?: string;           // optional system prompt
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
    stream: true;
    abortSignal?: AbortSignal;
  }): AsyncIterable<string>;
}

Routing & Prompt Assembly

- Route by prefix (`openai`, `anthropic`) from the `<provider>:<model>` id.
- If a system message exists, send it first; then historical user/assistant turns; then the new user message.
- Truncation policy (MVP): estimate tokens, drop oldest pairs to leave ~15% headroom.

Streaming & Usage

- Yield provider SDK stream chunks as SSE `delta` events.
- On finish, include usage (if available) and persist to `usageJson`.
- On abort/error, stop upstream request and emit SSE `error`.

Retries & Errors

- One retry with jitter on 429/5xx; if still failing, map to API `PROVIDER_ERROR`.
- Never forward raw provider error messages to the client.

SDK Notes

- OpenAI: official Node SDK; server-only with `OPENAI_API_KEY`.
- Anthropic: official TS SDK `@anthropic-ai/sdk`; server-only with `ANTHROPIC_API_KEY`.

Model Limits (reference)

- openai:gpt-4o — ~128k context (varies by account); use conservative truncation.
- openai:gpt-4o-mini — smaller context, faster.
- anthropic:claude-3-5-sonnet — large context, higher quality.
- anthropic:claude-3-5-haiku — large context, faster/cheaper.

All IDs are centralized; update the allowlist and UI options together when adding/removing models.
