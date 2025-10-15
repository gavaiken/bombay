/**
 * Test Provider Adapter - "Repeat After Me"
 * 
 * This is a special test provider that simply echoes back user input without
 * making any external API calls. It's designed for:
 * - Testing UI layouts without consuming LLM quota
 * - Development and debugging
 * - E2E testing scenarios
 * - Mobile layout testing
 * 
 * Model ID: test:repeat-after-me
 * UI Label: "Test — Repeat After Me"
 * 
 * @example
 * User: "Hello world"
 * Assistant: "Hello world"
 */

import type { ProviderAdapter, ChatMessage } from './types'

export const testAdapter: ProviderAdapter = {
  name: 'test',

  /**
   * Non-streaming implementation - returns the user's message immediately
   * Used by the test-only mode=json API parameter
   */
  async chatNonStreaming({ messages }): Promise<{ text: string; usage?: { input_tokens: number; output_tokens: number } }> {
    // Extract the most recent user message from conversation history
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()
    const text = lastUserMessage ? lastUserMessage.content : 'No message to repeat'
    
    return {
      text,
      // Mock usage stats based on text length (no real API usage)
      usage: { input_tokens: text.length, output_tokens: text.length }
    }
  },

  /**
   * Streaming implementation - yields the user's message word by word
   * This simulates real LLM streaming behavior for UI testing
   */
  async *chatStreaming({ messages }): AsyncIterable<string> {
    // Extract the most recent user message from conversation history
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()
    const text = lastUserMessage ? lastUserMessage.content : 'No message to repeat'
    
    // Split into words and stream them with realistic delays
    // This helps test streaming UI components like typing indicators
    const words = text.split(' ')
    for (let i = 0; i < words.length; i++) {
      // First word has no leading space, subsequent words do
      const chunk = (i === 0 ? '' : ' ') + words[i]
      yield chunk
      
      // 100ms delay between words simulates network latency and LLM processing
      // This allows testing of streaming indicators and auto-scroll behavior
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
}
