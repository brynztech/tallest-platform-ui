import { http, HttpResponse } from 'msw'
import type { HttpHandler } from 'msw'
import { API_BASE } from '../base-url'

// MSW-only contract proposal — the internal quality-review gate queue.
// Lists submissions awaiting internal (BrynzIT) approval before the client sees
// them. Not yet implemented in the backend; shared future surface. DELETE when
// the real endpoint ships.

export type InternalReviewItem = {
  submission_id: string
  candidate_id: string
  candidate_name: string
  requisition_id: string
  role_title: string
  client_id: string
  client_name: string
  ai_recommendation: 'advance' | 'reject' | 'unknown'
  ai_score: number | null
  ai_rationale: string | null
  submitted_by: string | null
  submitted_at: string
}

function seedQueue(): InternalReviewItem[] {
  const now = Date.now()
  return [
    {
      submission_id: 'sub-review-001',
      candidate_id: '00000000-0000-0000-0000-candidate0002',
      candidate_name: 'David Park',
      requisition_id: '00000000-0000-0000-0000-req000000001',
      role_title: 'Senior Backend Engineer',
      client_id: '00000000-0000-0000-0000-client000001',
      client_name: 'Acme Corp',
      ai_recommendation: 'advance',
      ai_score: 88,
      ai_rationale: 'Strong distributed-systems background; matches core requirements.',
      submitted_by: 'usr_recruiter',
      submitted_at: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
    },
    {
      submission_id: 'sub-review-002',
      candidate_id: '00000000-0000-0000-0000-candidate0003',
      candidate_name: 'Sara Okonkwo',
      requisition_id: '00000000-0000-0000-0000-req000000001',
      role_title: 'Senior Backend Engineer',
      client_id: '00000000-0000-0000-0000-client000001',
      client_name: 'Acme Corp',
      ai_recommendation: 'reject',
      ai_score: 41,
      ai_rationale: 'Limited backend depth at required scale; AI suggests not advancing.',
      submitted_by: 'usr_recruiter',
      submitted_at: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
    },
    {
      submission_id: 'sub-review-003',
      candidate_id: '00000000-0000-0000-0000-candidate0004',
      candidate_name: 'Marcus Lee',
      requisition_id: '00000000-0000-0000-0000-req000000009',
      role_title: 'Platform Engineer',
      client_id: '00000000-0000-0000-0000-client000002',
      client_name: 'Globex',
      ai_recommendation: 'advance',
      ai_score: 76,
      ai_rationale: 'Good infra fit; some gaps in observability tooling.',
      submitted_by: 'usr_recruiter',
      submitted_at: new Date(now - 1000 * 60 * 60 * 20).toISOString(),
    },
  ]
}

// In-memory queue for the dev session. Decisions remove items so the UI reflects
// progress. Resets on server restart.
let queue: InternalReviewItem[] = seedQueue()

export const qualityHandlers: HttpHandler[] = [
  http.get(`${API_BASE}/api/v1/supply/internal-review-queue`, () => {
    return HttpResponse.json({ items: queue })
  }),

  http.post(
    `${API_BASE}/api/v1/supply/internal-review-queue/:submission_id/decision`,
    async ({ params, request }) => {
      const submissionId = params.submission_id as string
      const body = (await request.json().catch(() => ({}))) as {
        action?: 'approve' | 'reject' | 'hold'
        reason?: string
      }
      const item = queue.find((entry) => entry.submission_id === submissionId)
      if (!item) {
        return HttpResponse.json({ error: 'Submission not found in queue' }, { status: 404 })
      }
      // Approve and reject leave the queue; hold keeps it for later.
      const action = body.action ?? 'approve'
      if (action !== 'hold') {
        queue = queue.filter((entry) => entry.submission_id !== submissionId)
      }
      const status =
        action === 'approve'
          ? 'submitted_to_client'
          : action === 'reject'
            ? 'internal_rejected'
            : 'paused'
      return HttpResponse.json({
        submission_id: submissionId,
        action,
        status,
        reason: body.reason ?? null,
      })
    },
  ),
]

/** Test/dev helper to reset the in-memory queue to its seed state. */
export function __resetQualityQueue() {
  queue = seedQueue()
}
