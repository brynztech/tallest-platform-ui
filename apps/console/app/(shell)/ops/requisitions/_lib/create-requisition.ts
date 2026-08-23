/**
 * Native-fetch helpers for the generate-first create wizard.
 *
 * `status: "draft"` is not in the generated api.d.ts yet — same convention as
 * `_lib/jd.ts` and `_lib/assignments.ts`.
 */

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
}

export interface DraftRequisition {
  id: string
  title: string
  status: string
  client_id: string | null
}

export async function createDraftRequisition(input: {
  client_id: string
  title: string
}): Promise<DraftRequisition> {
  const response = await fetch(`${apiBase()}/api/v1/ops/requisitions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: input.client_id,
      title: input.title,
      status: 'draft',
    }),
  })
  if (!response.ok) {
    throw new Error(`Failed to create requisition: ${response.status}`)
  }
  return (await response.json()) as DraftRequisition
}

export async function patchRequisitionTitle(reqId: string, title: string): Promise<void> {
  const response = await fetch(`${apiBase()}/api/v1/ops/requisitions/${encodeURIComponent(reqId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
  if (!response.ok) {
    throw new Error(`Failed to update title: ${response.status}`)
  }
}

/** Apply the user's post-parse edits (upload intake's review step). */
export async function patchRequisitionFields(
  reqId: string,
  fields: {
    seniority?: string | null
    skills?: string[]
    compensation_range?: string | null
  },
): Promise<void> {
  const response = await fetch(`${apiBase()}/api/v1/ops/requisitions/${encodeURIComponent(reqId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  })
  if (!response.ok) {
    throw new Error(`Failed to update requisition: ${response.status}`)
  }
}

export const JD_UPLOAD_MAX_BYTES = 10 * 1024 * 1024 // mirrors backend jd_upload_max_bytes
export const JD_UPLOAD_EXTENSIONS = ['.pdf', '.docx']

export interface ParsedJd {
  requisition_id: string
  status: string
  role: string
  seniority: string | null
  skills: string[]
  compensation_range: string | null
  target_start_date: string | null
  /** JD-stated hiring stages — already written into the requisition's
   * hiring process (with the internal Recruiter Review gate prepended);
   * echoed here so the review step can show what was configured. */
  interview_process: string[]
}

/**
 * Upload a PDF/DOCX JD; the backend extracts its text and parses it into
 * structured fields on the (draft) requisition. Multipart, so native fetch
 * (apps/console/CLAUDE.md gotcha #5 — the original multipart case).
 * Surfaces the backend's 422/413 detail messages verbatim (unsupported type,
 * unreadable scan, size cap) so the wizard can show them inline.
 */
export async function uploadJdDocument(reqId: string, file: File): Promise<ParsedJd> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch(
    `${apiBase()}/api/v1/ops/requisitions/${encodeURIComponent(reqId)}/jd/upload`,
    { method: 'POST', body: formData },
  )
  if (!response.ok) {
    let detail = ''
    try {
      const raw = ((await response.json()) as { detail?: unknown }).detail
      // FastAPI request-validation errors send detail as an array — only
      // surface plain-string details (our HTTPException paths) verbatim.
      if (typeof raw === 'string') detail = raw
    } catch {
      // non-JSON error body — fall through to the generic message
    }
    throw new Error(detail || `Failed to parse the uploaded JD: ${response.status}`)
  }
  return (await response.json()) as ParsedJd
}
