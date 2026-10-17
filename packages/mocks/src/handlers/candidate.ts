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

type PublicJobItem = {
  id: string
  title: string
  company_name: string | null
  employment_type: 'full_time' | 'part_time' | 'contract'
  location: string | null
  remote: boolean
  seniority: 'junior' | 'mid' | 'senior' | 'staff' | 'principal' | null
  skills: string[]
  date_posted: string
  description_summary: string | null
  description?: string | null
  compensation_min: number | null
  compensation_max: number | null
  match_strength: 'strong' | 'partial' | 'none' | null
}

type CandidateProfile = {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  headline: string | null
  location: string | null
  remote_preference: 'remote_only' | 'hybrid' | 'onsite' | 'flexible' | null
  seniority: 'junior' | 'mid' | 'senior' | 'staff' | 'principal' | null
  skills: string[]
  github_url: string | null
  linkedin_url: string | null
  resume_url: string | null
  completeness_score: number | null
  enrichment_status: 'pending' | 'enriched' | 'failed' | null
}

const MOCK_JOBS: PublicJobItem[] = [
  {
    id: 'job-001',
    title: 'Senior Frontend Engineer',
    company_name: 'Acme Corp',
    employment_type: 'full_time',
    location: 'San Francisco, CA',
    remote: true,
    seniority: 'senior',
    skills: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
    date_posted: '2026-06-01',
    description_summary:
      'Join our product team to build the next generation of our customer-facing web application. You will work closely with design and backend teams.',
    description:
      'Join our product team to build the next generation of our customer-facing web application.\n\nWhat you will do\n• Ship features end to end with design and backend\n• Own the performance of our React front end\n• Mentor two engineers\n\nWhat you bring\n• 5+ years with React and TypeScript\n• Experience with GraphQL',
    compensation_min: 160000,
    compensation_max: 220000,
    match_strength: 'strong',
  },
  {
    id: 'job-002',
    title: 'Full Stack Engineer',
    company_name: 'Buildco',
    employment_type: 'full_time',
    location: 'New York, NY',
    remote: false,
    seniority: 'mid',
    skills: ['Python', 'Django', 'React', 'PostgreSQL'],
    date_posted: '2026-06-03',
    description_summary:
      'Build scalable web services and contribute to our platform architecture. Opportunity to work across the full stack in a fast-moving environment.',
    compensation_min: 120000,
    compensation_max: 160000,
    match_strength: 'partial',
  },
  {
    id: 'job-003',
    title: 'Backend Engineer',
    company_name: 'Dataflow Inc',
    employment_type: 'contract',
    location: 'Remote',
    remote: true,
    seniority: 'senior',
    skills: ['Go', 'Kubernetes', 'gRPC', 'PostgreSQL'],
    date_posted: '2026-06-05',
    description_summary:
      '6-month contract to build data pipeline infrastructure for a high-throughput analytics platform.',
    compensation_min: null,
    compensation_max: null,
    match_strength: 'none',
  },
  {
    id: 'job-004',
    title: 'Staff Software Engineer',
    company_name: 'Fintech Ltd',
    employment_type: 'full_time',
    location: 'Austin, TX',
    remote: true,
    seniority: 'staff',
    skills: ['Java', 'Kafka', 'AWS', 'TypeScript'],
    date_posted: '2026-06-04',
    description_summary:
      'Lead technical initiatives across our payments platform and mentor a team of 6 engineers. Owns cross-cutting infrastructure decisions.',
    compensation_min: 200000,
    compensation_max: 280000,
    match_strength: 'strong',
  },
  {
    id: 'job-005',
    title: 'Junior Frontend Developer',
    company_name: 'Growthbase',
    employment_type: 'full_time',
    location: 'Austin, TX',
    remote: false,
    seniority: 'junior',
    skills: ['React', 'CSS', 'JavaScript'],
    date_posted: '2026-06-08',
    description_summary:
      'Great opportunity to grow your frontend skills working on a B2B SaaS product with an experienced team.',
    compensation_min: 80000,
    compensation_max: 100000,
    match_strength: null,
  },
  {
    id: 'job-006',
    title: 'DevOps Engineer',
    company_name: 'Horizon Labs',
    employment_type: 'full_time',
    location: 'Seattle, WA',
    remote: true,
    seniority: 'mid',
    skills: ['Terraform', 'AWS', 'Docker', 'Python'],
    date_posted: '2026-06-07',
    description_summary:
      'Own CI/CD infrastructure and cloud cost optimization for a growing AI startup. Work directly with engineering leadership.',
    compensation_min: 130000,
    compensation_max: 170000,
    match_strength: 'partial',
  },
  {
    id: 'job-007',
    title: 'Product Engineer',
    company_name: 'Metrotech',
    employment_type: 'full_time',
    location: 'Chicago, IL',
    remote: true,
    seniority: 'mid',
    skills: ['React', 'TypeScript', 'Ruby on Rails'],
    date_posted: '2026-05-28',
    description_summary:
      'Work at the intersection of product and engineering — own features end-to-end and collaborate directly with customers.',
    compensation_min: null,
    compensation_max: null,
    match_strength: null,
  },
  {
    id: 'job-008',
    title: 'Senior Data Engineer',
    company_name: 'Nexus Analytics',
    employment_type: 'full_time',
    location: 'Remote',
    remote: true,
    seniority: 'senior',
    skills: ['Spark', 'Airflow', 'Python', 'dbt', 'Snowflake'],
    date_posted: '2026-06-02',
    description_summary:
      'Build and maintain data pipelines powering our ML platform. Opportunity to shape data infrastructure strategy.',
    compensation_min: 150000,
    compensation_max: 190000,
    match_strength: 'strong',
  },
  {
    id: 'job-009',
    title: 'iOS Engineer',
    company_name: 'Pinewave',
    employment_type: 'full_time',
    location: 'Los Angeles, CA',
    remote: false,
    seniority: 'senior',
    skills: ['Swift', 'SwiftUI', 'Xcode', 'CoreData'],
    date_posted: '2026-06-06',
    description_summary:
      'Join our mobile team to ship features to 2M+ daily active users. Own performance and accessibility improvements.',
    compensation_min: 170000,
    compensation_max: 230000,
    match_strength: 'none',
  },
  {
    id: 'job-010',
    title: 'Platform Engineer',
    company_name: 'Orion Systems',
    employment_type: 'contract',
    location: 'Boston, MA',
    remote: true,
    seniority: 'mid',
    skills: ['Kubernetes', 'Helm', 'Go', 'Prometheus'],
    date_posted: '2026-06-09',
    description_summary:
      'Short-term contract to migrate infrastructure to EKS and establish SLOs for a Series A startup.',
    compensation_min: 90000,
    compensation_max: 120000,
    match_strength: 'partial',
  },
  {
    id: 'job-011',
    title: 'Frontend Engineer',
    company_name: 'Strata Health',
    employment_type: 'full_time',
    location: 'Denver, CO',
    remote: true,
    seniority: 'mid',
    skills: ['Vue.js', 'TypeScript', 'GraphQL'],
    date_posted: '2026-06-10',
    description_summary:
      'Build patient-facing dashboards for a healthcare data platform. HIPAA experience preferred.',
    compensation_min: 110000,
    compensation_max: 145000,
    match_strength: null,
  },
  {
    id: 'job-012',
    title: 'Part-time React Contractor',
    company_name: 'Wanderlust Studios',
    employment_type: 'part_time',
    location: 'Remote',
    remote: true,
    seniority: 'junior',
    skills: ['React', 'Tailwind CSS', 'Next.js'],
    date_posted: '2026-06-11',
    description_summary:
      'Part-time engagement to build marketing site components and help with a design system migration.',
    compensation_min: null,
    compensation_max: null,
    match_strength: null,
  },
]

const MOCK_PROFILE: CandidateProfile = {
  id: 'mock-candidate-id',
  email: 'demo@brynzit.local',
  first_name: 'Demo',
  last_name: 'Candidate',
  headline: 'Frontend Engineer with 5 years in React and TypeScript',
  location: 'San Francisco, CA',
  remote_preference: 'hybrid',
  seniority: 'senior',
  skills: ['TypeScript', 'React', 'Node.js'],
  github_url: 'https://github.com/alexchen',
  linkedin_url: null,
  resume_url: null,
  completeness_score: 65,
  enrichment_status: 'pending',
}

const MOCK_PROFILE_SNAPSHOT: Partial<CandidateProfile> = {
  first_name: 'Demo',
  last_name: 'Candidate',
  headline: 'Senior Frontend Engineer',
  skills: ['TypeScript', 'React', 'Node.js', 'GraphQL'],
  github_url: 'https://github.com/alexchen',
}

// Stateful poll counter for resume parse simulation
const resumeParsePollCounts = new Map<string, number>()

function computeMockScore(
  body: Record<string, unknown>,
  base: CandidateProfile,
): number {
  const updated = { ...base, ...body }
  const updatedFields = [
    updated.first_name,
    updated.last_name,
    updated.headline,
    updated.location,
    ((updated.skills as string[] | undefined)?.length ?? 0) > 0,
    updated.remote_preference,
    updated.seniority,
    updated.github_url,
    updated.linkedin_url,
    updated.resume_url,
  ]
  return Math.min(100, updatedFields.filter(Boolean).length * 10)
}

export const candidateHandlers: HttpHandler[] = [
  // POST /public/jobs/:id/apply-click — fire-and-forget analytics
  http.post(`${API_BASE}/api/v1/public/jobs/:id/apply-click`, () => new HttpResponse(null, { status: 204 })),

  // GET /public/jobs/:id — must come BEFORE GET /public/jobs (more specific)
  http.get(`${API_BASE}/api/v1/public/jobs/:id`, ({ params }) => {
    const job = MOCK_JOBS.find((j) => j.id === params.id)
    if (!job) {
      return HttpResponse.json({ detail: 'Job not found' }, { status: 404 })
    }
    return HttpResponse.json(job)
  }),

  // GET /candidate/profile/resume/status/:parse_id — stateful poll simulation
  // must come BEFORE POST /candidate/profile/resume
  http.get(
    `${API_BASE}/api/v1/candidate/profile/resume/status/:parse_id`,
    ({ params }) => {
      const parseId = String(params.parse_id)
      const count = (resumeParsePollCounts.get(parseId) ?? 0) + 1
      resumeParsePollCounts.set(parseId, count)

      if (count <= 2) {
        return HttpResponse.json({ status: 'processing' })
      }

      // On 3rd+ poll: complete with profile snapshot
      resumeParsePollCounts.delete(parseId)
      return HttpResponse.json({
        status: 'complete',
        profile_snapshot: MOCK_PROFILE_SNAPSHOT,
      })
    },
  ),

  // POST /candidate/profile/resume — triggers async parse
  http.post(`${API_BASE}/api/v1/candidate/profile/resume`, () => {
    const parseId = `resume-parse-mock-${Date.now()}`
    resumeParsePollCounts.set(parseId, 0)
    return HttpResponse.json({ parse_id: parseId }, { status: 202 })
  }),

  // POST /candidate/applications
  http.post(
    `${API_BASE}/api/v1/candidate/applications`,
    async ({ request }) => {
      const body = (await request.json()) as { job_id: string; note?: string }
      return HttpResponse.json(
        {
          id: `app-${Date.now()}`,
          job_id: body.job_id,
          job_title: MOCK_JOBS.find((j) => j.id === body.job_id)?.title ?? null,
          company_name:
            MOCK_JOBS.find((j) => j.id === body.job_id)?.company_name ?? null,
          status: 'applied',
          substep_label: 'Matching to open roles',
          applied_at: new Date().toISOString(),
        },
        { status: 201 },
      )
    },
  ),

  // GET /public/jobs — cursor paginated with q filter
  http.get(`${API_BASE}/api/v1/public/jobs`, ({ request }) => {
    const url = new URL(request.url)
    const cursor = url.searchParams.get('cursor')
    const q = url.searchParams.get('q')?.toLowerCase()
    const roleType = url.searchParams.get('role_type')
    const seniority = url.searchParams.get('seniority')
    const location = url.searchParams.get('location')?.toLowerCase()
    const skills = url.searchParams
      .get('skills')
      ?.split(',')
      .map((skill) => skill.trim().toLowerCase())
      .filter(Boolean)
    const remote = url.searchParams.get('remote') === 'true'

    const allJobs = MOCK_JOBS.filter((job) => {
      const searchableText = [
        job.title,
        job.company_name,
        job.description_summary,
        ...job.skills,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      if (q && !searchableText.includes(q)) return false
      if (roleType && job.employment_type !== roleType) return false
      if (seniority && job.seniority !== seniority) return false
      if (location && !(job.location ?? '').toLowerCase().includes(location)) return false
      if (remote && !job.remote) return false
      if (skills?.length) {
        const jobSkills = job.skills.map((skill) => skill.toLowerCase())
        if (!skills.every((skill) => jobSkills.some((jobSkill) => jobSkill.includes(skill)))) {
          return false
        }
      }
      return true
    })

    const offset = cursor === 'cursor-page-2' ? 6 : 0
    const page = allJobs.slice(offset, offset + 6)
    const hasMore = allJobs.length > 6 && offset === 0

    return HttpResponse.json({
      items: page,
      next_cursor: hasMore ? 'cursor-page-2' : null,
    })
  }),

  // POST /candidate/auth/signup
  http.post(
    `${API_BASE}/api/v1/candidate/auth/signup`,
    async ({ request }) => {
      const body = (await request.json()) as { email: string }
      return HttpResponse.json(
        {
          id: `cand-${Date.now()}`,
          email: body.email ?? 'test@example.com',
          access_token: `mock-token-${Date.now()}`,
          expires_in: 3600,
        },
        { status: 201 },
      )
    },
  ),

  // POST /candidate/auth/login
  http.post(`${API_BASE}/api/v1/candidate/auth/login`, async ({ request }) => {
    const body = (await request.json()) as {
      email: string
      password: string
    }
    if (body.password === 'wrongpassword') {
      return HttpResponse.json(
        { detail: 'Invalid credentials' },
        { status: 401 },
      )
    }
    return HttpResponse.json({
      access_token: 'mock-token',
      token_type: 'bearer',
      expires_in: 3600,
    })
  }),

  // GET /candidate/profile
  http.get(`${API_BASE}/api/v1/candidate/profile`, () => {
    return HttpResponse.json(MOCK_PROFILE)
  }),

  // PUT /candidate/profile — merges and recomputes completeness score
  http.put(`${API_BASE}/api/v1/candidate/profile`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const newScore = computeMockScore(body, MOCK_PROFILE)
    return HttpResponse.json({
      ...MOCK_PROFILE,
      ...body,
      completeness_score: newScore,
    })
  }),

  // GET /candidate/applications
  http.get(`${API_BASE}/api/v1/candidate/applications`, () => {
    return HttpResponse.json({
      items: [
        {
          id: 'app-001',
          job_id: MOCK_JOBS[0].id,
          job_title: MOCK_JOBS[0].title,
          company_name: MOCK_JOBS[0].company_name,
          status: 'reviewing',
          substep_label: 'Recruiter notified',
          applied_at: '2026-06-10T09:00:00Z',
        },
        {
          id: 'app-002',
          job_id: MOCK_JOBS[1].id,
          job_title: MOCK_JOBS[1].title,
          company_name: MOCK_JOBS[1].company_name,
          status: 'applied',
          substep_label: 'Matching to open roles',
          applied_at: '2026-06-12T14:00:00Z',
        },
      ],
      next_cursor: null,
    })
  }),
]
