/**
 * Native-fetch data layer for stored-document presigned URLs (candidate
 * resumes, uploaded JD originals) — endpoints not yet in the generated
 * api.d.ts, per the documented convention (apps/console/CLAUDE.md gotcha #5).
 *
 * URLs are short-lived (backend DOCUMENT_URL_TTL_SECONDS): fetch on click,
 * never cache — a cached presigned URL is a stale-authorization bug.
 */

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
}

export interface DocumentUrlResponse {
  url: string
  filename: string | null
}

/** 404 → null (no stored file: pre-persistence candidate or unconfigured bucket). */
export async function fetchResumeUrl(candidateId: string): Promise<DocumentUrlResponse | null> {
  const res = await fetch(
    `${apiBase()}/api/v1/supply/candidates/${encodeURIComponent(candidateId)}/resume-url`,
  )
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Failed to get resume URL: ${res.status}`)
  return (await res.json()) as DocumentUrlResponse
}

/** 404 → null (JD was never uploaded as a document, or bucket unconfigured). */
export async function fetchUploadedJdUrl(reqId: string): Promise<DocumentUrlResponse | null> {
  const res = await fetch(
    `${apiBase()}/api/v1/ops/requisitions/${encodeURIComponent(reqId)}/jd/original-url`,
  )
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Failed to get JD document URL: ${res.status}`)
  return (await res.json()) as DocumentUrlResponse
}

/**
 * Open a fetched document URL in a new tab, popup-blocker-safe: the window is
 * opened synchronously inside the user gesture, then navigated once the
 * presigned URL arrives (Safari blocks window.open after an await).
 * Returns false when there is no stored document (caller shows its own toast).
 */
export async function openDocumentInNewTab(
  fetchUrl: () => Promise<DocumentUrlResponse | null>,
): Promise<boolean> {
  const win = window.open('about:blank', '_blank', 'noopener,noreferrer')
  try {
    const doc = await fetchUrl()
    if (!doc) {
      win?.close()
      return false
    }
    if (win) win.location.href = doc.url
    else window.location.href = doc.url // popup fully blocked — same-tab fallback
    return true
  } catch (error) {
    win?.close()
    throw error
  }
}
