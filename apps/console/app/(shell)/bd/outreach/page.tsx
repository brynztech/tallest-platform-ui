'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import { SequenceEditor } from './_components/sequence-editor'
import {
  getOutreachReviewItemFromLead,
  type OutreachReviewItem,
} from './_lib/sequence-list'

type GeneratingOutreachItem = {
  kind: 'generating'
  id: string
  leadName: string
  domain: string | null
}

type OutreachListItem =
  | ({ kind: 'review' } & OutreachReviewItem)
  | GeneratingOutreachItem

function GeneratingSequenceCard({ item }: { item: GeneratingOutreachItem }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/70 p-4 shadow-sm shadow-black/10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{item.leadName}</p>
          {item.domain && <p className="text-xs text-muted-foreground">{item.domain}</p>}
        </div>
        <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          Generating outreach
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Brynz is drafting the 3-step sequence. This card will become editable when generation finishes.
      </p>
    </div>
  )
}

export default function OutreachPage() {
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())

  const { data, isLoading, error } = useQuery({
    queryKey: ['outreach-sequences'],
    queryFn: async () => {
      const statuses = ['outreach_generation', 'outreach_review'] as const
      const leadPages = await Promise.all(
        statuses.map(async (status) => {
          const { data: leadData, error: leadError } = await apiClient.GET('/api/v1/bd/leads', {
            params: { query: { status, limit: 50 } },
          })
          if (leadError) throw leadError
          return leadData.leads ?? []
        }),
      )

      const items = await Promise.all(
        leadPages.flat().map(async (lead): Promise<OutreachListItem | null> => {
          const { data: detailData, error: detailError } = await apiClient.GET('/api/v1/bd/leads/{lead_id}', {
            params: { path: { lead_id: lead.id } },
          })
          if (detailError) throw detailError

          if (detailData.status === 'outreach_generation') {
            return {
              kind: 'generating',
              id: detailData.active_sequence?.id ?? detailData.id,
              leadName: detailData.contact.company_name ?? detailData.contact.name ?? 'Lead',
              domain: detailData.canonical_domain ?? null,
            }
          }

          const reviewItem = getOutreachReviewItemFromLead(detailData)
          return reviewItem ? { kind: 'review', ...reviewItem } : null
        }),
      )

      return { items: items.filter((item): item is OutreachListItem => item !== null) }
    },
    refetchInterval: 5000,
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
        <p className="text-sm text-destructive">Couldn&apos;t load outreach sequences.</p>
      </div>
    )
  }

  const items = (data?.items ?? []).filter((item) =>
    item.kind === 'review' ? !removedIds.has(item.sequence.sequence_id) : !removedIds.has(item.id),
  )
  const reviewCount = items.filter((item) => item.kind === 'review').length

  function handleApproved(id: string) {
    setRemovedIds((prev) => new Set([...prev, id]))
  }

  function handleRejected(id: string) {
    setRemovedIds((prev) => new Set([...prev, id]))
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Outreach Review</h1>
        <span className="text-sm text-muted-foreground">{reviewCount} pending review</span>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <h2 className="text-xl font-semibold">All reviewed</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            No outreach sequences waiting for review.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            item.kind === 'generating' ? (
              <GeneratingSequenceCard key={item.id} item={item} />
            ) : (
              <SequenceEditor
                key={item.sequence.sequence_id}
                sequence={item.sequence}
                leadName={item.leadName}
                onApproved={handleApproved}
                onRejected={handleRejected}
              />
            )
          ))}
        </div>
      )}
    </div>
  )
}
