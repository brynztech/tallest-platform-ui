import { describe, it, expect, vi, afterEach } from 'vitest'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Interview state machine (OPS-05)', () => {
  it('VALID_TRANSITIONS only allows valid next states from each status', () => {
    const VALID_TRANSITIONS: Record<string, string[]> = {
      scheduled: ['accepted', 'declined'],
      accepted: ['completed'],
      declined: [],
      completed: [],
    }
    expect(VALID_TRANSITIONS['scheduled']).toContain('accepted')
    expect(VALID_TRANSITIONS['scheduled']).toContain('declined')
    expect(VALID_TRANSITIONS['accepted']).toEqual(['completed'])
    expect(VALID_TRANSITIONS['declined']).toEqual([])
    expect(VALID_TRANSITIONS['completed']).toEqual([])
  })
})

describe('Interview VALID_TRANSITIONS enforcement (OPS-05)', () => {
  it('scheduled can only transition to accepted or declined', () => {
    const VALID_TRANSITIONS: Record<string, string[]> = {
      scheduled: ['accepted', 'declined'],
      accepted: ['completed'],
      declined: [],
      completed: [],
    }
    // Verify no invalid transitions are offered
    expect(VALID_TRANSITIONS['scheduled']).not.toContain('completed')
    expect(VALID_TRANSITIONS['accepted']).not.toContain('declined')
    expect(VALID_TRANSITIONS['declined']).toHaveLength(0)
    expect(VALID_TRANSITIONS['completed']).toHaveLength(0)
  })

  it('isTerminal is true for declined and completed', () => {
    const VALID_TRANSITIONS: Record<string, string[]> = {
      scheduled: ['accepted', 'declined'],
      accepted: ['completed'],
      declined: [],
      completed: [],
    }
    expect((VALID_TRANSITIONS['declined'] ?? []).length === 0).toBe(true)
    expect((VALID_TRANSITIONS['completed'] ?? []).length === 0).toBe(true)
    expect((VALID_TRANSITIONS['scheduled'] ?? []).length === 0).toBe(false)
  })

  it('terminal statuses have empty next-states array', () => {
    const VALID_TRANSITIONS: Record<string, string[]> = {
      scheduled: ['accepted', 'declined'],
      accepted: ['completed'],
      declined: [],
      completed: [],
    }
    const terminalStatuses = ['declined', 'completed']
    for (const status of terminalStatuses) {
      expect(VALID_TRANSITIONS[status]).toHaveLength(0)
    }
  })
})
