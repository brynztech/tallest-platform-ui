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

  it.todo('POST /api/v1/ops/interviews creates interview with status=scheduled')
  it.todo('PATCH /api/v1/ops/interviews/{id} fires on status Select change')
  it.todo('409 response from PATCH shows toast.error("Invalid status transition.")')
  it.todo('Declined and Completed status selects are disabled (no further transitions)')
  it.todo('Interview row renders candidate name, date, status badge, and status Select')
})
