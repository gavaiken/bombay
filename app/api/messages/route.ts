import fs from 'node:fs/promises'
import path from 'node:path'

export const runtime = 'nodejs'

async function readJsonFile(file: string) {
  const p = path.join(process.cwd(), 'docs', 'ui', 'fixtures', file)
  const raw = await fs.readFile(p, 'utf-8')
  return JSON.parse(raw)
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const threadId = url.searchParams.get('threadId')
    if (!threadId) {
      return new Response(JSON.stringify({ error: { code: 'VALIDATION_ERROR', message: 'threadId required' } }), { status: 400 })
    }
    const messages = await readJsonFile('messages.json')
    const data = messages[threadId] ?? []
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Failed to load messages' } }), { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { threadId, content } = await req.json()
    if (!threadId || !content) {
      return new Response(JSON.stringify({ error: { code: 'VALIDATION_ERROR', message: 'threadId and content required' } }), { status: 400 })
    }
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        function send(event: string, data: string) {
          controller.enqueue(encoder.encode(`event: ${event}\n`))
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        }
        // Minimal deterministic chunks
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
    return new Response(JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Failed to stream response' } }), { status: 500 })
  }
}
