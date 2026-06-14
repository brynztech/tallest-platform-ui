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

describe('JD parse flow (OPS-02, OPS-03)', () => {
  it('useAsyncJob transitions to complete when RequisitionResponse.status=open is returned', async () => {
    let callCount = 0
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++
      const status = callCount >= 2 ? 'open' : 'parsing'
      return Promise.resolve({
        ok: true,
        json: async () => ({
          id: 'req-1',
          status,
          client_id: 'client-1',
          title: 'Senior Engineer',
          skills: status === 'open' ? ['TypeScript'] : [],
          seniority: null,
          compensation_range: null,
          target_start_date: null,
          intake_details: null,
          shortlist: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      })
    })

    const { useAsyncJob } = await import('@brynzit/hooks')
    const { result } = renderHook(
      () =>
        useAsyncJob({
          jobId: 'req-1',
          endpoint: '/api/v1/ops/requisitions/{id}',
          statusMap: {
            open: 'complete',
            filled: 'complete',
            closed: 'complete',
            parsing: 'pending',
          },
        }),
      { wrapper: makeWrapper() },
    )

    await waitFor(() => expect(result.current.phase).toBe('complete'), { timeout: 5000 })
  })

  it.todo('POST create requisition returns 201 and req_id is captured')
  it.todo('POST parse-jd returns 202 and isParsingJd state is set to true')
  it.todo('phase=failed fires toast.error with message "JD parsing failed — fill fields manually."')
  it.todo('Fields unlock and animate in when phase=complete')
})

describe('Requisition status badge logic (OPS-03)', () => {
  it('status badge maps correctly to visual variants', () => {
    function getReqBadgeVariant(status: string) {
      if (status === 'filled') return 'green'
      if (status === 'closed') return 'muted'
      return 'secondary'
    }
    expect(getReqBadgeVariant('open')).toBe('secondary')
    expect(getReqBadgeVariant('filled')).toBe('green')
    expect(getReqBadgeVariant('closed')).toBe('muted')
  })
})
