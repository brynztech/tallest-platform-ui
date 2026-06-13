import { http, HttpResponse } from 'msw'
import type { HttpHandler } from 'msw'

// BD domain MSW handlers for Phase 1.
// Phase 1 ships one handler for the walking skeleton smoke test (rejection-reasons).
// All BD feature handlers added in Phase 2.
export const bdHandlers: HttpHandler[] = [
  // Walking skeleton: GET /api/v1/bd/rejection-reasons
  // Real backend endpoint — returns the 7 lead rejection reasons enum values.
  // MSW intercepts this in dev (NEXT_PUBLIC_API_MOCKING=enabled).
  // When MSW is disabled, request goes to real backend.
  // T-04-01 mitigation: handler only active when env var is set (MSW guard).
  http.get('/api/v1/bd/rejection-reasons', () => {
    return HttpResponse.json({
      reasons: [
        'not_icp',
        'no_open_roles',
        'recently_contacted',
        'competitor',
        'funding_stage',
        'geography',
        'other',
      ],
    })
  }),
]
