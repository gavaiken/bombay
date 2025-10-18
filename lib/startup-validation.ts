/**
 * Environment validation and startup checks utility
 * Validates required environment variables and external dependencies
 */

import { logError, logInfo, logWarn } from './logger';
import { prisma } from './prisma';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationResults {
  environment: ValidationResult;
  database: ValidationResult;
  providers: ValidationResult;
  overall: ValidationResult;
}

/**
 * Required environment variables for the application
 */
const REQUIRED_ENV_VARS = {
  // Authentication
  NEXTAUTH_SECRET: 'NextAuth secret key for session encryption',
  NEXTAUTH_URL: 'Base URL for NextAuth callbacks',
  GOOGLE_CLIENT_ID: 'Google OAuth client ID',
  GOOGLE_CLIENT_SECRET: 'Google OAuth client secret',
  
  // Database
  DATABASE_URL: 'PostgreSQL connection string',
} as const;

// AI Providers (at least one required, but not individually required)
const AI_PROVIDER_ENV_VARS = {
  OPENAI_API_KEY: 'OpenAI API key for GPT models',
  ANTHROPIC_API_KEY: 'Anthropic API key for Claude models',
} as const;

/**
 * Optional environment variables with recommended usage
 */
const OPTIONAL_ENV_VARS = {
  // Logging
  LOGTAIL_SOURCE_TOKEN: 'Better Stack Logtail token for log persistence',
  
  // Rate limiting
  UPSTASH_REDIS_REST_URL: 'Upstash Redis URL for rate limiting',
  UPSTASH_REDIS_REST_TOKEN: 'Upstash Redis token for rate limiting',
  
  // Admin access
  ADMIN_EMAIL_1: 'Primary admin email for metrics access',
  ADMIN_EMAIL_2: 'Secondary admin email for metrics access',
  
  // Development
  SEED_USER_EMAIL: 'Email for development database seeding',
  E2E_STUB_PROVIDER: 'Enable stubbed providers for E2E testing',
} as const;

/**
 * Validate environment variables
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const [key, description] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      errors.push(`Missing required environment variable: ${key} (${description})`);
    } else {
      // Additional validation for specific variables
      if (key === 'NEXTAUTH_SECRET' && value.length < 32) {
        warnings.push(`${key} should be at least 32 characters long for security`);
      }
      if (key === 'NEXTAUTH_URL' && !value.startsWith('http')) {
        errors.push(`${key} must be a valid HTTP(S) URL`);
      }
      if (key === 'DATABASE_URL' && !value.startsWith('postgresql://')) {
        errors.push(`${key} must be a valid PostgreSQL connection string`);
      }
    }
  }

  // Check that at least one AI provider is configured
  const hasOpenAI = process.env.OPENAI_API_KEY?.trim();
  const hasAnthropic = process.env.ANTHROPIC_API_KEY?.trim();
  
  if (!hasOpenAI && !hasAnthropic) {
    errors.push('At least one AI provider must be configured (OPENAI_API_KEY or ANTHROPIC_API_KEY)');
  }

  // Check optional variables and provide recommendations
  for (const [key, description] of Object.entries(OPTIONAL_ENV_VARS)) {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      if (key === 'LOGTAIL_SOURCE_TOKEN') {
        warnings.push(`Consider setting ${key} for persistent logging in production`);
      }
      if (key === 'ADMIN_EMAIL_1') {
        warnings.push(`Consider setting ${key} to access admin metrics endpoint`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate database connection and schema
 */
export async function validateDatabase(): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Test basic database connection
    await prisma.$queryRaw`SELECT 1 as test`;
    
    // Check that required tables exist
    const tables = ['User', 'Thread', 'Message'];
    
    for (const table of tables) {
      try {
        // Check if table exists by querying it
        if (table === 'User') {
          await prisma.user.count();
        } else if (table === 'Thread') {
          await prisma.thread.count();
        } else if (table === 'Message') {
          await prisma.message.count();
        }
      } catch (error) {
        errors.push(`Database table '${table}' is missing or inaccessible`);
      }
    }

    // Check for any pending migrations (in a production-ready app, you might want to check migration status)
    // For now, we'll just verify the core schema works
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    errors.push(`Database connection failed: ${message}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate AI provider API keys
 */
export async function validateProviders(): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Test OpenAI API key if present
  if (process.env.OPENAI_API_KEY) {
    try {
      // Make a minimal test call to OpenAI
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        if (response.status === 401) {
          errors.push('OpenAI API key is invalid or expired');
        } else {
          errors.push(`OpenAI API returned ${response.status}: ${response.statusText}`);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        warnings.push('OpenAI API request timed out (may indicate network issues)');
      } else {
        warnings.push(`Failed to validate OpenAI API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  // Test Anthropic API key if present
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      // Make a minimal test call to Anthropic
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.ANTHROPIC_API_KEY}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }],
        }),
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        if (response.status === 401) {
          errors.push('Anthropic API key is invalid or expired');
        } else if (response.status === 400) {
          // A 400 with our minimal request might be expected, we just want to verify auth
          // If we get a 400, it means the API key was accepted but the request was bad
        } else {
          errors.push(`Anthropic API returned ${response.status}: ${response.statusText}`);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        warnings.push('Anthropic API request timed out (may indicate network issues)');
      } else {
        warnings.push(`Failed to validate Anthropic API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Run all validation checks
 */
export async function validateStartup(): Promise<ValidationResults> {
  const results: ValidationResults = {
    environment: validateEnvironment(),
    database: await validateDatabase(),
    providers: await validateProviders(),
    overall: { valid: true, errors: [], warnings: [] }
  };

  // Combine all results
  const allErrors = [
    ...results.environment.errors,
    ...results.database.errors,
    ...results.providers.errors
  ];

  const allWarnings = [
    ...results.environment.warnings,
    ...results.database.warnings,
    ...results.providers.warnings
  ];

  results.overall = {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };

  return results;
}

/**
 * Log validation results and exit if critical errors are found
 */
export async function performStartupValidation(): Promise<void> {
  await logInfo('Starting application validation checks...');

  try {
    const results = await validateStartup();

    // Log warnings
    for (const warning of results.overall.warnings) {
      await logWarn(`Startup validation warning: ${warning}`);
    }

    // Log errors and exit if validation failed
    if (!results.overall.valid) {
      await logError('Startup validation failed. Application cannot start safely.', {
        environmentErrors: results.environment.errors,
        databaseErrors: results.database.errors,
        providerErrors: results.providers.errors
      });

      console.error('\n❌ Startup Validation Failed:');
      for (const error of results.overall.errors) {
        console.error(`  • ${error}`);
      }

      if (results.overall.warnings.length > 0) {
        console.warn('\n⚠️  Warnings:');
        for (const warning of results.overall.warnings) {
          console.warn(`  • ${warning}`);
        }
      }

      console.error('\nApplication will not start. Please fix the above issues and try again.\n');
      
      // In a production environment, you might want to exit the process
      // process.exit(1);
      
      throw new Error('Startup validation failed');
    }

    await logInfo('Startup validation completed successfully', {
      warningCount: results.overall.warnings.length
    });

    if (results.overall.warnings.length > 0) {
      console.warn(`\n⚠️  Application started with ${results.overall.warnings.length} warnings. Consider addressing them for optimal operation.\n`);
    } else {
      console.log('\n✅ All startup validation checks passed.\n');
    }

  } catch (error) {
    await logError('Critical error during startup validation', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}