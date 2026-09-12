/**
 * Typed client for the job-board admin API.
 *
 * Every call goes through the console's own `/api/job-board/*` route handler, not
 * the backend directly: the admin token lives in server-only env and must never
 * reach the browser bundle.
 */

export type IngestionRunStatus = 'queued' | 'running' | 'succeeded' | 'partial' | 'failed'

export type IngestionRunError = {
  company_id?: string
  display_name?: string
  /** Saved-search failures identify themselves by search name, not company. */
  name?: string
  search_id?: string
  source?: string
  error: string
  stage?: string
}

/** Which pipeline produced a run. They share one table and one active-run slot
 *  but have separate schedules and costs — ATS boards are free, Apify bills per
 *  result — so the console lists them in separate tabs. */
export type RunEngine = 'ats' | 'apify_linkedin'

export type IngestionRun = {
  id: string
  status: IngestionRunStatus
  trigger: string
  triggered_by: string | null
  engine: RunEngine
  started_at: string | null
  finished_at: string | null
  companies_total: number
  companies_done: number
  jobs_fetched: number
  jobs_inserted: number
  jobs_updated: number
  jobs_closed: number
  /** Fetched but not stored — currently postings outside US/IN. Surfaced so a
   *  smaller-than-expected result is explainable rather than mysterious. */
  jobs_rejected: number
  errors: IngestionRunError[]
  created_at: string
}

export type IngestionRunList = { items: IngestionRun[]; total: number }

export type JobSource = {
  source: string
  display_name: string
  requires_board_token: boolean
  enabled: boolean
  notes: string
  docs_url: string | null
}

export type TrackedCompany = {
  id: string
  source: string
  board_token: string
  display_name: string
  website_url: string
  canonical_domain: string
  is_active: boolean
  created_at: string
}

export type VisibilityRules = {
  max_age_days: number | null
  allowed_countries: string[]
  allowed_sources: string[]
  min_quality_score: number
  require_compensation: boolean
  blocked_company_domains: string[]
  blocked_title_patterns: string[]
  /** Increments on every save; part of the feed cache key, so a change takes
   *  effect platform-wide on the next request. */
  rules_version: number
  updated_by: string | null
  updated_at: string
}

export type VisibilityRulesUpdate = Partial<
  Omit<VisibilityRules, 'rules_version' | 'updated_by' | 'updated_at'>
>

export type VisibilityImpact = {
  total_active: number
  visible: number
  hidden: number
  by_country: Record<string, number>
  /** Non-null when the proposed rules would show candidates nothing. */
  warning: string | null
}

/** A saved Apify LinkedIn keyword search — the counterpart of TrackedCompany
 *  for a source with no per-company board to register. */
export type SearchQuery = {
  id: string
  name: string
  keywords: string | null
  location: string | null
  geo_id: string | null
  distance: number | null
  company_ids: string[] | null
  under_10_applicants: boolean
  limit_per_source: number
  search_urls: string[] | null
  date_posted_override: string | null
  is_active: boolean
  last_run_at: string | null
  created_at: string
  updated_at: string
}

export type SearchQueryCreate = {
  name: string
  keywords?: string | null
  location?: string | null
  geo_id?: string | null
  distance?: number | null
  company_ids?: string[] | null
  under_10_applicants?: boolean
  limit_per_source?: number
  search_urls?: string[] | null
  date_posted_override?: string | null
  is_active?: boolean
}

export type SearchQueryUpdate = Partial<SearchQueryCreate>

const BASE = '/api/job-board'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    // Surface the backend's own message: "an ingestion run is already active",
    // "invalid title pattern", etc. are actionable; "Request failed" is not.
    let detail = `Request failed (${response.status})`
    try {
      const body = await response.json()
      if (typeof body?.detail === 'string') detail = body.detail
    } catch {
      /* non-JSON error body — keep the status-based message */
    }
    throw new Error(detail)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export const jobBoardApi = {
  listSources: () => request<JobSource[]>('/sources'),

  listCompanies: () => request<TrackedCompany[]>('/companies'),

  seedCompanies: () => request<TrackedCompany[]>('/companies/seed', { method: 'POST' }),

  addCompany: (body: {
    source: string
    board_token: string
    website_url: string
    display_name?: string
  }) => request<TrackedCompany>('/companies', { method: 'POST', body: JSON.stringify(body) }),

  /** 202 + a pollable run record. 409 if a crawl is already in flight, which is
   *  what makes an impatient double-click harmless. */
  startRun: () => request<IngestionRun>('/ingestion-runs', { method: 'POST' }),

  getRun: (id: string) => request<IngestionRun>(`/ingestion-runs/${id}`),

  /** `engine` scopes history to one pipeline; omitted, both come back mixed. */
  listRuns: (limit = 10, engine?: RunEngine) =>
    request<IngestionRunList>(`/ingestion-runs?limit=${limit}${engine ? `&engine=${engine}` : ''}`),

  getVisibilityRules: () => request<VisibilityRules>('/visibility-rules'),

  saveVisibilityRules: (body: VisibilityRulesUpdate) =>
    request<VisibilityRules>('/visibility-rules', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  /** Impact of a proposed policy WITHOUT saving it. Exists because a tight age
   *  window can silently empty the candidate site. */
  previewVisibilityRules: (body: VisibilityRulesUpdate) =>
    request<VisibilityImpact>('/visibility-rules/preview', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  listSearchQueries: () => request<SearchQuery[]>('/search-queries'),

  createSearchQuery: (body: SearchQueryCreate) =>
    request<SearchQuery>('/search-queries', { method: 'POST', body: JSON.stringify(body) }),

  updateSearchQuery: (id: string, body: SearchQueryUpdate) =>
    request<SearchQuery>(`/search-queries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  deleteSearchQuery: (id: string) => request<void>(`/search-queries/${id}`, { method: 'DELETE' }),

  /** 202 + a pollable run record, same contract as startRun — 409 if a run
   *  (of either kind) is already active. */
  runSearchQuery: (id: string) =>
    request<IngestionRun>(`/search-queries/${id}/run`, { method: 'POST' }),
}

export const RUN_IN_PROGRESS: IngestionRunStatus[] = ['queued', 'running']

export function isRunActive(run: IngestionRun | undefined | null): boolean {
  return run != null && RUN_IN_PROGRESS.includes(run.status)
}
