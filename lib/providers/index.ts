/**
 * Provider Adapter Registry
 * 
 * This module routes model IDs to their corresponding provider adapters.
 * Model IDs follow the format: provider:model-name
 * 
 * Supported Providers:
 * - openai: OpenAI GPT models (gpt-4o, gpt-4o-mini)
 * - anthropic: Anthropic Claude models (claude-3-5-haiku-20241022, etc)
 * - test: Test models for development/testing (repeat-after-me)
 * 
 * @example
 * getAdapterForModel('openai:gpt-4o') // returns openaiAdapter
 * getAdapterForModel('test:repeat-after-me') // returns testAdapter
 */

import { openaiAdapter } from './openai'
import type { ProviderAdapter } from './types'

import { anthropicAdapter } from './anthropic'
import { testAdapter } from './test'

/**
 * Routes a model ID to its corresponding provider adapter
 * 
 * @param modelId - Format: "provider:model-name" (e.g., "openai:gpt-4o")
 * @returns The appropriate provider adapter or null if unsupported
 */
export function getAdapterForModel(modelId: string): ProviderAdapter | null {
  // OpenAI models: gpt-4o, gpt-4o-mini
  if (modelId.startsWith('openai:')) return openaiAdapter
  
  // Anthropic models: claude-3-5-haiku-20241022, claude-sonnet-4-20250514
  if (modelId.startsWith('anthropic:')) return anthropicAdapter
  
  // Test models: repeat-after-me (for development/testing, no API costs)
  if (modelId.startsWith('test:')) return testAdapter
  
  // Unknown provider
  return null
}
