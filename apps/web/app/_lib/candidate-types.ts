// apps/web/app/_lib/candidate-types.ts
// Types derived from .planning/contracts/*.yaml
// DELETE and import from api.d.ts when candidate backend endpoints ship.

export type EmploymentType =
  | 'full_time'
  | 'part_time'
  | 'contract'
  | 'internship'
  | 'temporary'

/** Job-side workplace arrangement. Supersedes the `remote` boolean, which
 *  cannot express hybrid — the most common real arrangement. */
export type RemoteMode = 'onsite' | 'hybrid' | 'remote'

export type Seniority =
  | 'intern'
  | 'junior'
  | 'mid'
  | 'senior'
  | 'staff'
  | 'lead'
  | 'principal'
  | 'director'
  | 'exec'

/** 'scraped' = public ATS posting (apply outbound via source_url).
 *  'client_requisition' = our own role (apply through the platform). */
export type JobKind = 'scraped' | 'client_requisition'

export type PublicJobItem = {
  id: string
  title: string
  company_name: string | null
  employment_type: EmploymentType
  location: string | null
  /** Legacy flag kept for compatibility; prefer `remote_mode`. */
  remote: boolean
  seniority: Seniority | null
  /** Normalized slugs — what the ?skills= filter accepts. Render
   *  `skills_display` instead: "cplusplus" is not what a human should read. */
  skills: string[]
  date_posted: string
  description_summary: string | null
  /** Full posting text with line breaks; "• " starts a list item. Job detail only (the feed sends null). */
  description?: string | null
  compensation_min: number | null
  compensation_max: number | null
  match_strength: 'strong' | 'partial' | 'none' | null

  job_kind: JobKind
  source: string | null
  /** External apply URL for scraped jobs; null for our own requisitions. */
  source_url: string | null
  country: string | null
  city: string | null
  remote_mode: RemoteMode | null
  role_family: string | null
  compensation_currency: string | null
  compensation_period: 'year' | 'month' | 'hour' | null
  /** Why this job matched, e.g. "3 of 4 skills matched (python, …)". */
  match_reasons: string[]
  /** Render-ready skill labels ("C++", "CI/CD"). */
  skills_display: string[]
  /** Preformatted, currency-qualified pay ("USD 160k–210k/yr"), or null.
   *  Never render an amount without this — 2,000,000 is ~INR 20L or ~USD 2M. */
  compensation_label: string | null
  /** Identical postings collapsed into this entry (a company opening N seats
   *  on one role). >1 renders as "N openings". */
  openings: number
  /** Company avatar; null for sources that don't provide one. */
  company_logo_url: string | null
  /** LinkedIn-sourced applicant count. Null means unknown — render nothing at
   *  all. A real 0 is a known count worth showing ("be the first to apply"),
   *  so gate on `!== null`, never on truthiness. Always null for ATS sources
   *  (greenhouse, ashby, etc), which don't publish it. */
  applicants_count: number | null
  /** Other job boards carrying this same real job, collapsed out of the
   *  list so the candidate can pick which board to apply through. Usually empty. */
  alternate_postings: { source: string; url: string }[]
}

export type PublicJobsResponse = {
  items: PublicJobItem[]
  next_cursor: string | null
  /** Total matching the current filters; a floor when `truncated` is true. */
  total: number
  /** True when the ranked set hit its size cap, so more exist than `total` says. */
  truncated: boolean
  /** True when the caller has a profile to match against — lets the UI tell
   *  "no matches" apart from "no profile yet". */
  personalized: boolean
}

export type CandidateProfile = {
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

export type CandidateProfileUpdate = Partial<
  Omit<CandidateProfile, 'id' | 'email' | 'enrichment_status' | 'completeness_score'>
>

export type CandidateAuthResponse = {
  id: string
  email: string
  access_token: string
  expires_in?: number
}

export type CandidateApplication = {
  id: string
  job_id: string
  job_title: string | null
  company_name: string | null
  status: 'applied' | 'reviewing' | 'shortlisted' | 'interview' | 'offer' | 'rejected'
  substep_label: string | null
  applied_at: string
}

export type CandidateApplicationsResponse = {
  items: CandidateApplication[]
  next_cursor: string | null
}

export type ResumeParseStatus = {
  status: 'processing' | 'complete' | 'failed'
  profile_snapshot?: Partial<CandidateProfile>
}
