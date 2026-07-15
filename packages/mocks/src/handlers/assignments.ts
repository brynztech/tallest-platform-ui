import { http, HttpResponse } from 'msw'
import type { HttpHandler } from 'msw'
import { API_BASE } from '../base-url'

// MSW-only contract proposal — recruiter → requisition assignments.
// Not yet implemented in the backend. DELETE when the real endpoint ships.
//
// Seed: the recruiter is assigned to one specific role; managers/admins bypass
// assignment (handled client-side via the role.view_all capability).
const ASSIGNMENTS: Record<string, string[]> = {
  usr_recruiter: ['00000000-0000-0000-0000-req000000001'],
}

export const assignmentHandlers: HttpHandler[] = [
  http.get(`${API_BASE}/api/v1/ops/assignments`, ({ request }) => {
    const userId = new URL(request.url).searchParams.get('user_id') ?? ''
    return HttpResponse.json({ requisition_ids: ASSIGNMENTS[userId] ?? [] })
  }),
]
