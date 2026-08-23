/**
 * Tests for the recruiter-module feature set (backend FEATURE_SPEC.md):
 * - Feature 3: compensation PATCH hits the scoped endpoint.
 * - Feature 6: acting_user_id sent on scoped shortlist fetches; 403'd
 *   requisitions drop out of the pipeline rows.
 *
 * Data-layer only — this repo's vitest pipeline doesn't transform JSX, so
 * component render tests aren't possible here (no existing test renders a
 * component either); card behavior (disabled+title, CTC row) is covered by
 * typecheck + the manual test plan (TEST_PLAN.md).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  fetchRecruiterShortlist,
  updateCandidateCompensation,
} from '../../app/(shell)/my-roles/[id]/_lib/shortlist'
import { fetchPipelineSubmissions } from '../../app/(shell)/_lib/recruiter-data'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Feature 3 — compensation data layer', () => {
  it('updateCandidateCompensation PATCHes the scoped endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ candidate_id: 'cand-1', ctc: 1, ectc: 2 }), { status: 200 }),
    )
    await updateCandidateCompensation('cand-1', 'usr_recruiter', { ctc: 1, ectc: 2 })
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('/api/v1/supply/candidates/cand-1/compensation')
    expect(String(url)).toContain('acting_user_id=usr_recruiter')
    expect(init?.method).toBe('PATCH')
    expect(JSON.parse(String(init?.body))).toEqual({ ctc: 1, ectc: 2 })
  })

  it('throws on a 403 (unassigned caller)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('forbidden', { status: 403 }))
    await expect(
      updateCandidateCompensation('cand-1', 'usr_stranger', { ctc: 1, ectc: 2 }),
    ).rejects.toThrow('403')
  })
})

describe('Feature 6 — acting_user_id on scoped fetches', () => {
  it('fetchRecruiterShortlist sends acting_user_id only when given', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () =>
        new Response(JSON.stringify({ requisition_id: 'req-1', submissions: [], total: 0 }), {
          status: 200,
        }),
    )
    await fetchRecruiterShortlist('req-1', 'usr_recruiter')
    expect(String(fetchMock.mock.calls[0][0])).toContain('acting_user_id=usr_recruiter')
    expect(String(fetchMock.mock.calls[0][0])).toContain('include_pending=true')

    await fetchRecruiterShortlist('req-1')
    expect(String(fetchMock.mock.calls[1][0])).not.toContain('acting_user_id')
  })

  it('fetchPipelineSubmissions sends acting_user_id and drops 403 requisitions', async () => {
    const requisitions = [
      { id: 'req-allowed', client: null },
      { id: 'req-denied', client: null },
    ] as never[]
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      if (String(url).includes('req-denied')) return new Response('forbidden', { status: 403 })
      expect(String(url)).toContain('acting_user_id=usr_recruiter')
      return new Response(
        JSON.stringify({ submissions: [{ id: 'sub-1', status: 'approved' }] }),
        { status: 200 },
      )
    })
    const rows = await fetchPipelineSubmissions(requisitions, 'usr_recruiter')
    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe('sub-1')
  })

  it('fetchPipelineSubmissions omits acting_user_id for view-all managers', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ submissions: [] }), { status: 200 }),
    )
    await fetchPipelineSubmissions([{ id: 'req-1', client: null }] as never[])
    expect(String(fetchMock.mock.calls[0][0])).not.toContain('acting_user_id')
  })
})
