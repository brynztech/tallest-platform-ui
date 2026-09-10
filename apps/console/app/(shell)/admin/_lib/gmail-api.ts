/**
 * Typed client for the Gmail resume-ingest admin API.
 *
 * Every call goes through the console's own `/api/gmail/*` route handler, not
 * the backend directly: the admin token lives in server-only env and must never
 * reach the browser bundle.
 */

export type GmailIngestStatusValue =
  | 'ingested'
  | 'parse_failed'
  | 'no_attachment'
  | 'too_large'
  | 'duplicate'

export type GmailIngestedMessage = {
  message_id: string
  filename: string
  subject: string | null
  from_address: string | null
  status: GmailIngestStatusValue
  candidate_id: string | null
  ingested_at: string
}

export type GmailIngestStatus = {
  /** Backend env holds GMAIL_ADDRESS + GMAIL_APP_PASSWORD. False means no
   *  amount of console configuration will make this run. */
  configured: boolean
  email_address: string | null
  /** Case-insensitive substring match on the subject. Empty means ingest
   *  nothing — never "match everything". */
  subject_filters: string[]
  is_active: boolean
  last_polled_at: string | null
  last_error: string | null
  recent: GmailIngestedMessage[]
}

export type GmailIngestConfigUpdate = {
  subject_filters?: string[]
  is_active?: boolean
}

export type GmailPollResponse = { status: string; detail: string }

const BASE = '/api/gmail'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    // Surface the backend's own message: "Add at least one subject filter
    // before polling", "Gmail ingest is paused" are actionable; a bare
    // "Request failed" is not.
    let detail = `Request failed (${response.status})`
    try {
      const body = await response.json()
      if (typeof body?.detail === 'string') detail = body.detail
    } catch {
      /* non-JSON error body — keep the status-based message */
    }
    throw new Error(detail)
  }

  return (await response.json()) as T
}

export const gmailApi = {
  getStatus: () => request<GmailIngestStatus>('/status'),

  updateConfig: (body: GmailIngestConfigUpdate) =>
    request<GmailIngestStatus>('/config', { method: 'PATCH', body: JSON.stringify(body) }),

  /** 202 — the poll runs in the Celery worker. The result shows up as
   *  last_polled_at / last_error on the next getStatus(). */
  pollNow: () => request<GmailPollResponse>('/poll', { method: 'POST' }),
}
