// smoke-domains.test.ts
// Live-backend integration tests for ROADMAP Success Criterion 6.
// These tests MUST run against the live backend (MSW disabled).
// Run: BACKEND_URL=http://localhost:8000 pnpm --filter @brynzit/api-client test:live -- --run
//
// Each test:
// 1. Calls one representative endpoint from each of the 4 existing API domains
// 2. Uses the typed liveClient (createClient<paths>) — TypeScript validates the response shape at compile time
// 3. Asserts the response is a 200 with a defined (non-null) body
// This catches schema drift between the committed openapi.json snapshot and the live backend.
//
// Path strings below are exact keys from the generated `paths` interface in src/types/api.d.ts.
// No `as any` casts — all paths are verified typed keys.
// Supply domain uses /api/v1/supply/candidates/search (required param: q string).
// Note: the search endpoint calls Qdrant for semantic ranking — allow 30s timeout.

import { describe, it, expect, beforeAll } from 'vitest'
import createClient from 'openapi-fetch'
import type { paths } from '../types/api'

// Create a live client pointing directly to the backend (no MSW)
// Uses BACKEND_URL env var or falls back to localhost:8000
const liveClient = createClient<paths>({
  baseUrl: process.env.BACKEND_URL ?? 'http://localhost:8000',
})

describe('Live backend smoke tests — all four domains (ROADMAP SC-6)', () => {
  beforeAll(() => {
    const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:8000'
    console.info(`[smoke-domains] Running against live backend: ${backendUrl}`)
    console.info('[smoke-domains] Ensure the backend is running before executing these tests.')
  })

  it('BD domain: GET /api/v1/bd/rejection-reasons returns reasons array', async () => {
    const { data, error } = await liveClient.GET('/api/v1/bd/rejection-reasons')
    expect(error).toBeUndefined()
    expect(data).toBeDefined()
    expect(Array.isArray(data?.reasons)).toBe(true)
    expect(data!.reasons.length).toBeGreaterThan(0)
  })

  it('Ops domain: GET /api/v1/ops/clients returns a list', async () => {
    const { data, error } = await liveClient.GET('/api/v1/ops/clients')
    expect(error).toBeUndefined()
    expect(data).toBeDefined()
    // Response is ClientResponse[] — could be empty array in test environment
    expect(Array.isArray(data)).toBe(true)
  })

  it(
    'Supply domain: GET /api/v1/supply/candidates/search returns search results',
    async () => {
      // /api/v1/supply/candidates/search requires q: string (from generated types)
      // Qdrant semantic search can take up to 15s — allow 30s per-test timeout
      const { data, error } = await liveClient.GET('/api/v1/supply/candidates/search', {
        params: { query: { q: 'engineer', top_k: 1 } },
      })
      expect(error).toBeUndefined()
      expect(data).toBeDefined()
    },
    30000, // 30s per-test timeout for Qdrant semantic search
  )

  it('Monitoring domain: GET /api/v1/monitoring/cost returns cost breakdown', async () => {
    const { data, error } = await liveClient.GET('/api/v1/monitoring/cost')
    expect(error).toBeUndefined()
    expect(data).toBeDefined()
  })
})
