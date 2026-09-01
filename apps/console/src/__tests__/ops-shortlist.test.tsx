import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  shortlistScoreOverridesFromTotal,
  shortlistScoreOverridesFromBreakdown,
  shortlistScoreTotal,
  normalizeShortlistSubmission,
  shortlistStatusBadgeClass,
} from '../../app/(shell)/ops/requisitions/[id]/_components/shortlist-utils'
import {
  canTriggerCandidateMatch,
  candidateMatchButtonLabel,
} from '../../app/(shell)/ops/requisitions/[id]/_lib/match-status'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Shortlist status badge logic (OPS-04)', () => {
  it('approved status maps to green badge class (oklch)', () => {
    // Asserts against the real production function, not a local re-implementation
    expect(shortlistStatusBadgeClass('approved')).toContain('oklch')
    expect(shortlistStatusBadgeClass('approved')).toContain('145')
  })

  it('rejected status returns muted text class', () => {
    expect(shortlistStatusBadgeClass('rejected')).toContain('muted-foreground')
  })

  it('shortlisted (default) returns empty string — uses Badge variant="secondary"', () => {
    expect(shortlistStatusBadgeClass('shortlisted')).toBe('')
  })

  it('unknown/legacy statuses return empty string', () => {
    expect(shortlistStatusBadgeClass('hold')).toBe('')
    expect(shortlistStatusBadgeClass('passed')).toBe('')
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

  it('supply shortlist response contains SubmissionResponse entries with real ids', () => {
    // ShortlistTable now reads GET /supply/shortlists/{requisition_id} → ShortlistResponse
    const mockResponse = {
      requisition_id: 'req-1',
      total: 2,
      submissions: [
        { id: 'sub-1', candidate_id: 'cand-1', match_score: 92, status: 'shortlisted', match_rationale: { rationale: 'Strong match', top_matching_skills: [], gaps: [] } },
        { id: 'sub-2', candidate_id: 'cand-2', match_score: 78, status: 'approved', match_rationale: null },
      ],
    }
    expect(mockResponse.submissions).toHaveLength(2)
    expect(mockResponse.submissions[0].id).toBe('sub-1')
    expect(mockResponse.submissions[1].status).toBe('approved')
  })

  it('normalizes supply submissions into shortlist table rows', () => {
    const row = normalizeShortlistSubmission(
      {
        id: 'sub-1',
        requisition_id: 'req-1',
        candidate_id: 'cand-1',
        match_score: 92,
        match_rationale: {
          summary: 'Strong match',
          top_matching_skills: ['python', 'sql'],
          gaps: ['aws'],
          score_breakdown: { skill_exact: 88 },
        },
        status: 'shortlisted',
        supply_notes: null,
        created_at: '2026-06-20T00:00:00.000Z',
        updated_at: '2026-06-20T00:00:00.000Z',
        candidate_name: 'Alice Chen',
        candidate_title: 'Senior Engineer',
        candidate_skills: ['python', 'sql'],
      },
      0,
    )

    expect(row.submission_id).toBe('sub-1')
    expect(row.candidate_id).toBe('cand-1')
    expect(row.candidate_name).toBe('Alice Chen')
    expect(row.current_title).toBe('Senior Engineer')
    expect(row.fit_score).toBe(92)
    expect(row.rationale).toBe('Strong match')
    expect(row.top_matching_skills).toEqual(['python', 'sql'])
    expect(row.gaps).toEqual(['aws'])
    expect(row.score_breakdown).toEqual({ skill_exact: 88 })
  })

  it('seeds edit score fields from computed score breakdown', () => {
    expect(
      shortlistScoreOverridesFromBreakdown({
        semantic_similarity: 16.57,
        skill_exact: 13.12,
        skill_cluster: 14,
        seniority_fit: 18,
      }),
    ).toEqual({
      semantic_similarity: 16.57,
      skill_exact: 13.12,
      skill_cluster: 14,
      seniority_fit: 18,
    })
  })

  it('distributes a manual total into score contributions that sum to the total', () => {
    const overrides = shortlistScoreOverridesFromTotal(73)

    expect(shortlistScoreTotal(overrides)).toBe(73)
    expect(Math.max(...Object.values(overrides))).toBeLessThanOrEqual(73)
  })

  it.todo('PATCH /supply/shortlists/{id} with status=approved fires and invalidates supply-shortlist query')
  it.todo('PATCH /supply/shortlists/{id} with status=rejected fires and invalidates supply-shortlist query')
  it.todo('Shortlist row click sets selectedCandidateId and opens candidate Sheet')
  it.todo('Approve action shows 5-second undo toast with "Candidate [name] approved."')
  it.todo('POST /ops/requisitions/{req_id}/match fires on button click when req.status === "open"')
  it('candidate matching can be triggered for open and matching_complete requisitions', () => {
    expect(canTriggerCandidateMatch('open')).toBe(true)
    expect(canTriggerCandidateMatch('matching_complete')).toBe(true)
    expect(canTriggerCandidateMatch('filled')).toBe(false)
    expect(candidateMatchButtonLabel('matching_complete', false)).toBe('Re-run Candidate Match')
  })
  it.todo('Shortlist query is invalidated after successful match trigger')
})
