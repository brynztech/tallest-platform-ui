import createClient from 'openapi-fetch'
import type { paths } from './types/api'

export const apiClient = createClient<paths>({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
  // Staff auth's session lives in a cross-origin cookie (platform/staff_auth.py) —
  // without this, the browser never attaches it to API calls.
  credentials: 'include',
})

export type { paths, components } from './types/api'
export type { LeadQueueItemExtended, SubmissionResponseExtended, TalentPoolSummaryExtended } from './types/extensions'
