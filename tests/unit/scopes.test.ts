import { describe, it, expect } from 'vitest';
import { SCOPES_REGISTRY, DEFAULT_ACTIVE_SCOPE_KEYS, isValidScopeKey, getScopeDef, requiresConsent, SENSITIVE_SCOPE_KEYS } from '../../lib/scopes';

describe('Scopes registry (S0.1)', () => {
  it('exports an empty default active scopes array (privacy-first)', () => {
    expect(Array.isArray(DEFAULT_ACTIVE_SCOPE_KEYS)).toBe(true);
    expect(DEFAULT_ACTIVE_SCOPE_KEYS.length).toBe(0);
  });

  it('contains the four fixed scopes with correct properties', () => {
    const keys = SCOPES_REGISTRY.map((s) => s.key);
    expect(keys.sort()).toEqual(['health', 'personal', 'profile', 'work'].sort());
    // Uniqueness
    expect(new Set(keys).size).toBe(keys.length);

    const profile = getScopeDef('profile');
    expect(profile.name).toBe('Profile');
    expect(profile.sensitive).toBe(true);

    const work = getScopeDef('work');
    expect(work.sensitive).toBe(false);

    const personal = getScopeDef('personal');
    expect(personal.sensitive).toBe(false);

    const health = getScopeDef('health');
    expect(health.sensitive).toBe(true);
  });

  it('validates keys correctly', () => {
    expect(isValidScopeKey('work')).toBe(true);
    expect(isValidScopeKey('unknown')).toBe(false);
  });

  it('requires consent only for sensitive scopes', () => {
    expect(requiresConsent('profile')).toBe(true);
    expect(requiresConsent('health')).toBe(true);
    expect(requiresConsent('work')).toBe(false);
    expect(requiresConsent('personal')).toBe(false);
  });
});

describe('Scopes consent policy (S0.2)', () => {
  it('lists sensitive scope keys explicitly', () => {
    expect([...SENSITIVE_SCOPE_KEYS].sort()).toEqual(['health', 'profile'].sort());
  });
});
