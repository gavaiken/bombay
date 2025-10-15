export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export interface ProviderAdapter {
  name: 'openai' | 'anthropic' | 'test'
  chatNonStreaming(opts: {
    model: string
    messages: ChatMessage[]
  }): Promise<{
    text: string
    usage?: { input_tokens: number; output_tokens: number }
  }>
  chatStreaming?(opts: {
    model: string
    messages: ChatMessage[]
    signal?: AbortSignal
  }): AsyncIterable<string>
}