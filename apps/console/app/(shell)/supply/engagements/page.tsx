'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { components } from '@brynzit/api-client'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { ChevronRight } from 'lucide-react'
import { EngagementSequenceSheet } from './_components/engagement-sequence-sheet'

type EngagementSequenceResponse = components['schemas']['EngagementSequenceResponse']
type EngagementListResponse =
  | EngagementSequenceResponse[]
  | { sequences?: EngagementSequenceResponse[] }

function statusBadgeVariant(status: string): 'secondary' | 'outline' | 'default' | 'destructive' {
  switch (status) {
    case 'draft':
      return 'secondary'
    case 'approved':
      return 'default'
    case 'rejected':
      return 'outline'
    case 'generating':
      return 'secondary'
    default:
      return 'secondary'
  }
}

export default function EngagementsPage() {
  const [selectedSequence, setSelectedSequence] = useState<EngagementSequenceResponse | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['supply-engagements'],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/v1/supply/engagements`,
      )
      if (res.status === 404) return []
      if (!res.ok) throw new Error('Failed to fetch engagement sequences')

      const body = (await res.json()) as EngagementListResponse
      return Array.isArray(body) ? body : (body.sequences ?? [])
    },
    staleTime: 30000,
  })

  if (isLoading) {
    return (
      <div className="overflow-y-auto px-6 py-6">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="overflow-y-auto px-6 py-6">
        <p className="text-sm text-destructive">Couldn&apos;t load engagement sequences.</p>
      </div>
    )
  }

  const sequences = data ?? []

  return (
    <div className="overflow-y-auto px-6 py-6">
      {/* Toolbar */}
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-xl font-semibold">Engagements</h1>
        {sequences.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {sequences.filter((s) => s.status === 'draft').length} pending
          </span>
        )}
      </div>

      {/* Empty state */}
      {sequences.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center text-center">
          <h2 className="text-xl font-semibold">No engagement sequences</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Generate sequences from candidate profiles in search results, then review them here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sequences.map((seq) => {
            const candidateLabel = `Candidate ${seq.candidate_id.slice(0, 8)}`
            const stepCount = seq.steps?.length ?? 0
            const badgeVariant = statusBadgeVariant(seq.status)

            return (
              <div
                key={seq.id}
                className="flex cursor-pointer items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-accent/30"
                onClick={() => {
                  setSelectedSequence(seq)
                  setIsSheetOpen(true)
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedSequence(seq)
                    setIsSheetOpen(true)
                  }
                }}
              >
                <span className="flex-1 text-sm font-semibold">{candidateLabel}</span>
                <span className="text-xs text-muted-foreground">{stepCount} steps</span>
                <Badge variant={badgeVariant} className="text-xs capitalize">
                  {seq.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {seq.created_at ? new Date(seq.created_at).toLocaleDateString() : ''}
                </span>
                <ChevronRight className="ml-auto size-4 text-muted-foreground" />
              </div>
            )
          })}
        </div>
      )}

      <EngagementSequenceSheet
        sequence={selectedSequence}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </div>
  )
}
