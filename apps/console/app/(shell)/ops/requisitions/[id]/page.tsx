'use client'

import { use, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import { Separator } from '@brynzit/ui/components/ui/separator'
import { Button } from '@brynzit/ui/components/ui/button'
import { Badge } from '@brynzit/ui/components/ui/badge'
import Link from 'next/link'
import { Trophy, Zap } from 'lucide-react'
import { RequisitionFields } from './_components/requisition-fields'
import { ShortlistTable } from './_components/shortlist-table'
import { CandidateDetailPanel } from './_components/candidate-detail-panel'
import { InterviewsSection } from './_components/interviews-section'
import { PlacementPanel } from './_components/placement-panel'
import { PlacementsSection } from './_components/placements-section'

export default function RequisitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Next.js 16: params is a Promise in 'use client' pages — unwrap with React.use()
  const { id } = use(params)

  // Shared state for Wave 3 components (shortlist, placement, candidate panel)
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
  const [isCandidatePanelOpen, setIsCandidatePanelOpen] = useState(false)
  const [isPlacementOpen, setIsPlacementOpen] = useState(false)
  const [approvedCandidateId, setApprovedCandidateId] = useState<string | null>(null)

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
            {req.client_id}
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <RequisitionStatusBadge status={req.status} />
        </div>
      </div>

      {/* Section 1: Requisition Fields */}
      <RequisitionFields req={req} />

      {/* Trigger Match button */}
      <Button variant="default" size="sm" className="mb-6 mt-4" disabled={req.status !== 'open'}>
        <Zap className="mr-1 size-4" />
        Trigger Candidate Match
      </Button>

      {/* Section 2: Shortlist */}
      <Separator className="mb-4" />
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-base font-semibold">Shortlist</h2>
      </div>
      <ShortlistTable
        reqId={id}
        onCandidateSelect={(candidateId) => {
          setSelectedCandidateId(candidateId)
          setIsCandidatePanelOpen(true)
        }}
        onApprove={(candidateId) => setApprovedCandidateId(candidateId)}
      />
      <CandidateDetailPanel
        candidateId={selectedCandidateId}
        isOpen={isCandidatePanelOpen}
        onOpenChange={setIsCandidatePanelOpen}
        onApprove={() => {
          if (selectedCandidateId) setApprovedCandidateId(selectedCandidateId)
        }}
      />

      {/* Section 3: Interviews */}
      <Separator className="my-4" />
      <h2 className="mb-2 text-base font-semibold">Interviews</h2>
      <InterviewsSection reqId={id} approvedCandidateId={approvedCandidateId} />

      {/* Log Placement button — visible when approvedCandidateId is set */}
      {approvedCandidateId && (
        <Button
          variant="default"
          size="sm"
          className="mb-6 mt-4"
          onClick={() => setIsPlacementOpen(true)}
        >
          <Trophy className="mr-1 size-4" />
          Log Placement
        </Button>
      )}

      {/* Section 4: Placements */}
      <Separator className="my-4" />
      <h2 className="mb-2 text-base font-semibold">Placements</h2>
      <PlacementsSection reqId={id} />

      {/* Placement slide-over */}
      <PlacementPanel
        isOpen={isPlacementOpen}
        onOpenChange={setIsPlacementOpen}
        reqId={id}
        clientId={req.client_id ?? ''}
        approvedCandidateId={approvedCandidateId}
      />
    </div>
  )
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
