'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { KanbanBoard } from './_components/kanban-board'
import type { KanbanLeadItem } from './_components/kanban-board'
import { LeadDetailSheet } from './_components/lead-detail-sheet'
import { QuickRejectDialog } from './_components/quick-reject-dialog'
import { toast } from 'sonner'

export default function PipelinePage() {
  const queryClient = useQueryClient()

  // Sheet state — which lead is open for detail view
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)

  // Quick-reject dialog state — triggered by the X button on a card
  const [rejectTarget, setRejectTarget] = useState<KanbanLeadItem | null>(null)

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

  const moveMutation = useMutation({
    mutationFn: (body: components['schemas']['BulkActionRequest']) =>
      apiClient.POST('/api/v1/bd/leads/bulk-action', { body }),
    onSuccess: (response) => {
      if (response.data?.failed) {
        toast.error('Move failed for this lead.')
      } else {
        toast.success('Lead moved.')
      }
      queryClient.invalidateQueries({ queryKey: ['pipeline'] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
    onError: () => {
      toast.error('Move failed — pipeline restored.')
      queryClient.invalidateQueries({ queryKey: ['pipeline'] })
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
        <KanbanBoard
          columns={data.columns}
          isMoving={moveMutation.isPending}
          onMoveLead={(leadId, action) => {
            moveMutation.mutate({ action, lead_ids: [leadId] })
          }}
          onCardClick={(lead) => setSelectedLeadId(lead.id)}
          onCardReject={(lead) => setRejectTarget(lead)}
        />
      )}

      {/* Full detail sheet — opened by clicking a card */}
      <LeadDetailSheet
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
        onRejectSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['pipeline'] })
          queryClient.invalidateQueries({ queryKey: ['leads'] })
        }}
      />

      {/* Quick-reject dialog — opened by the X button on a card hover */}
      <QuickRejectDialog
        lead={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['pipeline'] })
          queryClient.invalidateQueries({ queryKey: ['leads'] })
        }}
      />
    </div>
  )
}
