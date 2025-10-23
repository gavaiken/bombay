import Anthropic from '@anthropic-ai/sdk'
import type { ProviderAdapter, ChatMessage } from './types'
import { getProviderModelName } from '../models'

let client: Anthropic | null = null
function ensureClient(): Anthropic | null {
  if (!client) {
    const raw = process.env.ANTHROPIC_API_KEY || ''
    const apiKey = raw.replace(/[\r\n]/g, '').trim()
    if (apiKey) {
      client = new Anthropic({ apiKey })
    }
  }
  return client
}

function normalizeAnthropicModelId(model: string): string {
  switch (model) {
    case 'claude-3-5-sonnet':
      return 'claude-3-5-sonnet-latest'
    case 'claude-3-5-haiku':
      return 'claude-3-5-haiku-latest'
    default:
      return model
  }
}

function splitForAnthropic(messages: ChatMessage[]): { system?: string; chat: Anthropic.Messages.MessageParam[] } {
  const systemParts: string[] = []
  const chat: Anthropic.Messages.MessageParam[] = []
  for (const m of messages) {
    if (m.role === 'system') {
      systemParts.push(m.content)
    } else {
      chat.push({ role: m.role as 'user' | 'assistant', content: m.content } as Anthropic.Messages.MessageParam)
    }
  }
  const system = systemParts.length ? systemParts.join('\n\n') : undefined
  return { system, chat }
}

export const anthropicAdapter: ProviderAdapter = {
  name: 'anthropic',
  async chatNonStreaming({ model, messages }) {
    const cli = ensureClient()
    if (!cli) {
      return { text: '[stub] hello from anthropic:' + model, usage: { input_tokens: 1, output_tokens: 2 } }
    }
    // Extract actual model name for Anthropic API (remove provider prefix)
    const actualModel = getProviderModelName(model);
const primary = normalizeAnthropicModelId(actualModel)
    const { system, chat } = splitForAnthropic(messages)
    try {
      const res = await cli.messages.create({
        model: primary,
        max_tokens: 512,
        system,
        messages: chat
      })
      const text = (res as any).content?.map((c: any) => c.text).join('') || ''
      const usage = (res as any).usage && 'input_tokens' in (res as any).usage ? { input_tokens: (res as any).usage.input_tokens || 0, output_tokens: (res as any).usage.output_tokens || 0 } : undefined
      return { text, usage }
    } catch (err) {
      const msg = (err as any)?.message ? String((err as any).message) : ''
      const fallbackMap: Record<string, string> = {
        'claude-3-5-sonnet-latest': 'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-latest': 'claude-3-5-haiku-20241022'
      }
const fallback = fallbackMap[primary]
      if (msg.includes('not_found_error') && fallback) {
        const res = await cli.messages.create({
          model: fallback,
          max_tokens: 512,
          system,
          messages: chat
        })
        const text = (res as any).content?.map((c: any) => c.text).join('') || ''
        const usage = (res as any).usage && 'input_tokens' in (res as any).usage ? { input_tokens: (res as any).usage.input_tokens || 0, output_tokens: (res as any).usage.output_tokens || 0 } : undefined
        return { text, usage }
      }
      throw err
    }
  },
  async *chatStreaming({ model, messages }) {
    const cli = ensureClient()
    if (!cli) {
      yield '[stub-stream] '
      yield 'anthropic '
      yield 'response'
      return
    }
    // Extract actual model name for Anthropic API (remove provider prefix)
    const actualModel = getProviderModelName(model);
const primary = normalizeAnthropicModelId(actualModel)
    const { system, chat } = splitForAnthropic(messages)
    async function* runStream(modelId: string): AsyncIterable<string> {
      const c = ensureClient()
      if (!c) {
        yield '[stub-stream] '
        yield 'anthropic '
        yield 'response'
        return
      }
      const stream = await c.messages.stream({
        model: modelId,
        max_tokens: 512,
        system,
        messages: chat
      })
      for await (const event of stream as any) {
        if ((event as any).type === 'content_block_delta') {
          const delta = (event as any).delta?.text
          if (delta) yield delta
        }
      }
    }
    try {
      for await (const chunk of runStream(primary)) {
        yield chunk
      }
    } catch (err) {
      const msg = (err as any)?.message ? String((err as any).message) : ''
      const fallbackMap: Record<string, string> = {
        'claude-3-5-sonnet-latest': 'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-latest': 'claude-3-5-haiku-20241022'
      }
      const fallback = fallbackMap[primary]
      if (msg.includes('not_found_error') && fallback) {
        for await (const chunk of runStream(fallback)) {
          yield chunk
        }
        return
      }
      throw err
    }
  }
}
