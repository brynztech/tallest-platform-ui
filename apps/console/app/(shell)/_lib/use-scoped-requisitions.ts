'use client'

/**
 * The requisitions the acting user may act on: everything for managers/admins
 * (`role.view_all`), only their `ops_assignments` rows for recruiters.
 *
 * Every recruiter-facing surface that offers a requisition to act on (submit a
 * candidate, cross-list, browse your clients' roles, the pipeline board) must
 * pick from this list — otherwise a recruiter can act on a role that was never
 * assigned to them. Extracted because four screens needed the identical
 * query-plus-filter; the filter itself is `visibleByAssignment` from
 * @brynzit/recruiting (single tested place for the view_all distinction).
 *
 * Note this filters AFTER an unscoped fetch, so the requisitions cache stays
 * shared across personas — safe because the cached payload is identical for
 * everyone and only the derived list differs (unlike per-user API responses,
 * which must be keyed by acting user).
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useActingUser, useCan } from '@brynzit/identity'
import { visibleByAssignment } from '@brynzit/recruiting'
import { assignmentQueryKeys, fetchAssignedRequisitionIds } from './assignments'
import {
  clientIdsKey,
  fetchRequisitionsForClients,
  recruiterQueryKeys,
  RECRUITER_STALE_TIME_MS,
  type OpsClient,
  type RequisitionWithClient,
} from './recruiter-data'

export interface ScopedRequisitions {
  /** Requisitions the acting user may act on (already assignment-filtered). */
  requisitions: RequisitionWithClient[]
  /** True while either the requisition list or the assignment list is loading. */
  isLoading: boolean
  error: unknown
  /** True when the acting user sees every requisition (manager/admin). */
  canViewAll: boolean
}

export function useScopedRequisitions(
  clients: OpsClient[],
  enabled: boolean,
): ScopedRequisitions {
  const actingUser = useActingUser()
  const can = useCan()
  const canViewAll = can('role.view_all')

  const requisitionsQuery = useQuery({
    queryKey: recruiterQueryKeys.requisitions(clientIdsKey(clients)),
    queryFn: () => fetchRequisitionsForClients(clients),
    enabled,
    staleTime: RECRUITER_STALE_TIME_MS,
  })

  const assignedIdsQuery = useQuery({
    queryKey: assignmentQueryKeys.forUser(actingUser.id),
    queryFn: () => fetchAssignedRequisitionIds(actingUser.id),
    enabled: !canViewAll,
    staleTime: 60_000,
  })

  const requisitions = useMemo(
    () =>
      visibleByAssignment(requisitionsQuery.data ?? [], {
        assignedIds: assignedIdsQuery.data ?? [],
        canViewAll,
      }),
    [requisitionsQuery.data, assignedIdsQuery.data, canViewAll],
  )

  return {
    requisitions,
    // Recruiters must not see an empty picker while assignments are still in
    // flight — that reads as "you have no roles" rather than "loading".
    isLoading: requisitionsQuery.isLoading || (!canViewAll && assignedIdsQuery.isLoading),
    error: requisitionsQuery.error ?? (canViewAll ? null : assignedIdsQuery.error),
    canViewAll,
  }
}
