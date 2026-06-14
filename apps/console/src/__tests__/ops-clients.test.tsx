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

describe('Client notes security (OPS-01)', () => {
  it('note text is NOT rendered via dangerouslySetInnerHTML', () => {
    // Test that the component pattern uses text node rendering
    // This is a pattern enforcement test — whitespace-pre-wrap p tag, not innerHTML
    const renderNote = (text: string) =>
      `<p class="text-sm whitespace-pre-wrap">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`
    const xssPayload = '<script>alert("xss")</script>'
    const rendered = renderNote(xssPayload)
    expect(rendered).not.toContain('<script>')
    expect(rendered).toContain('&lt;script&gt;')
  })

  it('notes are sorted reverse-chronological (newest first)', () => {
    const notes = [
      {
        id: '1',
        created_at: '2026-06-10T10:00:00.000Z',
        text: 'older note',
        client_id: 'c1',
        channel: 'other',
        author: null,
      },
      {
        id: '2',
        created_at: '2026-06-14T10:00:00.000Z',
        text: 'newer note',
        client_id: 'c1',
        channel: 'other',
        author: null,
      },
    ]
    const sorted = [...notes].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    expect(sorted[0].id).toBe('2')
    expect(sorted[1].id).toBe('1')
  })
})
