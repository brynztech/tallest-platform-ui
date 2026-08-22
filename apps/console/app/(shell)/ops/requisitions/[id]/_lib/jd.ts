/**
 * Native-fetch data layer for JD generation (JD v2).
 *
 * Uses native `fetch`, not `apiClient`, because `/ops/requisitions/{id}/jd`,
 * `.../jd/generate` and `.../jd/download` are not yet in this repo's generated
 * `api.d.ts` — the documented convention for paths absent from the generated
 * client (see `apps/console/CLAUDE.md` gotcha #5 and `_lib/shortlist.ts`).
 *
 * Backend contract: ../talent-platform/docs/jd-generation.md
 */

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
}

export interface JdTitleBlock {
  role_title: string
  company: string
  location: string
  work_type: string
  stage: string
}

export interface JdQuickFacts {
  location: string
  employment: string
  experience: string
  salary: string
  work_type: string
  company: string
  stage: string
  team_size: string
  equity: string
}

export interface JdFooter {
  recruiter_name: string
  recruiter_title: string
  email: string
  website: string
}

export interface JobDescription {
  requisition_id: string
  generated_at: string | null
  title_block: JdTitleBlock
  quick_facts: JdQuickFacts
  about_company: string
  about_role: string
  what_youll_own: string[]
  requirements: { must_have: string[]; nice_to_have: string[] }
  green_flags: string[]
  red_flags: string[]
  benefits: string[]
  interview_process: string[]
  footer: JdFooter
  hard_requirements: string[]
  application_requirements: string[]
  resdex_search_criteria: string
}

export interface GenerateJdInput {
  requirement_text: string
  website_url?: string
  website_content?: string
  reference_memos?: string[]
  resdex_memo?: string
  extra_green_flags?: string
  extra_red_flags?: string
}

export const NOT_SPECIFIED = 'Not specified'

/** A missing value renders as "Not specified" — never a blank cell. */
export function factValue(value: string | null | undefined): string {
  const trimmed = (value ?? '').trim()
  return trimmed === '' ? NOT_SPECIFIED : trimmed
}

/**
 * The quick-facts table's fixed 3x3 layout. Order is part of the template
 * contract (see the backend's `_quick_facts`) — never reordered or collapsed.
 */
export function quickFactRows(
  facts: Partial<JdQuickFacts> | null | undefined,
): { label: string; value: string }[][] {
  const f = facts ?? {}
  return [
    [
      { label: 'LOCATION', value: factValue(f.location) },
      { label: 'EMPLOYMENT', value: factValue(f.employment) },
      { label: 'EXPERIENCE', value: factValue(f.experience) },
    ],
    [
      { label: 'SALARY', value: factValue(f.salary) },
      { label: 'WORK TYPE', value: factValue(f.work_type) },
      { label: 'COMPANY', value: factValue(f.company) },
    ],
    [
      { label: 'STAGE', value: factValue(f.stage) },
      { label: 'TEAM SIZE', value: factValue(f.team_size) },
      { label: 'EQUITY', value: factValue(f.equity) },
    ],
  ]
}

/** `Company · Work type · Location · Stage`, skipping anything unset. */
export function titleSubtitle(block: Partial<JdTitleBlock> | null | undefined): string {
  const b = block ?? {}
  return [b.company, b.work_type, b.location, b.stage]
    .map((part) => (part ?? '').trim())
    .filter(Boolean)
    .join('  ·  ')
}

/** Splits a model-written block into paragraphs; blank text renders nothing. */
export function paragraphs(text: string | null | undefined): string[] {
  return (text ?? '')
    .split('\n')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
}

/** The stored JD, or `null` when this requisition has never had one generated. */
export async function fetchJd(reqId: string): Promise<JobDescription | null> {
  const res = await fetch(`${apiBase()}/api/v1/ops/requisitions/${encodeURIComponent(reqId)}/jd`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GET jd failed: ${res.status}`)
  return (await res.json()) as JobDescription
}

export async function generateJd(
  reqId: string,
  input: GenerateJdInput,
): Promise<JobDescription> {
  const res = await fetch(
    `${apiBase()}/api/v1/ops/requisitions/${encodeURIComponent(reqId)}/jd/generate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  )
  if (!res.ok) {
    // FastAPI puts the operator-facing reason in `detail` (e.g. no website supplied).
    const detail = await res
      .json()
      .then((body) => (typeof body?.detail === 'string' ? body.detail : null))
      .catch(() => null)
    throw new Error(detail ?? `Generation failed: ${res.status}`)
  }
  return (await res.json()) as JobDescription
}

/** The backend streams the .docx — the browser never builds the file. */
export function jdDownloadUrl(reqId: string): string {
  return `${apiBase()}/api/v1/ops/requisitions/${encodeURIComponent(reqId)}/jd/download`
}
