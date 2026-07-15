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
