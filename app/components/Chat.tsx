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
  const transcriptRef = useRef<HTMLDivElement>(null)

  // Load threads
  useEffect(() => {
    async function loadThreads() {
      const res = await fetch('/api/threads', { cache: 'no-store' })
      if (!res.ok) return
      const data: Thread[] = await res.json()
      setThreads(data)
      if (data.length) {
        setCurrentThreadId(data[0].id)
        setCurrentThreadTitle(data[0].title || 'Untitled')
        setModel(data[0].activeModel || 'openai:gpt-4o')
      }
    }
    loadThreads()
  }, [])

  // Load messages when thread changes
  useEffect(() => {
    async function loadMessages() {
      if (!currentThreadId) return
      const url = `/api/messages?threadId=${encodeURIComponent(currentThreadId)}`
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) return
      const data: any[] = await res.json()
      const mapped: Message[] = data.map((m) => ({ id: m.id, role: m.role, contentText: m.content || m.contentText }))
      setMessages(mapped)
    }
    loadMessages()
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

  async function onSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || !currentThreadId) return
    const userMsg: Message = { id: `u_${Date.now()}`, role: 'user', contentText: input }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setTyping(true)

    // POST with fetch streaming and parse text/event-stream
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
      // Keep only the trailing partial chunk in buffer
      const lastSep = buf.lastIndexOf('\n\n')
      if (lastSep >= 0) buf = buf.slice(lastSep + 2)
      for (const ev of events) {
        if (ev.event === 'delta') {
          try {
            const piece = JSON.parse(ev.data)
            assistantText += piece
            // Optimistically render/update the last assistant bubble
            setMessages((prev) => {
              const last = prev[prev.length - 1]
              if (last && last.role === 'assistant') {
                const clone = [...prev]
                clone[clone.length - 1] = { ...last, contentText: assistantText }
                return clone
              }
              return [...prev, { id: `a_${Date.now()}`, role: 'assistant', contentText: assistantText }]
            })
          } catch { /* ignore */ }
        } else if (ev.event === 'done') {
          setTyping(false)
        } else if (ev.event === 'error') {
          setTyping(false)
        }
      }
    }
  }

  return (
    <div data-testid="app-shell" className="grid grid-cols-[280px_1fr] h-screen">
      <aside data-testid="thread-tray" className="border-r overflow-y-auto p-2" aria-label="Chat threads">
        <button data-testid="new-thread" className="mb-2">New Chat</button>
        <ul data-testid="thread-list" className="space-y-1">
          {threads.map((t) => (
            <li key={t.id} data-testid="thread-item" data-active={t.id === currentThreadId || undefined}>
              <button onClick={() => onSelectThread(t.id)} className="w-full text-left">
                {t.title}
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <main data-testid="chat-pane" role="main" className="flex flex-col">
        <header className="flex items-center justify-between border-b p-3">
          <h1 data-testid="thread-title">{currentThreadTitle}</h1>
          <select data-testid="model-switcher" aria-label="Model selector" value={model} onChange={(e) => onChangeModel(e.target.value)}>
            <option value="openai:gpt-4o">OpenAI — gpt-4o</option>
            <option value="openai:gpt-4o-mini">OpenAI — gpt-4o-mini</option>
            <option value="anthropic:claude-3-5-sonnet">Claude — 3.5 Sonnet</option>
            <option value="anthropic:claude-3-5-haiku">Claude — 3.5 Haiku</option>
          </select>
        </header>
        <section ref={transcriptRef} data-testid="transcript" role="log" aria-live="polite" className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((m) => (
            <div key={m.id} data-testid="message" data-role={m.role}>
              {m.contentText}
            </div>
          ))}
          <div data-testid="typing-indicator" hidden={!typing}>Assistant is typing…</div>
        </section>
        <form data-testid="composer" className="border-t p-3 flex gap-2" onSubmit={onSend}>
          <label className="sr-only" htmlFor="composer-input">Message</label>
          <textarea id="composer-input" data-testid="composer-input" rows={2} placeholder="Message…" className="flex-1 border p-2" value={input} onChange={(e) => setInput(e.target.value)} />
          <button data-testid="composer-send" type="submit" disabled={typing} className="border px-3">Send</button>
        </form>
        <div data-testid="brand-swatch" className="h-6 w-24 m-2 rounded-md" style={{ background: 'var(--gradient-brand)' }} />
      </main>
    </div>
  )
}
