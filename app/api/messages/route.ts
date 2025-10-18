import { prisma } from 'lib/prisma'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

import { requireUser } from 'lib/authz'
import { jsonError } from 'lib/errors'
import { SendMessageSchema } from 'lib/schemas'
import { checkRateLimit, RATE_LIMITS } from 'lib/rate-limit'
import { logEvent, Events } from 'lib/logger'

export async function GET(req: NextRequest) {
  const gate = await requireUser()
  if (!gate.ok) return gate.error
  const userId = gate.user.id
  try {
    const url = new URL(req.url)
    const threadId = url.searchParams.get('threadId')
    const limitParam = url.searchParams.get('limit')
    const beforeParam = url.searchParams.get('before')
    
    if (!threadId) {
      return jsonError('VALIDATION_ERROR', 'threadId required', 400)
    }
    
    // Parse pagination parameters
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 200) : 50; // Max 200, default 50
    const before = beforeParam ? new Date(beforeParam) : undefined;
    
    // Ownership check
    const own = await prisma.thread.findFirst({ where: { id: threadId, userId }, select: { id: true } })
    if (!own) {
      return jsonError('FORBIDDEN', 'Forbidden', 403)
    }
    
    // Build query with pagination
    const whereClause: any = { threadId };
    if (before) {
      whereClause.createdAt = { lt: before };
    }
    
    const data = await prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }, // Desc to get most recent first, then reverse
      take: limit,
      select: { id: true, role: true, contentText: true, createdAt: true, provider: true, model: true }
    })
    
    // Reverse to maintain chronological order (oldest first)
    const messages = data.reverse();
    
    // Add pagination metadata
    const response = {
      messages,
      pagination: {
        hasMore: data.length === limit,
        before: data.length > 0 ? data[0].createdAt : null,
        limit
      }
    };
    
    return new Response(JSON.stringify(response), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return jsonError('INTERNAL_ERROR', 'Failed to load messages', 500)
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireUser()
  if (!gate.ok) return gate.error
  const userId = gate.user.id
  try {
    const url = new URL(req.url)
    const mode = url.searchParams.get('mode') // optional non-stream validation path
    
    // Parse and validate request body with Zod
    const body = await req.json()
    const validation = SendMessageSchema.safeParse(body)
    if (!validation.success) {
      const firstError = validation.error.errors[0]
      return jsonError('VALIDATION_ERROR', firstError.message, 400)
    }
    
    const { threadId, content } = validation.data
    
    // Check rate limiting
    const rateLimit = await checkRateLimit({
      identifier: userId,
      ...RATE_LIMITS.MESSAGES
    })
    
    if (!rateLimit.success) {
      // Log rate limiting
      await logEvent(Events.RATE_LIMITED, 'warn', {
        userId,
        threadId
      });
      return jsonError('RATE_LIMITED', 'Too many messages. Please wait before sending again.', 429)
    }
    // Ownership check
    const thread = await prisma.thread.findFirst({ where: { id: threadId, userId }, select: { id: true, activeModel: true } })
    if (!thread) {
      return jsonError('FORBIDDEN', 'Forbidden', 403)
    }
    // Persist user message
    await prisma.message.create({ data: { threadId, role: 'user', contentText: content } })
    
    // Log message sent
    await logEvent(Events.MESSAGE_SENT, 'info', {
      userId,
      threadId,
      model: thread.activeModel || 'unknown'
    });

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
        } catch (err: unknown) {
          // Friendly error mapping + masked logs
          const raw = err && typeof err === 'object' && 'message' in err ? String((err as { message?: string }).message || 'error') : 'error'
          const masked = raw.replace(/sk-[a-zA-Z0-9_-]+/g, 'sk-***').replace(/sk-ant-[a-zA-Z0-9_-]+/g, 'sk-ant-***')
          let code = 'PROVIDER_ERROR'
          let userMessage = 'An error occurred. Please try again.'
          if (/\b429\b/.test(raw) && /quota/i.test(raw)) {
            code = 'QUOTA_EXCEEDED'
            userMessage = 'Provider quota exceeded. Please try again later or switch models.'
          } else if (/not_found_error/i.test(raw) && /model/i.test(raw)) {
            code = 'MODEL_NOT_FOUND'
            userMessage = 'Selected model is not available for this API key. Try another model.'
          }
          const { logError } = await import('lib/logger')
          await logError('messages SSE provider error', { message: masked })
          send('error', JSON.stringify({ error: { code, message: userMessage, details: null } }))
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
