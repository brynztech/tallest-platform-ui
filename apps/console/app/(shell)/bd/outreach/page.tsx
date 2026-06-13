'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { components } from '@brynzit/api-client'
import { SequenceEditor } from './_components/sequence-editor'

type OutreachSequenceResponse = components['schemas']['OutreachSequenceResponse']

export default function OutreachPage() {
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())

  const { data, isLoading, error } = useQuery({
    queryKey: ['outreach-sequences'],
    queryFn: async () => {
      // MSW-only: no live /api/v1/bd/outreach list endpoint (RESEARCH.md Open Question 3)
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/v1/bd/outreach`,
      )
      if (!res.ok) throw new Error('Failed to fetch outreach sequences')
      return res.json() as Promise<{ sequences: OutreachSequenceResponse[] }>
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

  const sequences = (data?.sequences ?? []).filter((s) => !removedIds.has(s.sequence_id))

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
        <span className="text-sm text-muted-foreground">{sequences.length} pending</span>
      </div>

      {sequences.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <h2 className="text-xl font-semibold">All reviewed</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            No outreach sequences waiting for review.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sequences.map((sequence) => (
            <SequenceEditor
              key={sequence.sequence_id}
              sequence={sequence}
              leadName={undefined}
              onApproved={handleApproved}
              onRejected={handleRejected}
            />
          ))}
        </div>
      )}
    </div>
  )
}
