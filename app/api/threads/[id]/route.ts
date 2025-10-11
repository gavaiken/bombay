import fs from 'node:fs/promises'
import path from 'node:path'

export const runtime = 'nodejs'

async function readJsonFile(file) {
  const p = path.join(process.cwd(), 'docs', 'ui', 'fixtures', file)
  const raw = await fs.readFile(p, 'utf-8')
  return JSON.parse(raw)
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { activeModel } = body
    if (!activeModel) {
      return new Response(JSON.stringify({ error: { code: 'VALIDATION_ERROR', message: 'activeModel required' } }), { status: 400 })
    }
    const threads = await readJsonFile('threads.json')
    const found = threads.find((t: any) => t.id === params.id)
    if (!found) {
      return new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Thread not found' } }), { status: 404 })
    }
    const updated = { ...found, activeModel }
    return new Response(JSON.stringify(updated), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update thread' } }), { status: 500 })
  }
}
