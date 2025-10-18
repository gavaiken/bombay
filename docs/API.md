API Contract Overview

All API endpoints are implemented as Next.js API route handlers. Every endpoint requires authentication – the user must be logged in via the Google OAuth session (HTTP-only session cookie is used). If a request is made without a valid session, the API will respond with an HTTP 401 Unauthorized and an error message.

The API follows REST semantics for thread and message management. The base URL is the deployment domain (e.g., https://bombay.chat) with the following routes (all prefixed by /api):

- GET /api/threads – Retrieve the list of chat threads for the authenticated user. Returns a JSON array of thread objects.
- POST /api/threads – Create a new chat thread. Expects JSON body with an optional title and optional activeModel. Returns the created thread object.
- PATCH /api/threads/:id – Update an existing thread’s metadata. Currently used to switch the thread’s active model. Expects JSON body with activeModel (the new model id). Returns the updated thread object.
- GET /api/scopes – Returns available scopes registry; when passed ?threadId, also returns that thread’s activeScopeKeys and consent defaults (feature-flag gated).
- POST /api/threads/:id/scopes – Sets the thread’s activeScopeKeys (feature-flag gated). Validates keys and requires consent for sensitive scopes.
- POST /api/threads/:id/scopes/consent – Records consent for a sensitive scope on a thread (feature-flag gated).
- GET /api/messages?threadId=<id> – Retrieve all messages in a given thread. The threadId is provided as a query parameter. Returns a JSON array of message objects (conversation history) for that thread.
- POST /api/messages – Send a new user message and receive the assistant’s streaming response. This endpoint uses Server-Sent Events (SSE) to progressively deliver the assistant's reply. Expects a JSON body with threadId (the target thread) and content (the user’s message text). The response is an SSE stream rather than a standard JSON object.
  - Test-only validation path: appending `?mode=json` to this endpoint will return a non-streaming JSON response for tests. This path is gated and returns HTTP 400 in development and production (NODE_ENV !== 'test').

All request payloads and responses are strictly validated using Zod schemas on the server. If validation fails (e.g., required fields missing or invalid types), the API returns 400 Bad Request with an error response (see Error Handling below). Likewise, any internal server errors will result in a 500 Internal Server Error with an error response.

Data Models

The API uses the following data models (as defined in the database schema) for its inputs and outputs:

- Thread: Each chat thread has an id, a title (nullable), an activeModel (the currently selected model for that thread), timestamps (createdAt, updatedAt), and a foreign key userId linking to its owner.
- Message: Each chat message has an id, the associated threadId, a role (one of system, user, assistant), the contentText of the message, and for assistant messages, metadata fields: provider (e.g. "openai" or "anthropic"), model (e.g. "openai:gpt-4"), and usageJson (a JSON object with token usage stats). Timestamps are included (createdAt).

These models shape the API responses. For example, the GET endpoints return arrays of Threads or Messages in JSON form. An example thread object JSON looks like:

{
  "id": "clab5u9zi0000l8y37nqusgf3",
  "title": "My Chat Topic",
  "activeModel": "openai:gpt-4",
  "createdAt": "2025-10-01T12:00:00.000Z",
  "updatedAt": "2025-10-10T09:30:00.000Z"
}

And an example message object:

{
  "id": "clab5vcgl0002l8y3ac9f8fgh",
  "threadId": "clab5u9zi0000l8y37nqusgf3",
  "role": "assistant",
  "contentText": "Hello! How can I help you today?",
  "provider": "openai",
  "model": "openai:gpt-4",
  "usage": { "input_tokens": 12, "output_tokens": 18 },
  "createdAt": "2025-10-10T09:31:00.000Z"
}

(Here usage is derived from the stored usageJson.) In this case, the assistant’s message content and token usage are shown. User messages would have "role": "user", and typically no provider/model/usage fields (those are null or omitted for user roles).

Zod Schema Definitions

Below are the Zod schemas (TypeScript) that define the contract for requests and responses:

import { z } from 'zod';

// Thread schema as returned in responses
export const ThreadSchema = z.object({
  id: z.string().cuid(),
  title: z.string().nullable(),
  activeModel: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export const ThreadListSchema = z.array(ThreadSchema);

// Message schema as returned in responses
export const MessageSchema = z.object({
  id: z.string().cuid(),
  threadId: z.string().cuid(),
  role: z.enum(['system','user','assistant']),
  contentText: z.string(),
  provider: z.string().optional().nullable(),  // only set for assistant
  model: z.string().optional().nullable(),     // only set for assistant
  usage: z.object({ 
    input_tokens: z.number().int(), 
    output_tokens: z.number().int() 
  }).optional(),
  createdAt: z.string().datetime()
});
export const MessageListSchema = z.array(MessageSchema);

// Request schemas
export const CreateThreadSchema = z.object({
  title: z.string().optional(),
  activeModel: z.string().optional()
});
export const UpdateThreadSchema = z.object({
  activeModel: z.string()
});
export const SendMessageSchema = z.object({
  threadId: z.string().cuid(),
  content: z.string().min(1)
});

The CreateThreadSchema defines the JSON body for creating a thread (both fields optional).

The UpdateThreadSchema defines the body for switching a thread’s model (must include a model identifier).

The SendMessageSchema defines the body for sending a message (must include a valid threadId and a non-empty content string).

All incoming request bodies are validated against these schemas. For response data, the handlers ensure they return data matching the ThreadSchema or MessageSchema structures above.

Scopes Endpoints (Feature-flag gated)

When NEXT_PUBLIC_SCOPES_ENABLED is on, the following endpoints are available:

- GET /api/scopes[?threadId=<id>] – Returns the scope registry and optionally the thread’s scope state and consent map.
- POST /api/threads/:id/scopes – Update a thread’s activeScopeKeys (validates keys; requires consent for sensitive scopes).
- POST /api/threads/:id/scopes/consent – Record consent (or revocation) for a sensitive scope.

Examples:

GET registry only

```bash
curl -H "Cookie: session=..." https://bombay.chat/api/scopes
```

Response:

```json
{
  "registry": [
    { "key": "profile", "name": "Profile", "sensitive": true },
    { "key": "work", "name": "Work", "sensitive": false },
    { "key": "personal", "name": "Personal", "sensitive": false },
    { "key": "health", "name": "Health", "sensitive": true }
  ]
}
```

GET registry + thread state

```bash
curl -H "Cookie: session=..." "https://bombay.chat/api/scopes?threadId=clx123"
```

Response:

```json
{
  "registry": [ /* as above */ ],
  "thread": { "id": "clx123", "activeScopeKeys": ["work"] },
  "consents": { "profile": false, "health": false }
}
```

Enable scopes (non-sensitive only)

```bash
curl -X POST -H 'Content-Type: application/json' -H "Cookie: session=..." \
  -d '{"activeScopeKeys":["work","personal"]}' \
  https://bombay.chat/api/threads/clx123/scopes
```

Consent for a sensitive scope

```bash
curl -X POST -H 'Content-Type: application/json' -H "Cookie: session=..." \
  -d '{"scopeKey":"health","consent":true}' \
  https://bombay.chat/api/threads/clx123/scopes/consent
```

Then enable including sensitive scope

```bash
curl -X POST -H 'Content-Type: application/json' -H "Cookie: session=..." \
  -d '{"activeScopeKeys":["work","health"]}' \
  https://bombay.chat/api/threads/clx123/scopes
```

Notes:
- When the flag is disabled, these endpoints return 404 and threads omit activeScopeKeys.
- SSE done events include `usedScopes: []` reflecting scopes actually used for recall.

Server-Sent Events (Streaming Responses)

The POST /api/messages endpoint implements a streaming response using Server-Sent Events. Upon receiving a valid SendMessageSchema request (which represents a new user message), the server will begin sending SSE events that contain the assistant’s reply incrementally. The SSE stream uses UTF-8 encoded text/event-stream format. Three event types are used in the stream:

- event: delta – A partial message fragment from the assistant. The server sends many of these events as the AI's message is generated. Each “delta” event’s data: field is a string containing the next segment of the assistant’s answer (it may be a word, sentence fragment, or token). The client appends these chunks in order to build the full response.
- event: done – Indicates the assistant’s reply is complete. The data: of this event contains a JSON object with meta-information: {"messageId": "...", "usage": {"input_tokens": X, "output_tokens": Y}, "usedScopes": []}. Here messageId is the ID of the newly created assistant message in the database, usage includes the token counts, and usedScopes is an array of scope keys used (empty if none). The server sends this event as the final one in the stream (after sending this, it will close the SSE connection).
- event: error – Indicates an error occurred during generation. If an error happens, the server will send an error event with a data payload in the standard envelope shape: `{ "error": { "code": "PROVIDER_ERROR", "message": "An error occurred. Please try again.", "details": null } }` and then close the stream.

On the client side, an EventSource or fetch-stream can be used to handle these events. In our implementation, when a user sends a message, the app opens an EventSource to /api/messages?threadId=...&content=... (or uses a fetch with streaming) to receive these SSE events. The UI will append each delta text to the chat, and on done it finalizes the message. If an error event arrives, the UI will display the error message in the chat.

Error Handling

Error responses from the API follow a simple JSON structure. For non-SSE endpoints (standard REST calls), errors are returned with an appropriate HTTP status code and a JSON body:

{ "error": "Description of the error." }

Examples:

- A 401 Unauthorized will return {"error": "Not authenticated"} if the user’s session is missing or invalid.
- A 400 Bad Request will return {"error": "Invalid request data"} (with possibly more detail) if Zod validation fails or required parameters are missing.
- A 404 Not Found may be returned if a requested resource ID does not exist or doesn’t belong to the user (for instance, a thread ID that’s not found).
- A 500 Internal Server Error will return {"error": "Internal server error"} for unhandled exceptions.

The SSE endpoint is a bit different: if an error occurs after streaming has started, the server will emit an error SSE event as described above (the HTTP status for the SSE response might still be 200 in that case, since the error is conveyed within the stream). If the error happens before any SSE data is sent (e.g., an authentication failure or validation error on the request), the server will respond with a normal HTTP error status and no stream (the client will receive the HTTP error response instead of an SSE connection).

All errors are handled in a way to avoid leaking sensitive info. For instance, if the OpenAI API returns an error, the API might map it to a generic message for the user (“The assistant is currently unavailable. Please try again.”). Detailed error information is logged on the server side for debugging, but not exposed to the client.

Notes

- Authentication: As noted, all API routes are protected. Internally, we use NextAuth’s session middleware to ensure requests have a valid session. A helper fetches the userId from the session and queries only that user’s data. There is no concept of multi-user access to the same thread – each thread’s IDs are user-specific and verified against the session.
- Input Size Limits: The server imposes some limits on input payloads (for example, maximum length of a message content) to prevent abuse or extremely large inputs. These limits are enforced by Zod schemas (e.g. the content must be at least 1 character and could be capped with a .max() if needed). This prevents excessively large requests from impacting performance.
- Streaming Details: The SSE implementation uses Node’s streaming response capabilities. We flush events immediately as they are received from the AI providers. The client should reconnect or handle gracefully if the connection is interrupted. We support client-initiated cancellation (closing the EventSource), which aborts the provider API call via an AbortController.
- Examples: For sample requests and SSE flow, see the Appendix in the Design document which provides example payloads and event sequences.


Error Envelope & Rules

All JSON errors use a standard envelope shape and enumerated codes. For pre-stream errors, respond with the relevant HTTP code and this payload:

```json
{ "error": { "code": "AUTH_REQUIRED|VALIDATION_ERROR|NOT_FOUND|RATE_LIMITED|PROVIDER_ERROR|INTERNAL_ERROR", "message": "human-readable", "details": null } }
```

Rules

- Validate request bodies using Zod. On failure, return 400 VALIDATION_ERROR.
- Scope all queries/mutations to the authenticated userId; return 404 NOT_FOUND for foreign resources.
- For SSE, emit `delta` chunks and a terminal `done` (with usage) or `error` event. No heartbeat required.
- Never surface raw provider errors; map to PROVIDER_ERROR with a generic message and log details server-side.
