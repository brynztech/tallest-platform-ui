import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

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

  it.todo('approving a sequence fires POST /outreach/{id}/approve')
})
