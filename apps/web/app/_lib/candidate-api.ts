export function candidateAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('candidate_access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function candidateJsonHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...candidateAuthHeaders(),
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

/** Record an Apply press for analytics and the dashboard. Fire and forget:
 *  `keepalive` lets it finish while the browser opens the employer's site. */
export function recordApplyClick(jobId: string): void {
  fetch(`${API_BASE}/api/v1/public/jobs/${jobId}/apply-click`, {
    method: 'POST',
    headers: candidateAuthHeaders(),
    keepalive: true,
  }).catch(() => {})
}
