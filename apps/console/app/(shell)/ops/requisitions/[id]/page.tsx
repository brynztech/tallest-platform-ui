'use client'

import { use, useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { Button } from '@brynzit/ui/components/ui/button'
import Link from 'next/link'
import { ChevronRight, Trophy } from 'lucide-react'
import { AssignedRecruitersCard } from '@/(shell)/my-roles/[id]/_components/assigned-recruiters-card'
import { RequisitionFields } from './_components/requisition-fields'
import { RequisitionLifecycleControls } from './_components/lifecycle-controls'
import { HiringProcessPanel } from './_components/hiring-process-panel'
import { JdPanel } from './_components/jd-panel'
import { ShortlistTable } from './_components/shortlist-table'
import { CandidateProfileSheet } from '@/(shell)/_components/candidate-profile-sheet'
import { InterviewsSection } from './_components/interviews-section'
import { PlacementPanel } from './_components/placement-panel'
import { PlacementsSection } from './_components/placements-section'
import { requisitionStatusLabel } from '@/(shell)/_lib/requisition-status'
import { intakeGreenFlags, intakeRedFlags, intakeQuickFacts } from '@/(shell)/_lib/requisition-intake'

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

  const clientName = clientsData?.find((c) => c.id === req.client_id)?.name ?? req.client_id
  const quickFacts = intakeQuickFacts(req.intake_details)
  const location = [quickFacts.location, quickFacts.work_type].filter(Boolean).join(' · ')
  const greenFlagsCount = intakeGreenFlags(req.intake_details).length
  const redFlagsCount = intakeRedFlags(req.intake_details).length
  const shortlistTotal = shortlistEntries.length
  const submittedCount = shortlistEntries.filter((e) => e.submitted_at != null).length
  const awaitingScreenCount = shortlistEntries.filter((e) => e.status === 'shortlisted').length

  return (
    <div className="overflow-y-auto px-6 py-6">
      {/* Breadcrumb */}
      <div className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/ops/requisitions" className="hover:text-foreground">
          Ops requisitions
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href={`/ops/clients/${req.client_id}`} className="font-semibold text-foreground hover:underline">
          {clientName}
        </Link>
      </div>

      {/* Page header */}
      <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
        <h1 className="flex flex-wrap items-center gap-2 text-xl font-semibold">
          {req.title}
          <RequisitionStatusBadge status={req.status} />
        </h1>
        <div className="flex shrink-0 items-center gap-2">
          <RequisitionLifecycleControls reqId={id} status={req.status} />
        </div>
      </div>
      <p className="text-[13px] text-muted-foreground">
        {[clientName, location, `posted ${daysAgo(req.created_at)}d ago`, 'owner ops']
          .filter(Boolean)
          .join(' · ')}
      </p>

      {/* Stats row */}
      <div className="mt-3 mb-6 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-[#ECEAE4] pt-3 text-[13px]">
        <span className="font-medium">{shortlistTotal} on shortlist</span>
        <Stat dotTone="#386CA0" label={`${submittedCount} submitted to client`} />
        <Stat dotTone="#905300" label={`${awaitingScreenCount} awaiting recruiter screen`} />
        <Stat dotTone="#317A4F" label={`${greenFlagsCount} green flags`} />
        <Stat dotTone="#BA4642" label={`${redFlagsCount} red flags`} />
      </div>

      {/* Section 1: Requisition Fields */}
      <RequisitionFields req={req} />
      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <JdPanel req={req} />
        <AssignedRecruitersCard reqId={id} />
      </div>
      <HiringProcessPanel req={req} submissions={shortlistEntries} />

      {/* Section 2: Shortlist */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Shortlist</h2>
          <p className="text-[13px] text-muted-foreground">
            {shortlistTotal} candidate{shortlistTotal === 1 ? '' : 's'}
          </p>
        </div>
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

      {/* Sections 3 & 4: Interviews + Placements */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-base font-semibold">Interviews</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            A lightweight tracker. Record the date and outcome here; invites and notes live
            outside Brynz.
          </p>
          <div className="mt-3">
            <InterviewsSection
              reqId={id}
              candidates={shortlistCandidates}
              defaultCandidateId={approvedCandidateId}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Placements</h2>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                Log a placement once the client confirms an accepted offer.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsPlacementOpen(true)}>
              <Trophy className="mr-1 size-4" />
              Log placement
            </Button>
          </div>
          <div className="mt-3">
            <PlacementsSection reqId={id} />
          </div>
        </div>
      </div>

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

function daysAgo(dateIso: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(dateIso).getTime()) / 86_400_000))
}

function Stat({ label, dotTone }: { label: string; dotTone: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className="size-1.5 rounded-full" style={{ backgroundColor: dotTone }} />
      {label}
    </span>
  )
}

function RequisitionStatusBadge({ status }: { status: string }) {
  const live = status === 'open' || status === 'matching_complete'
  return (
    <span
      className={
        live
          ? 'inline-flex items-center gap-[5px] rounded-full border border-[#D3E2D7] bg-[#EFF4EF] px-2 py-[3px] text-[11px] font-medium text-[#317A4F]'
          : 'inline-flex items-center gap-[5px] rounded-full border border-border bg-secondary px-2 py-[3px] text-[11px] font-medium text-muted-foreground'
      }
    >
      <span className="size-[5px] rounded-full bg-current" />
      {requisitionStatusLabel(status)}
    </span>
  )
}
