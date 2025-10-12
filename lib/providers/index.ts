import { openaiAdapter } from './openai'
import type { ProviderAdapter } from './types'

export function getAdapterForModel(modelId: string): ProviderAdapter | null {
  if (modelId.startsWith('openai:')) return openaiAdapter
  return null
}