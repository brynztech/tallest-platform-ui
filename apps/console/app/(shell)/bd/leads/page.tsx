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
import { getFocusedIndexForLead } from './_lib/focus-index'
import {
  LEAD_STATUS_TABS,
  canReviewLead,
  filterLeadsForStatusTab,
  getQueryStatusForTab,
  parseLeadStatusTab,
  type LeadStatusTab,
} from './_lib/lead-status'

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
  const [activeTab, setActiveTab] = useState<LeadStatusTab>(() =>
    typeof window === 'undefined'
      ? 'review_queue'
      : parseLeadStatusTab(new URLSearchParams(window.location.search).get('status')),
  )
  const queryStatus = getQueryStatusForTab(activeTab)
  const leadListQueryKey = ['leads', queryStatus] as const
  const activeTabConfig = LEAD_STATUS_TABS.find((tab) => tab.id === activeTab) ?? LEAD_STATUS_TABS[0]

  // ---- Infinite query (cursor pagination) ----
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useInfiniteQuery({
    queryKey: leadListQueryKey,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await apiClient.GET('/api/v1/bd/leads', {
        params: {
          query: {
            status: queryStatus,
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

  const fetchedLeads: LeadQueueItem[] = data?.pages.flatMap((page) => page.leads) ?? []
  const leads = filterLeadsForStatusTab(fetchedLeads, activeTab)
  const totalCount = data?.pages[0]?.total ?? 0
  const shownCount = leads.length

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
      const previousData =
        queryClient.getQueryData<InfiniteData<LeadQueueResponse>>(leadListQueryKey)
      queryClient.setQueryData(leadListQueryKey, (old: InfiniteData<LeadQueueResponse> | undefined) => {
        if (!old) return old
        const removedCount = old.pages.reduce(
          (count, page) =>
            count + page.leads.filter((lead) => payload.lead_ids.includes(lead.id)).length,
          0,
        )
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            leads: page.leads.filter((l) => !payload.lead_ids.includes(l.id)),
            total: Math.max(0, page.total - removedCount),
          })),
        }
      })
      return { previousData }
    },
    onError: (_err, payload, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(leadListQueryKey, context.previousData)
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
      queryClient.invalidateQueries({ queryKey: ['pipeline'] })
    },
  })

  function handleAction(
    leadId: string,
    action: 'approve' | 'reject' | 'snooze' | 'move_to_review',
    extra?: { reason?: string; dueAt?: string },
  ) {
    // Optimistic exit animation
    setLeavingIds((prev) => new Set([...prev, leadId]))

    const lead = leads.find((l) => l.id === leadId)
    const companyName = lead?.company_name ?? 'Lead'

    let toastMessage = ''
    if (action === 'approve') {
      toastMessage = `Approved — ${companyName}`
    } else if (action === 'move_to_review') {
      toastMessage = `Moved to review — ${companyName}`
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

  function handleTabChange(tab: LeadStatusTab) {
    setActiveTab(tab)
    setSelectedIds(new Set())
    setFocusedIndex(0)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('status', tab)
      window.history.pushState({}, '', url)
    }
  }

  // ---- Keyboard shortcuts (CUX-03) ----
  const visibleLeads = leads.filter((l) => !leavingIds.has(l.id))

  function openLeadDetail(leadId: string) {
    setFocusedIndex((currentIndex) => getFocusedIndexForLead(visibleLeads, leadId, currentIndex))
    setDetailLeadId(leadId)
    setIsDetailOpen(true)
  }

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
          if (lead && canReviewLead(lead)) handleAction(lead.id, 'approve')
          break
        }
        case 'r': {
          e.preventDefault()
          if (!canReviewLead(visibleLeads[focusedIndex] ?? {})) break
          // Trigger reject popover on focused card via data attribute
          const cardEl = document.querySelector(
            `[data-lead-id="${visibleLeads[focusedIndex]?.id}"] [data-reject-trigger]`,
          )
          if (cardEl instanceof HTMLElement) cardEl.click()
          break
        }
        case 's': {
          e.preventDefault()
          if (!canReviewLead(visibleLeads[focusedIndex] ?? {})) break
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
          if (lead) openLeadDetail(lead.id)
          break
        }
        case ' ': {
          e.preventDefault()
          const lead = visibleLeads[focusedIndex]
          if (lead && canReviewLead(lead)) {
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
    <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_28%_0%,oklch(0.9_0.035_261_/_0.45),transparent_36%)]">
      {/* Sticky toolbar */}
      <div className="sticky top-0 z-10 flex min-h-16 items-center gap-4 border-b border-border/70 bg-white/85 px-6 py-3 shadow-sm shadow-slate-200/60 backdrop-blur-xl">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-[-0.045em]">Lead Queue</h1>
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              {activeTab === 'processing' ? `${shownCount} shown` : `${totalCount} leads`}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {activeTabConfig.description}
          </p>
        </div>
        {selectedIds.size > 0 && (
          <div className="ml-auto">
            <BulkToolbar
              selectedIds={[...selectedIds]}
              mode={activeTab === 'suppressed' ? 'suppressed' : 'review'}
              onClearSelection={() => setSelectedIds(new Set())}
              onBulkStart={handleBulkStart}
              onBulkSettled={handleBulkSettled}
            />
          </div>
        )}
      </div>

      {/* Lead cards */}
      <div className="flex w-full max-w-[920px] flex-col gap-2.5 px-5 py-5">
        <div className="mb-2 flex flex-wrap gap-2">
          {LEAD_STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={[
                'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-[background-color,border-color,color,box-shadow]',
                activeTab === tab.id
                  ? 'border-primary/55 bg-primary/15 text-foreground shadow-sm shadow-primary/10'
                  : 'border-border/70 bg-card/50 text-muted-foreground hover:border-primary/30 hover:text-foreground',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {visibleLeads.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-border/60 bg-card/55 py-24 text-center shadow-sm shadow-black/10">
            <h2 className="text-xl font-semibold tracking-[-0.03em]">
              {activeTab === 'review_queue' ? 'Review queue is clear' : `No ${activeTabConfig.label.toLowerCase()}`}
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              {activeTab === 'review_queue'
                ? 'Qualified leads appear here after ICP scoring. Suppressed or processing leads are visible in the other tabs.'
                : 'Try All Leads to inspect every backend status returned by the API.'}
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
                openLeadDetail(id)
              }}
              onApprove={(id) => handleAction(id, 'approve')}
              onMoveToReview={(id) => handleAction(id, 'move_to_review')}
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
