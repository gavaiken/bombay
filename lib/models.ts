/**
 * Centralized model configuration for AI providers
 * Implements exact model specifications from PRD.md
 */

export interface ModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic';
  description: string;
  contextWindow: number;
  available: boolean;
}

/**
 * Exact models specified in PRD.md
 */
export const AVAILABLE_MODELS: Record<string, ModelConfig> = {
  // OpenAI Models
  'openai:gpt-4o': {
    id: 'openai:gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: 'OpenAI GPT-4o - Latest multimodal model with excellent reasoning',
    contextWindow: 128000,
    available: true,
  },
  'openai:gpt-4o-mini': {
    id: 'openai:gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    description: 'OpenAI GPT-4o Mini - Faster and more cost-effective',
    contextWindow: 128000,
    available: true,
  },
  
  // Anthropic Models
  'anthropic:claude-3-5-sonnet': {
    id: 'anthropic:claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    description: 'Anthropic Claude 3.5 Sonnet - Advanced reasoning and coding',
    contextWindow: 200000,
    available: true,
  },
  'anthropic:claude-3-5-haiku': {
    id: 'anthropic:claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    description: 'Anthropic Claude 3.5 Haiku - Fast and efficient',
    contextWindow: 200000,
    available: true,
  },
} as const;

/**
 * Default model for new chats (as specified in PRD)
 */
export const DEFAULT_MODEL = 'openai:gpt-4o';

/**
 * Get list of available models for UI dropdown
 */
export function getAvailableModels(): ModelConfig[] {
  return Object.values(AVAILABLE_MODELS).filter(model => model.available);
}

/**
 * Get model configuration by ID
 */
export function getModelConfig(modelId: string): ModelConfig | null {
  return AVAILABLE_MODELS[modelId] || null;
}

/**
 * Get human-friendly model name by ID
 */
export function getModelName(modelId: string): string {
  const config = getModelConfig(modelId);
  return config ? config.name : modelId;
}

/**
 * Get provider from model ID
 */
export function getProviderFromModel(modelId: string): 'openai' | 'anthropic' | null {
  const config = getModelConfig(modelId);
  return config ? config.provider : null;
}

/**
 * Extract actual model name for provider APIs (remove provider prefix)
 */
export function getProviderModelName(modelId: string): string {
  if (modelId.includes(':')) {
    return modelId.split(':')[1];
  }
  return modelId;
}

/**
 * Validate that a model ID is supported
 */
export function isValidModel(modelId: string): boolean {
  return modelId in AVAILABLE_MODELS && AVAILABLE_MODELS[modelId].available;
}

/**
 * Get models grouped by provider for UI organization
 */
export function getModelsByProvider(): Record<string, ModelConfig[]> {
  const models = getAvailableModels();
  const grouped: Record<string, ModelConfig[]> = {};
  
  for (const model of models) {
    if (!grouped[model.provider]) {
      grouped[model.provider] = [];
    }
    grouped[model.provider].push(model);
  }
  
  return grouped;
}

/**
 * Model display utilities for UI
 */
export const ModelUtils = {
  // Format model for dropdown display
  formatForDropdown: (model: ModelConfig) => ({
    value: model.id,
    label: model.name,
    description: model.description,
    provider: model.provider
  }),
  
  // Format provider name for display
  formatProviderName: (provider: 'openai' | 'anthropic'): string => {
    switch (provider) {
      case 'openai':
        return 'OpenAI';
      case 'anthropic':
        return 'Anthropic';
      default:
        return provider;
    }
  },
  
  // Get provider color for UI theming
  getProviderColor: (provider: 'openai' | 'anthropic'): string => {
    switch (provider) {
      case 'openai':
        return '#10a37f'; // OpenAI green
      case 'anthropic':
        return '#d97757'; // Anthropic orange
      default:
        return '#6b7280'; // Default gray
    }
  }
};