import { prisma } from 'lib/prisma'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

import { requireUser } from 'lib/authz'
import { jsonError } from 'lib/errors'

export async function GET(req: NextRequest) {
  const gate = await requireUser()
  if ('error' in gate) return gate.error
  try {
    const url = new URL(req.url)
    const threadId = url.searchParams.get('threadId')
    if (!threadId) {
      return jsonError('VALIDATION_ERROR', 'threadId required', 400)
    }
    // Ownership check
    const own = await prisma.thread.findFirst({ where: { id: threadId, userId: gate.user.id }, select: { id: true } })
    if (!own) {
      return jsonError('FORBIDDEN', 'Forbidden', 403)
    }
    const data = await prisma.message.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, role: true, contentText: true, createdAt: true, provider: true, model: true }
    })
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return jsonError('INTERNAL_ERROR', 'Failed to load messages', 500)
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireUser()
  if ('error' in gate) return gate.error
  try {
    const url = new URL(req.url)
    const mode = url.searchParams.get('mode') // optional non-stream validation path
    const { threadId, content } = await req.json()
    if (!threadId || !content) {
      return jsonError('VALIDATION_ERROR', 'threadId and content required', 400)
    }
    // Ownership check
    const thread = await prisma.thread.findFirst({ where: { id: threadId, userId: gate.user.id }, select: { id: true, activeModel: true } })
    if (!thread) {
      return jsonError('FORBIDDEN', 'Forbidden', 403)
    }
    // Persist user message
    await prisma.message.create({ data: { threadId, role: 'user', contentText: content } })

    if (mode === 'json') {
      // Test-only non-streaming validation path
      if (process.env.NODE_ENV !== 'test') {
        return jsonError('VALIDATION_ERROR', 'mode=json is test-only', 400)
      }
      const { getAdapterForModel } = await import('lib/providers')
      const adapter = getAdapterForModel(thread.activeModel || 'openai:gpt-4o')
      if (!adapter) {
        return jsonError('VALIDATION_ERROR', 'Unsupported model', 400)
      }
      const { buildPromptWithTruncation } = await import('lib/context')
      const prior = await prisma.message.findMany({ where: { threadId }, orderBy: { createdAt: 'asc' } })
      const messages = buildPromptWithTruncation({ model: (thread.activeModel || '').split(':')[1] || 'gpt-4o', prior, currentUserText: content })
      const res = await adapter.chatNonStreaming({ model: (thread.activeModel || '').split(':')[1] || 'gpt-4o', messages })
      const saved = await prisma.message.create({
        data: { threadId, role: 'assistant', contentText: res.text, provider: adapter.name, model: (thread.activeModel || '').split(':')[1] || 'gpt-4o', usageJson: res.usage ?? undefined }
      })
      return new Response(JSON.stringify(saved), { headers: { 'Content-Type': 'application/json' } })
    }

    // Default SSE path (UI behavior now uses OpenAI adapter streaming)
    const encoder = new TextEncoder()
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        function send(event: string, data: string) {
          controller.enqueue(encoder.encode(`event: ${event}\n`))
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        }
        try {
          const { getAdapterForModel } = await import('lib/providers')
          const adapter = getAdapterForModel(thread.activeModel || 'openai:gpt-4o')
          const model = (thread.activeModel || '').split(':')[1] || 'gpt-4o'
          let text = ''
          if (process.env.E2E_STUB_PROVIDER === '1' || !adapter || !adapter.chatStreaming) {
            // Deterministic stub for E2E and when adapter/streaming unavailable
            send('delta', JSON.stringify('Okay — '))
await new Promise((r) => setTimeout(r, 200))
            send('delta', JSON.stringify('working on it…'))
            await new Promise((r) => setTimeout(r, 60))
            send('done', JSON.stringify({ messageId: 'm_temp', usage: { input_tokens: 0, output_tokens: 0 } }))
            controller.close()
            return
          }
          const { buildPromptWithTruncation } = await import('lib/context')
          const prior = await prisma.message.findMany({ where: { threadId }, orderBy: { createdAt: 'asc' } })
          const messages = buildPromptWithTruncation({ model, prior, currentUserText: content })
          for await (const chunk of adapter.chatStreaming({ model, messages })) {
            text += chunk
            send('delta', JSON.stringify(chunk))
          }
          const saved = await prisma.message.create({
            data: { threadId, role: 'assistant', contentText: text, provider: adapter.name, model }
          })
          send('done', JSON.stringify({ messageId: saved.id, usage: { input_tokens: 0, output_tokens: text.length } }))
        } catch (err) {
          send('error', JSON.stringify({ error: { code: 'PROVIDER_ERROR', message: 'An error occurred. Please try again.', details: null } }))
        } finally {
          try { controller.close() } catch {}
        }
      }
    })
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } })
  } catch (e) {
    return jsonError('INTERNAL_ERROR', 'Failed to stream response', 500)
  }
}
