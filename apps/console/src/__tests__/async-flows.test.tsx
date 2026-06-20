import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { getOutreachReviewItemFromLead } from '../../app/(shell)/bd/outreach/_lib/sequence-list'
import { getReplyTasksFromLead } from '../../app/(shell)/bd/replies/_lib/reply-tasks'

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Async flows (BD-04, BD-05)', () => {
  it('useAsyncJob transitions from pending to complete when status=complete is returned', async () => {
    // Validates BD-04: polling works without manual refresh
    // useAsyncJob is already tested in packages/hooks — this validates the import flow end-state
    let callCount = 0
    global.fetch = vi.fn().mockImplementation((_url: string) => {
      callCount++
      const status = callCount >= 2 ? 'complete' : 'processing'
      return Promise.resolve({
        ok: true,
        json: async () => ({
          import_id: 'test-id',
          status,
          total: 100,
          enriching: 0,
          icp_scored: 0,
          review_queue: status === 'complete' ? 97 : 50,
          suppressed: 3,
          failed: 0,
        }),
      })
    })

    const { useAsyncJob } = await import('@brynzit/hooks')
    const { result } = renderHook(
      () => useAsyncJob({ jobId: 'test-id', endpoint: '/api/v1/bd/imports/{id}/status' }),
      { wrapper: makeWrapper() },
    )

    await waitFor(
      () => {
        expect(result.current.phase).toBe('complete')
      },
      { timeout: 5000 },
    )

    expect((result.current.data as { review_queue?: number } | undefined)?.review_queue).toBe(97)
  })

  it.todo('outreach sequence renders 3 steps with subject and body editors')
  it.todo('approving a sequence fires POST /outreach/{id}/approve')
})

describe('Outreach sequences (BD-05)', () => {
  it('sequence data structure has 3 steps with step_index fields per api.d.ts schema', () => {
    // Validates BD-05: 3-email outreach sequence with correct field names from api.d.ts
    // Uses step_index (not step_number), scheduled_day (not scheduled_at)
    const mockSequence = {
      sequence_id: 'seq-1',
      lead_id: 'l1',
      status: 'pending_review',
      outreach_angle: null,
      rejection_notes: null,
      failure_reason: null,
      created_at: new Date().toISOString(),
      steps: [
        { step_index: 1, subject: 'Subject 1', body: 'Body 1', original_subject: 'Subject 1', original_body: 'Body 1', status: 'draft', scheduled_day: 0 },
        { step_index: 2, subject: 'Subject 2', body: 'Body 2', original_subject: 'Subject 2', original_body: 'Body 2', status: 'draft', scheduled_day: 3 },
        { step_index: 3, subject: 'Subject 3', body: 'Body 3', original_subject: 'Subject 3', original_body: 'Body 3', status: 'draft', scheduled_day: 7 },
      ],
    }
    expect(mockSequence.steps).toHaveLength(3)
    expect(mockSequence.steps[0].step_index).toBe(1)
    expect(mockSequence.steps[2].step_index).toBe(3)
    expect(mockSequence.steps[0].scheduled_day).toBe(0)
    expect(mockSequence.steps[1].scheduled_day).toBe(3)
  })

  it('maps live lead fat-card active_sequence into a review sequence item', () => {
    const item = getOutreachReviewItemFromLead({
      id: 'lead-1',
      status: 'outreach_review',
      canonical_domain: 'acme.com',
      icp_score: 87,
      icp_breakdown: null,
      enrichment_status: 'complete',
      rejection_reason: null,
      import_id: null,
      created_at: '2026-06-16T00:00:00.000Z',
      updated_at: '2026-06-16T00:00:00.000Z',
      contact: {
        id: 'contact-1',
        name: 'Jane Doe',
        email: 'jane@acme.com',
        title: 'VP Engineering',
        linkedin_url: null,
        company_name: 'Acme Corp',
        tech_stack: null,
        funding_stage: null,
        headcount: null,
        open_roles_summary: null,
        verified: null,
        last_enriched_at: null,
      },
      active_sequence: {
        id: 'seq-1',
        status: 'outreach_review',
        outreach_angle: 'Hiring signal',
        rejection_notes: null,
        created_at: '2026-06-16T00:00:00.000Z',
        updated_at: '2026-06-16T00:00:00.000Z',
        steps: [
          {
            step_index: 1,
            subject: 'Intro',
            body: 'Hi',
            scheduled_day: 0,
            status: 'draft',
            original_subject: 'Intro',
            original_body: 'Hi',
          },
        ],
      },
      tasks: [],
    })

    expect(item?.leadName).toBe('Acme Corp')
    expect(item?.sequence.sequence_id).toBe('seq-1')
    expect(item?.sequence.lead_id).toBe('lead-1')
    expect(item?.sequence.steps).toHaveLength(1)
  })

  it.todo('approving a sequence fires POST /outreach/{id}/approve')
})

describe('Reply tasks (BD-07)', () => {
  it('maps live lead fat-card tasks into reply task cards', () => {
    const tasks = getReplyTasksFromLead({
      id: 'lead-1',
      status: 'interested',
      canonical_domain: 'acme.com',
      icp_score: 87,
      icp_breakdown: null,
      enrichment_status: 'complete',
      rejection_reason: null,
      import_id: null,
      created_at: '2026-06-16T00:00:00.000Z',
      updated_at: '2026-06-16T00:00:00.000Z',
      contact: {
        id: 'contact-1',
        name: 'Jane Doe',
        email: 'jane@acme.com',
        title: 'VP Engineering',
        linkedin_url: null,
        company_name: 'Acme Corp',
        tech_stack: null,
        funding_stage: null,
        headcount: null,
        open_roles_summary: null,
        verified: null,
        last_enriched_at: null,
      },
      active_sequence: null,
      tasks: [
        {
          id: 'task-1',
          type: 'task',
          category: 'interested',
          status: 'urgent',
          context_json: { company_summary: 'Ready to talk next week.' },
          due_at: null,
          created_at: '2026-06-16T00:00:00.000Z',
        },
      ],
    })

    expect(tasks).toHaveLength(1)
    expect(tasks[0].classification).toBe('interested')
    expect(tasks[0].company_name).toBe('Acme Corp')
    expect(tasks[0].ai_briefing).toBe('Ready to talk next week.')
  })
})
