'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import { SequenceEditor } from './_components/sequence-editor'
import {
  getOutreachReviewItemFromLead,
  type OutreachReviewItem,
} from './_lib/sequence-list'

export default function OutreachPage() {
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())

  const { data, isLoading, error } = useQuery({
    queryKey: ['outreach-sequences'],
    queryFn: async () => {
      const { data: leadData, error: leadError } = await apiClient.GET('/api/v1/bd/leads', {
        params: { query: { status: 'outreach_review', limit: 50 } },
      })
      if (leadError) throw leadError

      const items = await Promise.all(
        (leadData.leads ?? []).map(async (lead): Promise<OutreachReviewItem | null> => {
          const { data: detailData, error: detailError } = await apiClient.GET('/api/v1/bd/leads/{lead_id}', {
            params: { path: { lead_id: lead.id } },
          })
          if (detailError) throw detailError
          return getOutreachReviewItemFromLead(detailData)
        }),
      )

      return { items: items.filter((item): item is OutreachReviewItem => item !== null) }
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
        <p className="text-sm text-destructive">Couldn&apos;t load outreach sequences.</p>
      </div>
    )
  }

  const items = (data?.items ?? []).filter((item) => !removedIds.has(item.sequence.sequence_id))

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
        <span className="text-sm text-muted-foreground">{items.length} pending</span>
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
            <SequenceEditor
              key={item.sequence.sequence_id}
              sequence={item.sequence}
              leadName={item.leadName}
              onApproved={handleApproved}
              onRejected={handleRejected}
            />
          ))}
        </div>
      )}
    </div>
  )
}
