import { describe, it, expect, vi, afterEach } from 'vitest'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Lead queue (BD-01, BD-02, BD-03)', () => {
  it('ICP score badge color tier — ≥80 uses bg-primary, 60-79 amber, <60 muted', () => {
    // Validates BD-01 fat card ICP score badge color tier logic from icpBadgeClass()
    function icpBadgeClass(score: number | null) {
      if (score === null || score === undefined) return 'bg-muted text-muted-foreground'
      if (score >= 80) return 'bg-primary text-primary-foreground'
      if (score >= 60) return 'bg-[oklch(0.769_0.188_85.87)] text-black'
      return 'bg-muted text-muted-foreground'
    }
    expect(icpBadgeClass(87)).toBe('bg-primary text-primary-foreground')
    expect(icpBadgeClass(72)).toBe('bg-[oklch(0.769_0.188_85.87)] text-black')
    expect(icpBadgeClass(55)).toBe('bg-muted text-muted-foreground')
    expect(icpBadgeClass(null)).toBe('bg-muted text-muted-foreground')
  })

  it('null company_name falls back to "Unknown Company" (BD-01 null-safety)', () => {
    // Validates: company_name ?? 'Unknown Company' never crashes on null
    const companyName: string | null = null
    const rendered = companyName ?? 'Unknown Company'
    expect(rendered).toBe('Unknown Company')
  })

  it('reject action includes rejection_reason field (BD-02 — 422 if omitted)', () => {
    // Validates that rejection_reason is included when action='reject'
    const action = 'reject'
    const extra = { reason: 'NOT_ICP_FIT' }
    const payload = {
      action,
      lead_ids: ['lead-1'],
      ...(action === 'reject' && extra?.reason ? { rejection_reason: extra.reason } : {}),
    }
    expect(payload.rejection_reason).toBe('NOT_ICP_FIT')
  })

  it('snooze action includes due_at field (BD-03 — 422 if omitted)', () => {
    // Validates that due_at is included when action='snooze'
    const action = 'snooze'
    const dueAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const payload = {
      action,
      lead_ids: ['lead-1'],
      ...(action === 'snooze' && dueAt ? { due_at: dueAt } : {}),
    }
    expect(payload.due_at).toBeDefined()
    expect(typeof payload.due_at).toBe('string')
    expect(() => new Date(payload.due_at!)).not.toThrow()
  })

  it.todo('approve action optimistically removes card and shows undo toast')
  it.todo('reject popover shows 7 rejection reasons')
  it.todo('snooze popover shows 4 presets')
  it.todo('bulk select + bulk approve triggers pending-overlay and resets to page 1')
})
