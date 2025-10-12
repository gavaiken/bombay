import { openaiAdapter } from './openai'
import type { ProviderAdapter } from './types'

import { anthropicAdapter } from './anthropic'

export function getAdapterForModel(modelId: string): ProviderAdapter | null {
  if (modelId.startsWith('openai:')) return openaiAdapter
  if (modelId.startsWith('anthropic:')) return anthropicAdapter
  return null
}
