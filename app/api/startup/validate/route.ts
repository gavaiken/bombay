import { NextRequest } from 'next/server';
import { validateStartup } from 'lib/startup-validation';
import { jsonError } from 'lib/errors';

export const runtime = 'nodejs';

/**
 * Admin endpoint to check startup validation status
 * Useful for deployment monitoring and troubleshooting
 */
export async function GET(req: NextRequest) {
  try {
    const results = await validateStartup();
    
    // Return validation results with appropriate HTTP status
    const httpStatus = results.overall.valid ? 200 : 503;
    
    const response = {
      timestamp: new Date().toISOString(),
      status: results.overall.valid ? 'healthy' : 'unhealthy',
      checks: {
        environment: {
          valid: results.environment.valid,
          errorCount: results.environment.errors.length,
          warningCount: results.environment.warnings.length,
          errors: results.environment.errors,
          warnings: results.environment.warnings
        },
        database: {
          valid: results.database.valid,
          errorCount: results.database.errors.length,
          warningCount: results.database.warnings.length,
          errors: results.database.errors,
          warnings: results.database.warnings
        },
        providers: {
          valid: results.providers.valid,
          errorCount: results.providers.errors.length,
          warningCount: results.providers.warnings.length,
          errors: results.providers.errors,
          warnings: results.providers.warnings
        }
      },
      summary: {
        totalErrors: results.overall.errors.length,
        totalWarnings: results.overall.warnings.length,
        allErrors: results.overall.errors,
        allWarnings: results.overall.warnings
      }
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: httpStatus,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    console.error('Startup validation endpoint error:', error);
    return jsonError('INTERNAL_ERROR', 'Failed to run startup validation', 500);
  }
}