import { http, HttpResponse } from 'msw'
import type { HttpHandler } from 'msw'
import { API_BASE } from '../base-url'

// MSW contract mocks — recruiter → requisition assignments.
// Mirrors the live backend (ops/router.py): GET by user, GET assignees by
// requisition, idempotent POST/DELETE. DELETE this file's handlers when
// mocking is no longer needed for a given environment.
//
// Seed: the recruiter is assigned to one specific role; managers/admins bypass
// assignment (handled client-side via the role.view_all capability).
const ASSIGNMENTS: Record<string, string[]> = {
  usr_recruiter: ['00000000-0000-0000-0000-req000000001'],
}

function assigneesFor(reqId: string): string[] {
  return Object.entries(ASSIGNMENTS)
    .filter(([, reqIds]) => reqIds.includes(reqId))
    .map(([userId]) => userId)
}

export const assignmentHandlers: HttpHandler[] = [
  http.get(`${API_BASE}/api/v1/ops/assignments`, ({ request }) => {
    const userId = new URL(request.url).searchParams.get('user_id') ?? ''
    return HttpResponse.json({ requisition_ids: ASSIGNMENTS[userId] ?? [] })
  }),

  http.get(`${API_BASE}/api/v1/ops/requisitions/:reqId/assignees`, ({ params }) => {
    return HttpResponse.json({ user_ids: assigneesFor(String(params.reqId)) })
  }),

  http.post(`${API_BASE}/api/v1/ops/assignments`, async ({ request }) => {
    const body = (await request.json()) as { user_id: string; requisition_id: string }
    const reqIds = (ASSIGNMENTS[body.user_id] ??= [])
    if (!reqIds.includes(body.requisition_id)) reqIds.push(body.requisition_id)
    return HttpResponse.json({ user_ids: assigneesFor(body.requisition_id) }, { status: 201 })
  }),

  http.delete(`${API_BASE}/api/v1/ops/assignments`, ({ request }) => {
    const url = new URL(request.url)
    const userId = url.searchParams.get('user_id') ?? ''
    const reqId = url.searchParams.get('requisition_id') ?? ''
    if (ASSIGNMENTS[userId]) {
      ASSIGNMENTS[userId] = ASSIGNMENTS[userId].filter((id) => id !== reqId)
    }
    return new HttpResponse(null, { status: 204 })
  }),
]
