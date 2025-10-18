# Chat Component Inventory

The current UI is implemented as a single client component at [`app/components/Chat.tsx`](../../app/components/Chat.tsx) that orchestrates layout, data fetching, and user interaction. `app/page.tsx` simply renders `<Chat />`, so this file is the authoritative reference for UI behaviour.

## Top-level layout

| Section | DOM root | Key state/hooks | Notes |
| --- | --- | --- | --- |
| Application shell | `<div data-testid="app-shell">` | `isSidebarVisible`, `isTrayOpen` | Responsive grid that exposes the thread tray on desktop and a slide-over tray on mobile. |
| Thread tray | `<aside data-testid="thread-tray">` | `threads`, `currentThreadId`, `isLoadingThreads`, `threadsError` | Sidebar listing conversations, including loading, empty, and error states. |
| Chat pane | `<main data-testid="chat-pane">` | `currentThreadTitle`, `model`, `scopesRegistry`, `messages`, `typing`, `input` | Houses the header, scope bar, transcript, and composer. |

Refer to [docs/ui/structure.md](./structure.md) for the DOM outline, and to [docs/ui/selectors.md](./selectors.md) for the canonical selector contract.

## Thread tray (`data-testid="thread-tray"`)

- **Data sources**: Threads are loaded via `loadThreads()` (GET `/api/threads`) and updated locally when creating (`newThread()`), renaming (`renameThread()`), or selecting (`onSelectThread()`) a thread.
- **State slices**: `threads`, `currentThreadId`, `currentThreadTitle`, `isLoadingThreads`, `threadsError`, `isTrayOpen`, `isSidebarVisible`.
- **UI states**:
  - Loading skeleton (`data-testid="loading-state"`).
  - Error banner (`data-testid="error-state"`, `role="alert"`) with retry.
  - Empty copy (`data-testid="empty-state"`) when no saved threads exist.
- **List items**: Rendered inside `<ul data-testid="thread-list">`.
  - Each entry uses `<li data-testid="thread-item" data-thread-id="..." data-active>`.
  - Rename control calls `renameThread()` and preserves the active title.
- **Actions**:
  - `data-testid="new-thread"` button generates a local stub thread (`t_<timestamp>`) and focuses the composer.
  - Mobile close button toggles `isTrayOpen` via `toggleSidebar()`.

## Header & model switcher

- **DOM**: Located at the top of the chat pane header (`<header>` inside `data-testid="chat-pane"`).
- **Primary elements**:
  - `<h1 data-testid="thread-title">` shows `currentThreadTitle` (falls back to `"bombay"`).
  - `<select data-testid="model-switcher">` controls the `model` state.
- **Behaviour**:
  - `onChangeModel()` updates local state and persists to `/api/threads/:id` when the thread exists server-side.
  - Keyboard shortcuts defined in `useEffect` support creating chats (⌘/Ctrl+N) and toggling the sidebar (⌘/Ctrl+Shift+S).
- **Accessibility**: `aria-label="Model selector"`, header button toggles the tray on mobile via `aria-controls="thread-tray"`/`aria-expanded`.

## Scope toggle bar (`data-testid="scope-toggle-bar"`)

- **State slices**: `scopesRegistry`, `activeScopeKeys`, `scopeConsents`.
- **Data loading**: `loadScopes(threadId)` fetches `/api/scopes` when switching threads, storing registry metadata and consent status.
- **Interaction**: `toggleScope(key, enable)` manages active scope keys, prompting for consent when needed and POSTing to `/api/threads/:id/scopes`.
- **Selectors**: Individual chips render with `data-testid="scope-chip-${key}"` and toggle `aria-pressed`.
- **Annotations**: Assistant messages display a `<div data-testid="scope-annotation">` summarising any scopes used; includes buttons to remove scopes mid-conversation.

## Transcript (`data-testid="transcript"`)

- **State slices**: `messages`, `typing`, `messagesError`, `isLoadingMessages`.
- **Data flow**:
  - `reloadMessages()` fetches history for the active thread.
  - `sendCurrentInput()` posts to `/api/messages` and streams responses via `parseSSEChunk()`; assistant responses are accumulated in `messages`.
  - Typing status controlled by `typing` with a minimum display duration.
- **UI states**:
  - Loading skeleton (`data-testid="loading-state"`).
  - Error banner (`data-testid="error-state"`, `role="alert"`) with retry.
  - Empty welcome state when there are no saved threads or when an active thread has no messages yet.
- **Messages**:
  - Rendered as `<div data-testid="message" data-message-id data-role>` with role-specific styling and emojis.
  - Assistant items may include scope annotations (see above).
  - Typing indicator appended when `typing === true` via `<div data-testid="typing-indicator">`.
- **Accessibility**: Transcript uses `role="log"`, `aria-live="polite"` per [selectors guidance](./selectors.md#accessibility-roles--labels-append).

## Composer (`data-testid="composer"`)

- **State slices**: `input`, `typing`, `currentThreadId`.
- **Behaviour**:
  - `onSend()` handles submit events by calling `sendCurrentInput()`.
  - `onComposerKeyDown()` allows Enter to send messages (Shift+Enter for newline).
  - `ensureThread()` ensures a persisted thread exists before sending, POSTing to `/api/threads` when required.
- **Inputs**:
  - `<textarea data-testid="composer-input">` reflects `input` state and disables while `typing`.
  - `<button data-testid="composer-send">` is disabled if empty or while `typing`.
- **Accessibility**: Includes a visually hidden `<label>` for the textarea (“Message”).

## Supporting utilities

- **Scrolling**: `transcriptRef` auto-scrolls on new messages or thread changes; `composerRef` receives focus after creating a new thread.
- **Responsive layout**: `toggleSidebar()` inspects `window.matchMedia('(max-width: 767px)')` to switch between mobile tray and desktop sidebar visibility.
- **Error handling**: `threadsError` and `messagesError` share UI treatment but are kept separate to isolate failure modes.

For selector coverage and accessibility contracts, always cross-reference [docs/ui/selectors.md](./selectors.md).
