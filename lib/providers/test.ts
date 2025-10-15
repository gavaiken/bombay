import type { ProviderAdapter, ChatMessage } from './types'

export const testAdapter: ProviderAdapter = {
  name: 'test',

  async chatNonStreaming({ messages }): Promise<{ text: string; usage?: { input_tokens: number; output_tokens: number } }> {
    // Get the last user message
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()
    const text = lastUserMessage ? lastUserMessage.content : 'No message to repeat'
    
    return {
      text,
      usage: { input_tokens: text.length, output_tokens: text.length }
    }
  },

  async *chatStreaming({ messages }): AsyncIterable<string> {
    // Get the last user message
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()
    const text = lastUserMessage ? lastUserMessage.content : 'No message to repeat'
    
    // Stream the text word by word for a realistic effect
    const words = text.split(' ')
    for (let i = 0; i < words.length; i++) {
      const chunk = (i === 0 ? '' : ' ') + words[i]
      yield chunk
      // Small delay between words to simulate streaming
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
}