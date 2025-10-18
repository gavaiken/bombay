import { prisma } from 'lib/prisma'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

import { requireUser } from 'lib/authz'
import { jsonError } from 'lib/errors'
import { SendMessageSchema } from 'lib/schemas'
import { checkRateLimit, RATE_LIMITS } from 'lib/rate-limit'
import { logEvent, Events } from 'lib/logger'
import { Metrics } from 'lib/metrics'

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
    
    const { threadId, content, model } = validation.data
    
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
    // Ownership check and get thread model
    const thread = await prisma.thread.findFirst({ where: { id: threadId, userId }, select: { id: true, activeModel: true, activeScopeKeys: true } })
    if (!thread) {
      return jsonError('FORBIDDEN', 'Forbidden', 403)
    }
    
    // Use provided model or fall back to thread's active model
    const { DEFAULT_MODEL } = await import('lib/models');
    const selectedModel = model || thread.activeModel || DEFAULT_MODEL;
    // Persist user message
    await prisma.message.create({ data: { threadId, role: 'user', contentText: content } })
    
    // Log message sent
    await logEvent(Events.MESSAGE_SENT, 'info', {
      userId,
      threadId,
      model: selectedModel
    });
    
    // Track metrics
    await Metrics.trackActiveUser(userId);
    await Metrics.trackMessage(userId, selectedModel);
    await Metrics.trackModelUsage(selectedModel);

    if (mode === 'json') {
      // Test-only non-streaming validation path
      if (process.env.NODE_ENV !== 'test') {
        return jsonError('VALIDATION_ERROR', 'mode=json is test-only', 400)
      }
      const { getAdapterForModel } = await import('lib/providers')
      const adapter = getAdapterForModel(selectedModel)
      if (!adapter) {
        return jsonError('VALIDATION_ERROR', 'Unsupported model', 400)
      }
          const { buildPromptWithTruncation, buildScopedContext } = await import('lib/context')
          const { getProviderModelName } = await import('lib/models')
          const prior = await prisma.message.findMany({ where: { threadId }, orderBy: { createdAt: 'asc' } })
          const modelName = getProviderModelName(selectedModel)
          let messages = await buildPromptWithTruncation({ model: modelName, prior, currentUserText: content, userId })
          let usedScopes: string[] = []
          if (process.env.NEXT_PUBLIC_SCOPES_ENABLED === '1' || process.env.NEXT_PUBLIC_SCOPES_ENABLED === 'true') {
            const scoped = await buildScopedContext({ model: modelName, prior, currentUserText: content, userId, threadId, enabledScopeKeys: thread.activeScopeKeys || [] })
            messages = scoped.messages
            usedScopes = scoped.usedScopes
          }
          const res = await adapter.chatNonStreaming({ model: modelName, messages })
          let saved: any
          try {
            saved = await prisma.message.create({
              data: { threadId, role: 'assistant', contentText: res.text, provider: adapter.name, model: modelName, usageJson: res.usage ?? undefined, metaJson: usedScopes.length ? { usedScopes } : undefined } as any
            })
          } catch {
            saved = await prisma.message.create({ data: { threadId, role: 'assistant', contentText: res.text, provider: adapter.name, model: modelName } })
          }
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
          const adapter = getAdapterForModel(selectedModel)
          const { getProviderModelName } = await import('lib/models')
          const model = getProviderModelName(selectedModel)
          let text = ''
          if (process.env.E2E_STUB_PROVIDER === '1' || !adapter || !adapter.chatStreaming) {
            // Deterministic stub for E2E and when adapter/streaming unavailable
            let usedScopes: string[] = []
            if (process.env.NEXT_PUBLIC_SCOPES_ENABLED === '1' || process.env.NEXT_PUBLIC_SCOPES_ENABLED === 'true') {
              const { buildScopedContext } = await import('lib/context')
              const prior = await prisma.message.findMany({ where: { threadId }, orderBy: { createdAt: 'asc' } })
              const scoped = await buildScopedContext({ model, prior, currentUserText: content, userId, threadId, enabledScopeKeys: thread.activeScopeKeys || [] })
              usedScopes = scoped.usedScopes
            }
            send('delta', JSON.stringify('Okay — '))
            await new Promise((r) => setTimeout(r, 200))
            send('delta', JSON.stringify('working on it…'))
            await new Promise((r) => setTimeout(r, 60))
            let saved: any
            try {
              saved = await prisma.message.create({
                data: { threadId, role: 'assistant', contentText: 'Okay — working on it…', provider: adapter ? adapter.name : 'test', model, metaJson: usedScopes.length ? { usedScopes } : undefined } as any
              })
            } catch {
              saved = await prisma.message.create({ data: { threadId, role: 'assistant', contentText: 'Okay — working on it…', provider: adapter ? adapter.name : 'test', model } })
            }
            send('done', JSON.stringify({ messageId: saved.id, usage: { input_tokens: 0, output_tokens: 0 }, usedScopes }))
            controller.close()
            return
          }
          const { buildPromptWithTruncation, buildScopedContext } = await import('lib/context')
          const prior = await prisma.message.findMany({ where: { threadId }, orderBy: { createdAt: 'asc' } })
          let messages = await buildPromptWithTruncation({ model, prior, currentUserText: content, userId })
          let usedScopes: string[] = []
          if (process.env.NEXT_PUBLIC_SCOPES_ENABLED === '1' || process.env.NEXT_PUBLIC_SCOPES_ENABLED === 'true') {
            const scoped = await buildScopedContext({ model, prior, currentUserText: content, userId, threadId, enabledScopeKeys: thread.activeScopeKeys || [] })
            messages = scoped.messages
            usedScopes = scoped.usedScopes
          }
          
          // Track response time
          const responseStart = Date.now();
          
          for await (const chunk of adapter.chatStreaming({ model, messages })) {
            text += chunk
            send('delta', JSON.stringify(chunk))
          }
          
          const responseTime = Date.now() - responseStart;
          
          // Track provider response time metrics
          await Metrics.trackResponseTime(adapter.name, responseTime);
          
          let saved: any
          try {
            saved = await prisma.message.create({
              data: { threadId, role: 'assistant', contentText: text, provider: adapter.name, model, metaJson: usedScopes.length ? { usedScopes } : undefined } as any
            })
          } catch {
            saved = await prisma.message.create({ data: { threadId, role: 'assistant', contentText: text, provider: adapter.name, model } })
          }
          send('done', JSON.stringify({ messageId: saved.id, usage: { input_tokens: 0, output_tokens: text.length }, usedScopes }))
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
