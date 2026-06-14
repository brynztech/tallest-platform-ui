// apps/web/app/_lib/candidate-types.ts
// Types derived from .planning/contracts/*.yaml
// DELETE and import from api.d.ts when candidate backend endpoints ship.

export type PublicJobItem = {
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
  compensation_min: number | null
  compensation_max: number | null
  match_strength: 'strong' | 'partial' | 'none' | null
}

export type PublicJobsResponse = {
  items: PublicJobItem[]
  next_cursor: string | null
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
