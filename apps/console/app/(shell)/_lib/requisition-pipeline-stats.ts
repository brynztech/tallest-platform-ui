import { apiClient, type components } from '@brynzit/api-client'

export type RequisitionPipelineStats = components['schemas']['RequisitionPipelineStats']

const EMPTY_STATS: Omit<RequisitionPipelineStats, 'requisition_id'> = {
  shortlist_total: 0,
  not_yet_screened: 0,
  submitted: 0,
  in_client_process: 0,
  approved: 0,
  recruiter_count: 0,
}

/** Sparse — a requisition with no submissions/assignments has no row. */
export async function fetchRequisitionsPipelineStats(): Promise<
  Map<string, RequisitionPipelineStats>
> {
  const { data, error } = await apiClient.GET('/api/v1/ops/requisitions/pipeline-stats')
  if (error) throw error
  return new Map(data.map((row) => [row.requisition_id, row]))
}

export function statsFor(
  statsById: Map<string, RequisitionPipelineStats>,
  requisitionId: string,
): Omit<RequisitionPipelineStats, 'requisition_id'> {
  return statsById.get(requisitionId) ?? EMPTY_STATS
}
