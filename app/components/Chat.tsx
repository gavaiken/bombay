"use client"

import { useEffect, useMemo, useRef, useState } from 'react'

type Thread = { id: string; title: string; activeModel: string; updatedAt: string }
type Message = { id: string; role: 'user'|'assistant'|'system'; contentText: string }

type SSEEvent = { event: string; data: string }

export default function Chat() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null)
  const [currentThreadTitle, setCurrentThreadTitle] = useState<string>('')
  const [model, setModel] = useState<string>('openai:gpt-4o')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)

  // UI state for loading/error/empty
  const [isLoadingThreads, setIsLoadingThreads] = useState(true)
  const [threadsError, setThreadsError] = useState<string | null>(null)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [messagesError, setMessagesError] = useState<string | null>(null)

  // Mobile tray
  const [isTrayOpen, setIsTrayOpen] = useState(false)
  // Desktop sidebar visibility
  const [isSidebarVisible, setIsSidebarVisible] = useState(true)

  function toggleSidebar() {
    const isMobile = window.matchMedia('(max-width: 767px)').matches
    if (isMobile) {
      setIsTrayOpen((v) => !v)
    } else {
      setIsSidebarVisible((v) => !v)
    }
  }

  const transcriptRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLTextAreaElement>(null)

  // Load threads
  async function loadThreads() {
    try {
      setIsLoadingThreads(true)
      setThreadsError(null)
      const res = await fetch('/api/threads', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load threads')
      const data: Thread[] = await res.json()
      setThreads(data)
      if (data.length) {
        setCurrentThreadId(data[0].id)
        setCurrentThreadTitle(data[0].title || 'Untitled')
        setModel(data[0].activeModel || 'openai:gpt-4o')
      } else {
        setCurrentThreadId(null)
        setCurrentThreadTitle('')
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load threads'
      setThreadsError(msg)
    } finally {
      setIsLoadingThreads(false)
    }
  }

  useEffect(() => {
    loadThreads()
    // keyboard shortcuts
    function onKey(e: KeyboardEvent) {
      const isMac = navigator.platform.toLowerCase().includes('mac')
      const mod = isMac ? e.metaKey : e.ctrlKey
      const shift = e.shiftKey
      const key = e.key.toLowerCase()
      // New chat: Cmd/Ctrl+N
      if (mod && !shift && key === 'n') {
        e.preventDefault()
        newThread()
        setTimeout(() => composerRef.current?.focus(), 0)
        return
      }
      // Toggle sidebar: Cmd/Ctrl+Shift+S
      if (mod && shift && key === 's') {
        e.preventDefault()
        toggleSidebar()
        return
      }
      if (key === 'escape') {
        setIsTrayOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function reloadMessages() {
    if (!currentThreadId) return
    if (currentThreadId.startsWith('t_')) {
      setMessagesError(null)
      setMessages([])
      return
    }
    if (currentThreadId.startsWith('t_')) {
      setMessagesError(null)
      setMessages([])
      return
    }
    try {
      setIsLoadingMessages(true)
      setMessagesError(null)
      const url = `/api/messages?threadId=${encodeURIComponent(currentThreadId)}`
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load messages')
      const data = await res.json() as Array<{ id: string; role: 'user'|'assistant'|'system'; content?: string; contentText?: string }>
      const mapped: Message[] = data.map((m) => ({ id: m.id, role: m.role, contentText: m.content ?? m.contentText ?? '' }))
      setMessages(mapped)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load messages'
      setMessagesError(msg)
      setMessages([])
    } finally {
      setIsLoadingMessages(false)
    }
  }

  // Load messages when thread changes
  useEffect(() => {
    if (!currentThreadId) return
    if (currentThreadId.startsWith('t_')) {
      setMessagesError(null)
      setMessages([])
      return
    }
    reloadMessages()
  }, [currentThreadId])

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [messages, typing])

  async function onSelectThread(id: string) {
    setCurrentThreadId(id)
    const t = threads.find((x) => x.id === id)
    setCurrentThreadTitle(t?.title || 'Untitled')
    setModel(t?.activeModel || model)
    setIsTrayOpen(false)
  }

  async function onChangeModel(next: string) {
    setModel(next)
    if (!currentThreadId) return
    await fetch(`/api/threads/${encodeURIComponent(currentThreadId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activeModel: next })
    })
  }

  function parseSSEChunk(buffer: string): SSEEvent[] {
    const events: SSEEvent[] = []
    const chunks = buffer.split('\n\n')
    for (const chunk of chunks) {
      const lines = chunk.split('\n')
      let event = ''
      let data = ''
      for (const line of lines) {
        if (line.startsWith('event:')) event = line.slice(6).trim()
        else if (line.startsWith('data:')) data = line.slice(5).trim()
      }
      if (event && data) events.push({ event, data })
    }
    return events
  }

  async function renameThread(id: string) {
    const t = threads.find(x => x.id === id)
    const current = t?.title || ''
    const next = window.prompt('Rename chat', current)
    if (!next || !next.trim()) return
    if (id.startsWith('t_')) {
      setThreads(prev => prev.map(x => x.id === id ? { ...x, title: next.trim() } : x))
      if (id === currentThreadId) setCurrentThreadTitle(next.trim())
      return
    }
    await fetch(`/api/threads/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: next.trim() })
    })
    setThreads(prev => prev.map(x => x.id === id ? { ...x, title: next.trim() } : x))
    if (id === currentThreadId) setCurrentThreadTitle(next.trim())
  }

  async function ensureThread(): Promise<string | null> {
    // If we already have a real server thread id, reuse it. Treat local stub ids (e.g., "t_...") as not real.
    if (currentThreadId && !currentThreadId.startsWith('t_')) return currentThreadId
    try {
      const res = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: currentThreadTitle || 'New chat' })
      })
      if (!res.ok) throw new Error('Failed to create thread')
      const t = await res.json()
      setThreads((prev) => [t, ...prev])
      setCurrentThreadId(t.id)
      setCurrentThreadTitle(t.title || 'Untitled')
      if (t.activeModel) setModel(t.activeModel)
      return t.id
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to create thread'
      setMessagesError(msg)
      return null
    }
  }

  async function sendCurrentInput() {
    const text = input.trim()
    if (!text) return

    // Ensure there is a real server thread before sending
    let threadId = currentThreadId as string | null
    if (!threadId || threadId.startsWith('t_')) {
      threadId = await ensureThread()
    }
    if (!threadId) return

    const userMsg: Message = { id: `u_${Date.now()}`, role: 'user', contentText: text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setTyping(true)
    const typingStartedAt = Date.now()
    const finishTyping = () => {
      const elapsed = Date.now() - typingStartedAt
      const remain = elapsed < 150 ? 150 - elapsed : 0
      setTimeout(() => setTyping(false), remain)
    }

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId, content: userMsg.contentText })
    })
    if (!res.body) {
      finishTyping()
      return
    }
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''
    let assistantText = ''
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const events = parseSSEChunk(buf)
      const lastSep = buf.lastIndexOf('\n\n')
      if (lastSep >= 0) buf = buf.slice(lastSep + 2)
      for (const ev of events) {
        if (ev.event === 'delta') {
          try {
            const piece = JSON.parse(ev.data)
            assistantText += piece
            setMessages((prev) => {
              const last = prev[prev.length - 1]
              if (last && last.role === 'assistant') {
                const clone = [...prev]
                clone[clone.length - 1] = { ...last, contentText: assistantText }
                return clone
              }
              return [...prev, { id: `a_${Date.now()}`, role: 'assistant', contentText: assistantText }]
            })
          } catch {}
        } else if (ev.event === 'done') {
          finishTyping()
        } else if (ev.event === 'error') {
          try {
            const payload = JSON.parse(ev.data) as { error?: { message?: string } }
            const msg = payload?.error?.message || 'Provider error. Please try again.'
            setMessagesError(msg)
          } catch {
            setMessagesError('Provider error. Please try again.')
          }
          finishTyping()
        }
      }
    }
  }

  async function onSend(e: React.FormEvent) {
    e.preventDefault()
    await sendCurrentInput()
  }

  function onComposerKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim()) void sendCurrentInput()
    }
  }

  function formatDateTime(dt: Date) {
    const y = dt.getFullYear()
    const m = String(dt.getMonth() + 1).padStart(2, '0')
    const d = String(dt.getDate()).padStart(2, '0')
    const h = dt.getHours()
    const am = h < 12
    const hour12 = h % 12 === 0 ? 12 : h % 12
    const min = String(dt.getMinutes()).padStart(2, '0')
    const ap = am ? 'AM' : 'PM'
    return `${y}-${m}-${d} ${hour12}:${min}${ap}`
  }

  function newThread() {
    const id = `t_${Date.now()}`
    const defaultTitle = formatDateTime(new Date())
    const t: Thread = { id, title: defaultTitle, activeModel: model, updatedAt: new Date().toISOString() }
    setThreads((prev) => [t, ...prev])
    setCurrentThreadId(id)
    setCurrentThreadTitle(t.title)
    setMessages([])
    setMessagesError(null)
    // Focus composer to meet UX acceptance
    setTimeout(() => composerRef.current?.focus(), 0)
  }


  return (
    <div
      data-testid="app-shell"
      className={`relative md:grid h-screen ${isSidebarVisible ? 'md:grid-cols-[280px_1fr]' : 'md:grid-cols-[0_1fr]'}`}
    >
      {/* Mobile overlay backdrop */}
      {isTrayOpen && (
        <button aria-label="Close threads" onClick={() => setIsTrayOpen(false)} className="fixed inset-0 bg-black/50 md:hidden z-40" />
      )}

      <aside
        id="thread-tray"
        data-testid="thread-tray"
        className={`border-r overflow-y-auto p-2 bg-panel z-50 ${isTrayOpen ? 'fixed inset-0 w-4/5 max-w-xs md:static' : 'hidden md:block'} ${isSidebarVisible ? 'md:opacity-100 md:pointer-events-auto' : 'md:opacity-0 md:pointer-events-none md:w-0 md:p-0 md:border-0'}`}
        aria-label="Chat threads"
        aria-busy={isLoadingThreads || undefined}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1" />
          <button
            data-testid="new-thread"
            className="mb-0 rounded-md border border-brand-500 text-brand-500 hover:bg-brand-100/10 focus:outline-none focus:ring-4 focus:ring-pink-400/40 px-2 py-1"
            onClick={newThread}
          >
            New Chat
          </button>
          <button className="md:hidden rounded-md border border-border px-2 py-1" aria-label="Close thread tray" onClick={() => setIsTrayOpen(false)}>Close</button>
        </div>

        {threadsError && (
          <div data-testid="error-state" role="alert" className="rounded-md border border-border bg-panel p-3 mb-2">
            <div className="mb-2">{threadsError}</div>
            <button className="rounded-md border border-border px-2 py-1" onClick={loadThreads}>Retry</button>
          </div>
        )}

        {isLoadingThreads && (
          <div data-testid="loading-state" className="space-y-2">
            <div className="h-4 w-3/4 bg-border rounded" />
            <div className="h-4 w-2/3 bg-border rounded" />
            <div className="h-4 w-1/2 bg-border rounded" />
          </div>
        )}

        {!isLoadingThreads && !threadsError && threads.length === 0 && (
          <div data-testid="empty-state" className="text-sm text-text/70">No conversations yet</div>
        )}

        <ul data-testid="thread-list" className="space-y-1">
          {threads.map((t) => (
            <li key={t.id} className="group flex items-center justify-between" data-testid="thread-item" data-thread-id={t.id} data-active={t.id === currentThreadId || undefined}>
              <button onClick={() => onSelectThread(t.id)} className="flex-1 text-left truncate">
                {t.title}
              </button>
              <button
                aria-label="Rename thread"
                title="Rename"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-xs border border-border rounded px-1 ml-2"
                onClick={(e) => { e.stopPropagation(); void renameThread(t.id) }}
              >
                ✏️
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <main data-testid="chat-pane" role="main" className="flex flex-col">
        <header className="flex items-center justify-between border-b p-3">
          <div className="flex items-center gap-2">
            <button className="md:hidden rounded-md border border-border px-2 py-1" aria-controls="thread-tray" aria-expanded={isTrayOpen} onClick={() => setIsTrayOpen(true)}>
              Threads
            </button>
            <h1 data-testid="thread-title">{currentThreadTitle || 'bombay'}</h1>
          </div>
          <select
            data-testid="model-switcher"
            aria-label="Model selector"
            className="bg-panel text-brand-500 border border-border hover:border-brand-500 focus:outline-none focus:ring-4 focus:ring-pink-400/40 rounded-md px-2 py-1"
            value={model}
            onChange={(e) => onChangeModel(e.target.value)}
          >
            <option value="openai:gpt-4o">OpenAI — gpt-4o</option>
            <option value="openai:gpt-4o-mini">OpenAI — gpt-4o-mini</option>
            <option value="anthropic:claude-3-5-sonnet">Claude — 3.5 Sonnet</option>
            <option value="anthropic:claude-3-5-haiku">Claude — 3.5 Haiku</option>
          </select>
        </header>

        {/* Messages/transcript */}
        <section
          ref={transcriptRef}
          data-testid="transcript"
          role="log"
          aria-label="Chat messages"
          aria-live="polite"
          className="flex-1 overflow-y-auto p-4 space-y-2"
        >
          {(threadsError || messagesError) && (
            <div data-testid="error-state" role="alert" className="rounded-md border border-brand-500 text-brand-500 bg-panel p-3 flex items-center justify-between">
              <span>{threadsError || messagesError}</span>
              <button className="rounded-md border border-brand-500 text-brand-500 px-2 py-1" onClick={() => { if (threadsError) { void loadThreads() } else { void reloadMessages() } }}>Retry</button>
            </div>
          )}

          {isLoadingMessages && (
            <div data-testid="loading-state" className="space-y-2">
              <div className="h-4 w-5/6 bg-border rounded" />
              <div className="h-4 w-3/4 bg-border rounded" />
              <div className="h-4 w-2/3 bg-border rounded" />
            </div>
          )}

          {!isLoadingThreads && !threadsError && threads.length === 0 && (
            <div data-testid="empty-state" className="h-full flex flex-col items-center justify-center text-center text-text/70">
              <h2 className="text-lg mb-2">Start your first chat</h2>
              <p className="text-sm mb-4">Choose a model and send your first message.</p>
              <button className="rounded-md border border-brand-500 text-brand-500 hover:bg-brand-100/10 px-3 py-2" onClick={() => { newThread(); setTimeout(() => composerRef.current?.focus(), 0) }}>Start a chat</button>
            </div>
          )}

          {!messagesError && !isLoadingMessages && currentThreadId && messages.length === 0 && (
            <div className="text-sm text-text/70">Welcome — start by sending a message.</div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              data-testid="message"
              data-message-id={m.id}
              data-role={m.role}
              className={`msg ${m.role === 'assistant' ? 'msg-ai justify-start' : 'msg-user justify-end'} items-start`}
              aria-label={m.role === 'assistant' ? 'assistant message' : 'user message'}
            >
              {m.role === 'assistant' && <div className="select-none mr-1">🤖</div>}
              <div className="content">{m.contentText}</div>
              {m.role === 'user' && <div className="select-none ml-1">🐸</div>}
            </div>
          ))}
          <div data-testid="typing-indicator" hidden={!typing} aria-live="polite" className="msg msg-ai items-start">
            <div className="select-none mr-1">🤖</div>
            <div className="content animate-pulse-subtle">…</div>
          </div>
        </section>

        {/* Composer */}
        <form data-testid="composer" className="sticky bottom-0 border-t bg-panel/80 backdrop-blur supports-[backdrop-filter]:bg-panel/60 p-4 md:p-3 flex gap-2" onSubmit={onSend}>
          <label className="sr-only" htmlFor="composer-input">Message</label>
          <textarea
            id="composer-input"
            ref={composerRef}
            data-testid="composer-input"
            rows={3}
            placeholder="Message…"
            className="flex-1 resize-none min-h-[44px] max-h-40 overflow-y-auto bg-panel text-text placeholder:text-text/50 border border-border rounded-md p-2 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-pink-400/40"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onComposerKeyDown}
            disabled={typing}
          />
          <button data-testid="composer-send" type="submit" disabled={typing || !input.trim()} className="rounded-md border border-brand-500 bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 px-4 py-2">Send</button>
        </form>

      </main>
    </div>
  )
}
