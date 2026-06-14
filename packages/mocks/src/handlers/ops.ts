import { http, HttpResponse } from 'msw'
import type { HttpHandler } from 'msw'
import type { components } from '@brynzit/api-client'
import { API_BASE } from '../base-url'

// Ops domain MSW handlers.
// All 19 handlers covering clients, requisitions, interviews, and placements.
// MSW-only handlers are marked with: // NOTE: MSW-only — no live backend endpoint
export const opsHandlers: HttpHandler[] = [

  // --- Clients ---

  // 1. GET /api/v1/ops/clients — list all clients
  http.get(`${API_BASE}/api/v1/ops/clients`, () => {
    return HttpResponse.json([
      {
        id: '00000000-0000-0000-0000-client000001',
        name: 'Acme Corp',
        primary_contact_name: 'Jane Smith',
        primary_contact_email: 'jane@acme.com',
        status: 'active',
        created_at: new Date().toISOString(),
      },
      {
        id: '00000000-0000-0000-0000-client000002',
        name: 'TechStart Inc',
        primary_contact_name: 'Bob Lee',
        primary_contact_email: 'bob@techstart.io',
        status: 'active',
        created_at: new Date().toISOString(),
      },
    ] satisfies components['schemas']['ClientResponse'][])
  }),

  // 2. POST /api/v1/ops/clients — create client
  http.post(`${API_BASE}/api/v1/ops/clients`, async ({ request }) => {
    const body = await request.json() as components['schemas']['CreateClientRequest']
    return HttpResponse.json(
      {
        id: crypto.randomUUID(),
        name: body.name,
        primary_contact_name: body.primary_contact_name ?? null,
        primary_contact_email: body.primary_contact_email ?? null,
        status: 'active',
        created_at: new Date().toISOString(),
      } satisfies components['schemas']['ClientResponse'],
      { status: 201 },
    )
  }),

  // 3. GET /api/v1/ops/clients/:client_id — get single client
  http.get(`${API_BASE}/api/v1/ops/clients/:client_id`, ({ params }) => {
    return HttpResponse.json({
      id: params.client_id as string,
      name: 'Acme Corp',
      primary_contact_name: 'Jane Smith',
      primary_contact_email: 'jane@acme.com',
      status: 'active',
      created_at: new Date().toISOString(),
    } satisfies components['schemas']['ClientResponse'])
  }),

  // 4. PATCH /api/v1/ops/clients/:client_id — update client
  http.patch(`${API_BASE}/api/v1/ops/clients/:client_id`, async ({ params, request }) => {
    const body = await request.json() as components['schemas']['PatchClientRequest']
    return HttpResponse.json({
      id: params.client_id as string,
      name: body.name ?? 'Acme Corp',
      primary_contact_name: body.primary_contact_name ?? 'Jane Smith',
      primary_contact_email: body.primary_contact_email ?? 'jane@acme.com',
      status: body.status ?? 'active',
      created_at: new Date().toISOString(),
    } satisfies components['schemas']['ClientResponse'])
  }),

  // 5. GET /api/v1/ops/clients/:client_id/requisitions — list requisitions for a client
  http.get(`${API_BASE}/api/v1/ops/clients/:client_id/requisitions`, ({ params }) => {
    return HttpResponse.json([
      {
        id: '00000000-0000-0000-0000-req000000001',
        client_id: params.client_id as string,
        title: 'Senior Backend Engineer',
        status: 'open',
        skills: ['TypeScript', 'Node.js', 'PostgreSQL'],
        seniority: 'senior',
        compensation_range: '$150k–$180k',
        target_start_date: '2026-09-01',
        intake_details: null,
        shortlist: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '00000000-0000-0000-0000-req000000002',
        client_id: params.client_id as string,
        title: 'Product Designer',
        status: 'filled',
        skills: ['Figma', 'User Research'],
        seniority: 'mid',
        compensation_range: '$120k–$140k',
        target_start_date: '2026-07-01',
        intake_details: null,
        shortlist: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ] satisfies components['schemas']['RequisitionResponse'][])
  }),

  // 6. GET /api/v1/ops/clients/:client_id/notes — list notes for a client
  http.get(`${API_BASE}/api/v1/ops/clients/:client_id/notes`, ({ params }) => {
    return HttpResponse.json([
      {
        id: '00000000-0000-0000-0000-note00000001',
        client_id: params.client_id as string,
        text: 'Client onboarding call — 3 open reqs, prefers remote-first candidates.',
        channel: 'other',
        author: null,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
      {
        id: '00000000-0000-0000-0000-note00000002',
        client_id: params.client_id as string,
        text: 'Follow-up: Jane confirmed budget locked for Q3. Target hire for Backend role by Aug.',
        channel: 'other',
        author: null,
        created_at: new Date().toISOString(),
      },
    ] satisfies components['schemas']['NoteResponse'][])
  }),

  // 7. POST /api/v1/ops/clients/:client_id/notes — add note to client
  http.post(`${API_BASE}/api/v1/ops/clients/:client_id/notes`, async ({ params, request }) => {
    const body = await request.json() as components['schemas']['CreateNoteRequest']
    return HttpResponse.json(
      {
        id: crypto.randomUUID(),
        client_id: params.client_id as string,
        text: body.text,
        channel: body.channel,
        author: body.author ?? null,
        created_at: new Date().toISOString(),
      } satisfies components['schemas']['NoteResponse'],
      { status: 201 },
    )
  }),

  // --- Requisitions ---

  // 8. GET /api/v1/ops/requisitions — list all requisitions (cross-client)
  // NOTE: MSW-only — no live backend endpoint (api.d.ts line 445: get?: never)
  http.get(`${API_BASE}/api/v1/ops/requisitions`, ({ request }) => {
    const url = new URL(request.url)
    const clientId = url.searchParams.get('client_id')
    const allReqs: components['schemas']['RequisitionResponse'][] = [
      {
        id: '00000000-0000-0000-0000-req000000001',
        client_id: '00000000-0000-0000-0000-client000001',
        title: 'Senior Backend Engineer',
        status: 'open',
        skills: ['TypeScript', 'Node.js', 'PostgreSQL'],
        seniority: 'senior',
        compensation_range: '$150k–$180k',
        target_start_date: '2026-09-01',
        intake_details: null,
        shortlist: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '00000000-0000-0000-0000-req000000002',
        client_id: '00000000-0000-0000-0000-client000001',
        title: 'Product Designer',
        status: 'filled',
        skills: ['Figma', 'User Research'],
        seniority: 'mid',
        compensation_range: '$120k–$140k',
        target_start_date: '2026-07-01',
        intake_details: null,
        shortlist: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]
    const filtered = clientId ? allReqs.filter((r) => r.client_id === clientId) : allReqs
    return HttpResponse.json(filtered)
  }),

  // 9. POST /api/v1/ops/requisitions — create requisition
  http.post(`${API_BASE}/api/v1/ops/requisitions`, async ({ request }) => {
    const body = await request.json() as components['schemas']['CreateRequisitionRequest']
    return HttpResponse.json(
      {
        id: crypto.randomUUID(),
        client_id: body.client_id ?? null,
        title: body.title,
        status: 'open',
        skills: body.skills ?? [],
        seniority: body.seniority ?? null,
        compensation_range: body.compensation_range ?? null,
        target_start_date: body.target_start_date ?? null,
        intake_details: null,
        shortlist: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } satisfies components['schemas']['RequisitionResponse'],
      { status: 201 },
    )
  }),

  // 10. GET /api/v1/ops/requisitions/:req_id — get requisition (stateful poll counter)
  // Uses IIFE closure with parsePollCounts to simulate JD parse completing on 2nd call
  ...((): HttpHandler[] => {
    const parsePollCounts: Record<string, number> = {}
    return [
      http.get(`${API_BASE}/api/v1/ops/requisitions/:req_id`, ({ params }) => {
        const id = params.req_id as string
        parsePollCounts[id] = (parsePollCounts[id] ?? 0) + 1
        const isParsed = parsePollCounts[id] >= 2
        return HttpResponse.json({
          id,
          client_id: '00000000-0000-0000-0000-client000001',
          title: 'Senior Backend Engineer',
          status: 'open',
          skills: isParsed ? ['TypeScript', 'Node.js', 'PostgreSQL'] : [],
          seniority: isParsed ? 'senior' : null,
          compensation_range: isParsed ? '$150k–$180k' : null,
          target_start_date: isParsed ? '2026-09-01' : null,
          intake_details: null,
          shortlist: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } satisfies components['schemas']['RequisitionResponse'])
      }),
    ]
  })(),

  // 11. POST /api/v1/ops/requisitions/:req_id/parse-jd — trigger JD parsing (202 async)
  http.post(`${API_BASE}/api/v1/ops/requisitions/:req_id/parse-jd`, ({ params }) => {
    return HttpResponse.json(
      {
        requisition_id: params.req_id as string,
        status: 'processing',
        role: '',
        seniority: null,
        skills: [],
        compensation_range: null,
        target_start_date: null,
      } satisfies components['schemas']['ParseJDResponse'],
      { status: 202 },
    )
  }),

  // 11b. PATCH /api/v1/ops/requisitions/:req_id — update requisition fields
  // NOTE: MSW-only — no live PATCH /api/v1/ops/requisitions/{req_id} endpoint (api.d.ts patch?: never)
  http.patch(`${API_BASE}/api/v1/ops/requisitions/:req_id`, async ({ params, request }) => {
    const body = await request.json() as Partial<components['schemas']['CreateRequisitionRequest']>
    return HttpResponse.json({
      id: params.req_id as string,
      client_id: body.client_id ?? null,
      title: body.title ?? 'Updated Requisition',
      status: 'open',
      skills: body.skills ?? [],
      seniority: body.seniority ?? null,
      compensation_range: body.compensation_range ?? null,
      target_start_date: body.target_start_date ?? null,
      intake_details: null,
      shortlist: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } satisfies components['schemas']['RequisitionResponse'])
  }),

  // 12. POST /api/v1/ops/requisitions/:req_id/match — trigger candidate matching (202 async)
  http.post(`${API_BASE}/api/v1/ops/requisitions/:req_id/match`, () => {
    return HttpResponse.json({ status: 'processing' }, { status: 202 })
  }),

  // 13. GET /api/v1/ops/requisitions/:req_id/shortlist — get shortlist (loosely typed JSONB)
  // NOTE: api.d.ts returns { [key: string]: unknown } — using plain object, no satisfies assertion
  http.get(`${API_BASE}/api/v1/ops/requisitions/:req_id/shortlist`, () => {
    return HttpResponse.json({
      submissions: [
        {
          submission_id: '00000000-0000-0000-0000-sub000000001',
          candidate_id: '00000000-0000-0000-0000-cand00000001',
          candidate_name: 'Alice Chen',
          current_title: 'Senior Engineer @ Stripe',
          fit_score: 92,
          rank: 1,
          status: 'shortlisted',
        },
        {
          submission_id: '00000000-0000-0000-0000-sub000000002',
          candidate_id: '00000000-0000-0000-0000-cand00000002',
          candidate_name: 'David Park',
          current_title: 'Backend Lead @ Vercel',
          fit_score: 78,
          rank: 2,
          status: 'approved',
        },
        {
          submission_id: '00000000-0000-0000-0000-sub000000003',
          candidate_id: '00000000-0000-0000-0000-cand00000003',
          candidate_name: 'Sara Okonkwo',
          current_title: 'Staff Engineer @ GitHub',
          fit_score: 65,
          rank: 3,
          status: 'hold',
        },
      ],
    })
  }),

  // 14. GET /api/v1/ops/requisitions/:req_id/placements — list placements for a requisition
  http.get(`${API_BASE}/api/v1/ops/requisitions/:req_id/placements`, ({ params }) => {
    return HttpResponse.json([
      {
        id: '00000000-0000-0000-0000-plac00000001',
        requisition_id: params.req_id as string,
        candidate_id: '00000000-0000-0000-0000-cand00000001',
        confirmed_at: null,
        fee_usd: 25000,
        billing_status: 'pending',
        retention_flag_90d: true,
        notes: null,
        created_at: new Date().toISOString(),
      },
    ] satisfies components['schemas']['PlacementResponse'][])
  }),

  // --- Interviews ---

  // 15. GET /api/v1/ops/interviews — list all interviews (cross-requisition)
  // NOTE: MSW-only — no live backend endpoint (api.d.ts line 548: get?: never)
  http.get(`${API_BASE}/api/v1/ops/interviews`, ({ request }) => {
    const url = new URL(request.url)
    const requisitionId = url.searchParams.get('requisition_id')
    const statusParam = url.searchParams.get('status')
    const allInterviews: components['schemas']['InterviewResponse'][] = [
      {
        id: '00000000-0000-0000-0000-intv00000001',
        requisition_id: '00000000-0000-0000-0000-req000000001',
        candidate_id: '00000000-0000-0000-0000-cand00000001',
        status: 'scheduled',
        scheduled_at: '2026-07-01T10:00:00.000Z',
        notes: null,
        created_at: new Date().toISOString(),
      },
    ]
    let filtered = allInterviews
    if (requisitionId) filtered = filtered.filter((i) => i.requisition_id === requisitionId)
    if (statusParam) filtered = filtered.filter((i) => i.status === statusParam)
    return HttpResponse.json(filtered)
  }),

  // 16. POST /api/v1/ops/interviews — create interview
  http.post(`${API_BASE}/api/v1/ops/interviews`, async ({ request }) => {
    const body = await request.json() as components['schemas']['CreateInterviewRequest']
    return HttpResponse.json(
      {
        id: crypto.randomUUID(),
        requisition_id: body.requisition_id,
        candidate_id: body.candidate_id ?? null,
        status: 'scheduled',
        scheduled_at: body.scheduled_at ?? null,
        notes: body.notes ?? null,
        created_at: new Date().toISOString(),
      } satisfies components['schemas']['InterviewResponse'],
      { status: 201 },
    )
  }),

  // 17. GET /api/v1/ops/interviews/:interview_id — get single interview
  http.get(`${API_BASE}/api/v1/ops/interviews/:interview_id`, ({ params }) => {
    return HttpResponse.json({
      id: params.interview_id as string,
      requisition_id: '00000000-0000-0000-0000-req000000001',
      candidate_id: '00000000-0000-0000-0000-cand00000001',
      status: 'scheduled',
      scheduled_at: '2026-07-01T10:00:00.000Z',
      notes: null,
      created_at: new Date().toISOString(),
    } satisfies components['schemas']['InterviewResponse'])
  }),

  // 18. PATCH /api/v1/ops/interviews/:interview_id — update interview status
  http.patch(`${API_BASE}/api/v1/ops/interviews/:interview_id`, async ({ params, request }) => {
    const body = await request.json() as components['schemas']['PatchInterviewRequest']
    return HttpResponse.json({
      id: params.interview_id as string,
      requisition_id: '00000000-0000-0000-0000-req000000001',
      candidate_id: '00000000-0000-0000-0000-cand00000001',
      status: body.status,
      scheduled_at: '2026-07-01T10:00:00.000Z',
      notes: body.notes ?? null,
      created_at: new Date().toISOString(),
    } satisfies components['schemas']['InterviewResponse'])
  }),

  // --- Placements ---

  // 19. POST /api/v1/ops/placements — create placement
  http.post(`${API_BASE}/api/v1/ops/placements`, async ({ request }) => {
    const body = await request.json() as components['schemas']['CreatePlacementRequest']
    return HttpResponse.json(
      {
        id: crypto.randomUUID(),
        requisition_id: body.requisition_id,
        candidate_id: body.candidate_id ?? null,
        confirmed_at: body.confirmed_at ?? null,
        fee_usd: body.fee_usd ?? null,
        billing_status: body.billing_status,
        retention_flag_90d: body.retention_flag_90d,
        notes: body.notes ?? null,
        created_at: new Date().toISOString(),
      } satisfies components['schemas']['PlacementResponse'],
      { status: 201 },
    )
  }),

  // 20. GET /api/v1/ops/placements/:placement_id — get single placement
  http.get(`${API_BASE}/api/v1/ops/placements/:placement_id`, ({ params }) => {
    return HttpResponse.json({
      id: params.placement_id as string,
      requisition_id: '00000000-0000-0000-0000-req000000001',
      candidate_id: '00000000-0000-0000-0000-cand00000001',
      confirmed_at: null,
      fee_usd: 25000,
      billing_status: 'pending',
      retention_flag_90d: true,
      notes: null,
      created_at: new Date().toISOString(),
    } satisfies components['schemas']['PlacementResponse'])
  }),

]
