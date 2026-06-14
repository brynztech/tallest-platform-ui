'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { useAsyncJob } from '@brynzit/hooks'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@brynzit/ui/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@brynzit/ui/components/ui/dialog'
import { Input } from '@brynzit/ui/components/ui/input'
import { Label } from '@brynzit/ui/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@brynzit/ui/components/ui/select'
import { Textarea } from '@brynzit/ui/components/ui/textarea'
import { Skeleton } from '@brynzit/ui/components/ui/skeleton'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Separator } from '@brynzit/ui/components/ui/separator'
import Link from 'next/link'
import { ChevronRight, Plus, Loader2 } from 'lucide-react'

const createReqSchema = z.object({
  client_id: z.string().min(1, 'Select a client'),
  title: z.string().min(1, 'Title is required'),
})
type CreateReqFormValues = z.infer<typeof createReqSchema>

export default function RequisitionsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  // --- Filter + dialog state ---
  const [clientFilter, setClientFilter] = useState<string>('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [jdText, setJdText] = useState('')
  const [reqId, setReqId] = useState<string | null>(null)
  const [isParsingJd, setIsParsingJd] = useState(false)
  const [parsePhaseComplete, setParsePhaseComplete] = useState(false)

  // --- Requisitions list query (MSW-only — raw fetch) ---
  // NOTE: MSW-only — no live GET /api/v1/ops/requisitions endpoint (api.d.ts line 445: get?: never)
  const { data, isLoading, error } = useQuery({
    queryKey: ['ops-requisitions', clientFilter],
    queryFn: async () => {
      const url = new URL(
        '/api/v1/ops/requisitions',
        process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
      )
      if (clientFilter !== 'all') url.searchParams.set('client_id', clientFilter)
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error('Failed to fetch requisitions')
      return res.json() as Promise<components['schemas']['RequisitionResponse'][]>
    },
  })
  const requisitions = data ?? []

  // --- Clients query (for filter Select and create form) ---
  const { data: clientsData } = useQuery({
    queryKey: ['ops-clients'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/ops/clients')
      if (error) throw error
      return data
    },
  })
  const clients = clientsData ?? []

  // --- useAsyncJob for JD parse ---
  // CRITICAL: statusMap override required — 'open' not in DEFAULT_STATUS_MAP
  // statusMap: { open: 'complete', filled: 'complete', closed: 'complete', parsing: 'pending' }
  const { phase, data: polledReq } = useAsyncJob<components['schemas']['RequisitionResponse']>({
    jobId: isParsingJd ? reqId : null,
    endpoint: '/api/v1/ops/requisitions/{id}',
    statusMap: {
      open: 'complete',
      filled: 'complete',
      closed: 'complete',
      parsing: 'pending',
    },
    refetchInterval: 2000,
  })

  const isParsing = phase === 'pending'
  const parseFailed = phase === 'failed'

  // Surface parse failure via toast (D-07)
  useEffect(() => {
    if (parseFailed) {
      toast.error('JD parsing failed — fill fields manually.')
      setIsParsingJd(false)
    }
  }, [parseFailed])

  // Mark complete for navigate button
  useEffect(() => {
    if (phase === 'complete') {
      setParsePhaseComplete(true)
    }
  }, [phase])

  // --- Create requisition mutation ---
  const createMutation = useMutation({
    mutationFn: async (body: components['schemas']['CreateRequisitionRequest']) => {
      const { data, error } = await apiClient.POST('/api/v1/ops/requisitions', { body })
      if (error) throw error
      return data
    },
    onSuccess: async (req) => {
      setReqId(req.id)
      if (jdText.trim()) {
        const { error } = await apiClient.POST('/api/v1/ops/requisitions/{req_id}/parse-jd', {
          params: { path: { req_id: req.id } },
          body: { jd_text: jdText },
        })
        if (!error) {
          setIsParsingJd(true)
        } else {
          // parse-jd POST failed — navigate directly
          router.push(`/ops/requisitions/${req.id}`)
          setIsCreateOpen(false)
        }
      } else {
        // No JD pasted — navigate directly
        router.push(`/ops/requisitions/${req.id}`)
        setIsCreateOpen(false)
      }
      queryClient.invalidateQueries({ queryKey: ['ops-requisitions'] })
    },
    onError: () => {
      toast.error('Failed to create requisition.')
    },
  })

  // --- Form ---
  const form = useForm<CreateReqFormValues>({
    resolver: zodResolver(createReqSchema),
    defaultValues: { client_id: '', title: '' },
  })
  const onSubmit = form.handleSubmit((values) => {
    createMutation.mutate({ client_id: values.client_id, title: values.title })
  })

  // --- Dialog close reset ---
  function handleDialogOpenChange(open: boolean) {
    setIsCreateOpen(open)
    if (!open) {
      setJdText('')
      setReqId(null)
      setIsParsingJd(false)
      setParsePhaseComplete(false)
      form.reset()
    }
  }

  // --- Loading / error states ---
  if (isLoading) {
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
    <div className="flex flex-col">
      {/* Sticky toolbar */}
      <div className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-6 backdrop-blur">
        <h1 className="flex-1 text-xl font-semibold">Requisitions</h1>
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All clients</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="default" size="sm" onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-1 size-4" />
          New Requisition
        </Button>
      </div>

      {/* Requisitions list */}
      <div className="flex flex-col gap-2 px-4 py-4">
        {requisitions.length === 0 ? (
          <div className="mt-16 flex flex-col items-center justify-center text-center">
            {clientFilter !== 'all' ? (
              <>
                <h2 className="text-xl font-semibold">No requisitions for this client</h2>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  Create one now to start matching candidates.
                </p>
                <Button
                  variant="default"
                  size="sm"
                  className="mt-4"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <Plus className="mr-1 size-4" />
                  New Requisition
                </Button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold">No requisitions</h2>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  Create your first requisition or select a client above to filter.
                </p>
                <Button
                  variant="default"
                  size="sm"
                  className="mt-4"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <Plus className="mr-1 size-4" />
                  New Requisition
                </Button>
              </>
            )}
          </div>
        ) : (
          requisitions.map((req) => (
            <Link
              key={req.id}
              href={`/ops/requisitions/${req.id}`}
              className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <span className="flex-1 truncate text-sm font-semibold">{req.title}</span>
              <span className="max-w-[140px] truncate text-xs text-muted-foreground">
                {clients.find((c) => c.id === req.client_id)?.name ?? req.client_id ?? '—'}
              </span>
              <Badge variant="secondary" className="text-xs">
                {req.status}
              </Badge>
              <ChevronRight className="ml-auto size-4 text-muted-foreground" />
            </Link>
          ))
        )}
      </div>

      {/* Create Requisition Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Requisition</DialogTitle>
          </DialogHeader>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            {/* Phase 1: Input fields (before create) */}
            <div>
              <Label htmlFor="client_id">Client</Label>
              <Controller
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="client_id" className="mt-1 w-full">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.client_id && (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.client_id.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                {...form.register('title')}
                placeholder="e.g. Senior Backend Engineer"
                className="mt-1"
                disabled={createMutation.isPending || isParsingJd}
              />
              {form.formState.errors.title && (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="jd_text">Job Description</Label>
              <Textarea
                id="jd_text"
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste full job description here — skills, seniority, comp, and dates will be extracted automatically."
                className="mt-1 min-h-[160px] resize-y"
                disabled={createMutation.isPending || isParsingJd || parsePhaseComplete}
              />
              {/* Parse status line */}
              {!reqId && (
                <p className="mt-1 text-xs text-muted-foreground">
                  JD is optional — fields can be filled manually after creation.
                </p>
              )}
              {isParsing && (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" />
                  Parsing job description…
                </p>
              )}
              {parseFailed && (
                <p className="mt-1 text-xs text-destructive">
                  Parsing failed — fill fields manually.
                </p>
              )}
            </div>

            {/* Phase 2 / 3: Parsed fields (after create) */}
            {reqId && (
              <>
                <Separator />
                <div className="flex flex-col gap-3">
                  {isParsing ? (
                    // Phase 2 — Skeleton shimmer
                    <>
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </>
                  ) : (
                    // Phase 3 — Parsed fields animate in (complete or failed).
                    // These are display-only: values are already saved on the
                    // requisition record. Edit them from the requisition detail page.
                    <>
                      <p className="text-xs text-muted-foreground">
                        Parsed from JD — review before navigating. Edit from the requisition detail page.
                      </p>
                      <div
                        className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300"
                        style={{ animationDelay: '0ms' }}
                      >
                        <Label htmlFor="parsed_seniority">Seniority</Label>
                        <Input
                          id="parsed_seniority"
                          readOnly
                          value={
                            phase === 'complete' && polledReq
                              ? ((polledReq as components['schemas']['RequisitionResponse']).seniority ?? '')
                              : ''
                          }
                          placeholder="e.g. senior"
                          className="mt-1 bg-muted/50"
                        />
                      </div>
                      <div
                        className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300"
                        style={{ animationDelay: '50ms' }}
                      >
                        <Label htmlFor="parsed_skills">Skills (comma-separated)</Label>
                        <Input
                          id="parsed_skills"
                          readOnly
                          value={
                            phase === 'complete' && polledReq
                              ? (
                                  (
                                    (polledReq as components['schemas']['RequisitionResponse'])
                                      .skills as string[] | null
                                  ) ?? []
                                ).join(', ')
                              : ''
                          }
                          placeholder="e.g. TypeScript, React, Node.js"
                          className="mt-1 bg-muted/50"
                        />
                      </div>
                      <div
                        className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300"
                        style={{ animationDelay: '100ms' }}
                      >
                        <Label htmlFor="parsed_comp">Compensation Range</Label>
                        <Input
                          id="parsed_comp"
                          readOnly
                          value={
                            phase === 'complete' && polledReq
                              ? ((polledReq as components['schemas']['RequisitionResponse']).compensation_range ?? '')
                              : ''
                          }
                          placeholder="e.g. $150k–$180k"
                          className="mt-1 bg-muted/50"
                        />
                      </div>
                      <div
                        className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300"
                        style={{ animationDelay: '150ms' }}
                      >
                        <Label htmlFor="parsed_start_date">Target Start Date</Label>
                        <Input
                          id="parsed_start_date"
                          readOnly
                          value={
                            phase === 'complete' && polledReq
                              ? ((polledReq as components['schemas']['RequisitionResponse']).target_start_date ?? '')
                              : ''
                          }
                          className="mt-1 bg-muted/50"
                        />
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            {/* Action buttons */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogOpenChange(false)}
                disabled={createMutation.isPending || isParsing}
              >
                Cancel
              </Button>
              {!reqId ? (
                // Before create: show "Create Requisition" button
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating…' : 'Create Requisition'}
                </Button>
              ) : isParsing ? (
                // During parse: show disabled "Parsing JD…"
                <Button type="button" disabled>
                  <Loader2 className="mr-1 size-4 animate-spin" />
                  Parsing JD…
                </Button>
              ) : (
                // After parse (complete or failed): show "Go to Requisition"
                <Button
                  type="button"
                  onClick={() => {
                    router.push(`/ops/requisitions/${reqId}`)
                    setIsCreateOpen(false)
                  }}
                >
                  Go to Requisition
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
