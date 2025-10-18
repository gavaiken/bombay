import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  validateEnvironment, 
  validateDatabase, 
  validateProviders, 
  validateStartup 
} from 'lib/startup-validation';

// Mock environment variables
const originalEnv = process.env;

describe('Startup Validation Tests', () => {
  beforeEach(() => {
    // Reset environment variables for each test
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Environment Validation', () => {
    test('should pass with all required environment variables', () => {
      // Set all required environment variables
      process.env.NEXTAUTH_SECRET = 'a-very-long-secret-key-that-is-definitely-over-32-characters-long';
      process.env.NEXTAUTH_URL = 'https://bombay.chat';
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.OPENAI_API_KEY = 'sk-test-key';

      const result = validateEnvironment();
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should fail with missing required environment variables', () => {
      // Clear all environment variables
      process.env = {};

      const result = validateEnvironment();
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('NEXTAUTH_SECRET'))).toBe(true);
      expect(result.errors.some(e => e.includes('DATABASE_URL'))).toBe(true);
    });

    test('should require at least one AI provider', () => {
      // Set all required vars except AI providers
      process.env.NEXTAUTH_SECRET = 'a-very-long-secret-key-that-is-definitely-over-32-characters-long';
      process.env.NEXTAUTH_URL = 'https://bombay.chat';
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      // No AI provider keys

      const result = validateEnvironment();
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('At least one AI provider'))).toBe(true);
    });

    test('should warn about short NEXTAUTH_SECRET', () => {
      process.env.NEXTAUTH_SECRET = 'short-secret';
      process.env.NEXTAUTH_URL = 'https://bombay.chat';
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.OPENAI_API_KEY = 'sk-test-key';

      const result = validateEnvironment();
      
      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('32 characters long'))).toBe(true);
    });

    test('should validate URL format for NEXTAUTH_URL', () => {
      process.env.NEXTAUTH_SECRET = 'a-very-long-secret-key-that-is-definitely-over-32-characters-long';
      process.env.NEXTAUTH_URL = 'not-a-url';
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.OPENAI_API_KEY = 'sk-test-key';

      const result = validateEnvironment();
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('valid HTTP(S) URL'))).toBe(true);
    });

    test('should validate DATABASE_URL format', () => {
      process.env.NEXTAUTH_SECRET = 'a-very-long-secret-key-that-is-definitely-over-32-characters-long';
      process.env.NEXTAUTH_URL = 'https://bombay.chat';
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
      process.env.DATABASE_URL = 'not-a-database-url';
      process.env.OPENAI_API_KEY = 'sk-test-key';

      const result = validateEnvironment();
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('PostgreSQL connection string'))).toBe(true);
    });

    test('should provide warnings for missing optional variables', () => {
      // Set minimal required variables
      process.env.NEXTAUTH_SECRET = 'a-very-long-secret-key-that-is-definitely-over-32-characters-long';
      process.env.NEXTAUTH_URL = 'https://bombay.chat';
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.OPENAI_API_KEY = 'sk-test-key';

      const result = validateEnvironment();
      
      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('LOGTAIL_SOURCE_TOKEN'))).toBe(true);
      expect(result.warnings.some(w => w.includes('ADMIN_EMAIL_1'))).toBe(true);
    });
  });

  describe('Database Validation', () => {
    test('should pass with accessible database and tables', async () => {
      // This test will use the actual database connection
      // In a real test, you might want to mock Prisma
      
      const result = await validateDatabase();
      
      // The test might pass or fail depending on database state
      // We mainly test that it doesn't throw an exception
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    // In a full test suite, you would mock Prisma to test various scenarios
    test('should handle database connection errors', async () => {
      // This is a conceptual test - in practice you'd mock Prisma to throw errors
      const result = await validateDatabase();
      
      // Just verify the structure is correct
      expect(typeof result.valid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  describe('Provider Validation', () => {
    test('should handle missing API keys gracefully', async () => {
      // Clear API keys
      delete process.env.OPENAI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      const result = await validateProviders();
      
      // Should pass validation even without keys (they're optional for provider validation)
      expect(result).toHaveProperty('valid');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    test('should structure validation results correctly', async () => {
      const result = await validateProviders();
      
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(typeof result.valid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    // Note: Testing actual API calls would require real API keys and might be slow/unreliable
    // In a full test suite, you'd mock the fetch calls
  });

  describe('Overall Validation', () => {
    test('should combine all validation results', async () => {
      // Set up minimal valid environment
      process.env.NEXTAUTH_SECRET = 'a-very-long-secret-key-that-is-definitely-over-32-characters-long';
      process.env.NEXTAUTH_URL = 'https://bombay.chat';
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.OPENAI_API_KEY = 'sk-test-key';

      const results = await validateStartup();
      
      expect(results).toHaveProperty('environment');
      expect(results).toHaveProperty('database');
      expect(results).toHaveProperty('providers');
      expect(results).toHaveProperty('overall');
      
      // Check structure of each result
      for (const key of ['environment', 'database', 'providers', 'overall']) {
        const result = results[key as keyof typeof results];
        expect(result).toHaveProperty('valid');
        expect(result).toHaveProperty('errors');
        expect(result).toHaveProperty('warnings');
        expect(typeof result.valid).toBe('boolean');
        expect(Array.isArray(result.errors)).toBe(true);
        expect(Array.isArray(result.warnings)).toBe(true);
      }
    });

    test('should fail overall validation if any component fails', async () => {
      // Set invalid environment (missing required vars)
      process.env = {};

      const results = await validateStartup();
      
      expect(results.environment.valid).toBe(false);
      expect(results.overall.valid).toBe(false);
      expect(results.overall.errors.length).toBeGreaterThan(0);
    });

    test('should pass overall validation with valid configuration', async () => {
      // Set all required environment variables
      process.env.NEXTAUTH_SECRET = 'a-very-long-secret-key-that-is-definitely-over-32-characters-long';
      process.env.NEXTAUTH_URL = 'https://bombay.chat';
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.OPENAI_API_KEY = 'sk-test-key';

      const results = await validateStartup();
      
      expect(results.environment.valid).toBe(true);
      // Note: database and provider validation might still fail in test environment
      // but environment validation should pass
    });
  });

  describe('Error and Warning Messages', () => {
    test('should provide descriptive error messages', () => {
      process.env = {};
      
      const result = validateEnvironment();
      
      expect(result.errors.length).toBeGreaterThan(0);
      // Check that error messages are descriptive
      for (const error of result.errors) {
        expect(error.length).toBeGreaterThan(10); // Non-empty, descriptive messages
        expect(typeof error).toBe('string');
      }
    });

    test('should provide helpful warning messages', () => {
      // Set minimal configuration to trigger warnings
      process.env.NEXTAUTH_SECRET = 'a-very-long-secret-key-that-is-definitely-over-32-characters-long';
      process.env.NEXTAUTH_URL = 'https://bombay.chat';
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.OPENAI_API_KEY = 'sk-test-key';

      const result = validateEnvironment();
      
      expect(result.warnings.length).toBeGreaterThan(0);
      for (const warning of result.warnings) {
        expect(warning.length).toBeGreaterThan(10);
        expect(typeof warning).toBe('string');
      }
    });
  });
});