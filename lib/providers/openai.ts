import OpenAI from 'openai'
import type { ProviderAdapter, ChatMessage } from './types'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function toOpenAI(messages: ChatMessage[]): OpenAI.Chat.ChatCompletionMessageParam[] {
  return messages.map((m) => ({ role: m.role, content: m.content })) as any
}

export const openaiAdapter: ProviderAdapter = {
  name: 'openai',
  async chatNonStreaming({ model, messages }) {
    if (!process.env.OPENAI_API_KEY) {
      // Deterministic stub when no key provided
      return { text: '[stub] hello from openai:' + model, usage: { input_tokens: 1, output_tokens: 2 } }
    }
    const res = await client.chat.completions.create({
      model,
      messages: toOpenAI(messages),
      temperature: 0.3
    })
    const text = res.choices?.[0]?.message?.content ?? ''
    const usage = res.usage ? { input_tokens: res.usage.prompt_tokens ?? 0, output_tokens: res.usage.completion_tokens ?? 0 } : undefined
    return { text, usage }
  },
  async *chatStreaming({ model, messages }) {
    if (!process.env.OPENAI_API_KEY) {
      yield '[stub-stream] '
      yield 'streaming '
      yield 'response'
      return
    }
    const stream = await client.chat.completions.create({
      model,
      messages: toOpenAI(messages),
      stream: true,
      temperature: 0.3
    })
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content
      if (delta) yield delta
    }
  }
}