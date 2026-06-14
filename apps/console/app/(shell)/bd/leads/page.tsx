'use client'

import { useEffect, useRef, useState } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components, LeadQueueItemExtended } from '@brynzit/api-client'
import { toast } from 'sonner'
import { LeadCard } from './_components/lead-card'
import { LeadDetailPanel } from './_components/lead-detail-panel'
import { BulkToolbar } from './_components/bulk-toolbar'
import { ShortcutOverlay } from './_components/shortcut-overlay'

type LeadQueueResponse = components['schemas']['LeadQueueResponse']
type LeadQueueItem = LeadQueueItemExtended

const REASON_LABELS: Record<string, string> = {
  NOT_ICP_FIT: 'Not a fit',
  WRONG_SENIORITY: 'Wrong seniority',
  NO_OPEN_ROLES: 'No open roles',
  COMPETITOR: 'Competitor',
  BAD_TIMING: 'Bad timing',
  ALREADY_A_CLIENT: 'Already a client',
  OTHER: 'Other',
}

export default function LeadsPage() {
  const queryClient = useQueryClient()

  // ---- Infinite query (cursor pagination) ----
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useInfiniteQuery({
    queryKey: ['leads'],
    queryFn: async ({ pageParam }) => {
      const { data, error } = await apiClient.GET('/api/v1/bd/leads', {
        params: {
          query: {
            status: 'review_queue',
            cursor: pageParam ?? undefined,
            limit: 50,
          },
        },
      })
      if (error) throw error
      return data
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
  })

  const leads: LeadQueueItem[] = data?.pages.flatMap((page) => page.leads) ?? []
  const totalCount = data?.pages[0]?.total ?? 0

  // ---- UI state ----
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [leavingIds, setLeavingIds] = useState<Set<string>>(new Set())
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const [focusedIndex, setFocusedIndex] = useState<number>(0)
  const [detailLeadId, setDetailLeadId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isShortcutOpen, setIsShortcutOpen] = useState(false)
  const [anyPopoverOpen, setAnyPopoverOpen] = useState(false)

  // Undo timers: leadId -> timeoutRef
  const undoTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // ---- Single-lead mutation (approve/reject/snooze) ----
  const actionMutation = useMutation({
    mutationFn: (payload: components['schemas']['BulkActionRequest']) =>
      apiClient.POST('/api/v1/bd/leads/bulk-action', { body: payload }),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['leads'] })
      const previousData = queryClient.getQueryData(['leads'])
      queryClient.setQueryData(['leads'], (old: InfiniteData<LeadQueueResponse> | undefined) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            leads: page.leads.filter((l) => !payload.lead_ids.includes(l.id)),
          })),
        }
      })
      return { previousData }
    },
    onError: (_err, payload, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['leads'], context.previousData)
      }
      // Remove from leavingIds to restore card visually
      setLeavingIds((prev) => {
        const next = new Set(prev)
        payload.lead_ids.forEach((id) => next.delete(id))
        return next
      })
      toast.error('Action failed — lead restored.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })

  function handleAction(
    leadId: string,
    action: 'approve' | 'reject' | 'snooze',
    extra?: { reason?: string; dueAt?: string },
  ) {
    // Optimistic exit animation
    setLeavingIds((prev) => new Set([...prev, leadId]))

    const lead = leads.find((l) => l.id === leadId)
    const companyName = lead?.company_name ?? 'Lead'

    let toastMessage = ''
    if (action === 'approve') {
      toastMessage = `Approved — ${companyName}`
    } else if (action === 'reject') {
      toastMessage = `Rejected — ${extra?.reason ? (REASON_LABELS[extra.reason] ?? extra.reason) : 'reason'}`
    } else {
      toastMessage = extra?.dueAt
        ? `Snoozed until ${new Date(extra.dueAt).toLocaleDateString()}`
        : 'Snoozed'
    }

    const toastId = toast(toastMessage, {
      action: {
        label: 'Undo',
        onClick: () => {
          const timer = undoTimers.current.get(leadId)
          if (timer) {
            clearTimeout(timer)
            undoTimers.current.delete(leadId)
          }
          // Restore card by removing from leavingIds
          setLeavingIds((prev) => {
            const next = new Set(prev)
            next.delete(leadId)
            return next
          })
          // Restore from server
          queryClient.invalidateQueries({ queryKey: ['leads'] })
          toast.dismiss(toastId)
        },
      },
      duration: 5000,
    })

    // Fire API after 300ms to allow undo before network (D-06)
    const timer = setTimeout(() => {
      undoTimers.current.delete(leadId)
      const payload: components['schemas']['BulkActionRequest'] = {
        action,
        lead_ids: [leadId],
        ...(action === 'reject' && extra?.reason ? { rejection_reason: extra.reason } : {}),
        ...(action === 'snooze' && extra?.dueAt ? { due_at: extra.dueAt } : {}),
      }
      actionMutation.mutate(payload)
    }, 300)
    undoTimers.current.set(leadId, timer)
  }

  // ---- Bulk actions ----
  function handleBulkStart(ids: string[]) {
    setProcessingIds(new Set(ids))
  }

  function handleBulkSettled() {
    setProcessingIds(new Set())
    setSelectedIds(new Set())
  }

  // ---- Keyboard shortcuts (CUX-03) ----
  const visibleLeads = leads.filter((l) => !leavingIds.has(l.id))

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const activeEl = document.activeElement
      const isInputFocused =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        (activeEl as HTMLElement)?.isContentEditable
      // Guard: disable shortcuts when overlays are open (CUX-03)
      if (isInputFocused || isDetailOpen || isShortcutOpen || anyPopoverOpen) return

      switch (e.key) {
        case 'j': {
          e.preventDefault()
          // Guard empty list: length-1 would be -1 when the queue is clear,
          // causing Math.min(1, -1) = -1 and silently breaking all action keys.
          if (visibleLeads.length > 0)
            setFocusedIndex((i) => Math.min(i + 1, visibleLeads.length - 1))
          break
        }
        case 'k': {
          e.preventDefault()
          if (visibleLeads.length > 0)
            setFocusedIndex((i) => Math.max(i - 1, 0))
          break
        }
        case 'a': {
          e.preventDefault()
          const lead = visibleLeads[focusedIndex]
          if (lead) handleAction(lead.id, 'approve')
          break
        }
        case 'r': {
          e.preventDefault()
          // Trigger reject popover on focused card via data attribute
          const cardEl = document.querySelector(
            `[data-lead-id="${visibleLeads[focusedIndex]?.id}"] [data-reject-trigger]`,
          )
          if (cardEl instanceof HTMLElement) cardEl.click()
          break
        }
        case 's': {
          e.preventDefault()
          const snoozeEl = document.querySelector(
            `[data-lead-id="${visibleLeads[focusedIndex]?.id}"] [data-snooze-trigger]`,
          )
          if (snoozeEl instanceof HTMLElement) snoozeEl.click()
          break
        }
        case '?': {
          e.preventDefault()
          setIsShortcutOpen(true)
          break
        }
        case 'Enter': {
          e.preventDefault()
          const lead = visibleLeads[focusedIndex]
          if (lead) {
            setDetailLeadId(lead.id)
            setIsDetailOpen(true)
          }
          break
        }
        case ' ': {
          e.preventDefault()
          const lead = visibleLeads[focusedIndex]
          if (lead) {
            setSelectedIds((prev) => {
              const next = new Set(prev)
              next.has(lead.id) ? next.delete(lead.id) : next.add(lead.id)
              return next
            })
          }
          break
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDetailOpen, isShortcutOpen, anyPopoverOpen, focusedIndex, visibleLeads])

  // Clamp focusedIndex when visibleLeads shrinks (e.g. after approve/reject removes a card)
  // so the focused card doesn't silently point past the end of the list.
  useEffect(() => {
    if (visibleLeads.length > 0)
      setFocusedIndex((i) => Math.min(i, visibleLeads.length - 1))
  }, [visibleLeads.length])

  // ---- Intersection observer for load-more ----
  const loadMoreRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = loadMoreRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // ---- Render ----
  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-destructive text-sm">
          Couldn&apos;t load leads. Check your connection or refresh the page.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Sticky toolbar */}
      <div className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-background/90 px-6 backdrop-blur">
        <h1 className="text-xl font-semibold">Lead Queue</h1>
        <span className="text-sm text-muted-foreground">{totalCount} leads</span>
        {selectedIds.size > 0 && (
          <div className="ml-auto">
            <BulkToolbar
              selectedIds={[...selectedIds]}
              onClearSelection={() => setSelectedIds(new Set())}
              onBulkStart={handleBulkStart}
              onBulkSettled={handleBulkSettled}
            />
          </div>
        )}
      </div>

      {/* Lead cards */}
      <div className="flex flex-col gap-2 px-4 py-4">
        {visibleLeads.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <h2 className="text-xl font-semibold">Queue is clear</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              No leads waiting for review. New leads appear here when the ICP scoring agent processes
              them.
            </p>
          </div>
        ) : (
          visibleLeads.map((lead, idx) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              isSelected={selectedIds.has(lead.id)}
              isLeaving={leavingIds.has(lead.id)}
              isProcessing={processingIds.has(lead.id)}
              isFocused={idx === focusedIndex}
              onSelect={(id, checked) => {
                setSelectedIds((prev) => {
                  const next = new Set(prev)
                  checked ? next.add(id) : next.delete(id)
                  return next
                })
              }}
              onOpenDetail={(id) => {
                setDetailLeadId(id)
                setIsDetailOpen(true)
              }}
              onApprove={(id) => handleAction(id, 'approve')}
              onReject={(id, reason) => handleAction(id, 'reject', { reason })}
              onSnooze={(id, dueAt) => handleAction(id, 'snooze', { dueAt })}
              onPopoverOpenChange={setAnyPopoverOpen}
            />
          ))
        )}

        {/* Intersection observer anchor for infinite scroll */}
        <div ref={loadMoreRef} className="h-4" />
        {isFetchingNextPage && (
          <p className="py-2 text-center text-sm text-muted-foreground">Loading more…</p>
        )}
      </div>

      {/* Slide-over detail panel */}
      <LeadDetailPanel
        leadId={detailLeadId}
        isOpen={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onApprove={(id) => handleAction(id, 'approve')}
        onReject={(id, reason) => handleAction(id, 'reject', { reason })}
        onSnooze={(id, dueAt) => handleAction(id, 'snooze', { dueAt })}
      />

      {/* Shortcut overlay */}
      <ShortcutOverlay open={isShortcutOpen} onOpenChange={setIsShortcutOpen} />
    </div>
  )
}
