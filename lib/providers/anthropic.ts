import Anthropic from '@anthropic-ai/sdk'
import type { ProviderAdapter, ChatMessage } from './types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function toAnthropic(messages: ChatMessage[]): Anthropic.Messages.MessageParam[] {
  return messages.map((m) => ({ role: m.role as any, content: m.content }))
}

export const anthropicAdapter: ProviderAdapter = {
  name: 'anthropic',
  async chatNonStreaming({ model, messages }) {
    if (!process.env.ANTHROPIC_API_KEY) {
      return { text: '[stub] hello from anthropic:' + model, usage: { input_tokens: 1, output_tokens: 2 } }
    }
    const res = await client.messages.create({
      model,
      max_tokens: 512,
      messages: toAnthropic(messages)
    })
    const text = res.content?.map((c: any) => c.text).join('') || ''
    // Anthropics SDK returns usage: { input_tokens, output_tokens }
    const usage = (res.usage && 'input_tokens' in res.usage) ? { input_tokens: (res.usage as any).input_tokens || 0, output_tokens: (res.usage as any).output_tokens || 0 } : undefined
    return { text, usage }
  },
  async *chatStreaming({ model, messages }) {
    if (!process.env.ANTHROPIC_API_KEY) {
      yield '[stub-stream] '
      yield 'anthropic '
      yield 'response'
      return
    }
    const stream = await client.messages.stream({
      model,
      max_tokens: 512,
      messages: toAnthropic(messages)
    })
    for await (const event of stream) {
      if ((event as any).type === 'content_block_delta') {
        const delta = (event as any).delta?.text
        if (delta) yield delta
      }
    }
  }
}