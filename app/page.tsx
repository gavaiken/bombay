export default function Page() {
  return (
    <div data-testid="app-shell" className="grid grid-cols-[280px_1fr] h-screen">
      <aside data-testid="thread-tray" className="border-r overflow-y-auto" aria-label="Chat threads">
        <button data-testid="new-thread">New Chat</button>
        <ul data-testid="thread-list">
          <li data-testid="thread-item" data-active="true">SEO plan</li>
          <li data-testid="thread-item">Refactor help</li>
        </ul>
      </aside>
      <main data-testid="chat-pane" role="main" className="flex flex-col">
        <header className="flex items-center justify-between border-b p-3">
          <h1 data-testid="thread-title">SEO plan</h1>
          <select data-testid="model-switcher" aria-label="Model selector">
            <option value="openai:gpt-4o">OpenAI — gpt-4o</option>
            <option value="anthropic:claude-3-5-sonnet">Claude — 3.5 Sonnet</option>
          </select>
        </header>
        <section data-testid="transcript" role="log" aria-live="polite" className="flex-1 overflow-y-auto p-4">
          <div data-testid="message" data-role="user">help me plan a sitemap</div>
          <div data-testid="message" data-role="assistant">Sure—what’s your domain?</div>
          <div data-testid="typing-indicator" hidden>Assistant is typing…</div>
        </section>
        <form data-testid="composer" className="border-t p-3">
          <label className="sr-only" htmlFor="composer">Message</label>
          <textarea id="composer" data-testid="composer-input" rows={2} placeholder="Message…" />
          <button data-testid="composer-send" type="submit">Send</button>
        </form>
        <div data-testid="brand-swatch" className="h-6 w-24 rounded-md" style={{ background: 'var(--gradient-brand)' }} />
      </main>
    </div>
  )
}
