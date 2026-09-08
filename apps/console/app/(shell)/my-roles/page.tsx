'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Briefcase, ChevronRight, Plus, Search } from 'lucide-react'
import { useActingUser, useCan } from '@brynzit/identity'
import { visibleByAssignment } from '@brynzit/recruiting'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Button } from '@brynzit/ui/components/ui/button'
import { Input } from '@brynzit/ui/components/ui/input'
import { Skeleton } from '@brynzit/ui/components/ui/skeleton'
import {
  fetchOpsClients,
  fetchRequisitionsForClients,
  recruiterQueryKeys,
} from '../_lib/recruiter-data'
import { assignmentQueryKeys, fetchAssignedRequisitionIds } from '../_lib/assignments'
import { requisitionStatusLabel, isLiveRequisitionStatus } from '../_lib/requisition-status'
import { fetchRequisitionsPipelineStats, statsFor } from '@/(shell)/_lib/requisition-pipeline-stats'
import { computeRequisitionHealth, healthLabel, healthTone } from '@/(shell)/_lib/requisition-health'
import { PipelineStatTile, PipelineStatTileRow } from '@/(shell)/_components/pipeline-stat-tile'
import { SegmentedControl } from '@/(shell)/_components/segmented-control'
import { CreateRequisitionWizard } from '../ops/requisitions/_components/create-requisition-wizard'

type ListFilter = 'all' | 'mine' | 'at_risk'
const LIST_FILTERS: { value: ListFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'mine', label: 'Mine' },
  { value: 'at_risk', label: 'At risk' },
]

export default function MyRolesPage() {
  const actingUser = useActingUser()
  const can = useCan()
  const canViewAll = can('role.view_all')
  const [listFilter, setListFilter] = useState<ListFilter>('all')
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const { data: clients = [] } = useQuery({
    queryKey: recruiterQueryKeys.clients,
    queryFn: fetchOpsClients,
    staleTime: 60_000,
  })

  const { data: requisitions = [], isLoading: reqsLoading } = useQuery({
    queryKey: ['my-roles', 'requisitions', clients.map((c) => c.id).sort().join(',')],
    queryFn: () => fetchRequisitionsForClients(clients),
    enabled: clients.length > 0,
    staleTime: 30_000,
  })

  const { data: assignedIds = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: assignmentQueryKeys.forUser(actingUser.id),
    queryFn: () => fetchAssignedRequisitionIds(actingUser.id),
    // Fetched regardless of canViewAll — a manager needs this too, to know
    // which of "all roles" are also assigned to them (the "Yours" badge).
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  })

  const { data: statsById = new Map() } = useQuery({
    queryKey: ['ops-requisitions-pipeline-stats'],
    queryFn: fetchRequisitionsPipelineStats,
  })

  const isLoading = reqsLoading || assignmentsLoading
  const visible = visibleByAssignment(requisitions, { assignedIds, canViewAll })
  const assignedIdSet = new Set(assignedIds)

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return visible
    return visible.filter(
      (req) =>
        req.title.toLowerCase().includes(q) || (req.client?.name ?? '').toLowerCase().includes(q),
    )
  }, [visible, search])

  const withHealth = searched.map((req) => ({
    req,
    health: computeRequisitionHealth(req.created_at, req.status),
  }))

  const filtered = withHealth.filter(({ req, health }) => {
    if (listFilter === 'mine') return assignedIdSet.has(req.id)
    if (listFilter === 'at_risk') return health !== 'on_track'
    return true
  })

  const openCount = visible.filter((req) => isLiveRequisitionStatus(req.status)).length
  const inClientProcessTotal = visible.reduce(
    (sum, req) => sum + statsFor(statsById, req.id).in_client_process,
    0,
  )
  const awaitingScreenTotal = visible.reduce(
    (sum, req) => sum + statsFor(statsById, req.id).not_yet_screened,
    0,
  )
  const needsAttentionCount = visible.filter(
    (req) => computeRequisitionHealth(req.created_at, req.status) !== 'on_track',
  ).length

  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">My roles</h1>
            <Badge variant="outline">{canViewAll ? 'All roles' : 'Assigned to you'}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {canViewAll
              ? 'You can see every open role. Admin and manager view.'
              : 'Roles assigned to you — focus your sourcing here.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Backend engineer, Acme"
              className="w-56 pl-8"
            />
          </div>
          {canViewAll && (
            <Button variant="default" size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-1 size-4" />
              New role
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Briefcase className="mx-auto mb-2 size-6 text-muted-foreground" />
          <p className="text-sm font-medium">No roles assigned yet</p>
          <p className="text-sm text-muted-foreground">
            An account manager assigns roles to you; they will appear here.
          </p>
        </div>
      ) : (
        <>
          <PipelineStatTileRow>
            <PipelineStatTile label="Open roles" value={openCount} suffix={`of ${visible.length} total`} />
            <PipelineStatTile
              label="In client process"
              value={inClientProcessTotal}
              suffix="candidates"
              dotTone="#386CA0"
            />
            <PipelineStatTile
              label="Awaiting your screen"
              value={awaitingScreenTotal}
              suffix="candidates"
              dotTone="#905300"
            />
            <PipelineStatTile
              label="Needs attention"
              value={needsAttentionCount}
              suffix="roles"
              dotTone="#BA4642"
            />
          </PipelineStatTileRow>

          <div className="flex items-center justify-between gap-3">
            <SegmentedControl options={LIST_FILTERS} value={listFilter} onChange={setListFilter} />
            <span className="text-sm text-muted-foreground">
              {filtered.length} role{filtered.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No roles match this filter.</p>
            ) : (
              filtered.map(({ req: requisition, health }) => {
                const stats = statsFor(statsById, requisition.id)
                const screened = stats.shortlist_total - stats.not_yet_screened
                const isMine = assignedIdSet.has(requisition.id)
                return (
                  <div
                    key={requisition.id}
                    className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(22,18,12,0.04)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[15px] font-semibold">{requisition.title}</span>
                          <StatusPill
                            live={isLiveRequisitionStatus(requisition.status)}
                            label={requisitionStatusLabel(requisition.status)}
                          />
                          {isMine && (
                            <span className="inline-flex items-center rounded-full border border-border bg-secondary px-2 py-[3px] text-[11px] font-medium">
                              Yours
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[13px] text-muted-foreground">
                          {requisition.client?.name ?? 'Unknown client'} · posted{' '}
                          {daysAgo(requisition.created_at)}d ago
                        </p>
                      </div>
                      <div className="flex shrink-0 items-start gap-6">
                        <MiniStat label="Shortlist" value={stats.shortlist_total} />
                        <MiniStat label="Submitted" value={stats.submitted} />
                        <div className="text-right">
                          <div className="text-[11px] font-medium tracking-[0.09em] text-[#908E8B] uppercase">
                            Health
                          </div>
                          <div className="mt-1.5 flex items-center justify-end gap-1.5">
                            <span className="size-1.5 rounded-full" style={{ backgroundColor: healthTone(health) }} />
                            <span className="text-sm font-semibold">{healthLabel(health)}</span>
                          </div>
                        </div>
                        <Link
                          href={canViewAll ? `/ops/requisitions/${requisition.id}` : `/my-roles/${requisition.id}`}
                          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-border bg-card px-3 text-sm font-medium hover:bg-muted"
                        >
                          Open
                          <ChevronRight className="size-3.5" />
                        </Link>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 border-t border-[#ECEAE4] bg-[#F8F7F3] px-4 py-2.5 text-[13px] text-[#3A3B3B]">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-[#317A4F]" />
                        {screened} screened
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-[#905300]" />
                        {stats.not_yet_screened} not yet screened
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}

      <CreateRequisitionWizard open={isCreateOpen} onOpenChange={setIsCreateOpen} clients={clients} />
    </div>
  )
}

function StatusPill({ live, label }: { live: boolean; label: string }) {
  return (
    <span
      className={
        live
          ? 'inline-flex items-center gap-[5px] rounded-full border border-[#D3E2D7] bg-[#EFF4EF] px-2 py-[3px] text-[11px] font-medium text-[#317A4F]'
          : 'inline-flex items-center gap-[5px] rounded-full border border-[#D4DFE9] bg-[#EFF3F4] px-2 py-[3px] text-[11px] font-medium text-[#386CA0]'
      }
    >
      <span className="size-[5px] rounded-full bg-current" />
      {label}
    </span>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-right">
      <div className="text-[11px] font-medium tracking-[0.09em] text-[#908E8B] uppercase">{label}</div>
      <div className="mt-1.5 text-xl font-semibold">{value}</div>
    </div>
  )
}

function daysAgo(isoDate: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(isoDate).getTime()) / (24 * 60 * 60 * 1000)))
}
