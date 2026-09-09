'use client'

import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useActingUser, useCan } from '@brynzit/identity'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Button } from '@brynzit/ui/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@brynzit/ui/components/ui/dialog'
import { Input } from '@brynzit/ui/components/ui/input'
import { Label } from '@brynzit/ui/components/ui/label'
import { ChevronRight, Plus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchOpsClients, fetchRequisitionsForClients } from '@/(shell)/_lib/recruiter-data'
import { fetchRequisitionsPipelineStats, statsFor } from '@/(shell)/_lib/requisition-pipeline-stats'
import { PipelineStatTile, PipelineStatTileRow } from '@/(shell)/_components/pipeline-stat-tile'
import { SegmentedControl } from '@/(shell)/_components/segmented-control'
import { isLiveRequisitionStatus } from '@/(shell)/_lib/requisition-status'

const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  primary_contact_name: z.string().nullable().optional(),
  primary_contact_email: z
    .string()
    .email('Invalid email')
    .nullable()
    .optional()
    .or(z.literal('')),
  agreed_fee_pct: z
    .string()
    .nullable()
    .optional()
    .refine(
      (v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100),
      'Enter a percentage between 0 and 100',
    ),
})

type ClientFormValues = z.infer<typeof clientSchema>
type ClientFilter = 'all' | 'active' | 'inactive'

export default function ClientsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const can = useCan()
  const canManage = can('client.manage')
  const actingUser = useActingUser()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [filter, setFilter] = useState<ClientFilter>('all')
  const [search, setSearch] = useState('')

  const { data: clientsData, isLoading, error } = useQuery({
    queryKey: ['ops-clients'],
    queryFn: fetchOpsClients,
  })
  const clients = useMemo(() => clientsData ?? [], [clientsData])

  const { data: requisitions = [] } = useQuery({
    queryKey: ['ops-requisitions-for-clients', clients.map((c) => c.id).join(',')],
    enabled: clients.length > 0,
    queryFn: () => fetchRequisitionsForClients(clients),
  })

  const { data: statsById = new Map() } = useQuery({
    queryKey: ['ops-requisitions-pipeline-stats'],
    queryFn: fetchRequisitionsPipelineStats,
  })

  // Per-client rollups from the same bulk pipeline-stats every requisition
  // screen already uses — no second backend endpoint for this.
  const clientStats = useMemo(() => {
    const byClient = new Map(
      clients.map((client) => [
        client.id,
        { openReqs: 0, shortlistTotal: 0, submittedTotal: 0 },
      ]),
    )
    for (const req of requisitions) {
      const bucket = req.client_id ? byClient.get(req.client_id) : undefined
      if (!bucket) continue
      if (isLiveRequisitionStatus(req.status)) bucket.openReqs += 1
      const stats = statsFor(statsById, req.id)
      bucket.shortlistTotal += stats.shortlist_total
      bucket.submittedTotal += stats.submitted
    }
    return byClient
  }, [clients, requisitions, statsById])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      primary_contact_name: '',
      primary_contact_email: '',
      agreed_fee_pct: '',
    },
  })

  const createMutation = useMutation({
    mutationFn: async (values: ClientFormValues) => {
      const body: components['schemas']['CreateClientRequest'] = {
        name: values.name,
        created_by: actingUser.id,
        agreed_fee_pct: values.agreed_fee_pct ? Number(values.agreed_fee_pct) : null,
        primary_contact_name: values.primary_contact_name ?? null,
        primary_contact_email:
          values.primary_contact_email === '' ? null : (values.primary_contact_email ?? null),
      }
      const { data, error } = await apiClient.POST('/api/v1/ops/clients', { body })
      if (error) throw error
      return data
    },
    onSuccess: (newClient) => {
      queryClient.invalidateQueries({ queryKey: ['ops-clients'] })
      toast('Client created — ' + newClient.name)
      setIsCreateOpen(false)
      reset()
      router.push('/ops/clients/' + newClient.id)
    },
    onError: () => {
      toast.error('Failed to create client.')
    },
  })

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">
          Couldn&apos;t load clients. Check your connection or refresh the page.
        </p>
      </div>
    )
  }

  const q = search.trim().toLowerCase()
  const searched = q
    ? clients.filter(
        (client) =>
          client.name.toLowerCase().includes(q) ||
          (client.primary_contact_name ?? '').toLowerCase().includes(q),
      )
    : clients
  const filtered = searched.filter((client) => {
    if (filter === 'active') return client.status === 'active'
    if (filter === 'inactive') return client.status !== 'active'
    return true
  })

  const activeCount = clients.filter((c) => c.status === 'active').length
  const openReqsAcrossClients = [...clientStats.values()].reduce((sum, s) => sum + s.openReqs, 0)
  const submittedToClients = [...clientStats.values()].reduce((sum, s) => sum + s.submittedTotal, 0)
  const noOpenRequisitionCount = clients.filter((c) => (clientStats.get(c.id)?.openReqs ?? 0) === 0).length

  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Clients</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Open one to edit its details, requisitions, and notes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Acme, Jane Smith"
              className="w-56 pl-8"
            />
          </div>
          {canManage && (
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-1 size-4" />
              New client
            </Button>
          )}
        </div>
      </div>

      <PipelineStatTileRow>
        <PipelineStatTile label="Active clients" value={activeCount} suffix={`of ${clients.length} total`} />
        <PipelineStatTile label="Open requisitions" value={openReqsAcrossClients} suffix="across clients" />
        <PipelineStatTile
          label="Submitted to clients"
          value={submittedToClients}
          suffix="candidates"
          dotTone="#386CA0"
        />
        <PipelineStatTile
          label="No open requisition"
          value={noOpenRequisitionCount}
          suffix={noOpenRequisitionCount === 1 ? 'client' : 'clients'}
          dotTone="#905300"
        />
      </PipelineStatTileRow>

      <div className="flex items-center justify-between gap-3">
        <SegmentedControl
          options={[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
          value={filter}
          onChange={setFilter}
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} client{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center text-center">
            <h2 className="text-lg font-semibold">No clients match</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Try a different filter, or add a new client.
            </p>
            {canManage && (
              <Button size="sm" className="mt-4" onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-1 size-4" />
                New client
              </Button>
            )}
          </div>
        ) : (
          filtered.map((client) => {
            const stats = clientStats.get(client.id) ?? { openReqs: 0, shortlistTotal: 0, submittedTotal: 0 }
            return (
              <Link
                key={client.id}
                href={`/ops/clients/${client.id}`}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(22,18,12,0.04)] transition-colors hover:bg-muted"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-semibold">{client.name}</span>
                    <ClientStatusPill status={client.status} />
                  </div>
                  <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                    {[client.primary_contact_name, client.primary_contact_email].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
                <div className="flex shrink-0 items-start gap-6">
                  <MiniStat label="Open reqs" value={stats.openReqs} />
                  <MiniStat label="Shortlist" value={stats.shortlistTotal} />
                  <MiniStat label="Submitted" value={stats.submittedTotal} />
                </div>
                <span className="shrink-0 text-[13px] text-muted-foreground">
                  Client since {new Date(client.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            )
          })
        )}
      </div>

      {/* Create Client Dialog */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (!open) reset()
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New client</DialogTitle>
            <DialogDescription>
              Ops owns client records. You can add requisitions and notes once the client exists.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit((values) => createMutation.mutate(values))} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="client-name">
                Client name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="client-name"
                placeholder="Acme Corp"
                {...register('name')}
                aria-invalid={!!errors.name}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contact-name">Primary contact name</Label>
                <Input
                  id="contact-name"
                  placeholder="Jane Smith"
                  {...register('primary_contact_name')}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contact-email">Primary contact email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="jane@acme.com"
                  {...register('primary_contact_email')}
                  aria-invalid={!!errors.primary_contact_email}
                />
                {errors.primary_contact_email && (
                  <p className="text-xs text-destructive">{errors.primary_contact_email.message}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="agreed-fee">Agreed fee (% of CTC)</Label>
              <Input
                id="agreed-fee"
                type="number"
                min={0}
                max={100}
                step="0.01"
                placeholder="8.33"
                {...register('agreed_fee_pct')}
                aria-invalid={!!errors.agreed_fee_pct}
              />
              {errors.agreed_fee_pct && (
                <p className="text-xs text-destructive">{errors.agreed_fee_pct.message}</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              A client name is required. Everything else can be added later.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false)
                  reset()
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create client'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ClientStatusPill({ status }: { status: string }) {
  const live = status === 'active'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-[5px] rounded-full border px-2 py-[3px] text-[11px] font-medium',
        live
          ? 'border-[#D3E2D7] bg-[#EFF4EF] text-[#317A4F]'
          : 'border-border bg-secondary text-muted-foreground',
      )}
    >
      <span className="size-[5px] rounded-full bg-current" />
      {status}
    </span>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-right">
      <div className="text-[11px] font-medium tracking-[0.09em] text-[#908E8B] uppercase">{label}</div>
      <div className="mt-1.5 text-sm font-semibold">{value}</div>
    </div>
  )
}
