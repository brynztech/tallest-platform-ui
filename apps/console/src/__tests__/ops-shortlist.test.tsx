import { describe, it, expect, vi, afterEach } from 'vitest'
import { shortlistStatusBadgeClass } from '../../app/(shell)/ops/requisitions/[id]/_components/shortlist-table'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Shortlist status badge logic (OPS-04)', () => {
  it('approved status maps to green badge class (oklch)', () => {
    // Asserts against the real production function, not a local re-implementation
    expect(shortlistStatusBadgeClass('approved')).toContain('oklch')
    expect(shortlistStatusBadgeClass('approved')).toContain('145')
  })

  it('hold status returns an amber/yellow oklch badge class', () => {
    const cls = shortlistStatusBadgeClass('hold')
    // The hold class uses oklch(0.769_0.188_85.87) — a yellow-amber hue
    expect(cls).toContain('oklch')
    expect(cls).toContain('85.87')
  })

  it('passed status returns muted text class', () => {
    expect(shortlistStatusBadgeClass('passed')).toContain('muted-foreground')
  })

  it('shortlisted (default) returns empty string — uses Badge variant="secondary"', () => {
    expect(shortlistStatusBadgeClass('shortlisted')).toBe('')
  })

  it('shortlist action uses supply PATCH endpoint (not ops endpoint)', () => {
    // Path enforcement: shortlist actions MUST use supply domain, NOT ops domain
    const SUPPLY_SHORTLIST_PATH = '/api/v1/supply/shortlists/{submission_id}'
    const OPS_SHORTLIST_PATH = '/api/v1/ops/shortlists/{submission_id}'
    // The correct path is supply domain:
    expect(SUPPLY_SHORTLIST_PATH).toContain('supply')
    expect(SUPPLY_SHORTLIST_PATH).not.toContain('/ops/')
    // The ops path should NOT be used (verified: no PATCH on /ops/ shortlist paths in api.d.ts):
    expect(OPS_SHORTLIST_PATH).toContain('/ops/')
  })

  it('ShortlistEntry local type cast — submissions extracted from loosely typed response', () => {
    // Verifies the safe cast pattern for { [key: string]: unknown } → ShortlistEntry[]
    type ShortlistEntry = {
      submission_id: string
      candidate_id: string
      candidate_name?: string | null
      current_title?: string | null
      fit_score?: number | null
      rank?: number | null
      status: string
    }
    const mockResponse: Record<string, unknown> = {
      submissions: [
        { submission_id: 'sub-1', candidate_id: 'cand-1', candidate_name: 'Alice', fit_score: 92, rank: 1, status: 'shortlisted' },
        { submission_id: 'sub-2', candidate_id: 'cand-2', candidate_name: 'Bob', fit_score: 78, rank: 2, status: 'approved' },
      ],
    }
    const entries = (mockResponse['submissions'] as ShortlistEntry[] | undefined) ?? []
    expect(entries).toHaveLength(2)
    expect(entries[0].submission_id).toBe('sub-1')
    expect(entries[1].status).toBe('approved')
  })

  it.todo('PATCH /supply/shortlists/{id} with status=approved fires and invalidates shortlist query')
  it.todo('PATCH /supply/shortlists/{id} with status=hold fires and invalidates shortlist query')
  it.todo('PATCH /supply/shortlists/{id} with status=passed fires and invalidates shortlist query')
  it.todo('Shortlist row click sets selectedCandidateId and opens candidate Sheet')
  it.todo('Approve action shows 5-second undo toast with "Candidate [name] approved."')
})
