import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useAsyncJob } from '../use-async-job'

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useAsyncJob', () => {
  it('returns phase=idle when jobId is null', () => {
    const { result } = renderHook(
      () => useAsyncJob({ jobId: null, endpoint: '/api/v1/bd/imports/{id}/status' }),
      { wrapper: makeWrapper() },
    )
    expect(result.current.phase).toBe('idle')
    expect(result.current.isPolling).toBe(false)
  })

  it('returns phase=idle when enabled=false', () => {
    const { result } = renderHook(
      () =>
        useAsyncJob({
          jobId: 'abc123',
          endpoint: '/api/v1/bd/imports/{id}/status',
          enabled: false,
        }),
      { wrapper: makeWrapper() },
    )
    expect(result.current.phase).toBe('idle')
    expect(result.current.isPolling).toBe(false)
  })

  it('maps backend "complete" status to phase=complete and stops polling', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'complete', import_id: 'abc123' }),
    })

    const { result } = renderHook(
      () => useAsyncJob({ jobId: 'abc123', endpoint: '/api/v1/bd/imports/{id}/status' }),
      { wrapper: makeWrapper() },
    )

    await waitFor(() => expect(result.current.phase).toBe('complete'))
    expect(result.current.isPolling).toBe(false)
    expect(result.current.rawStatus).toBe('complete')
  })

  it('maps backend "processing" status to phase=pending with isPolling=true', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'processing', import_id: 'abc123' }),
    })

    const { result } = renderHook(
      () =>
        useAsyncJob({
          jobId: 'abc123',
          endpoint: '/api/v1/bd/imports/{id}/status',
          refetchInterval: 60000, // high interval so test doesn't loop
        }),
      { wrapper: makeWrapper() },
    )

    await waitFor(() => expect(result.current.phase).toBe('pending'))
    expect(result.current.isPolling).toBe(true)
  })

  it('maps custom statusMap override — outreach_review → complete', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'outreach_review' }),
    })

    const { result } = renderHook(
      () =>
        useAsyncJob({
          jobId: 'seq123',
          endpoint: '/api/v1/bd/outreach/{id}',
          statusMap: { outreach_review: 'complete' },
        }),
      { wrapper: makeWrapper() },
    )

    await waitFor(() => expect(result.current.phase).toBe('complete'))
    expect(result.current.isPolling).toBe(false)
  })

  it('maps "failed" status to phase=failed', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'failed' }),
    })

    const { result } = renderHook(
      () => useAsyncJob({ jobId: 'abc123', endpoint: '/api/v1/bd/imports/{id}/status' }),
      { wrapper: makeWrapper() },
    )

    await waitFor(() => expect(result.current.phase).toBe('failed'))
    expect(result.current.isPolling).toBe(false)
  })
})
