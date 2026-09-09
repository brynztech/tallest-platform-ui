'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import { Button } from '@brynzit/ui/components/ui/button'
import { Input } from '@brynzit/ui/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@brynzit/ui/components/ui/select'
import Link from 'next/link'
import { ChevronRight, Plus, Search } from 'lucide-react'
import { requisitionStatusLabel, isLiveRequisitionStatus } from '@/(shell)/_lib/requisition-status'
import { fetchRequisitionsPipelineStats, statsFor } from '@/(shell)/_lib/requisition-pipeline-stats'
import { hasGeneratedJd } from '@/(shell)/_lib/requisition-intake'
import { PipelineStatTile, PipelineStatTileRow } from '@/(shell)/_components/pipeline-stat-tile'
import { SegmentedControl } from '@/(shell)/_components/segmented-control'
import { CreateRequisitionWizard } from './_components/create-requisition-wizard'

type ListFilter = 'all' | 'open' | 'needs_jd'
const LIST_FILTERS: { value: ListFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'needs_jd', label: 'Needs JD' },
]

export default function RequisitionsPage() {
  const [clientFilter, setClientFilter] = useState<string>(
    () =>
      typeof window === 'undefined'
        ? 'all'
        : (new URLSearchParams(window.location.search).get('client_id') ?? 'all'),
  )
  const [listFilter, setListFilter] = useState<ListFilter>('all')
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const { data: clientsData, isLoading: isLoadingClients } = useQuery({
    queryKey: ['ops-clients'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/ops/clients')
      if (error) throw error
      return data
    },
  })
  const clients = clientsData ?? []

  const fetchClientRequisitions = async (clientId: string) => {
    const { data, error } = await apiClient.GET('/api/v1/ops/clients/{client_id}/requisitions', {
      params: { path: { client_id: clientId } },
    })
    if (error) throw error
    return data ?? []
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['ops-requisitions', clientFilter, clients.map((client) => client.id).join(',')],
    enabled: Boolean(clientsData),
    queryFn: async () => {
      if (clientFilter !== 'all') {
        return fetchClientRequisitions(clientFilter)
      }
      const lists = await Promise.all(clients.map((client) => fetchClientRequisitions(client.id)))
      return lists
        .flat()
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    },
  })
  const requisitions = data ?? []

  const { data: statsById = new Map() } = useQuery({
    queryKey: ['ops-requisitions-pipeline-stats'],
    queryFn: fetchRequisitionsPipelineStats,
  })

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return requisitions
    return requisitions.filter((req) => {
      const clientName = clients.find((c) => c.id === req.client_id)?.name ?? ''
      return req.title.toLowerCase().includes(q) || clientName.toLowerCase().includes(q)
    })
  }, [requisitions, clients, search])

  const filtered = searched.filter((req) => {
    if (listFilter === 'open') return isLiveRequisitionStatus(req.status)
    if (listFilter === 'needs_jd') return !hasGeneratedJd(req.intake_details)
    return true
  })

  const openCount = requisitions.filter((req) => isLiveRequisitionStatus(req.status)).length
  const awaitingScreenTotal = requisitions.reduce(
    (sum, req) => sum + statsFor(statsById, req.id).not_yet_screened,
    0,
  )
  const inClientProcessTotal = requisitions.reduce(
    (sum, req) => sum + statsFor(statsById, req.id).in_client_process,
    0,
  )
  const missingJdCount = requisitions.filter((req) => !hasGeneratedJd(req.intake_details)).length

  if (isLoadingClients || isLoading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-destructive text-sm">
          Couldn&apos;t load requisitions. Check your connection or refresh the page.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Requisitions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every client requisition ops owns. Open one to edit its hiring process and matching
            signals.
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
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All clients</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="default" size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-1 size-4" />
            New requisition
          </Button>
        </div>
      </div>

      <PipelineStatTileRow>
        <PipelineStatTile label="Open requisitions" value={openCount} suffix={`of ${requisitions.length} total`} />
        <PipelineStatTile
          label="Awaiting recruiter screen"
          value={awaitingScreenTotal}
          suffix="candidates"
          dotTone="#905300"
        />
        <PipelineStatTile
          label="In client process"
          value={inClientProcessTotal}
          suffix="candidates"
          dotTone="#386CA0"
        />
        <PipelineStatTile
          label="Missing a JD"
          value={missingJdCount}
          suffix={missingJdCount === 1 ? 'requisition' : 'requisitions'}
          dotTone="#BA4642"
        />
      </PipelineStatTileRow>

      <div className="flex items-center justify-between gap-3">
        <SegmentedControl options={LIST_FILTERS} value={listFilter} onChange={setListFilter} />
        <span className="text-sm text-muted-foreground">
          {filtered.length} requisition{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center text-center">
            <h2 className="text-lg font-semibold">No requisitions match</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Try a different filter, or create a new requisition.
            </p>
            <Button variant="default" size="sm" className="mt-4" onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-1 size-4" />
              New requisition
            </Button>
          </div>
        ) : (
          filtered.map((req) => {
            const stats = statsFor(statsById, req.id)
            const jdGenerated = hasGeneratedJd(req.intake_details)
            return (
              <div
                key={req.id}
                className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(22,18,12,0.04)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[15px] font-semibold">{req.title}</span>
                      <StatusPill live={isLiveRequisitionStatus(req.status)} label={requisitionStatusLabel(req.status)} />
                      {!jdGenerated && (
                        <span className="inline-flex items-center gap-[5px] rounded-full border border-border bg-secondary px-2 py-[3px] text-[11px] font-medium text-muted-foreground">
                          JD missing
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                      {clients.find((client) => client.id === req.client_id)?.name ?? '—'} · posted{' '}
                      {daysAgo(req.created_at)}d ago
                    </p>
                  </div>
                  <div className="flex shrink-0 items-start gap-6">
                    <MiniStat label="Shortlist" value={stats.shortlist_total} />
                    <MiniStat label="Submitted" value={stats.submitted} />
                    <MiniStat label="Awaiting" value={stats.not_yet_screened} dotTone={stats.not_yet_screened > 0 ? '#905300' : undefined} />
                    <Link
                      href={`/ops/requisitions/${req.id}`}
                      className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-border bg-card px-3 text-sm font-medium hover:bg-muted"
                    >
                      Open
                      <ChevronRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

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

function MiniStat({ label, value, dotTone }: { label: string; value: number; dotTone?: string }) {
  return (
    <div className="text-right">
      <div className="text-[11px] font-medium tracking-[0.09em] text-[#908E8B] uppercase">{label}</div>
      <div className="mt-1.5 flex items-center justify-end gap-1.5">
        {dotTone && <span className="size-1.5 rounded-full" style={{ backgroundColor: dotTone }} />}
        <span className="text-xl font-semibold">{value}</span>
      </div>
    </div>
  )
}

function daysAgo(isoDate: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(isoDate).getTime()) / (24 * 60 * 60 * 1000)))
}
