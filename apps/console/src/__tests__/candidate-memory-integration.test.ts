import { describe, expect, it } from 'vitest'
import {
  candidateMemorySummary,
  toSubmissionRecords,
  type CandidateRelationshipBundle,
  type CandidateSubmissionHistory,
} from '../../app/(shell)/_lib/candidate-relationship'

function history(overrides: Partial<CandidateSubmissionHistory>): CandidateSubmissionHistory {
  return {
    id: 'h1',
    candidate_id: 'cand-1',
    client_id: 'client-1',
    client_name: 'Acme',
    requisition_id: 'req-1',
    role_title: 'Backend Engineer',
    current_stage_name: null,
    status: 'in_process',
    recruiter_note: null,
    rejection_reason: null,
    rejection_stage: null,
    rejected_at: null,
    rejected_by: null,
    cooldown_until: null,
    created_at: '2026-06-01T00:00:00.000Z',
    updated_at: '2026-06-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('toSubmissionRecords', () => {
  it('maps client-side rejection to client_rejected and internal to internal_rejected', () => {
    const records = toSubmissionRecords([
      history({ id: 'a', status: 'rejected', rejected_by: 'client' }),
      history({ id: 'b', status: 'rejected', rejected_by: 'internal' }),
    ])
    expect(records.map((r) => r.status)).toEqual(['client_rejected', 'internal_rejected'])
  })

  it('maps in_process to client_interviewing and placed to placed', () => {
    const records = toSubmissionRecords([
      history({ id: 'a', status: 'in_process' }),
      history({ id: 'b', status: 'placed' }),
    ])
    expect(records.map((r) => r.status)).toEqual(['client_interviewing', 'placed'])
  })

  it('drops submissions without a client id', () => {
    expect(toSubmissionRecords([history({ client_id: null })])).toHaveLength(0)
  })
})

describe('candidateMemorySummary', () => {
  it('summarizes counts through the shared domain package', () => {
    const bundle: CandidateRelationshipBundle = {
      relationship: {
        candidate_id: 'cand-1',
        status: 'active',
        contact_preference: null,
        last_contacted_at: null,
        next_allowed_contact_at: null,
        recruiter_notes: null,
      },
      submissions: [
        history({ id: 'a', status: 'rejected', rejected_by: 'client' }),
        history({ id: 'b', status: 'in_process' }),
        history({ id: 'c', status: 'placed', client_id: 'client-2', client_name: 'Globex' }),
      ],
      timeline: [],
    }
    const memory = candidateMemorySummary(bundle)
    expect(memory.total).toBe(3)
    expect(memory.rejected).toBe(1)
    expect(memory.placed).toBe(1)
    expect(memory.active).toBe(1)
    expect(memory.byClient).toHaveLength(2)
  })
})
