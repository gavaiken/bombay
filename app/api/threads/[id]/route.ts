import fs from 'node:fs/promises'
import path from 'node:path'

export const runtime = 'nodejs'

async function readJsonFile(file: string) {
  const p = path.join(process.cwd(), 'docs', 'ui', 'fixtures', file)
  const raw = await fs.readFile(p, 'utf-8')
  return JSON.parse(raw)
}

import { requireUser } from 'lib/authz'
import { jsonError } from 'lib/errors'

export async function PATCH(request: Request, context: any) {
  const gate = await requireUser()
  if ('error' in gate) return gate.error
  try {
    const body = await request.json()
    const { activeModel } = body
    const params = context?.params as { id: string }
    if (!activeModel) {
      return jsonError('VALIDATION_ERROR', 'activeModel required', 400)
    }
    const threads = await readJsonFile('threads.json')
    const found = threads.find((t: any) => t.id === params.id)
    if (!found) {
      return jsonError('NOT_FOUND', 'Thread not found', 404)
    }
    const updated = { ...found, activeModel }
    return new Response(JSON.stringify(updated), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return jsonError('INTERNAL_ERROR', 'Failed to update thread', 500)
  }
}
