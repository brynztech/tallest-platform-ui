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

describe('Client list (OPS-01)', () => {
  it.todo('GET /api/v1/ops/clients returns ClientResponse[] and list renders client names')
  it.todo('POST /api/v1/ops/clients creates client and appears in list after invalidation')
  it.todo('PATCH /api/v1/ops/clients/{id} updates client name and shows toast')
})

describe('Client notes log (OPS-01)', () => {
  it.todo('GET /api/v1/ops/clients/{id}/notes returns NoteResponse[] in reverse-chronological order')
  it.todo('POST /api/v1/ops/clients/{id}/notes adds note, clears textarea, refetches notes list')
  it.todo('Note text rendered as JSX text node — no dangerouslySetInnerHTML (XSS guard)')
})
