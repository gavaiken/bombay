import OpenAI from 'openai'
import type { ProviderAdapter, ChatMessage } from './types'
import { getProviderModelName } from '../models'

let client: OpenAI | null = null
function ensureClient(): OpenAI | null {
  if (!client) {
    const raw = process.env.OPENAI_API_KEY || ''
    const apiKey = raw.replace(/[\r\n]/g, '').trim()
    if (apiKey) {
      client = new OpenAI({ apiKey })
    }
  }
  return client
}

function toOpenAI(messages: ChatMessage[]): OpenAI.Chat.ChatCompletionMessageParam[] {
  return messages.map((m) => ({ role: m.role, content: m.content })) as any
}

export const openaiAdapter: ProviderAdapter = {
  name: 'openai',
  async chatNonStreaming({ model, messages }) {
    const cli = ensureClient()
    if (!cli) {
      // Deterministic stub when no key provided
      return { text: '[stub] hello from openai:' + model, usage: { input_tokens: 1, output_tokens: 2 } }
    }
    // Extract actual model name for OpenAI API (remove provider prefix)
    const actualModel = getProviderModelName(model);
    const res = await cli.chat.completions.create({
      model: actualModel,
      messages: toOpenAI(messages),
      temperature: 0.3
    })
    const text = res.choices?.[0]?.message?.content ?? ''
    const usage = res.usage ? { input_tokens: res.usage.prompt_tokens ?? 0, output_tokens: res.usage.completion_tokens ?? 0 } : undefined
    return { text, usage }
  },
  async *chatStreaming({ model, messages }) {
    const cli = ensureClient()
    if (!cli) {
      yield '[stub-stream] '
      yield 'streaming '
      yield 'response'
      return
    }
    // Extract actual model name for OpenAI API (remove provider prefix)
    const actualModel = getProviderModelName(model);
    const stream = await cli.chat.completions.create({
      model: actualModel,
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
