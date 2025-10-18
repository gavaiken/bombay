import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isScopesFeatureEnabled, SCOPES_FLAG_ENV } from '../../lib/scopes';

type Env = NodeJS.ProcessEnv;

let originalEnv: Env;

describe('Scopes feature flag (S0.3)', () => {
  beforeEach(() => {
    originalEnv = { ...process.env };
    delete process.env[SCOPES_FLAG_ENV];
  });
  afterEach(() => {
    process.env = originalEnv;
  });

  it('is disabled by default', () => {
    expect(isScopesFeatureEnabled()).toBe(false);
  });

  it('enables when NEXT_PUBLIC_SCOPES_ENABLED=1', () => {
    process.env[SCOPES_FLAG_ENV] = '1';
    expect(isScopesFeatureEnabled()).toBe(true);
  });

  it('enables when NEXT_PUBLIC_SCOPES_ENABLED=true', () => {
    process.env[SCOPES_FLAG_ENV] = 'true';
    expect(isScopesFeatureEnabled()).toBe(true);
  });
});