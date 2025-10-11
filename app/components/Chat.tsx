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
    } catch (e: any) {
      setThreadsError(e?.message || 'Failed to load threads')
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
      // New chat: Cmd/Ctrl+Shift+O
      if (mod && shift && key === 'o') {
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
    try {
      setIsLoadingMessages(true)
      setMessagesError(null)
      const url = `/api/messages?threadId=${encodeURIComponent(currentThreadId)}`
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load messages')
      const data: any[] = await res.json()
      const mapped: Message[] = data.map((m) => ({ id: m.id, role: m.role, contentText: m.content || m.contentText }))
      setMessages(mapped)
    } catch (e: any) {
      setMessagesError(e?.message || 'Failed to load messages')
      setMessages([])
    } finally {
      setIsLoadingMessages(false)
    }
  }

  // Load messages when thread changes
  useEffect(() => {
    if (!currentThreadId) return
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

  async function sendCurrentInput() {
    if (!input.trim() || !currentThreadId) return
    const userMsg: Message = { id: `u_${Date.now()}`, role: 'user', contentText: input }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setTyping(true)

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId: currentThreadId, content: userMsg.contentText })
    })
    if (!res.body) {
      setTyping(false)
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
          setTyping(false)
        } else if (ev.event === 'error') {
          setTyping(false)
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

  function newThread() {
    const id = `t_${Date.now()}`
    const t: Thread = { id, title: 'New chat', activeModel: model, updatedAt: new Date().toISOString() }
    setThreads((prev) => [t, ...prev])
    setCurrentThreadId(id)
    setCurrentThreadTitle(t.title)
    setMessages([])
    setMessagesError(null)
  }

  const activeThread = useMemo(() => threads.find(t => t.id === currentThreadId) || null, [threads, currentThreadId])

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
          <div className="flex items-center gap-2">
            <div data-testid="brand-swatch" aria-label="bombay brand" className="h-4 w-12 rounded-sm" style={{ background: 'var(--gradient-brand)' }} />
            <span className="text-text/60 text-xs">bombay</span>
          </div>
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
            <li key={t.id} data-testid="thread-item" data-thread-id={t.id} data-active={t.id === currentThreadId || undefined}>
              <button onClick={() => onSelectThread(t.id)} className="w-full text-left">
                {t.title}
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
              <button className="rounded-md border border-brand-500 text-brand-500 px-2 py-1" onClick={() => { threadsError ? loadThreads() : reloadMessages() }}>Retry</button>
            </div>
          )}
          {messagesError && (
            <div data-testid="error-state" role="alert" className="rounded-md border border-border bg-panel p-3">
              <div className="mb-2">{messagesError}</div>
              <button className="rounded-md border border-border px-2 py-1" onClick={reloadMessages}>Retry</button>
            </div>
          )}

          {isLoadingMessages && (
            <div data-testid="loading-state" className="space-y-2">
              <div className="h-4 w-5/6 bg-border rounded" />
              <div className="h-4 w-3/4 bg-border rounded" />
              <div className="h-4 w-2/3 bg-border rounded" />
            </div>
          )}

          {!messagesError && !isLoadingMessages && currentThreadId && messages.length === 0 && (
            <div className="text-sm text-text/70">Welcome — start by sending a message.</div>
          )}

          {messages.map((m) => (
            <div key={m.id} data-testid="message" data-message-id={m.id} data-role={m.role}>
              {m.contentText}
            </div>
          ))}
          <div data-testid="typing-indicator" hidden={!typing} aria-live="polite">Assistant is typing…</div>
        </section>

        {/* Composer */}
        <form data-testid="composer" className="border-t p-3 flex gap-2" onSubmit={onSend}>
          <label className="sr-only" htmlFor="composer-input">Message</label>
          <textarea
            id="composer-input"
            ref={composerRef}
            data-testid="composer-input"
            rows={2}
            placeholder="Message…"
            className="flex-1 bg-panel text-text placeholder:text-text/50 border border-border rounded-md p-2 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-pink-400/40"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onComposerKeyDown}
            disabled={typing}
          />
          <button data-testid="composer-send" type="submit" disabled={typing || !input.trim()} className="border px-3">Send</button>
        </form>

      </main>
    </div>
  )
}
