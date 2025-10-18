export function applyRedaction(scopeKey: string, text: string): string {
  switch (scopeKey) {
    case 'work':
      // Mask API key-like tokens
      return text.replace(/sk-[A-Za-z0-9_-]+/g, 'sk-***')
    case 'health':
      // Mask simple proper names (titlecase words) as a naive PII guard
      return text.replace(/\b([A-Z][a-z]{2,})\b/g, '[REDACTED]')
    case 'profile':
    case 'personal':
    default:
      return text
  }
}