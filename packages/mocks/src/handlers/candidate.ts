import { http, HttpResponse } from 'msw'
import type { HttpHandler } from 'msw'
import { API_BASE } from '../base-url'

// Contract mocks for candidate-facing endpoints not yet implemented in backend.
// Defined in .planning/contracts/*.yaml.
// DELETE each handler when the real backend endpoint ships and integration tests pass.
//
// Security note (T-01-04): Phase 1 handlers return mock data only — no real PII.
// When real candidate endpoints ship, all file access must go through backend-issued
// short-lived signed URLs (not direct S3 URLs stored in frontend state).
export const candidateHandlers: HttpHandler[] = [
  http.get(`${API_BASE}/api/v1/public/jobs`, () => {
    return HttpResponse.json({
      items: [],
      next_cursor: null,
    })
  }),

  http.post(`${API_BASE}/api/v1/candidate/auth/signup`, () => {
    return HttpResponse.json(
      { id: 'mock-candidate-id', email: 'test@example.com' },
      { status: 201 },
    )
  }),

  http.post(`${API_BASE}/api/v1/candidate/auth/login`, () => {
    return HttpResponse.json({ access_token: 'mock-token', token_type: 'bearer' })
  }),

  http.get(`${API_BASE}/api/v1/candidate/profile`, () => {
    return HttpResponse.json({ id: 'mock-candidate-id', first_name: 'Test', last_name: 'User' })
  }),

  http.put(`${API_BASE}/api/v1/candidate/profile`, () => {
    return HttpResponse.json({ id: 'mock-candidate-id', first_name: 'Test', last_name: 'User' })
  }),

  http.get(`${API_BASE}/api/v1/candidate/applications`, () => {
    return HttpResponse.json({ items: [], next_cursor: null })
  }),
]
