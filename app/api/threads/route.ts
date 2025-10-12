import fs from 'node:fs/promises'
import path from 'node:path'

export const runtime = 'nodejs'

async function readJsonFile(file: string) {
  const p = path.join(process.cwd(), 'docs', 'ui', 'fixtures', file)
  const raw = await fs.readFile(p, 'utf-8')
  return JSON.parse(raw)
}

export async function GET() {
  try {
    const threads = await readJsonFile('threads.json')
    return new Response(JSON.stringify(threads), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Failed to load threads' } }), { status: 500 })
  }
}
