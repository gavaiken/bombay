export type ScopeDefUI = { key: string; name: string; sensitive: boolean }

export function computeNextActiveScopes(current: string[], toggledKey: string, enable: boolean): string[] {
  const set = new Set(current)
  if (enable) set.add(toggledKey)
  else set.delete(toggledKey)
  return Array.from(set)
}

export function shouldPromptConsent(scope: ScopeDefUI, consents: Record<string, boolean | undefined>): boolean {
  if (!scope.sensitive) return false
  return !consents[scope.key]
}