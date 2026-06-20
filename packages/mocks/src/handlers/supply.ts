import { http, HttpResponse } from 'msw'
import type { HttpHandler } from 'msw'
import type { components } from '@brynzit/api-client'
import { API_BASE } from '../base-url'

// Supply domain MSW handlers.
// All 14 handlers covering candidates, ingest, shortlists, and engagement.
// MSW-only handlers are marked with: // NOTE: MSW-only — no live backend endpoint
//
// CRITICAL path ordering: specific static paths before parameterised paths
//   /supply/candidates/search  (static) → BEFORE /supply/candidates/:candidate_id
//   /supply/candidates/ingest  (static) → BEFORE /supply/candidates/:candidate_id
export const supplyHandlers: HttpHandler[] = [

  // --- Candidate Search ---

  // 1. GET /api/v1/supply/candidates/search — returns 3 mock results
  // Registered BEFORE /:candidate_id to prevent MSW matching "search" as a candidate_id
  http.get(`${API_BASE}/api/v1/supply/candidates/search`, ({ request }) => {
    const url = new URL(request.url)
    const topK = Number(url.searchParams.get('top_k') ?? 10)
    const results: (components['schemas']['CandidateSearchResult'] & { match_reason?: string })[] = [
      {
        candidate_id: '00000000-0000-0000-0000-cand000001',
        name: 'Alice Chen',
        email: null,
        current_title: 'Senior Software Engineer',
        current_company: 'Stripe',
        seniority: 'senior',
        location: 'San Francisco, CA',
        skills: ['Python', 'FastAPI', 'PostgreSQL'],
        total_years_experience: 7,
        availability_status: 'open',
        email_verified: true,
        github_public_repos: 42,
        source: 'linkedin',
        // NOTE: contract proposal — match_reason not in live schema yet
        match_reason: 'Matches Python, FastAPI, distributed systems',
      },
      {
        candidate_id: '00000000-0000-0000-0000-cand000002',
        name: 'David Park',
        email: null,
        current_title: 'Backend Lead',
        current_company: 'Vercel',
        seniority: 'senior',
        location: 'Remote',
        skills: ['TypeScript', 'Node.js', 'Redis'],
        total_years_experience: 9,
        availability_status: 'open',
        email_verified: null,
        github_public_repos: null,
        source: 'csv',
        // NOTE: contract proposal — match_reason not in live schema yet
        match_reason: 'Strong TypeScript background, remote-first',
      },
      {
        candidate_id: '00000000-0000-0000-0000-cand000003',
        name: 'Sara Okonkwo',
        email: null,
        current_title: 'Staff Engineer',
        current_company: 'GitHub',
        seniority: 'staff',
        location: 'Austin, TX',
        skills: ['Go', 'Kubernetes', 'PostgreSQL'],
        total_years_experience: 12,
        availability_status: 'passive',
        email_verified: null,
        github_public_repos: null,
        source: 'linkedin',
      },
    ]
    const capped = results.slice(0, topK)
    return HttpResponse.json({
      results: capped,
      total: capped.length,
    } satisfies components['schemas']['TalentPoolSearchResponse'])
  }),

  // --- Ingest ---

  // 2. POST /api/v1/supply/candidates/ingest — LinkedIn profile ingest (201)
  // Registered BEFORE /:candidate_id to prevent MSW matching "ingest" as a candidate_id
  http.post(`${API_BASE}/api/v1/supply/candidates/ingest`, async ({ request }) => {
    const body = await request.json() as components['schemas']['IngestLinkedInRequest']
    void body // accessed for type safety; linkedin_url triggers Proxycurl in production
    return HttpResponse.json(
      {
        candidate_id: crypto.randomUUID(),
        name: 'Alice Chen (mock)',
        email: null,
        status: 'new',
        message: 'Candidate ingested successfully from LinkedIn.',
      } satisfies components['schemas']['IngestLinkedInResponse'],
      { status: 201 },
    )
  }),

  // 3. POST /api/v1/supply/candidates/ingest/csv — CSV batch ingest (200)
  http.post(`${API_BASE}/api/v1/supply/candidates/ingest/csv`, () => {
    return HttpResponse.json({
      imported: 5,
      skipped_duplicates: 1,
      skipped_malformed: 0,
      candidate_ids: [
        crypto.randomUUID(),
        crypto.randomUUID(),
        crypto.randomUUID(),
        crypto.randomUUID(),
        crypto.randomUUID(),
      ],
    } satisfies components['schemas']['CsvIngestResponse'])
  }),

  // --- Resume Upload ---

  // 4. POST /api/v1/supply/resumes/upload — resume file upload (202 async)
  http.post(`${API_BASE}/api/v1/supply/resumes/upload`, () => {
    return HttpResponse.json(
      {
        task_id: crypto.randomUUID(),
        candidate_id: '00000000-0000-0000-0000-cand000001',
        status: 'processing',
        message: 'Resume upload accepted. Parsing in progress.',
      } satisfies components['schemas']['ResumeUploadResponse'],
      { status: 202 },
    )
  }),

  // --- Candidate Profile ---

  // 5. GET /api/v1/supply/candidates/:candidate_id — full candidate profile
  // Registered AFTER all static /supply/candidates/* paths above
  // if id ends in '001' return unenriched, otherwise return enriched
  http.get(`${API_BASE}/api/v1/supply/candidates/:candidate_id`, ({ params }) => {
    const id = params.candidate_id as string
    const isUnenriched = id.endsWith('001')
    return HttpResponse.json({
      id,
      name: isUnenriched ? 'Alice Chen' : 'David Park',
      email: isUnenriched ? null : 'david@example.com',
      linkedin_url: `https://linkedin.com/in/${isUnenriched ? 'alice-chen' : 'david-park'}`,
      current_company: isUnenriched ? 'Stripe' : 'Vercel',
      current_title: isUnenriched ? 'Senior Software Engineer' : 'Backend Lead',
      source: isUnenriched ? 'linkedin' : 'csv',
      status: 'active',
      talent_pool: {
        skills: isUnenriched ? ['Python', 'FastAPI'] : ['TypeScript', 'Node.js', 'Redis'],
        current_title: isUnenriched ? 'Senior Software Engineer' : 'Backend Lead',
        seniority: isUnenriched ? 'senior' : 'senior',
        availability_status: 'open',
        total_years_experience: isUnenriched ? 7 : 9,
        location: isUnenriched ? 'San Francisco, CA' : 'Remote',
        email_verified: isUnenriched ? null : true,
        email_score: isUnenriched ? null : 92,
        github_url: isUnenriched ? null : 'https://github.com/david-park',
        github_public_repos: isUnenriched ? null : 31,
        github_top_languages: isUnenriched ? null : ['TypeScript', 'JavaScript', 'Python'],
        resume_file_path: isUnenriched ? null : '/resumes/david-park-2026.pdf',
        extraction_method: isUnenriched ? null : 'pdf',
      },
    } satisfies components['schemas']['CandidateProfileResponse'])
  }),

  // 6. POST /api/v1/supply/candidates/:candidate_id/enrich — trigger enrichment (202)
  http.post(`${API_BASE}/api/v1/supply/candidates/:candidate_id/enrich`, () => {
    return HttpResponse.json({}, { status: 202 })
  }),

  // --- Shortlists ---

  // 7. GET /api/v1/supply/shortlists/:requisition_id — get shortlist for a requisition
  http.get(`${API_BASE}/api/v1/supply/shortlists/:requisition_id`, ({ params }) => {
    return HttpResponse.json({
      requisition_id: params.requisition_id as string,
      total: 3,
      submissions: [
        {
          id: '00000000-0000-0000-0000-sub000000001',
          requisition_id: params.requisition_id as string,
          candidate_id: '00000000-0000-0000-0000-cand000001',
          match_score: 92,
          match_rationale: { summary: 'Strong Python + FastAPI fit' },
          status: 'shortlisted',
          supply_notes: null,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          updated_at: new Date().toISOString(),
          candidate_name: 'Alice Chen',
          candidate_email: null,
          candidate_title: 'Senior Software Engineer',
          candidate_skills: ['Python', 'FastAPI', 'PostgreSQL'],
          candidate_seniority: 'senior',
          candidate_location: 'San Francisco, CA',
          total_years_experience: 7,
        },
        {
          id: '00000000-0000-0000-0000-sub000000002',
          requisition_id: params.requisition_id as string,
          candidate_id: '00000000-0000-0000-0000-cand000002',
          match_score: 78,
          match_rationale: { summary: 'TypeScript expertise, good cultural fit' },
          status: 'approved',
          supply_notes: 'Great candidate for the role',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
          updated_at: new Date().toISOString(),
          candidate_name: 'David Park',
          candidate_email: 'david@example.com',
          candidate_title: 'Backend Lead',
          candidate_skills: ['TypeScript', 'Node.js', 'Redis'],
          candidate_seniority: 'senior',
          candidate_location: 'Remote',
          total_years_experience: 9,
        },
        {
          id: '00000000-0000-0000-0000-sub000000003',
          requisition_id: params.requisition_id as string,
          candidate_id: '00000000-0000-0000-0000-cand000003',
          match_score: 65,
          match_rationale: null,
          status: 'shortlisted',
          supply_notes: null,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          updated_at: new Date().toISOString(),
          candidate_name: 'Sara Okonkwo',
          candidate_email: null,
          candidate_title: 'Staff Engineer',
          candidate_skills: ['Go', 'Kubernetes', 'PostgreSQL'],
          candidate_seniority: 'staff',
          candidate_location: 'Austin, TX',
          total_years_experience: 12,
        },
      ],
    } satisfies components['schemas']['ShortlistResponse'])
  }),

  // 8. PATCH /api/v1/supply/shortlists/:submission_id — update submission status
  http.patch(`${API_BASE}/api/v1/supply/shortlists/:submission_id`, async ({ params, request }) => {
    const body = await request.json() as components['schemas']['PatchSubmissionRequest']
    return HttpResponse.json({
      id: params.submission_id as string,
      requisition_id: '00000000-0000-0000-0000-req000000001',
      candidate_id: '00000000-0000-0000-0000-cand000001',
      match_score: 88,
      match_rationale: null,
      status: body.status,
      supply_notes: body.notes ?? null,
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      updated_at: new Date().toISOString(),
      candidate_name: 'Alice Chen',
      candidate_email: null,
      candidate_title: 'Senior Software Engineer',
      candidate_skills: ['Python', 'FastAPI'],
      candidate_seniority: 'senior',
      candidate_location: 'San Francisco, CA',
      total_years_experience: 7,
    } satisfies components['schemas']['SubmissionResponse'])
  }),

  // --- Engagement ---

  // 9. GET /api/v1/supply/candidates/:candidate_id/engagement — list engagement sequences
  http.get(`${API_BASE}/api/v1/supply/candidates/:candidate_id/engagement`, ({ params }) => {
    const candidateId = params.candidate_id as string
    const sequences: components['schemas']['EngagementSequenceResponse'][] = [
      {
        id: '00000000-0000-0000-0000-seq000000001',
        candidate_id: candidateId,
        requisition_id: '00000000-0000-0000-0000-req000000001',
        status: 'draft',
        steps: [
          {
            step_index: 0,
            subject: 'Exciting opportunity at Acme Corp — Sr. Backend Engineer',
            body: 'Hi Alice,\n\nI came across your profile and think you would be a great fit for a Senior Backend Engineer role...',
            scheduled_day: 0,
          },
          {
            step_index: 1,
            subject: 'Following up — Sr. Backend Engineer at Acme Corp',
            body: 'Hi Alice,\n\nJust wanted to follow up on my previous message...',
            scheduled_day: 4,
          },
        ],
        created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '00000000-0000-0000-0000-seq000000002',
        candidate_id: candidateId,
        requisition_id: '00000000-0000-0000-0000-req000000002',
        status: 'draft',
        steps: [
          {
            step_index: 0,
            subject: 'Product Designer role — TechStart Inc',
            body: 'Hi Alice,\n\nWe are looking for a Product Designer at TechStart Inc...',
            scheduled_day: 0,
          },
          {
            step_index: 1,
            subject: 'Still interested? — TechStart Inc Product Designer',
            body: 'Hi Alice,\n\nFollowing up on the Product Designer opportunity...',
            scheduled_day: 3,
          },
        ],
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]
    return HttpResponse.json(sequences)
  }),

  // 10. POST /api/v1/supply/candidates/:candidate_id/engagement/generate — generate sequences (201)
  http.post(`${API_BASE}/api/v1/supply/candidates/:candidate_id/engagement/generate`, ({ params }) => {
    const candidateId = params.candidate_id as string
    return HttpResponse.json(
      {
        id: crypto.randomUUID(),
        candidate_id: candidateId,
        requisition_id: null,
        status: 'draft',
        steps: [
          {
            step_index: 0,
            subject: 'Exciting opportunity — generated',
            body: 'Hi there,\n\nI have an exciting opportunity that matches your background...',
            scheduled_day: 0,
          },
          {
            step_index: 1,
            subject: 'Following up on the opportunity',
            body: 'Hi there,\n\nJust following up on my previous message...',
            scheduled_day: 3,
          },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } satisfies components['schemas']['EngagementSequenceResponse'],
      { status: 201 },
    )
  }),

  // 11. GET /api/v1/supply/engagements — MSW-only list of all engagement sequences
  // NOTE: MSW-only — no live backend endpoint; lists all draft sequences across candidates
  http.get(`${API_BASE}/api/v1/supply/engagements`, () => {
    const sequences: components['schemas']['EngagementSequenceResponse'][] = [
      {
        id: '00000000-0000-0000-0000-seq000000001',
        candidate_id: '00000000-0000-0000-0000-cand000001',
        requisition_id: '00000000-0000-0000-0000-req000000001',
        status: 'draft',
        steps: [
          {
            step_index: 0,
            subject: 'Exciting opportunity at Acme Corp — Sr. Backend Engineer',
            body: 'Hi Alice,\n\nI came across your profile...',
            scheduled_day: 0,
          },
          {
            step_index: 1,
            subject: 'Following up — Sr. Backend Engineer at Acme Corp',
            body: 'Hi Alice,\n\nJust wanted to follow up...',
            scheduled_day: 4,
          },
        ],
        created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '00000000-0000-0000-0000-seq000000003',
        candidate_id: '00000000-0000-0000-0000-cand000002',
        requisition_id: '00000000-0000-0000-0000-req000000001',
        status: 'draft',
        steps: [
          {
            step_index: 0,
            subject: 'Backend Lead role — Acme Corp',
            body: 'Hi David,\n\nWe have a Backend Lead position...',
            scheduled_day: 0,
          },
          {
            step_index: 1,
            subject: 'Following up — Backend Lead at Acme Corp',
            body: 'Hi David,\n\nFollowing up on the Backend Lead opportunity...',
            scheduled_day: 3,
          },
        ],
        created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]
    return HttpResponse.json({ sequences })
  }),

  // 12. PATCH /api/v1/supply/engagement/:sequence_id — update sequence steps
  http.patch(`${API_BASE}/api/v1/supply/engagement/:sequence_id`, async ({ params, request }) => {
    const body = await request.json() as components['schemas']['PatchEngagementRequest']
    return HttpResponse.json({
      id: params.sequence_id as string,
      candidate_id: '00000000-0000-0000-0000-cand000001',
      requisition_id: '00000000-0000-0000-0000-req000000001',
      status: 'draft',
      steps: body.steps,
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      updated_at: new Date().toISOString(),
    } satisfies components['schemas']['EngagementSequenceResponse'])
  }),

  // 13. POST /api/v1/supply/engagement/:sequence_id/approve — approve sequence
  http.post(`${API_BASE}/api/v1/supply/engagement/:sequence_id/approve`, ({ params }) => {
    return HttpResponse.json({
      id: params.sequence_id as string,
      candidate_id: '00000000-0000-0000-0000-cand000001',
      requisition_id: '00000000-0000-0000-0000-req000000001',
      status: 'approved',
      steps: [
        {
          step_index: 0,
          subject: 'Exciting opportunity at Acme Corp — Sr. Backend Engineer',
          body: 'Hi Alice,\n\nI came across your profile and think you would be a great fit...',
          scheduled_day: 0,
        },
        {
          step_index: 1,
          subject: 'Following up — Sr. Backend Engineer at Acme Corp',
          body: 'Hi Alice,\n\nJust wanted to follow up on my previous message...',
          scheduled_day: 4,
        },
      ],
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      updated_at: new Date().toISOString(),
    } satisfies components['schemas']['EngagementSequenceResponse'])
  }),

  // 14. POST /api/v1/supply/engagement/:sequence_id/reject — reject sequence
  http.post(`${API_BASE}/api/v1/supply/engagement/:sequence_id/reject`, ({ params }) => {
    return HttpResponse.json({
      id: params.sequence_id as string,
      candidate_id: '00000000-0000-0000-0000-cand000001',
      requisition_id: '00000000-0000-0000-0000-req000000001',
      status: 'rejected',
      steps: null,
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      updated_at: new Date().toISOString(),
    } satisfies components['schemas']['EngagementSequenceResponse'])
  }),

]
