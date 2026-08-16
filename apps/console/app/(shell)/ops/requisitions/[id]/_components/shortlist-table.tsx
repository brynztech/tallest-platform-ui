'use client'

import { useState, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { toast } from 'sonner'
import { Badge } from '@brynzit/ui/components/ui/badge'
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
import { Textarea } from '@brynzit/ui/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@brynzit/ui/components/ui/table'
import { CheckCircle, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  DEFAULT_SHORTLIST_SCORE_OVERRIDES,
  SHORTLIST_SCORE_KEYS,
  clampScore,
  normalizeShortlistSubmission,
  shortlistScoreOverridesFromBreakdown,
  shortlistScoreOverridesFromTotal,
  shortlistScoreTotal,
  shortlistStatusBadgeClass,
  type ShortlistEntry,
  type ShortlistScoreKey,
  type ShortlistScoreOverrides,
} from './shortlist-utils'

type CandidateSearchResult = components['schemas']['CandidateSearchResult']

interface ShortlistTableProps {
  reqId: string
  onCandidateSelect: (candidateId: string, submissionId: string | null) => void
  onApprove: (candidateId: string) => void
}

export function ShortlistTable({
  reqId,
  onCandidateSelect,
  onApprove,
}: ShortlistTableProps) {
  const queryClient = useQueryClient()
  const [pendingTimeouts] = useState(() => new Map<string, ReturnType<typeof setTimeout>>())
  const [expandedRationales, setExpandedRationales] = useState<Set<string>>(() => new Set())
  const [addOpen, setAddOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<ShortlistEntry | null>(null)
  const [removeEntry, setRemoveEntry] = useState<ShortlistEntry | null>(null)
  const [candidateQuery, setCandidateQuery] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateSearchResult | null>(null)
  const [reason, setReason] = useState('')
  const [manualScore, setManualScore] = useState(70)
  const [manualRationale, setManualRationale] = useState('')
  const [scoreOverrides, setScoreOverrides] = useState<ShortlistScoreOverrides>(
    DEFAULT_SHORTLIST_SCORE_OVERRIDES,
  )
  const [expandedScores, setExpandedScores] = useState<Set<string>>(() => new Set())
  // Track approve/reject locally for entries without a backend submission_id
  const [localStatusOverrides, setLocalStatusOverrides] = useState<Record<string, string>>({})
  const scoreTotal = shortlistScoreTotal(scoreOverrides)

  useEffect(() => {
    return () => {
      pendingTimeouts.forEach((id) => clearTimeout(id))
      pendingTimeouts.clear()
    }
  }, [pendingTimeouts])

  // Read from the supply shortlist so manual review actions operate on real submission ids.
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['supply-shortlist', reqId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        '/api/v1/supply/shortlists/{requisition_id}',
        { params: { path: { requisition_id: reqId } } },
      )
      if (error) throw error
      return data.submissions
    },
  })
  const entries = useMemo(
    () => submissions.map(normalizeShortlistSubmission),
    [submissions],
  )

  const { data: candidateResults = [] } = useQuery({
    queryKey: ['candidate-search-for-shortlist', candidateQuery],
    enabled: addOpen && candidateQuery.trim().length >= 2,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/supply/candidates/search', {
        params: { query: { q: candidateQuery, top_k: 8 } },
      })
      if (error) throw error
      return data.results ?? []
    },
  })

  const manualClient = apiClient as unknown as {
    POST: (path: string, args: unknown) => Promise<{ error?: unknown }>
    PATCH: (path: string, args: unknown) => Promise<{ error?: unknown }>
  }

  // Supply PATCH — used when submission_id is available from an enriched shortlist
  const actionMutation = useMutation({
    mutationFn: ({
      submissionId,
      status,
    }: {
      submissionId: string
      status: 'approved' | 'rejected'
    }) =>
      apiClient.PATCH('/api/v1/supply/shortlists/{submission_id}', {
        params: { path: { submission_id: submissionId } },
        body: { status } satisfies components['schemas']['PatchSubmissionRequest'],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supply-shortlist', reqId] })
    },
    onError: () => {
      // Non-fatal: local state already updated optimistically
    },
  })

  const manualAddMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCandidate) throw new Error('Select a candidate first.')
      const { error } = await manualClient.POST(
        '/api/v1/supply/shortlists/{requisition_id}/manual-add',
        {
          params: { path: { requisition_id: reqId } },
          body: {
            candidate_id: selectedCandidate.candidate_id,
            reason,
            score: scoreTotal,
            score_overrides: scoreOverrides,
            rationale: manualRationale || reason,
            top_matching_skills: selectedCandidate.skills ?? [],
            gaps: [],
          },
        },
      )
      if (error) throw error
    },
    onSuccess: () => {
      resetManualForm()
      setAddOpen(false)
      queryClient.invalidateQueries({ queryKey: ['supply-shortlist', reqId] })
      toast.success('Candidate added to shortlist.')
    },
    onError: () => toast.error('Failed to add candidate.'),
  })

  const scoreEditMutation = useMutation({
    mutationFn: async () => {
      if (!editEntry) throw new Error('Select a shortlist row first.')
      const { error } = await manualClient.PATCH('/api/v1/supply/shortlists/{submission_id}/score', {
        params: { path: { submission_id: editEntry.submission_id } },
        body: {
          reason,
          score: scoreTotal,
          score_overrides: scoreOverrides,
          rationale: manualRationale || editEntry.rationale,
          top_matching_skills: editEntry.top_matching_skills,
          gaps: editEntry.gaps,
        },
      })
      if (error) throw error
    },
    onSuccess: () => {
      resetManualForm()
      setEditEntry(null)
      queryClient.invalidateQueries({ queryKey: ['supply-shortlist', reqId] })
      toast.success('Score updated.')
    },
    onError: () => toast.error('Failed to update score.'),
  })

  const manualRemoveMutation = useMutation({
    mutationFn: async () => {
      if (!removeEntry) throw new Error('Select a shortlist row first.')
      const { error } = await manualClient.POST(
        '/api/v1/supply/shortlists/{submission_id}/manual-remove',
        {
          params: { path: { submission_id: removeEntry.submission_id } },
          body: { reason, score_overrides: scoreOverrides },
        },
      )
      if (error) throw error
    },
    onSuccess: () => {
      resetManualForm()
      setRemoveEntry(null)
      queryClient.invalidateQueries({ queryKey: ['supply-shortlist', reqId] })
      toast.success('Candidate removed from shortlist.')
    },
    onError: () => toast.error('Failed to remove candidate.'),
  })

  const handleAction = (entry: ShortlistEntry, newStatus: 'approved' | 'rejected') => {
    const name = entry.candidate_name ?? shortId(entry.candidate_id)
    const toastMsg = newStatus === 'approved' ? `${name} approved.` : `Rejected ${name}.`
    const key = entry.candidate_id

    const existing = pendingTimeouts.get(key)
    if (existing) {
      clearTimeout(existing)
      pendingTimeouts.delete(key)
    }

    // Optimistic: the row reflects the decision immediately, not after the
    // 5s undo window — the Undo action below already reverts this override,
    // so it was always meant to be immediate (see the actionMutation
    // onError comment). Only the real backend write (and the parent-state
    // callback that seeds Interviews/Placements candidate pickers) waits out
    // the undo window, since those are the parts that actually need to be
    // reversible.
    setLocalStatusOverrides((prev) => ({ ...prev, [key]: newStatus }))

    const timeoutId = setTimeout(() => {
      pendingTimeouts.delete(key)
      // Try supply PATCH if we have a real submission_id
      if (entry.submission_id) {
        actionMutation.mutate({ submissionId: entry.submission_id, status: newStatus })
      }
      if (newStatus === 'approved') {
        onApprove(entry.candidate_id)
      }
    }, 5000)

    pendingTimeouts.set(key, timeoutId)

    toast(toastMsg, {
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => {
          const t = pendingTimeouts.get(key)
          if (t) {
            clearTimeout(t)
            pendingTimeouts.delete(key)
          }
          setLocalStatusOverrides((prev) => {
            const next = { ...prev }
            delete next[key]
            return next
          })
        },
      },
    })
  }

  const columnHelper = createColumnHelper<ShortlistEntry>()

  function toggleRationale(id: string) {
    setExpandedRationales((cur) => {
      const next = new Set(cur)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  function toggleScore(id: string) {
    setExpandedScores((cur) => {
      const next = new Set(cur)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function resetManualForm() {
    setCandidateQuery('')
    setSelectedCandidate(null)
    setReason('')
    setManualScore(70)
    setManualRationale('')
    setScoreOverrides(shortlistScoreOverridesFromTotal(70))
  }

  function openEditDialog(entry: ShortlistEntry) {
    setEditEntry(entry)
    setReason('')
    setManualRationale(entry.rationale ?? '')
    const overrides = shortlistScoreOverridesFromBreakdown(entry.score_breakdown)
    setScoreOverrides(overrides)
    setManualScore(shortlistScoreTotal(overrides) || entry.fit_score || 0)
  }

  function openRemoveDialog(entry: ShortlistEntry) {
    setRemoveEntry(entry)
    setReason('')
    setScoreOverrides(DEFAULT_SHORTLIST_SCORE_OVERRIDES)
  }

  function updateScoreOverride(key: ShortlistScoreKey, value: string) {
    const requested = clampScore(Number(value))
    setScoreOverrides((current) => {
      const next = {
        ...current,
        [key]: Math.min(requested, remainingScoreBudget(current, key)),
      }
      setManualScore(shortlistScoreTotal(next))
      return next
    })
  }

  function scoreOverrideFields() {
    const total = shortlistScoreTotal(scoreOverrides)
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Component scores are weighted contribution points. They add up to the overall
          fit score and cannot exceed 100.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {SHORTLIST_SCORE_KEYS.map((key) => (
            <div key={key}>
              <Label htmlFor={`score-${key}`} className="text-xs">
                {formatBreakdownLabel(key)}
              </Label>
              <Input
                id={`score-${key}`}
                type="number"
                min={0}
                max={remainingScoreBudget(scoreOverrides, key)}
                step="0.01"
                value={scoreOverrides[key]}
                onChange={(event) => updateScoreOverride(key, event.target.value)}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Component total: {total} / 100
        </p>
      </div>
    )
  }

  const canSubmitFeedback = reason.trim().length >= 3

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: any[] = [
    columnHelper.accessor('rank', {
      header: '#',
      cell: (info) => (
        <span className="text-xs text-muted-foreground">{info.getValue() ?? '—'}</span>
      ),
      size: 48,
    }),
    columnHelper.accessor('candidate_name', {
      header: 'Candidate',
      cell: (info) => {
        const entry = info.row.original
        const label = info.getValue() ?? shortId(entry.candidate_id)
        return (
          <div>
            <button
              type="button"
              className="cursor-pointer text-left text-sm hover:text-primary"
              onClick={() => onCandidateSelect(entry.candidate_id, entry.submission_id)}
            >
              {label}
            </button>
            {entry.current_title && (
              <p className="text-[11px] text-muted-foreground">{entry.current_title}</p>
            )}
          </div>
        )
      },
    }),
    columnHelper.accessor('rationale', {
      header: 'Rationale',
      cell: (info) => {
        const entry = info.row.original
        const isExpanded = expandedRationales.has(entry.candidate_id)
        return (
          <button
            type="button"
            className="max-w-[560px] py-2 text-left"
            aria-expanded={isExpanded}
            onClick={() => toggleRationale(entry.candidate_id)}
          >
            <p
              className={
                isExpanded
                  ? 'whitespace-normal text-sm leading-relaxed text-muted-foreground'
                  : 'overflow-hidden text-sm leading-relaxed text-muted-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]'
              }
            >
              {info.getValue() ?? 'No rationale returned.'}
            </p>
            <span className="mt-1 block text-[11px] text-primary">
              {isExpanded ? 'Show less' : 'Show why'}
            </span>
            {isExpanded && (entry.top_matching_skills?.length ?? 0) > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1">
                <span className="mr-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                  Matched
                </span>
                {entry.top_matching_skills.map((skill) => (
                  <Badge key={skill} variant="outline" className="text-[11px]">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
            {isExpanded && (entry.gaps?.length ?? 0) > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1">
                <span className="mr-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                  Gaps
                </span>
                {entry.gaps.map((gap) => (
                  <Badge key={gap} variant="secondary" className="text-[11px]">
                    {gap}
                  </Badge>
                ))}
              </div>
            )}
            {isExpanded && (entry.missing_must_have?.length ?? 0) > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1">
                <span className="mr-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                  Missing must-have
                </span>
                {entry.missing_must_have.map((skill) => (
                  <Badge key={skill} variant="destructive" className="text-[11px]">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
          </button>
        )
      },
    }),
    columnHelper.accessor('fit_score', {
      header: 'Fit Score',
      cell: (info) => {
        const score = info.getValue()
        const entry = info.row.original
        const isExpanded = expandedScores.has(entry.candidate_id)
        return (
          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-2"
              aria-expanded={isExpanded}
              onClick={() => toggleScore(entry.candidate_id)}
            >
              <span className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${score ?? 0}%`, backgroundColor: scoreColor(score ?? 0) }}
                />
              </span>
              <span className="text-sm font-semibold" style={{ color: scoreColor(score ?? 0) }}>
                {score != null ? `${score}%` : '—'}
              </span>
            </button>
            {isExpanded && Object.keys(entry.score_breakdown ?? {}).length > 0 && (
              <div className="absolute left-0 top-7 z-20 w-72 rounded-lg border border-border bg-popover p-3 text-xs shadow-lg">
                <p className="mb-2 font-semibold text-popover-foreground">Score breakdown</p>
                <div className="space-y-2">
                  {Object.entries(entry.score_breakdown).map(([key, value]) => (
                    <div key={key}>
                      <div className="mb-1 flex justify-between gap-2 text-muted-foreground">
                        <span>{formatBreakdownLabel(key)}</span>
                        <span>{value}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.min(100, value)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      },
      size: 80,
    }),
    columnHelper.display({
      id: 'status',
      header: 'Status',
      cell: (info) => {
        const entry = info.row.original
        const effectiveStatus = localStatusOverrides[entry.candidate_id] ?? entry.status
        const extraClass = shortlistStatusBadgeClass(effectiveStatus)
        if (!extraClass) {
          return (
            <Badge variant="secondary" className="text-xs">
              {effectiveStatus}
            </Badge>
          )
        }
        return (
          <Badge variant="outline" className={`text-xs ${extraClass}`}>
            {effectiveStatus}
          </Badge>
        )
      },
      size: 120,
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: (info) => {
        const entry = info.row.original
        const effectiveStatus = localStatusOverrides[entry.candidate_id] ?? entry.status
        const isTerminal = effectiveStatus === 'approved' || effectiveStatus === 'rejected'
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 hover:text-primary"
              aria-label="Edit candidate score"
              onClick={() => openEditDialog(entry)}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 hover:text-green-600"
              aria-label="Approve candidate"
              disabled={isTerminal}
              onClick={() => handleAction(entry, 'approved')}
            >
              <CheckCircle className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 hover:text-destructive"
              aria-label="Remove candidate"
              onClick={() => openRemoveDialog(entry)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        )
      },
      size: 100,
    }),
  ]

  const table = useReactTable({
    data: entries,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const addCandidateButton = (
    <div className="mb-2 flex justify-end">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          resetManualForm()
          setAddOpen(true)
        }}
      >
        <Plus className="mr-1 size-4" />
        Add candidate
      </Button>
    </div>
  )

  const dialogs = (
    <>
      <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) resetManualForm() }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manually add candidate</DialogTitle>
            <DialogDescription>
              Select a candidate and rate every score component before adding them.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="candidate-search">Candidate search</Label>
              <Input
                id="candidate-search"
                value={candidateQuery}
                onChange={(event) => setCandidateQuery(event.target.value)}
                placeholder="Search by role, name, or skills"
              />
              <div className="mt-2 max-h-40 overflow-auto rounded-md border border-border">
                {candidateResults.map((candidate) => (
                  <button
                    key={candidate.candidate_id}
                    type="button"
                    className={`block w-full px-3 py-2 text-left text-sm hover:bg-muted ${
                      selectedCandidate?.candidate_id === candidate.candidate_id ? 'bg-muted' : ''
                    }`}
                    onClick={() => {
                      setSelectedCandidate(candidate)
                      setManualRationale(
                        `Manual add: ${candidate.name} has relevant experience for this requisition.`,
                      )
                    }}
                  >
                    <span className="font-medium">{candidate.name}</span>
                    <span className="ml-2 text-muted-foreground">
                      {candidate.current_title ?? 'Candidate'} · {candidate.total_years_experience ?? '—'} yrs
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <FeedbackFields
              reason={reason}
              setReason={setReason}
              manualScore={scoreTotal}
              setManualScore={(value) => {
                const total = clampScore(value)
                setManualScore(total)
                setScoreOverrides(shortlistScoreOverridesFromTotal(total))
              }}
              manualRationale={manualRationale}
              setManualRationale={setManualRationale}
              scoreOverrideFields={scoreOverrideFields}
            />
            <Button
              disabled={!selectedCandidate || !canSubmitFeedback || manualAddMutation.isPending}
              onClick={() => manualAddMutation.mutate()}
            >
              Add to shortlist
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editEntry} onOpenChange={(open) => { if (!open) { setEditEntry(null); resetManualForm() } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit shortlist score</DialogTitle>
            <DialogDescription>
              Adjust this candidate’s score and capture structured calibration feedback.
            </DialogDescription>
          </DialogHeader>
          <FeedbackFields
            reason={reason}
            setReason={setReason}
            manualScore={scoreTotal}
            setManualScore={(value) => {
              const total = clampScore(value)
              setManualScore(total)
              setScoreOverrides(shortlistScoreOverridesFromTotal(total))
            }}
            manualRationale={manualRationale}
            setManualRationale={setManualRationale}
            scoreOverrideFields={scoreOverrideFields}
          />
          <Button
            disabled={!canSubmitFeedback || scoreEditMutation.isPending}
            onClick={() => scoreEditMutation.mutate()}
          >
            Save score
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!removeEntry} onOpenChange={(open) => { if (!open) { setRemoveEntry(null); resetManualForm() } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Remove candidate</DialogTitle>
            <DialogDescription>
              Explain why this candidate should not be shortlisted and rate the scoring components.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="remove-reason">Reason</Label>
              <Textarea
                id="remove-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Why should this candidate be removed?"
              />
            </div>
            {scoreOverrideFields()}
            <Button
              variant="destructive"
              disabled={!canSubmitFeedback || manualRemoveMutation.isPending}
              onClick={() => manualRemoveMutation.mutate()}
            >
              Remove candidate
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )

  if (isLoading)
    return (
      <>
        {addCandidateButton}
        <p className="py-4 text-center text-sm text-muted-foreground">Loading shortlist…</p>
        {dialogs}
      </>
    )

  if (entries.length === 0) {
    return (
      <>
        {addCandidateButton}
        <p className="py-8 text-center text-sm text-muted-foreground">
          No candidates shortlisted yet. Trigger a match above to populate this list.
        </p>
        {dialogs}
      </>
    )
  }

  return (
    <>
      {addCandidateButton}
      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead
                  key={header.id}
                  style={{ width: header.column.getSize() || undefined }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className="h-10 cursor-pointer hover:bg-muted/30">
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
        </Table>
      </div>
      {dialogs}
    </>
  )
}

function FeedbackFields({
  reason,
  setReason,
  manualScore,
  setManualScore,
  manualRationale,
  setManualRationale,
  scoreOverrideFields,
}: {
  reason: string
  setReason: (value: string) => void
  manualScore: number
  setManualScore: (value: number) => void
  manualRationale: string
  setManualRationale: (value: string) => void
  scoreOverrideFields: () => ReactNode
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="feedback-reason">Reason</Label>
        <Textarea
          id="feedback-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Why are you making this shortlist change?"
        />
      </div>
      <div>
        <Label htmlFor="manual-score">Overall score</Label>
        <Input
          id="manual-score"
          type="number"
          min={0}
          max={100}
          value={manualScore}
          onChange={(event) => setManualScore(Math.max(0, Math.min(100, Number(event.target.value) || 0)))}
        />
      </div>
      <div>
        <Label htmlFor="manual-rationale">Rationale</Label>
        <Textarea
          id="manual-rationale"
          value={manualRationale}
          onChange={(event) => setManualRationale(event.target.value)}
          placeholder="What should the shortlist rationale say?"
        />
      </div>
      {scoreOverrideFields()}
    </div>
  )
}

function shortId(id: string) {
  if (!id) return '—'
  return `${id.slice(0, 8)}…${id.slice(-4)}`
}

function scoreColor(score: number) {
  if (score >= 75) return 'oklch(0.45 0.15 145)'
  if (score >= 50) return 'oklch(0.65 0.16 70)'
  return 'oklch(0.58 0.2 25)'
}

function remainingScoreBudget(
  overrides: ShortlistScoreOverrides,
  activeKey: ShortlistScoreKey,
) {
  const otherTotal = SHORTLIST_SCORE_KEYS.reduce(
    (total, key) => (key === activeKey ? total : total + overrides[key]),
    0,
  )
  return clampScore(100 - otherTotal)
}

function formatBreakdownLabel(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
