export type CandidateRelationshipStatus = 'active' | 'paused' | 'do_not_contact' | 'placed'

export type CandidateSubmissionOutcome =
  | 'submitted'
  | 'in_process'
  | 'rejected'
  | 'withdrawn'
  | 'offer'
  | 'placed'

export type CandidateSubmissionHistory = {
  id: string
  candidate_id: string
  client_id: string | null
  client_name: string | null
  requisition_id: string | null
  role_title: string | null
  current_stage_name: string | null
  status: CandidateSubmissionOutcome
  rejection_reason: string | null
  rejection_stage: string | null
  rejected_at: string | null
  rejected_by: 'client' | 'candidate' | 'internal' | null
  cooldown_until: string | null
  created_at: string
  updated_at: string
}

export type CandidateTimelineEvent = {
  id: string
  candidate_id: string
  event_type:
    | 'profile_updated'
    | 'resume_uploaded'
    | 'submitted'
    | 'stage_changed'
    | 'rejected'
    | 'candidate_declined'
    | 'recruiter_note'
    | 'availability_changed'
  title: string
  body: string | null
  visibility: 'internal' | 'candidate'
  occurred_at: string
}

export type CandidateRelationship = {
  candidate_id: string
  status: CandidateRelationshipStatus
  contact_preference: string | null
  last_contacted_at: string | null
  next_allowed_contact_at: string | null
  recruiter_notes: string | null
}

export type CandidateRelationshipBundle = {
  relationship: CandidateRelationship
  submissions: CandidateSubmissionHistory[]
  timeline: CandidateTimelineEvent[]
}

export type SubmissionGuard = {
  level: 'block' | 'warn' | 'clear'
  title: string
  description: string
}

export const candidateRelationshipQueryKeys = {
  bundle: (candidateId: string | null) => ['candidate-relationship', candidateId] as const,
}

export async function fetchCandidateRelationship(candidateId: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/v1/supply/candidates/${candidateId}/relationship`,
  )
  if (response.status === 404) return emptyCandidateRelationshipBundle(candidateId)
  if (!response.ok) throw new Error('Failed to fetch candidate relationship')
  return response.json() as Promise<CandidateRelationshipBundle>
}

export function emptyCandidateRelationshipBundle(candidateId: string): CandidateRelationshipBundle {
  return {
    relationship: {
      candidate_id: candidateId,
      status: 'active',
      contact_preference: null,
      last_contacted_at: null,
      next_allowed_contact_at: null,
      recruiter_notes: null,
    },
    submissions: [],
    timeline: [],
  }
}

export function candidateSafeTimeline(events: CandidateTimelineEvent[]) {
  return events.filter((event) => event.visibility === 'candidate')
}

export function relationshipGuardForTarget({
  bundle,
  clientId,
  requisitionId,
}: {
  bundle: CandidateRelationshipBundle
  clientId?: string | null
  requisitionId?: string | null
}): SubmissionGuard {
  const relationship = bundle.relationship

  if (relationship.status === 'do_not_contact') {
    return {
      level: 'block',
      title: 'Do not contact',
      description: 'This candidate is marked do-not-contact. Do not submit or reach out unless a lead overrides this relationship status.',
    }
  }

  if (relationship.next_allowed_contact_at && new Date(relationship.next_allowed_contact_at) > new Date()) {
    return {
      level: 'warn',
      title: 'Candidate is in cooldown',
      description: `Next allowed contact is ${formatRelationshipDate(relationship.next_allowed_contact_at)}.`,
    }
  }

  const sameRequisition = bundle.submissions.find(
    (submission) => requisitionId && submission.requisition_id === requisitionId,
  )
  if (sameRequisition) {
    return {
      level: 'warn',
      title: 'Already submitted to this role',
      description: `${sameRequisition.client_name ?? 'This client'} already saw this candidate for ${sameRequisition.role_title ?? 'this role'} (${sameRequisition.status}).`,
    }
  }

  const sameClientRejection = bundle.submissions.find(
    (submission) =>
      clientId &&
      submission.client_id === clientId &&
      submission.status === 'rejected' &&
      (!submission.cooldown_until || new Date(submission.cooldown_until) > new Date()),
  )
  if (sameClientRejection) {
    return {
      level: 'warn',
      title: 'Previously rejected by this client',
      description: `${sameClientRejection.client_name ?? 'This client'} rejected the candidate at ${sameClientRejection.rejection_stage ?? 'a prior stage'}${sameClientRejection.rejection_reason ? `: ${sameClientRejection.rejection_reason}` : '.'}`,
    }
  }

  return {
    level: 'clear',
    title: 'No relationship conflicts',
    description: 'No duplicate submission, cooldown, or do-not-contact flag is recorded for this candidate.',
  }
}

export function formatRelationshipDate(value: string | null | undefined) {
  if (!value) return 'Not set'
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}
