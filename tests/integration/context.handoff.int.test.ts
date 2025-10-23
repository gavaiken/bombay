import { describe, it, expect } from 'vitest'
import { buildPromptWithTruncation } from '../../lib/context'
import type { Message } from '@prisma/client'

describe('Context handoff optimization (CTX.2)', () => {
  it('injects handoff system message when model switches', async () => {
    const priorMessages: Message[] = [
      {
        id: 'm1',
        threadId: 't1',
        role: 'user',
        contentText: 'What is 2+2?',
        provider: null,
        model: null,
        usageJson: null,
        metaJson: null,
        createdAt: new Date('2025-01-01T10:00:00Z')
      },
      {
        id: 'm2',
        threadId: 't1',
        role: 'assistant',
        contentText: '2+2 equals 4.',
        provider: 'openai',
        model: 'gpt-4o',
        usageJson: null,
        metaJson: null,
        createdAt: new Date('2025-01-01T10:00:05Z')
      }
    ]

    // Switch to a different model (Anthropic Claude)
    const messages = await buildPromptWithTruncation({
      model: 'anthropic:claude-3-5-sonnet',
      prior: priorMessages,
      currentUserText: 'What is 3+3?',
      userId: 'user1'
    })

    // Should have: user message, assistant message, handoff system message, new user message
    expect(messages.length).toBe(4)
    
    // Check that handoff message was injected before the new user message
    const handoffMessage = messages[2]
    expect(handoffMessage.role).toBe('system')
    expect(handoffMessage.content).toContain('Continuing conversation from')
    expect(handoffMessage.content).toContain('GPT-4o')
    expect(handoffMessage.content).toContain('Claude 3.5 Sonnet')
    expect(handoffMessage.content).toContain('Maintain conversation context')

    // Check new user message is last
    const newUserMessage = messages[3]
    expect(newUserMessage.role).toBe('user')
    expect(newUserMessage.content).toBe('What is 3+3?')
  })

  it('does not inject handoff message when model stays the same', async () => {
    const priorMessages: Message[] = [
      {
        id: 'm1',
        threadId: 't1',
        role: 'user',
        contentText: 'Hello',
        provider: null,
        model: null,
        usageJson: null,
        metaJson: null,
        createdAt: new Date('2025-01-01T10:00:00Z')
      },
      {
        id: 'm2',
        threadId: 't1',
        role: 'assistant',
        contentText: 'Hi there!',
        provider: 'openai',
        model: 'gpt-4o',
        usageJson: null,
        metaJson: null,
        createdAt: new Date('2025-01-01T10:00:05Z')
      }
    ]

    // Continue with the same model
    const messages = await buildPromptWithTruncation({
      model: 'gpt-4o',
      prior: priorMessages,
      currentUserText: 'How are you?',
      userId: 'user1'
    })

    // Should have: user message, assistant message, new user message (no handoff)
    expect(messages.length).toBe(3)
    
    // No system message should be present
    const systemMessages = messages.filter(m => m.role === 'system')
    expect(systemMessages.length).toBe(0)
  })

  it('does not inject handoff message when there is no prior assistant message', async () => {
    const priorMessages: Message[] = [
      {
        id: 'm1',
        threadId: 't1',
        role: 'user',
        contentText: 'First message',
        provider: null,
        model: null,
        usageJson: null,
        metaJson: null,
        createdAt: new Date('2025-01-01T10:00:00Z')
      }
    ]

    const messages = await buildPromptWithTruncation({
      model: 'anthropic:claude-3-5-sonnet',
      prior: priorMessages,
      currentUserText: 'Second message',
      userId: 'user1'
    })

    // Should have: user message, new user message (no handoff)
    expect(messages.length).toBe(2)
    
    // No system message should be present
    const systemMessages = messages.filter(m => m.role === 'system')
    expect(systemMessages.length).toBe(0)
  })

  it('injects handoff message after system prompt if present', async () => {
    const priorMessages: Message[] = [
      {
        id: 'm0',
        threadId: 't1',
        role: 'system',
        contentText: 'You are a helpful assistant.',
        provider: null,
        model: null,
        usageJson: null,
        metaJson: null,
        createdAt: new Date('2025-01-01T09:59:00Z')
      },
      {
        id: 'm1',
        threadId: 't1',
        role: 'user',
        contentText: 'Tell me a fact',
        provider: null,
        model: null,
        usageJson: null,
        metaJson: null,
        createdAt: new Date('2025-01-01T10:00:00Z')
      },
      {
        id: 'm2',
        threadId: 't1',
        role: 'assistant',
        contentText: 'The sky is blue.',
        provider: 'openai',
        model: 'gpt-4o-mini',
        usageJson: null,
        metaJson: null,
        createdAt: new Date('2025-01-01T10:00:05Z')
      }
    ]

    const messages = await buildPromptWithTruncation({
      model: 'anthropic:claude-3-5-haiku',
      prior: priorMessages,
      currentUserText: 'Tell me another fact',
      userId: 'user1'
    })

    // Should have: system, user, assistant, handoff system, new user
    expect(messages.length).toBe(5)
    
    // First message should be original system prompt
    expect(messages[0].role).toBe('system')
    expect(messages[0].content).toBe('You are a helpful assistant.')
    
    // Handoff should be at index 3 (after assistant, before new user)
    const handoffMessage = messages[3]
    expect(handoffMessage.role).toBe('system')
    expect(handoffMessage.content).toContain('Continuing conversation from')
    expect(handoffMessage.content).toContain('GPT-4o Mini')
    expect(handoffMessage.content).toContain('Claude 3.5 Haiku')
  })
})
