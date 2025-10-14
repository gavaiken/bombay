import Anthropic from '@anthropic-ai/sdk'
import type { ProviderAdapter, ChatMessage } from './types'

let client: Anthropic | null = null
function ensureClient(): Anthropic | null {
  if (!client && process.env.ANTHROPIC_API_KEY) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return client
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
    const res = await cli.messages.create({
      model,
      max_tokens: 512,
      messages: toAnthropic(messages)
    })
    const text = (res as any).content?.map((c: any) => c.text).join('') || ''
    // Anthropics SDK returns usage: { input_tokens, output_tokens }
    const usage = (res as any).usage && 'input_tokens' in (res as any).usage ? { input_tokens: (res as any).usage.input_tokens || 0, output_tokens: (res as any).usage.output_tokens || 0 } : undefined
    return { text, usage }
  },
  async *chatStreaming({ model, messages }) {
    const cli = ensureClient()
    if (!cli) {
      yield '[stub-stream] '
      yield 'anthropic '
      yield 'response'
      return
    }
    const stream = await cli.messages.stream({
      model,
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
}
