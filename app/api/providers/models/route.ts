export const runtime = 'nodejs'

import { requireUser } from 'lib/authz'
import { jsonError } from 'lib/errors'
import OpenAI from 'openai'

function getOpenAIClient() {
  const raw = process.env.OPENAI_API_KEY || ''
  const apiKey = raw.replace(/[\r\n]/g, '').trim()
  return apiKey ? new OpenAI({ apiKey }) : null
}

async function listAnthropicModels() {
  const raw = process.env.ANTHROPIC_API_KEY || ''
  const apiKey = raw.replace(/[\r\n]/g, '').trim()
  if (!apiKey) return [] as string[]
  const res = await fetch('https://api.anthropic.com/v1/models', {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'accept': 'application/json'
    }
  })
  if (!res.ok) return []
  const json = await res.json() as { data?: { id: string }[] }
  return (json.data || []).map(m => m.id)
}

export async function GET() {
  const gate = await requireUser()
  if (!gate.ok) return gate.error
  try {
    const openai: string[] = []
    const cli = getOpenAIClient()
    if (cli) {
      const models = await cli.models.list()
      for (const m of models.data) {
        openai.push(m.id)
      }
    }
    const anthropic = await listAnthropicModels()
    return new Response(JSON.stringify({ openai, anthropic }), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return jsonError('INTERNAL_ERROR', 'Failed to list provider models', 500)
  }
}