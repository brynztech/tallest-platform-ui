import { apiClient, type components } from '@brynzit/api-client'

export type OpsClient = components['schemas']['ClientResponse']
export type OpsRequisition = components['schemas']['RequisitionResponse']
export type OpsInterview = components['schemas']['InterviewResponse']
export type OpsNote = components['schemas']['NoteResponse']
export type OpsPlacement = components['schemas']['PlacementResponse']
export type SupplySubmission = components['schemas']['SubmissionResponse']

export type RequisitionWithClient = OpsRequisition & {
  client: OpsClient | null
}

export type PipelineSubmission = SupplySubmission & {
  requisition: RequisitionWithClient
}

export type ClientNoteWithClient = OpsNote & {
  client: OpsClient
}

export type PlacementWithRequisition = OpsPlacement & {
  requisition: RequisitionWithClient
}

export const recruiterQueryKeys = {
  clients: ['recruiter', 'ops-clients'] as const,
  requisitions: (clientIds: string) => ['recruiter', 'ops-requisitions', clientIds] as const,
  interviews: (status: string) => ['recruiter', 'ops-interviews', status] as const,
  pipeline: (requisitionIds: string) => ['recruiter', 'supply-shortlists', requisitionIds] as const,
  candidateSearch: (query: string, limit: number) =>
    ['recruiter', 'supply-search', query, limit] as const,
  clientNotes: (clientIds: string) => ['recruiter', 'ops-client-notes', clientIds] as const,
  placements: (requisitionIds: string) => ['recruiter', 'ops-placements', requisitionIds] as const,
}

export const RECRUITER_STALE_TIME_MS = 30_000

export async function fetchOpsClients() {
  const { data, error } = await apiClient.GET('/api/v1/ops/clients')
  if (error) throw error
  return dedupeClientsByName(data ?? [])
}

function dedupeClientsByName(clients: OpsClient[]) {
  const uniqueByName = new Map<string, OpsClient>()
  for (const client of clients) {
    const key = client.name.trim().toLowerCase()
    if (!uniqueByName.has(key)) uniqueByName.set(key, client)
  }
  return [...uniqueByName.values()]
}

export async function fetchClientRequisitions(client: OpsClient): Promise<RequisitionWithClient[]> {
  const { data, error } = await apiClient.GET('/api/v1/ops/clients/{client_id}/requisitions', {
    params: { path: { client_id: client.id } },
  })
  if (error) throw error
  return (data ?? []).map((requisition) => ({ ...requisition, client }))
}

export async function fetchRequisitionsForClients(clients: OpsClient[]) {
  const requisitionLists = await Promise.all(clients.map((client) => fetchClientRequisitions(client)))
  return dedupeRequisitionsById(requisitionLists.flat())
}

export function dedupeRequisitionsById(requisitions: RequisitionWithClient[]) {
  const uniqueById = new Map<string, RequisitionWithClient>()
  for (const requisition of requisitions) {
    if (!uniqueById.has(requisition.id)) uniqueById.set(requisition.id, requisition)
  }
  return [...uniqueById.values()]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export async function fetchOpsInterviews(statusFilter = 'all') {
  const url = new URL(
    '/api/v1/ops/interviews',
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
  )
  if (statusFilter !== 'all') url.searchParams.set('status', statusFilter)
  const response = await fetch(url.toString())
  if (!response.ok) throw new Error('Failed to fetch interviews')
  return response.json() as Promise<OpsInterview[]>
}

export async function fetchPipelineSubmissions(requisitions: RequisitionWithClient[]) {
  const results = await Promise.allSettled(
    requisitions.map(async (requisition) => {
      const { data, error } = await apiClient.GET('/api/v1/supply/shortlists/{requisition_id}', {
        params: { path: { requisition_id: requisition.id } },
      })
      if (error) throw error
      return (data.submissions ?? []).map((submission) => ({
        ...submission,
        requisition,
      }))
    }),
  )

  return results.flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
}

export async function fetchClientNotes(clients: OpsClient[]) {
  const results = await Promise.allSettled(
    clients.map(async (client) => {
      const { data, error } = await apiClient.GET('/api/v1/ops/clients/{client_id}/notes', {
        params: { path: { client_id: client.id } },
      })
      if (error) throw error
      return (data ?? []).map((note) => ({ ...note, client }))
    }),
  )

  return results
    .flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export async function fetchPlacementsForRequisitions(requisitions: RequisitionWithClient[]) {
  const results = await Promise.allSettled(
    requisitions.map(async (requisition) => {
      const { data, error } = await apiClient.GET(
        '/api/v1/ops/requisitions/{req_id}/placements',
        {
          params: { path: { req_id: requisition.id } },
        },
      )
      if (error) throw error
      return (data ?? []).map((placement) => ({ ...placement, requisition }))
    }),
  )

  return results.flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
}

export function clientIdsKey(clients: OpsClient[]) {
  return clients.map((client) => client.id).sort().join(',')
}

export function requisitionIdsKey(requisitions: RequisitionWithClient[]) {
  return requisitions.map((requisition) => requisition.id).sort().join(',')
}

export function formatShortDate(value: string | null | undefined) {
  if (!value) return 'Not scheduled'
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}
