import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import { 
  getAvailableModels, 
  getModelsByProvider, 
  DEFAULT_MODEL,
  ModelUtils
} from '../../../lib/models';

/**
 * GET /api/models - List available AI models
 * Returns model configuration for UI dropdowns and selection
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get models organized for UI
    const models = getAvailableModels();
    const modelsByProvider = getModelsByProvider();

    // Format for frontend consumption
    const formattedModels = models.map(model => ({
      ...ModelUtils.formatForDropdown(model),
      contextWindow: model.contextWindow,
      providerName: ModelUtils.formatProviderName(model.provider),
      providerColor: ModelUtils.getProviderColor(model.provider)
    }));

    return NextResponse.json({
      success: true,
      data: {
        models: formattedModels,
        modelsByProvider: Object.entries(modelsByProvider).reduce((acc, [provider, models]) => {
          acc[provider] = {
            name: ModelUtils.formatProviderName(provider as any),
            color: ModelUtils.getProviderColor(provider as any),
            models: models.map(model => ModelUtils.formatForDropdown(model))
          };
          return acc;
        }, {} as any),
        defaultModel: DEFAULT_MODEL,
        totalModels: models.length
      }
    });

  } catch (error) {
    console.error('Models API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}