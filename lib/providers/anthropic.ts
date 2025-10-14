import Anthropic from '@anthropic-ai/sdk'
import type { ProviderAdapter, ChatMessage } from './types'

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

function toAnthropic(messages: ChatMessage[]): Anthropic.Messages.MessageParam[] {
  return messages.map((m) => ({ role: m.role as any, content: m.content }))
}

export const anthropicAdapter: ProviderAdapter = {
  name: 'anthropic',
  async chatNonStreaming({ model, messages }) {
    const cli = ensureClient()
    if (!cli) {
      return { text: '[stub] hello from anthropic:' + model, usage: { input_tokens: 1, output_tokens: 2 } }
    }
    const primary = normalizeAnthropicModelId(model)
    try {
      const res = await cli.messages.create({
        model: primary,
        max_tokens: 512,
        messages: toAnthropic(messages)
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
          messages: toAnthropic(messages)
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
    const primary = normalizeAnthropicModelId(model)
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
        messages: toAnthropic(messages)
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
