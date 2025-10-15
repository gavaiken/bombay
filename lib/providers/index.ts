import { openaiAdapter } from './openai'
import type { ProviderAdapter } from './types'

import { anthropicAdapter } from './anthropic'
import { testAdapter } from './test'

export function getAdapterForModel(modelId: string): ProviderAdapter | null {
  if (modelId.startsWith('openai:')) return openaiAdapter
  if (modelId.startsWith('anthropic:')) return anthropicAdapter
  if (modelId.startsWith('test:')) return testAdapter
  return null
}
