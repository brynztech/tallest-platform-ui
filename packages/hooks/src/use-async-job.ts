import { useQuery } from '@tanstack/react-query'

export type AsyncJobPhase = 'idle' | 'pending' | 'complete' | 'failed'

export type UseAsyncJobOptions<TData, TRawStatus extends string = string> = {
  /** null/undefined = idle (polling disabled) */
  jobId: string | null | undefined
  /**
   * Poll URL. Supports {id} interpolation or plain string where jobId is appended as a path segment.
   * Examples:
   *   '/api/v1/bd/imports/{id}/status'  → replaces {id} with jobId
   *   '/api/v1/ops/requisitions'         → appends /${jobId}
   *
   * Endpoint-to-poll-URL mapping (verified from live backend):
   *   BD import:    '/api/v1/bd/imports/{id}/status'   (dedicated status endpoint)
   *   Outreach gen: '/api/v1/bd/outreach/{id}'          (poll parent resource)
   *   Parse JD:     '/api/v1/ops/requisitions/{id}'     (poll requisition)
   *   Enrich:       '/api/v1/supply/candidates/{id}'    (poll candidate profile)
   *   Resume upload: no status endpoint — see known gap in .planning/phases/01-foundation/01-RESEARCH.md
   */
  endpoint: string
  /** Additional enabled gate on top of jobId presence */
  enabled?: boolean
  /**
   * Override or extend the default status mapping.
   * Default map covers: queued/processing/running/generating/enrichment_scheduled → pending;
   *   done/complete/completed/succeeded/success/outreach_review → complete;
   *   failed/error/new → failed.
   * Callers using domain-specific statuses not in defaults must pass their mapping here.
   */
  statusMap?: Partial<Record<TRawStatus, AsyncJobPhase>>
  /** Default: 2000ms */
  refetchInterval?: number
}

export type AsyncJobResult<TData, TRawStatus extends string = string> = {
  phase: AsyncJobPhase
  rawStatus?: TRawStatus
  data?: TData
  error?: unknown
  isPolling: boolean
}

/**
 * Default status vocabulary — verified from live backend source 2026-06-13.
 *
 * IMPORTANT: "complete" is the lead import terminal state (NOT "completed").
 * Both are included to cover all backend domains safely.
 *
 * "outreach_review" = outreach generation complete, ready for human review — terminal.
 * "enrichment_scheduled" = enrich job queued — pending.
 * "new" = candidate after failed resume parse — treat as failed.
 */
const DEFAULT_STATUS_MAP: Record<string, AsyncJobPhase> = {
  queued: 'pending',
  processing: 'pending',
  running: 'pending',
  generating: 'pending',
  enrichment_scheduled: 'pending',
  done: 'complete',
  complete: 'complete', // lead import terminal state (confirmed from backend source)
  completed: 'complete',
  succeeded: 'complete',
  success: 'complete',
  outreach_review: 'complete', // outreach generation terminal — ready for human review
  failed: 'failed',
  error: 'failed',
  new: 'failed', // candidate record after failed resume parse
}

const TERMINAL_PHASES: AsyncJobPhase[] = ['complete', 'failed']

export function useAsyncJob<TData, TRawStatus extends string = string>(
  options: UseAsyncJobOptions<TData, TRawStatus>,
): AsyncJobResult<TData, TRawStatus> {
  const {
    jobId,
    endpoint,
    enabled = true,
    statusMap = {},
    refetchInterval: intervalOverride = 2000,
  } = options

  const mergedMap = { ...DEFAULT_STATUS_MAP, ...statusMap }
  const isEnabled = !!jobId && enabled

  // Build poll URL: replace {id} placeholder or append jobId as path segment
  const url = endpoint.includes('{id}')
    ? endpoint.replace('{id}', jobId ?? '')
    : jobId
      ? `${endpoint}/${jobId}`
      : endpoint

  const query = useQuery<TData>({
    queryKey: ['async-job', url, jobId],
    queryFn: async () => {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Poll failed: ${res.status}`)
      return res.json() as Promise<TData>
    },
    enabled: isEnabled,
    // TanStack Query v5: refetchInterval receives the query object
    refetchInterval: (q) => {
      const data = q.state.data as Record<string, unknown> | undefined
      const rawStatus = data?.status as string | undefined
      if (!rawStatus) return intervalOverride
      const phase = mergedMap[rawStatus] ?? 'pending'
      return TERMINAL_PHASES.includes(phase) ? false : intervalOverride
    },
    refetchIntervalInBackground: false,
  })

  if (!isEnabled) {
    return { phase: 'idle', isPolling: false }
  }

  const data = query.data as Record<string, unknown> | undefined
  const rawStatus = data?.status as TRawStatus | undefined
  const phase: AsyncJobPhase = rawStatus
    ? ((mergedMap[rawStatus] as AsyncJobPhase) ?? 'pending')
    : query.isError
      ? 'failed'
      : 'pending'

  return {
    phase,
    rawStatus,
    data: query.data,
    error: query.error ?? undefined,
    isPolling: query.isFetching && !TERMINAL_PHASES.includes(phase),
  }
}
