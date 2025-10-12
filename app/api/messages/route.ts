import { prisma } from 'lib/prisma'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

import { requireUser } from 'lib/authz'

export async function GET(req: NextRequest) {
  const gate = await requireUser()
  if ('error' in gate) return gate.error
  try {
    const url = new URL(req.url)
    const threadId = url.searchParams.get('threadId')
    if (!threadId) {
      return new Response(JSON.stringify({ error: { code: 'VALIDATION_ERROR', message: 'threadId required', details: null } }), { status: 400 })
    }
    // Ownership check
    const own = await prisma.thread.findFirst({ where: { id: threadId, userId: gate.user.id }, select: { id: true } })
    if (!own) {
      return new Response(JSON.stringify({ error: { code: 'FORBIDDEN', message: 'Forbidden', details: null } }), { status: 403 })
    }
    const data = await prisma.message.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, role: true, contentText: true, createdAt: true }
    })
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Failed to load messages', details: null } }), { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireUser()
  if ('error' in gate) return gate.error
  try {
    const { threadId, content } = await req.json()
    if (!threadId || !content) {
      return new Response(JSON.stringify({ error: { code: 'VALIDATION_ERROR', message: 'threadId and content required', details: null } }), { status: 400 })
    }
    // Ownership check
    const own = await prisma.thread.findFirst({ where: { id: threadId, userId: gate.user.id }, select: { id: true } })
    if (!own) {
      return new Response(JSON.stringify({ error: { code: 'FORBIDDEN', message: 'Forbidden', details: null } }), { status: 403 })
    }
    // Persist user message
    await prisma.message.create({
      data: { threadId, role: 'user', contentText: content }
    })

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        function send(event: string, data: string) {
          controller.enqueue(encoder.encode(`event: ${event}\n`))
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        }
        // Minimal deterministic chunks (placeholder until streaming is implemented)
        send('delta', JSON.stringify('Okay — '))
        send('delta', JSON.stringify('working on it…'))
        send('done', JSON.stringify({ messageId: 'm_temp', usage: { input_tokens: 12, output_tokens: 18 } }))
        controller.close()
      }
    })
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      }
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Failed to stream response', details: null } }), { status: 500 })
  }
}
