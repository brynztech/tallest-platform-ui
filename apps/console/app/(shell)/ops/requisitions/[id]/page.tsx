'use client'

import { use, useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { toast } from 'sonner'
import { Separator } from '@brynzit/ui/components/ui/separator'
import { Button } from '@brynzit/ui/components/ui/button'
import { Badge } from '@brynzit/ui/components/ui/badge'
import Link from 'next/link'
import { Trophy, Zap } from 'lucide-react'
import { AssignedRecruitersCard } from '@/(shell)/my-roles/[id]/_components/assigned-recruiters-card'
import { RequisitionFields } from './_components/requisition-fields'
import { RequisitionLifecycleControls } from './_components/lifecycle-controls'
import { HiringProcessPanel } from './_components/hiring-process-panel'
import { JdPanel } from './_components/jd-panel'
import { MatchmakerPanel } from './_components/matchmaker-panel'
import { ShortlistTable } from './_components/shortlist-table'
import { CandidateProfileSheet } from '@/(shell)/_components/candidate-profile-sheet'
import { InterviewsSection } from './_components/interviews-section'
import { PlacementPanel } from './_components/placement-panel'
import { PlacementsSection } from './_components/placements-section'
import { canTriggerCandidateMatch, candidateMatchButtonLabel } from './_lib/match-status'

type SubmissionResponse = components['schemas']['SubmissionResponse']

export default function RequisitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null)
  const [isCandidatePanelOpen, setIsCandidatePanelOpen] = useState(false)
  const [isPlacementOpen, setIsPlacementOpen] = useState(false)

  // Approved candidate — optimistically set on approve action, also derived from shortlist data
  const [approvedCandidateId, setApprovedCandidateId] = useState<string | null>(null)
  const [approvedCandidateName, setApprovedCandidateName] = useState<string | undefined>(undefined)

  const {
    data: req,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['ops-requisition', id],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/ops/requisitions/{req_id}', {
        params: { path: { req_id: id } },
      })
      if (error) throw error
      return data
    },
  })

  const { data: clientsData } = useQuery({
    queryKey: ['ops-clients'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/ops/clients', {})
      if (error) throw error
      return data
    },
    staleTime: 60 * 1000,
    enabled: !!req?.client_id,
  })

  // Supply shortlist — same cache key as ShortlistTable; carries real submission ids/statuses.
  const { data: shortlistEntries = [] } = useQuery({
    queryKey: ['supply-shortlist', id],
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        '/api/v1/supply/shortlists/{requisition_id}',
        { params: { path: { requisition_id: id } } },
      )
      if (error) throw error
      return data.submissions
    },
    staleTime: 30 * 1000,
  })

  // Derive approvedCandidateId from the shortlist on load so it survives page refresh
  useEffect(() => {
    if (!approvedCandidateId) {
      const approved = shortlistEntries.find((e) => e.status === 'approved')
      if (approved?.candidate_id) {
        setApprovedCandidateId(approved.candidate_id)
        setApprovedCandidateName(approved.candidate_name ?? undefined)
      }
    }
  }, [shortlistEntries, approvedCandidateId])

  // Candidates available for scheduling interviews / logging placements.
  // Uses candidate_name when the backend provides it, falls back to short UUID.
  const shortlistCandidates = useMemo(
    () =>
      shortlistEntries
        .filter(
          (e): e is SubmissionResponse & { candidate_id: string } =>
            Boolean(e.candidate_id) && e.status !== 'rejected',
        )
        .map((e) => ({
          id: e.candidate_id,
          name: e.candidate_name ?? shortId(e.candidate_id),
        })),
    [shortlistEntries],
  )

  const queryClient = useQueryClient()

  const matchMutation = useMutation({
    mutationFn: () =>
      apiClient.POST('/api/v1/ops/requisitions/{req_id}/match', {
        params: { path: { req_id: id } },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops-requisition', id] })
      queryClient.invalidateQueries({ queryKey: ['supply-shortlist', id] })
      toast('Match triggered — shortlist will refresh shortly.')
    },
    onError: () => {
      toast.error('Failed to trigger match — try again.')
    },
  })

  if (isLoading)
    return (
      <div className="p-6">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    )
  if (error || !req)
    return (
      <div className="p-6">
        <p className="text-destructive text-sm">Requisition not found.</p>
      </div>
    )

  return (
    <div className="overflow-y-auto px-6 py-6">
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{req.title}</h1>
          <Link href={`/ops/clients/${req.client_id}`} className="text-sm text-primary">
            {clientsData?.find((c) => c.id === req.client_id)?.name ?? req.client_id}
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <RequisitionStatusBadge status={req.status} />
          <RequisitionLifecycleControls reqId={id} status={req.status} />
        </div>
      </div>

      {/* Section 1: Requisition Fields */}
      <RequisitionFields req={req} />
      <JdPanel req={req} />
      <AssignedRecruitersCard reqId={id} />
      <HiringProcessPanel req={req} />

      {/* Trigger Match button */}
      <Button
        variant="default"
        size="sm"
        className="mb-6 mt-4"
        disabled={!canTriggerCandidateMatch(req.status) || matchMutation.isPending}
        onClick={() => matchMutation.mutate()}
      >
        <Zap className="mr-1 size-4" />
        {candidateMatchButtonLabel(req.status, matchMutation.isPending)}
      </Button>

      {/* Section 2: Shortlist */}
      <Separator className="mb-4" />
      <MatchmakerPanel
        reqId={id}
        onCandidateSelect={(candidateId, submissionId) => {
          setSelectedCandidateId(candidateId)
          setSelectedSubmissionId(submissionId)
          setIsCandidatePanelOpen(true)
        }}
      />
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-base font-semibold">Shortlist</h2>
      </div>
      <ShortlistTable
        reqId={id}
        onCandidateSelect={(candidateId, submissionId) => {
          setSelectedCandidateId(candidateId)
          setSelectedSubmissionId(submissionId)
          setIsCandidatePanelOpen(true)
        }}
        onApprove={(candidateId) => {
          setApprovedCandidateId(candidateId)
          const match = shortlistEntries.find((e) => e.candidate_id === candidateId)
          setApprovedCandidateName(match?.candidate_name ?? undefined)
        }}
      />
      <CandidateProfileSheet
        candidateId={selectedCandidateId}
        submissionId={selectedSubmissionId}
        isOpen={isCandidatePanelOpen}
        onOpenChange={setIsCandidatePanelOpen}
        source="shortlist"
        requisitionId={id}
      />

      {/* Section 3: Interviews */}
      <Separator className="my-4" />
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-base font-semibold">Interviews</h2>
      </div>
      <InterviewsSection
        reqId={id}
        candidates={shortlistCandidates}
        defaultCandidateId={approvedCandidateId}
      />

      {/* Section 4: Placements */}
      <Separator className="my-4" />
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-base font-semibold">Placements</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsPlacementOpen(true)}
        >
          <Trophy className="mr-1 size-4" />
          Log Placement
        </Button>
      </div>
      <PlacementsSection reqId={id} />

      {/* Placement slide-over */}
      <PlacementPanel
        isOpen={isPlacementOpen}
        onOpenChange={setIsPlacementOpen}
        reqId={id}
        clientId={req.client_id ?? ''}
        approvedCandidateId={approvedCandidateId}
        candidateName={approvedCandidateName}
      />
    </div>
  )
}

function shortId(id: string) {
  if (!id) return '—'
  return `${id.slice(0, 8)}…${id.slice(-4)}`
}

function RequisitionStatusBadge({ status }: { status: string }) {
  if (status === 'filled') {
    return (
      <Badge
        className="border-[oklch(0.45_0.15_145)/40] bg-[oklch(0.45_0.15_145)/20] text-xs text-[oklch(0.45_0.15_145)]"
        variant="outline"
      >
        {status}
      </Badge>
    )
  }
  if (status === 'closed') {
    return (
      <Badge variant="outline" className="border-border text-xs text-muted-foreground">
        {status}
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="text-xs">
      {status}
    </Badge>
  )
}
