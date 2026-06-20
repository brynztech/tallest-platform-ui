'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Button } from '@brynzit/ui/components/ui/button'
import { cn } from '@brynzit/ui/lib/utils'
import { toast } from 'sonner'
import {
  REPLY_LEAD_STATUSES,
  getReplyTasksFromLead,
  type BDReplyTask,
} from './_lib/reply-tasks'

const CLASSIFICATION_LABELS: Record<BDReplyTask['classification'], string> = {
  interested: 'Interested',
  ooo: 'OOO',
  not_now: 'Not now',
  unsubscribe: 'Unsubscribe',
}

const SORT_PRIORITY: Record<string, number> = {
  interested: 0,
  ooo: 1,
  not_now: 2,
  unsubscribe: 3,
}

function classificationBadgeClass(classification: BDReplyTask['classification']): string {
  switch (classification) {
    case 'interested':
      return 'border border-primary/30 bg-primary/20 text-primary'
    case 'ooo':
    case 'not_now':
      return 'bg-muted text-muted-foreground'
    default:
      return ''
  }
}

interface ReplyCardProps {
  task: BDReplyTask
  onHandled: (id: string) => void
}

function ReplyCard({ task, onHandled }: ReplyCardProps) {
  function handleMarkHandled() {
    onHandled(task.id)
    toast(`${task.company_name} reply marked as handled.`)
  }

  function handleSnooze(months = 0, weeks = 0) {
    const d = new Date()
    if (months > 0) d.setMonth(d.getMonth() + months)
    if (weeks > 0) d.setDate(d.getDate() + weeks * 7)
    toast(`Snoozed until ${d.toLocaleDateString()}`)
    onHandled(task.id)
  }

  function handleUnsubscribe() {
    // Phase 2: UI action only — production would call POST /bd/leads/{id}/unsubscribe
    // T-02-17 mitigation: mock action with toast confirmation; no permanent side effects
    toast.error(`${task.contact_name} unsubscribed from all sequences.`)
    onHandled(task.id)
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            {/* T-02-15 mitigation: company_name and contact_name rendered as React text nodes — no innerHTML */}
            <span className="truncate text-sm font-semibold">{task.company_name}</span>
            <span className="text-xs text-muted-foreground">{task.contact_name}</span>
          </div>
          {task.classification === 'interested' && task.ai_briefing && (
            /* T-02-15 mitigation: ai_briefing is external email content — rendered as React text node, no dangerouslySetInnerHTML */
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{task.ai_briefing}</p>
          )}
        </div>
        <div className="shrink-0">
          {task.classification === 'unsubscribe' ? (
            <Badge variant="destructive" className="text-xs">
              {CLASSIFICATION_LABELS[task.classification]}
            </Badge>
          ) : (
            <Badge className={cn('text-xs', classificationBadgeClass(task.classification))}>
              {CLASSIFICATION_LABELS[task.classification]}
            </Badge>
          )}
        </div>
      </div>

      {/* Quick actions — vary by classification (BD-07) */}
      <div className="mt-3 flex items-center gap-2">
        {task.classification === 'interested' && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast('Briefing view not yet implemented.')}
            >
              View briefing
            </Button>
            <Button size="sm" onClick={handleMarkHandled}>
              Mark handled
            </Button>
          </>
        )}
        {task.classification === 'ooo' && (
          <Button size="sm" variant="outline" onClick={() => handleSnooze(0, 2)}>
            Snooze 2 weeks
          </Button>
        )}
        {task.classification === 'not_now' && (
          <Button size="sm" variant="outline" onClick={() => handleSnooze(1)}>
            Snooze 1 month
          </Button>
        )}
        {task.classification === 'unsubscribe' && (
          <Button size="sm" variant="destructive" onClick={handleUnsubscribe}>
            Unsubscribe
          </Button>
        )}
      </div>
    </div>
  )
}

export default function RepliesPage() {
  const [localHandledIds, setLocalHandledIds] = useState(new Set<string>())

  const { data, isLoading, error } = useQuery({
    queryKey: ['bd-tasks'],
    queryFn: async () => {
      const leadPages = await Promise.all(
        REPLY_LEAD_STATUSES.map(async (status) => {
          const { data, error } = await apiClient.GET('/api/v1/bd/leads', {
            params: { query: { status, limit: 50 } },
          })
          if (error) throw error
          return data.leads
        }),
      )
      const leads = leadPages.flat()
      const fatCards = await Promise.all(
        leads.map(async (lead) => {
          const { data, error } = await apiClient.GET('/api/v1/bd/leads/{lead_id}', {
            params: { path: { lead_id: lead.id } },
          })
          if (error) throw error
          return data
        }),
      )

      return { tasks: fatCards.flatMap(getReplyTasksFromLead) }
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
        <p className="text-sm text-destructive">Couldn&apos;t load reply tasks.</p>
      </div>
    )
  }

  const tasks = (data?.tasks ?? [])
    .filter((t) => !localHandledIds.has(t.id))
    .sort((a, b) => (SORT_PRIORITY[a.classification] ?? 9) - (SORT_PRIORITY[b.classification] ?? 9))

  const interestedCount = tasks.filter((t) => t.classification === 'interested').length

  function handleTaskDone(id: string) {
    setLocalHandledIds((prev) => new Set([...prev, id]))
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">Replies</h1>
        {interestedCount > 0 && (
          <Badge className="border border-primary/30 bg-primary/20 text-xs text-primary">
            {interestedCount} interested
          </Badge>
        )}
        <span className="ml-auto text-sm text-muted-foreground">{tasks.length} pending</span>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <h2 className="text-xl font-semibold">All clear</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            No reply tasks waiting for action.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tasks.map((task) => (
            <ReplyCard key={task.id} task={task} onHandled={handleTaskDone} />
          ))}
        </div>
      )}
    </div>
  )
}
