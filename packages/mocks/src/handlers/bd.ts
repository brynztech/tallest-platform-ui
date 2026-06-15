import { http, HttpResponse } from 'msw'
import type { HttpHandler } from 'msw'
import type { components, LeadQueueItemExtended } from '@brynzit/api-client'
import { API_BASE } from '../base-url'

const mockBdLeadQueueItems: LeadQueueItemExtended[] = [
  { id: '00000000-0000-0000-0000-000000000001', company_name: 'Acme Corp', canonical_domain: 'acme.com', contact_name: 'Jane Doe', contact_title: 'VP Engineering', contact_email: 'jane@acme.com', icp_score: 87, status: 'review_queue', icp_breakdown: null, enrichment_status: 'complete', rejection_reason: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), contact_id: '00000000-0000-0000-0001-000000000001', open_roles_count: 4, open_roles_summary: '4 open roles (Engineering)', suggested_angle: 'Scaling eng team rapidly — strong timing for a recruiting partner.' },
  { id: '00000000-0000-0000-0000-000000000002', company_name: 'Buildco', canonical_domain: 'buildco.io', contact_name: 'Tom Smith', contact_title: 'CTO', contact_email: 'tom@buildco.io', icp_score: 72, status: 'review_queue', icp_breakdown: null, enrichment_status: 'complete', rejection_reason: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), contact_id: '00000000-0000-0000-0001-000000000002', open_roles_count: 2, open_roles_summary: '2 open roles (Product)', suggested_angle: 'Two senior PM roles open — product-led growth push underway.' },
  { id: '00000000-0000-0000-0000-000000000003', company_name: 'Dataflow Inc', canonical_domain: 'dataflow.com', contact_name: 'Sara Lee', contact_title: 'Head of Talent', contact_email: 'sara@dataflow.com', icp_score: 55, status: 'review_queue', icp_breakdown: null, enrichment_status: 'complete', rejection_reason: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), contact_id: '00000000-0000-0000-0001-000000000003', open_roles_count: null, open_roles_summary: null, suggested_angle: null },
  { id: '00000000-0000-0000-0000-000000000004', company_name: 'Fintech Ltd', canonical_domain: 'fintech.co', contact_name: 'Alex Kim', contact_title: 'CEO', contact_email: 'alex@fintech.co', icp_score: 91, status: 'review_queue', icp_breakdown: null, enrichment_status: 'complete', rejection_reason: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), contact_id: '00000000-0000-0000-0001-000000000004', open_roles_count: 7, open_roles_summary: '7 open roles (Sales, Eng)', suggested_angle: 'Series B just closed — headcount plan live, talent team under pressure.' },
  { id: '00000000-0000-0000-0000-000000000005', company_name: 'Growthbase', canonical_domain: 'growthbase.com', contact_name: 'Maya Patel', contact_title: 'Founder', contact_email: 'maya@growthbase.com', icp_score: 68, status: 'review_queue', icp_breakdown: null, enrichment_status: 'complete', rejection_reason: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), contact_id: '00000000-0000-0000-0001-000000000005', open_roles_count: 1, open_roles_summary: '1 open role (Design)', suggested_angle: 'First design hire — founder-led recruiting, high friction expected.' },
  { id: '00000000-0000-0000-0000-000000000006', company_name: 'Horizon Labs', canonical_domain: 'horizonlabs.ai', contact_name: 'Chris Wu', contact_title: 'VP Sales', contact_email: 'chris@horizonlabs.ai', icp_score: 83, status: 'review_queue', icp_breakdown: null, enrichment_status: 'complete', rejection_reason: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), contact_id: '00000000-0000-0000-0001-000000000006', open_roles_count: 3, open_roles_summary: '3 open roles (Sales)', suggested_angle: 'AE pipeline stalled — missed quota two quarters, VP Sales owns the fix.' },
]

const mockBdLeadCompanyDetails: Record<
  string,
  { funding_stage: string; headcount: number; tech_stack: string; icp_breakdown: Record<string, number> }
> = {
  '00000000-0000-0000-0000-000000000001': {
    funding_stage: 'Series B',
    headcount: 120,
    tech_stack: 'React, Node.js, PostgreSQL',
    icp_breakdown: { company_size: 0.9, industry_fit: 0.8, tech_stack: 0.85, timing: 0.9 },
  },
  '00000000-0000-0000-0000-000000000002': {
    funding_stage: 'Series A',
    headcount: 85,
    tech_stack: 'Next.js, Go, AWS',
    icp_breakdown: { company_size: 0.72, industry_fit: 0.74, tech_stack: 0.7, timing: 0.78 },
  },
  '00000000-0000-0000-0000-000000000003': {
    funding_stage: 'Seed',
    headcount: 34,
    tech_stack: 'Python, Snowflake, React',
    icp_breakdown: { company_size: 0.55, industry_fit: 0.6, tech_stack: 0.62, timing: 0.5 },
  },
  '00000000-0000-0000-0000-000000000004': {
    funding_stage: 'Series B',
    headcount: 160,
    tech_stack: 'TypeScript, Java, Kubernetes',
    icp_breakdown: { company_size: 0.92, industry_fit: 0.88, tech_stack: 0.9, timing: 0.94 },
  },
  '00000000-0000-0000-0000-000000000005': {
    funding_stage: 'Pre-seed',
    headcount: 18,
    tech_stack: 'Rails, React, PostgreSQL',
    icp_breakdown: { company_size: 0.68, industry_fit: 0.64, tech_stack: 0.66, timing: 0.72 },
  },
  '00000000-0000-0000-0000-000000000006': {
    funding_stage: 'Series A',
    headcount: 95,
    tech_stack: 'Python, React, BigQuery',
    icp_breakdown: { company_size: 0.82, industry_fit: 0.86, tech_stack: 0.8, timing: 0.84 },
  },
}

export function getMockBdLeadDetail(
  leadId: string,
): components['schemas']['LeadFatCardResponse'] {
  const lead = mockBdLeadQueueItems.find((item) => item.id === leadId) ?? mockBdLeadQueueItems[0]
  const companyDetails = mockBdLeadCompanyDetails[lead.id]

  return {
    id: lead.id,
    canonical_domain: lead.canonical_domain,
    icp_score: lead.icp_score,
    status: lead.status,
    icp_breakdown: companyDetails.icp_breakdown,
    enrichment_status: lead.enrichment_status,
    rejection_reason: null,
    import_id: null,
    created_at: lead.created_at,
    updated_at: lead.updated_at,
    contact: {
      id: lead.contact_id,
      name: lead.contact_name ?? 'Unknown contact',
      title: lead.contact_title,
      email: lead.contact_email,
      linkedin_url: lead.contact_name
        ? `https://linkedin.com/in/${lead.contact_name.toLowerCase().replace(/\s+/g, '')}`
        : null,
      company_name: lead.company_name,
      tech_stack: companyDetails.tech_stack,
      funding_stage: companyDetails.funding_stage,
      headcount: companyDetails.headcount,
      open_roles_summary: lead.open_roles_summary ?? null,
      verified: true,
      last_enriched_at: new Date().toISOString(),
    },
    active_sequence: null,
    tasks: [],
  }
}

// BD domain MSW handlers.
// T-02-01 mitigation: MSW only activates when NEXT_PUBLIC_API_MOCKING=enabled;
// this guard is enforced in the MSWProvider early-return pattern (Phase 1).
export const bdHandlers: HttpHandler[] = [
  // Walking skeleton: GET /api/v1/bd/rejection-reasons
  // Real backend endpoint — returns the 7 lead rejection reasons enum values.
  // MSW intercepts this in dev (NEXT_PUBLIC_API_MOCKING=enabled).
  // When MSW is disabled, request goes to real backend.
  // T-04-01 mitigation: handler only active when env var is set (MSW guard).
  // Values verified against live backend at http://localhost:8000 on 2026-06-13.
  http.get(`${API_BASE}/api/v1/bd/rejection-reasons`, () => {
    return HttpResponse.json({
      reasons: [
        'NOT_ICP_FIT',
        'WRONG_SENIORITY',
        'NO_OPEN_ROLES',
        'COMPETITOR',
        'BAD_TIMING',
        'ALREADY_A_CLIENT',
        'OTHER',
      ],
    })
  }),

  // 1. Lead queue — cursor-paginated list
  http.get(`${API_BASE}/api/v1/bd/leads`, ({ request }) => {
    const url = new URL(request.url)
    const cursor = url.searchParams.get('cursor')
    // Page 1 (no cursor): first 5 mock leads. Page 2 (with cursor): next 5.
    // LeadQueueItemExtended adds open_roles_count/summary + suggested_angle per
    // .planning/contracts/bd-lead-queue-item-fat-card.yaml (BD-01 / ROADMAP SC1).
    // These fields are absent from the live api.d.ts until the backend ships them.
    const page1 = mockBdLeadQueueItems.slice(0, 5)
    const page2 = mockBdLeadQueueItems.slice(5)
    return HttpResponse.json({
      leads: cursor ? page2 : page1,
      next_cursor: cursor ? null : 'cursor-page-2',
      total: 6,
    } satisfies components['schemas']['LeadQueueResponse'])
  }),

  // 2. Snoozed wake badge count — must be registered BEFORE the :lead_id wildcard handler.
  // MSW v2 uses first-match-wins; ':lead_id' matches any path segment including
  // the literal string 'snoozed-wake-count', so this specific route must come first.
  // (MSW-only stub — no live endpoint per RESEARCH.md Open Question 2)
  http.get(`${API_BASE}/api/v1/bd/leads/snoozed-wake-count`, () => {
    return HttpResponse.json({ count: 2 })
  }),

  // 3. Lead detail (fat card)
  http.get(`${API_BASE}/api/v1/bd/leads/:lead_id`, ({ params }) => {
    return HttpResponse.json(getMockBdLeadDetail(params.lead_id as string))
  }),

  // 3. Bulk action
  http.post(`${API_BASE}/api/v1/bd/leads/bulk-action`, async ({ request }) => {
    const body = await request.json() as components['schemas']['BulkActionRequest']
    return HttpResponse.json({
      succeeded: body.lead_ids?.length ?? 0,
      failed: 0,
      errors: [],
    } satisfies components['schemas']['BulkActionResponse'])
  }),

  // 4. CSV import (multipart)
  http.post(`${API_BASE}/api/v1/bd/imports`, async ({ request }) => {
    const data = await request.formData()
    const file = data.get('file')
    if (!file || !(file instanceof File)) {
      return new HttpResponse('Missing file', { status: 400 })
    }
    return HttpResponse.json(
      {
        import_id: '00000000-0000-0000-0000-mock-import-01',
        accepted: 100,
        skipped_duplicate: 2,
        skipped_invalid: 1,
        skipped_rows: [],
      } satisfies components['schemas']['ImportResponse'],
      { status: 202 },
    )
  }),

  // 5. Import status polling (cycles through states for realistic testing)
  ...((): HttpHandler[] => {
    const importPollCounts: Record<string, number> = {}
    return [
      http.get(`${API_BASE}/api/v1/bd/imports/:import_id/status`, ({ params }) => {
        const id = params.import_id as string
        importPollCounts[id] = (importPollCounts[id] ?? 0) + 1
        const count = importPollCounts[id]
        const status = count <= 1 ? 'processing' : 'complete'
        return HttpResponse.json({
          import_id: id,
          status,
          total: 103,
          enriching: status === 'processing' ? 20 : 0,
          icp_scored: status === 'processing' ? 10 : 0,
          review_queue: status === 'complete' ? 97 : 50,
          suppressed: 3,
          failed: 0,
        } satisfies components['schemas']['ImportStatusResponse'])
      }),
    ]
  })(),

  // 6. Pipeline
  http.get(`${API_BASE}/api/v1/bd/pipeline`, () => {
    return HttpResponse.json({
      columns: [
        { status: 'discovered', count: 12, leads: [{ id: '00000000-0000-0000-0000-pipeline001', company_name: 'Alpha', icp_score: 80, canonical_domain: 'alpha.com', contact_name: null, contact_title: null, updated_at: new Date().toISOString(), created_at: new Date().toISOString() }] },
        { status: 'icp_scored', count: 8, leads: [{ id: '00000000-0000-0000-0000-pipeline002', company_name: 'Beta', icp_score: 72, canonical_domain: 'beta.io', contact_name: null, contact_title: null, updated_at: new Date().toISOString(), created_at: new Date().toISOString() }] },
        { status: 'review_queue', count: 6, leads: [] },
        { status: 'outreach_approved', count: 4, leads: [] },
        { status: 'outreach_sent', count: 9, leads: [] },
        { status: 'interested', count: 2, leads: [{ id: '00000000-0000-0000-0000-pipeline003', company_name: 'Gamma', icp_score: 91, canonical_domain: 'gamma.co', contact_name: null, contact_title: null, updated_at: new Date().toISOString(), created_at: new Date().toISOString() }] },
        { status: 'converted', count: 3, leads: [] },
      ],
    } satisfies components['schemas']['demand__schemas__lead_queue__PipelineResponse'])
  }),

  // 7. Outreach sequence list (MSW-only — no live list endpoint; sequences are accessed per lead)
  http.get(`${API_BASE}/api/v1/bd/outreach`, () => {
    return HttpResponse.json({
      sequences: [
        {
          sequence_id: '00000000-0000-0000-0002-000000000001',
          lead_id: '00000000-0000-0000-0000-000000000001',
          status: 'pending_review',
          outreach_angle: 'Engineering talent for Series B growth',
          rejection_notes: null,
          failure_reason: null,
          created_at: new Date().toISOString(),
          steps: [
            { step_index: 1, subject: 'Re: Engineering talent', body: 'Hi Jane, I wanted to reach out about...', original_subject: 'Re: Engineering talent', original_body: 'Hi Jane, I wanted to reach out about...', status: 'draft', scheduled_day: 0 },
            { step_index: 2, subject: 'Following up', body: 'Just checking in...', original_subject: 'Following up', original_body: 'Just checking in...', status: 'draft', scheduled_day: 3 },
            { step_index: 3, subject: 'Last touch', body: 'One final note...', original_subject: 'Last touch', original_body: 'One final note...', status: 'draft', scheduled_day: 7 },
          ],
        },
      ],
    })
  }),

  // 8. Outreach sequence detail
  http.get(`${API_BASE}/api/v1/bd/outreach/:sequence_id`, ({ params }) => {
    return HttpResponse.json({
      sequence_id: params.sequence_id as string,
      lead_id: '00000000-0000-0000-0000-000000000001',
      status: 'pending_review',
      outreach_angle: 'Engineering talent for Series B growth',
      rejection_notes: null,
      failure_reason: null,
      created_at: new Date().toISOString(),
      steps: [
        { step_index: 1, subject: 'Re: Engineering talent', body: 'Hi Jane...', original_subject: 'Re: Engineering talent', original_body: 'Hi Jane...', status: 'draft', scheduled_day: 0 },
        { step_index: 2, subject: 'Following up', body: 'Just checking in...', original_subject: 'Following up', original_body: 'Just checking in...', status: 'draft', scheduled_day: 3 },
        { step_index: 3, subject: 'Last touch', body: 'One final note...', original_subject: 'Last touch', original_body: 'One final note...', status: 'draft', scheduled_day: 7 },
      ],
    } satisfies components['schemas']['OutreachSequenceResponse'])
  }),

  // 9. Outreach approve/reject
  http.post(`${API_BASE}/api/v1/bd/outreach/:sequence_id/approve`, ({ params }) =>
    HttpResponse.json({ sequence_id: params.sequence_id, status: 'approved' })
  ),
  http.post(`${API_BASE}/api/v1/bd/outreach/:sequence_id/reject`, ({ params }) =>
    HttpResponse.json({ sequence_id: params.sequence_id, status: 'rejected' })
  ),

  // 10. Outreach step PATCH
  http.patch(`${API_BASE}/api/v1/bd/outreach/:sequence_id`, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ ...(body as object), updated: true })
  }),

  // 11. BD tasks (MSW-only stub — no live endpoint per RESEARCH.md Open Question 1)
  // NOTE: No live backend endpoint for /bd/tasks. MSW stub only.
  // Contract gap documented in .planning/contracts/ — Phase 2 uses mock.
  http.get(`${API_BASE}/api/v1/bd/tasks`, () => {
    return HttpResponse.json({
      tasks: [
        { id: '00000000-0000-0000-0003-000000000001', type: 'reply', category: 'interested', status: 'pending', due_at: null, context_json: { lead_id: '00000000-0000-0000-0000-000000000001', company_name: 'Acme Corp', contact_name: 'Jane Doe', classification: 'interested', ai_briefing: 'Acme Corp is actively hiring senior engineers. Jane mentioned budget approved for Q3.' }, created_at: new Date().toISOString() },
        { id: '00000000-0000-0000-0003-000000000002', type: 'reply', category: 'ooo', status: 'pending', due_at: null, context_json: { lead_id: '00000000-0000-0000-0000-000000000002', company_name: 'Buildco', contact_name: 'Tom Smith', classification: 'ooo', ai_briefing: null }, created_at: new Date().toISOString() },
        { id: '00000000-0000-0000-0003-000000000003', type: 'reply', category: 'unsubscribe', status: 'pending', due_at: null, context_json: { lead_id: '00000000-0000-0000-0000-000000000003', company_name: 'Dataflow Inc', contact_name: 'Sara Lee', classification: 'unsubscribe', ai_briefing: null }, created_at: new Date().toISOString() },
      ] satisfies components['schemas']['BDTaskSummary'][],
    })
  }),

]
