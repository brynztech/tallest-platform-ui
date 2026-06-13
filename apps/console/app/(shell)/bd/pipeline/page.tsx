'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import { KanbanBoard } from './_components/kanban-board'

export default function PipelinePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['pipeline'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/bd/pipeline')
      if (error) throw error
      return data
    },
    // Poll every 15 seconds for live pipeline counts (BD-06)
    refetchInterval: 15_000,
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
        <p className="text-sm text-destructive">Couldn&apos;t load pipeline data.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Pipeline</h1>
      </div>
      {data?.columns && (
        <KanbanBoard columns={data.columns} />
      )}
    </div>
  )
}
