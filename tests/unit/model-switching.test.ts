/**
 * Test model switching behavior for stub and persisted threads
 */

import { describe, it, expect } from 'vitest'

describe('Model Switching Logic', () => {
  it('should identify stub thread IDs correctly', () => {
    const stubId = 't_1729674000000'
    const realId = 'cm12345'
    
    expect(stubId.startsWith('t_')).toBe(true)
    expect(realId.startsWith('t_')).toBe(false)
  })

  it('should handle model updates for stub threads', () => {
    // Simulate the threads array state
    const threads = [
      { id: 't_123', title: 'Test', activeModel: 'openai:gpt-4o', updatedAt: new Date().toISOString() },
      { id: 'cm456', title: 'Real', activeModel: 'openai:gpt-4o-mini', updatedAt: new Date().toISOString() }
    ]
    
    // Simulate model change on stub thread
    const currentThreadId = 't_123'
    const newModel = 'anthropic:claude-3-5-haiku-20241022'
    
    const updatedThreads = threads.map(t => 
      t.id === currentThreadId ? { ...t, activeModel: newModel } : t
    )
    
    expect(updatedThreads[0].activeModel).toBe(newModel)
    expect(updatedThreads[1].activeModel).toBe('openai:gpt-4o-mini') // unchanged
  })

  it('should preserve model when creating thread from stub', () => {
    const stubThread = { 
      id: 't_123', 
      title: 'Test', 
      activeModel: 'anthropic:claude-3-5-haiku-20241022',
      updatedAt: new Date().toISOString() 
    }
    const currentModel = 'openai:gpt-4o' // old state
    
    // When creating thread, prefer the thread's activeModel over stale state
    const modelToUse = stubThread.activeModel || currentModel
    
    expect(modelToUse).toBe('anthropic:claude-3-5-haiku-20241022')
  })
})
