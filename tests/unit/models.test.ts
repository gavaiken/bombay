import { describe, it, expect } from 'vitest';
import {
  AVAILABLE_MODELS,
  DEFAULT_MODEL,
  getAvailableModels,
  getModelConfig,
  getModelName,
  getProviderFromModel,
  getProviderModelName,
  isValidModel,
  getModelsByProvider,
  ModelUtils
} from '../../lib/models';

describe('Model Configuration', () => {
  describe('AVAILABLE_MODELS', () => {
    it('contains exact models from PRD', () => {
      const expectedModels = [
        'openai:gpt-4o',
        'openai:gpt-4o-mini',
        'anthropic:claude-3-5-sonnet',
        'anthropic:claude-3-5-haiku'
      ];
      
      expectedModels.forEach(modelId => {
        expect(AVAILABLE_MODELS[modelId]).toBeDefined();
        expect(AVAILABLE_MODELS[modelId].available).toBe(true);
      });
    });

    it('has correct provider assignments', () => {
      expect(AVAILABLE_MODELS['openai:gpt-4o'].provider).toBe('openai');
      expect(AVAILABLE_MODELS['openai:gpt-4o-mini'].provider).toBe('openai');
      expect(AVAILABLE_MODELS['anthropic:claude-3-5-sonnet'].provider).toBe('anthropic');
      expect(AVAILABLE_MODELS['anthropic:claude-3-5-haiku'].provider).toBe('anthropic');
    });

    it('has realistic context windows', () => {
      expect(AVAILABLE_MODELS['openai:gpt-4o'].contextWindow).toBe(128000);
      expect(AVAILABLE_MODELS['openai:gpt-4o-mini'].contextWindow).toBe(128000);
      expect(AVAILABLE_MODELS['anthropic:claude-3-5-sonnet'].contextWindow).toBe(200000);
      expect(AVAILABLE_MODELS['anthropic:claude-3-5-haiku'].contextWindow).toBe(200000);
    });
  });

  describe('DEFAULT_MODEL', () => {
    it('is set to GPT-4o as per PRD', () => {
      expect(DEFAULT_MODEL).toBe('openai:gpt-4o');
    });

    it('default model exists in available models', () => {
      expect(AVAILABLE_MODELS[DEFAULT_MODEL]).toBeDefined();
      expect(AVAILABLE_MODELS[DEFAULT_MODEL].available).toBe(true);
    });
  });

  describe('getAvailableModels', () => {
    it('returns only available models', () => {
      const models = getAvailableModels();
      expect(models.length).toBeGreaterThan(0);
      
      models.forEach(model => {
        expect(model.available).toBe(true);
      });
    });

    it('includes all expected models', () => {
      const models = getAvailableModels();
      const modelIds = models.map(m => m.id);
      
      expect(modelIds).toContain('openai:gpt-4o');
      expect(modelIds).toContain('openai:gpt-4o-mini');
      expect(modelIds).toContain('anthropic:claude-3-5-sonnet');
      expect(modelIds).toContain('anthropic:claude-3-5-haiku');
    });
  });

  describe('getModelConfig', () => {
    it('returns config for valid model', () => {
      const config = getModelConfig('openai:gpt-4o');
      expect(config).toBeDefined();
      expect(config?.id).toBe('openai:gpt-4o');
      expect(config?.name).toBe('GPT-4o');
    });

    it('returns null for invalid model', () => {
      const config = getModelConfig('invalid:model');
      expect(config).toBeNull();
    });
  });

  describe('getModelName', () => {
    it('returns human-friendly name for valid model', () => {
      expect(getModelName('openai:gpt-4o')).toBe('GPT-4o');
      expect(getModelName('anthropic:claude-3-5-sonnet')).toBe('Claude 3.5 Sonnet');
    });

    it('returns original ID for invalid model', () => {
      expect(getModelName('invalid:model')).toBe('invalid:model');
    });
  });

  describe('getProviderFromModel', () => {
    it('returns correct provider for valid models', () => {
      expect(getProviderFromModel('openai:gpt-4o')).toBe('openai');
      expect(getProviderFromModel('anthropic:claude-3-5-haiku')).toBe('anthropic');
    });

    it('returns null for invalid model', () => {
      expect(getProviderFromModel('invalid:model')).toBeNull();
    });
  });

  describe('getProviderModelName', () => {
    it('extracts model name from provider-prefixed ID', () => {
      expect(getProviderModelName('openai:gpt-4o')).toBe('gpt-4o');
      expect(getProviderModelName('anthropic:claude-3-5-sonnet')).toBe('claude-3-5-sonnet');
    });

    it('returns original string if no colon', () => {
      expect(getProviderModelName('gpt-4o')).toBe('gpt-4o');
    });
  });

  describe('isValidModel', () => {
    it('returns true for valid models', () => {
      expect(isValidModel('openai:gpt-4o')).toBe(true);
      expect(isValidModel('anthropic:claude-3-5-haiku')).toBe(true);
    });

    it('returns false for invalid models', () => {
      expect(isValidModel('invalid:model')).toBe(false);
      expect(isValidModel('')).toBe(false);
    });
  });

  describe('getModelsByProvider', () => {
    it('groups models by provider correctly', () => {
      const grouped = getModelsByProvider();
      
      expect(grouped.openai).toBeDefined();
      expect(grouped.anthropic).toBeDefined();
      
      expect(grouped.openai.length).toBeGreaterThan(0);
      expect(grouped.anthropic.length).toBeGreaterThan(0);
      
      grouped.openai.forEach(model => {
        expect(model.provider).toBe('openai');
      });
      
      grouped.anthropic.forEach(model => {
        expect(model.provider).toBe('anthropic');
      });
    });
  });

  describe('ModelUtils', () => {
    describe('formatForDropdown', () => {
      it('formats model for UI dropdown', () => {
        const model = AVAILABLE_MODELS['openai:gpt-4o'];
        const formatted = ModelUtils.formatForDropdown(model);
        
        expect(formatted.value).toBe('openai:gpt-4o');
        expect(formatted.label).toBe('GPT-4o');
        expect(formatted.description).toContain('OpenAI GPT-4o');
        expect(formatted.provider).toBe('openai');
      });
    });

    describe('formatProviderName', () => {
      it('formats provider names for display', () => {
        expect(ModelUtils.formatProviderName('openai')).toBe('OpenAI');
        expect(ModelUtils.formatProviderName('anthropic')).toBe('Anthropic');
      });
    });

    describe('getProviderColor', () => {
      it('returns correct colors for providers', () => {
        expect(ModelUtils.getProviderColor('openai')).toBe('#10a37f');
        expect(ModelUtils.getProviderColor('anthropic')).toBe('#d97757');
      });

      it('returns default color for unknown provider', () => {
        expect(ModelUtils.getProviderColor('unknown' as any)).toBe('#6b7280');
      });
    });
  });
});

describe('Model Integration Tests', () => {
  it('all available models pass validation', () => {
    const models = getAvailableModels();
    
    models.forEach(model => {
      expect(isValidModel(model.id)).toBe(true);
      expect(getProviderFromModel(model.id)).toBeTruthy();
      expect(getProviderModelName(model.id)).toBeTruthy();
    });
  });

  it('provider routing works correctly', () => {
    const testCases = [
      { input: 'openai:gpt-4o', expectedProvider: 'openai', expectedModel: 'gpt-4o' },
      { input: 'anthropic:claude-3-5-sonnet', expectedProvider: 'anthropic', expectedModel: 'claude-3-5-sonnet' }
    ];

    testCases.forEach(({ input, expectedProvider, expectedModel }) => {
      expect(getProviderFromModel(input)).toBe(expectedProvider);
      expect(getProviderModelName(input)).toBe(expectedModel);
    });
  });

  it('default model is consistently available', () => {
    const defaultConfig = getModelConfig(DEFAULT_MODEL);
    expect(defaultConfig).toBeDefined();
    expect(defaultConfig?.available).toBe(true);
    expect(isValidModel(DEFAULT_MODEL)).toBe(true);
  });
});