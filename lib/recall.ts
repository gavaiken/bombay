export type RecallSnippet = { scopeKey: string; content: string }
export type RecallResult = { snippets: RecallSnippet[]; usedScopes: string[] }

export interface IRecallProvider {
  getScopedContext(params: {
    userId: string
    threadId: string
    enabledScopeKeys: string[]
    query?: string
  }): Promise<RecallResult>
}

// Simple in-process stub implementation
import { applyRedaction } from './scope-policies'

class StubRecallProvider implements IRecallProvider {
  async getScopedContext(params: { userId: string; threadId: string; enabledScopeKeys: string[]; query?: string }): Promise<RecallResult> {
    const { enabledScopeKeys } = params
    const snippets: RecallSnippet[] = []
    const used = new Set<string>()

    if (enabledScopeKeys.includes('profile')) {
      const txt = applyRedaction('profile', 'Profile: general preferences available.')
      snippets.push({ scopeKey: 'profile', content: txt })
      used.add('profile')
    }
    if (enabledScopeKeys.includes('work')) {
      const txt = applyRedaction('work', 'Work note: Meeting at 2 PM. API key sk-123456 should be masked.')
      snippets.push({ scopeKey: 'work', content: txt })
      used.add('work')
    }
    if (enabledScopeKeys.includes('personal')) {
      const txt = applyRedaction('personal', 'Personal reminder: Buy a gift for mom.')
      snippets.push({ scopeKey: 'personal', content: txt })
      used.add('personal')
    }
    if (enabledScopeKeys.includes('health')) {
      const txt = applyRedaction('health', 'Health log: BP 120/80 today by John.')
      snippets.push({ scopeKey: 'health', content: txt })
      used.add('health')
    }

    return { snippets, usedScopes: Array.from(used) }
  }
}

export const recallProvider: IRecallProvider = new StubRecallProvider()