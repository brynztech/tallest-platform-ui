'use client'

import { useState, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
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
import { CheckCircle, Pencil, Plus, Trash2 } from 'lucide-react'
import { CandidateShortlistCard } from '@/(shell)/_components/candidate-shortlist-card'
import { humanizeStatus } from '@/(shell)/_lib/status-tone'
import {
  DEFAULT_SHORTLIST_SCORE_OVERRIDES,
  SHORTLIST_SCORE_KEYS,
  clampScore,
  normalizeShortlistSubmission,
  shortlistScoreOverridesFromBreakdown,
  shortlistScoreOverridesFromTotal,
  shortlistScoreTotal,
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
      <div className="flex flex-col gap-3">
        {entries.map((entry) => {
          const effectiveStatus = localStatusOverrides[entry.candidate_id] ?? entry.status
          const isTerminal = effectiveStatus === 'approved' || effectiveStatus === 'rejected'
          return (
            <CandidateShortlistCard
              key={entry.candidate_id}
              name={entry.candidate_name ?? shortId(entry.candidate_id)}
              title={entry.current_title}
              yearsExperience={entry.years_experience}
              skills={entry.top_matching_skills}
              matchScore={entry.fit_score}
              evidence={entry.evidence}
              fallbackNote={entry.rationale}
              status={effectiveStatus}
              statusLabel={humanizeStatus(effectiveStatus)}
              ctc={entry.candidate_ctc}
              ectc={entry.candidate_ectc}
              onViewProfile={() => onCandidateSelect(entry.candidate_id, entry.submission_id)}
              actions={
                <>
                  <Badge variant="outline" className="text-xs">
                    Rank #{entry.rank}
                  </Badge>
                  <div className="flex-1" />
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(entry)}>
                    <Pencil className="mr-1 size-3.5" />
                    Edit score
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isTerminal}
                    className="border-[#D3E2D7] text-[#317A4F] hover:bg-[#EFF4EF]"
                    onClick={() => handleAction(entry, 'approved')}
                  >
                    <CheckCircle className="mr-1 size-3.5" />
                    Approve
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => openRemoveDialog(entry)}
                  >
                    <Trash2 className="mr-1 size-3.5" />
                    Remove
                  </Button>
                </>
              }
            />
          )
        })}
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
