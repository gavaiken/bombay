// Scopes feature — fixed registry and helpers (S0.1)

export type ScopeKey = 'profile' | 'work' | 'personal' | 'health';

export interface ScopeDef {
  key: ScopeKey;
  name: string;
  sensitive: boolean;
  policyId: string; // identifier for server-side redaction/policy engine
}

export const SCOPES_REGISTRY: ReadonlyArray<ScopeDef> = [
  { key: 'profile', name: 'Profile', sensitive: true, policyId: 'policy.profile.v1' },
  { key: 'work', name: 'Work', sensitive: false, policyId: 'policy.work.v1' },
  { key: 'personal', name: 'Personal', sensitive: false, policyId: 'policy.personal.v1' },
  { key: 'health', name: 'Health', sensitive: true, policyId: 'policy.health.v1' }
] as const;

export const DEFAULT_ACTIVE_SCOPE_KEYS: ReadonlyArray<ScopeKey> = Object.freeze([]);

export function isValidScopeKey(key: string): key is ScopeKey {
  return (SCOPES_REGISTRY as ScopeDef[]).some((s) => s.key === (key as ScopeKey));
}

export function getScopeDef(key: ScopeKey): ScopeDef {
  const def = (SCOPES_REGISTRY as ScopeDef[]).find((s) => s.key === key);
  if (!def) throw new Error(`Unknown scope key: ${key}`);
  return def;
}

export function requiresConsent(key: ScopeKey): boolean {
  const def = getScopeDef(key);
  return def.sensitive;
}