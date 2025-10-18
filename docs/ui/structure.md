# UI Structure & Layout Map

The primary UI entry point is [`app/page.tsx`](../../app/page.tsx), which renders the client-side [`Chat`](../../app/components/Chat.tsx) component. All interactive layout, selectors, and accessibility contracts originate from this file.

## DOM hierarchy

```
<div data-testid="app-shell">
  <aside data-testid="thread-tray" aria-label="Chat threads">
    <button data-testid="new-thread" />
    <div data-testid="error-state" /> | <div data-testid="loading-state" /> | <div data-testid="empty-state" />
    <ul data-testid="thread-list">
      <li data-testid="thread-item" data-thread-id data-active?>
        <button />
        <button aria-label="Rename thread" />
      </li>
    </ul>
  </aside>
  <main data-testid="chat-pane" role="main">
    <header>
      <button aria-controls="thread-tray" aria-expanded />
      <h1 data-testid="thread-title" />
      <select data-testid="model-switcher" aria-label="Model selector" />
    </header>
    <div data-testid="scope-toggle-bar">
      <button data-testid="scope-chip-<key>" aria-pressed />
    </div>
    <section data-testid="transcript" role="log" aria-live="polite">
      <div data-testid="error-state" role="alert" />
      <div data-testid="loading-state" />
      <div data-testid="empty-state" />
      <div data-testid="message" data-message-id data-role>
        <div data-testid="scope-annotation" />
      </div>
      <div data-testid="typing-indicator" />
    </section>
    <form data-testid="composer">
      <textarea data-testid="composer-input" />
      <button data-testid="composer-send" />
    </form>
  </main>
</div>
```

Refer to [docs/ui/selectors.md](./selectors.md) for the exhaustive selector contract and accessibility annotations that E2E tests rely upon.

## State & data flow

| Concern | Local state | Source of truth | Notes |
| --- | --- | --- | --- |
| Thread list | `threads`, `isLoadingThreads`, `threadsError` | `/api/threads` via `loadThreads()` | Populated on mount; new local IDs prefixed with `t_` until persisted. |
| Active thread | `currentThreadId`, `currentThreadTitle` | Selected from `threads` | Updated by `onSelectThread()`, `newThread()`, and `renameThread()`. |
| Model selection | `model` | `<select data-testid="model-switcher">` + `/api/threads/:id` | `onChangeModel()` patches the active thread when persisted. |
| Scopes | `scopesRegistry`, `activeScopeKeys`, `scopeConsents` | `/api/scopes` + `/api/threads/:id/scopes` | Chips rendered dynamically; consent captured via `window.confirm`. |
| Messages | `messages`, `isLoadingMessages`, `messagesError` | `/api/messages` + SSE stream | `reloadMessages()` fetches history; `sendCurrentInput()` streams assistant responses. |
| Typing indicator | `typing` | Derived from send flow | Minimum display duration of 150 ms before hiding. |
| Composer input | `input` | `<textarea data-testid="composer-input">` | Submit handled by `onSend()` / `sendCurrentInput()`. |
| Layout toggles | `isTrayOpen`, `isSidebarVisible` | Responsive behaviour via `toggleSidebar()` | `window.matchMedia('(max-width: 767px)')` decides tray vs. sidebar. |

## Accessibility & shortcuts

- Roles and labels align with [selectors guidance](./selectors.md#accessibility-roles--labels-append).
- Keyboard shortcuts registered in `Chat.tsx`:
  - ⌘/Ctrl + N → `newThread()` and focus composer.
  - ⌘/Ctrl + Shift + S → `toggleSidebar()`.
  - `Escape` → closes the mobile tray.
- Focus management: `composerRef` receives focus after creating threads; transcript auto-scrolls using `transcriptRef`.

## Project hierarchy for UI work

- **Primary component**: [`app/components/Chat.tsx`](../../app/components/Chat.tsx)
- **Entry point**: [`app/page.tsx`](../../app/page.tsx)
- **Selector contract**: [docs/ui/selectors.md](./selectors.md)
- **Design tokens & brand**: [docs/ui/tokens.json](../ui/tokens.json), [docs/brand.md](../brand.md)

When updating UI behaviour, prefer linking to the source component rather than duplicating logic here. This document is intended to help future agents discover the relevant code paths quickly while keeping selectors in sync with automation.
