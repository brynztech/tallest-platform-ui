import { describe, expect, it } from 'vitest'
import {
  candidateSafeTimeline,
  emptyCandidateRelationshipBundle,
  relationshipGuardForTarget,
  type CandidateRelationshipBundle,
} from '../../app/(shell)/_lib/candidate-relationship'

const baseBundle: CandidateRelationshipBundle = {
  relationship: {
    candidate_id: 'cand-1',
    status: 'active',
    contact_preference: 'Email first',
    last_contacted_at: null,
    next_allowed_contact_at: null,
    recruiter_notes: null,
  },
  submissions: [],
  timeline: [],
}

describe('Candidate relationship guardrails', () => {
  it('creates an empty active relationship bundle when no backend memory exists yet', () => {
    expect(emptyCandidateRelationshipBundle('cand-1')).toMatchObject({
      relationship: {
        candidate_id: 'cand-1',
        status: 'active',
      },
      submissions: [],
      timeline: [],
    })
  })

  it('blocks do-not-contact candidates', () => {
    const guard = relationshipGuardForTarget({
      bundle: {
        ...baseBundle,
        relationship: { ...baseBundle.relationship, status: 'do_not_contact' },
      },
      clientId: 'client-1',
    })

    expect(guard.level).toBe('block')
    expect(guard.title).toBe('Do not contact')
  })

  it('warns when a candidate is still in cooldown', () => {
    const guard = relationshipGuardForTarget({
      bundle: {
        ...baseBundle,
        relationship: {
          ...baseBundle.relationship,
          next_allowed_contact_at: '2999-01-01T00:00:00.000Z',
        },
      },
    })

    expect(guard.level).toBe('warn')
    expect(guard.title).toBe('Candidate is in cooldown')
  })

  it('warns on duplicate submission to the same requisition', () => {
    const guard = relationshipGuardForTarget({
      bundle: {
        ...baseBundle,
        submissions: [
          {
            id: 'sub-history-1',
            candidate_id: 'cand-1',
            client_id: 'client-1',
            client_name: 'Acme',
            requisition_id: 'req-1',
            role_title: 'Frontend Engineer',
            current_stage_name: 'Technical Interview',
            status: 'in_process',
            recruiter_note: null,
            rejection_reason: null,
            rejection_stage: null,
            rejected_at: null,
            rejected_by: null,
            cooldown_until: null,
            created_at: '2026-07-01T00:00:00.000Z',
            updated_at: '2026-07-01T00:00:00.000Z',
          },
        ],
      },
      requisitionId: 'req-1',
    })

    expect(guard.level).toBe('warn')
    expect(guard.title).toBe('Already submitted to this role')
  })

  it('warns on active same-client rejection memory', () => {
    const guard = relationshipGuardForTarget({
      bundle: {
        ...baseBundle,
        submissions: [
          {
            id: 'sub-history-2',
            candidate_id: 'cand-1',
            client_id: 'client-1',
            client_name: 'Acme',
            requisition_id: 'req-old',
            role_title: 'Backend Engineer',
            current_stage_name: 'Technical Interview',
            status: 'rejected',
            recruiter_note: 'System design depth was not enough for this role.',
            rejection_reason: 'System design depth was not enough for this role.',
            rejection_stage: 'Technical Interview',
            rejected_at: '2026-07-01T00:00:00.000Z',
            rejected_by: 'client',
            cooldown_until: '2999-01-01T00:00:00.000Z',
            created_at: '2026-07-01T00:00:00.000Z',
            updated_at: '2026-07-01T00:00:00.000Z',
          },
        ],
      },
      clientId: 'client-1',
    })

    expect(guard.level).toBe('warn')
    expect(guard.title).toBe('Previously rejected by this client')
  })

  it('filters internal recruiter notes out of candidate-safe timelines', () => {
    const safeEvents = candidateSafeTimeline([
      {
        id: 'event-1',
        candidate_id: 'cand-1',
        event_type: 'profile_updated',
        title: 'Profile updated',
        body: null,
        visibility: 'candidate',
        occurred_at: '2026-07-01T00:00:00.000Z',
      },
      {
        id: 'event-2',
        candidate_id: 'cand-1',
        event_type: 'recruiter_note',
        title: 'Internal calibration note',
        body: 'Do not show this to the candidate.',
        visibility: 'internal',
        occurred_at: '2026-07-01T00:00:00.000Z',
      },
    ])

    expect(safeEvents).toHaveLength(1)
    expect(safeEvents[0].id).toBe('event-1')
  })
})
