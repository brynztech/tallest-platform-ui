'use client'

import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowUp, MessageCircle, Square } from 'lucide-react'
import { useActingUser, useCan } from '@brynzit/identity'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Button } from '@brynzit/ui/components/ui/button'
import { ScrollArea } from '@brynzit/ui/components/ui/scroll-area'
import { Textarea } from '@brynzit/ui/components/ui/textarea'
import { cn } from '@brynzit/ui/lib/utils'
import { activitySummary, buildTimeline, type TimelineItem } from '../_lib/activity'
import {
  assistantQueryKeys,
  cancelTurn,
  createConversation,
  fetchEvents,
  isTurnLive,
  postMessage,
} from '../_lib/assistant-data'
import { startersFor } from '../_lib/starters'
import { AssistantHistory } from './assistant-history'
import { AssistantMarkdown } from './assistant-markdown'

/** Fast enough that streamed tokens read as typing; only ever runs while a
 *  turn is live, and stops dead the moment it goes terminal. */
const LIVE_POLL_MS = 300

/**
 * The chat: hero/timeline + composer, and (when expanded) the history sidebar.
 *
 * The shell around it — docked panel vs expanded dialog — is
 * assistant-widget.tsx. This component only cares about `expanded` for layout.
 */
export function AssistantChat({
  expanded,
  showHistoryPanel,
  onHistoryHandled,
  conversationId,
  onConversationChange,
  draft,
  onDraftChange,
}: {
  expanded: boolean
  /** Panel mode only: the header's history button swaps the timeline for the list. */
  showHistoryPanel: boolean
  onHistoryHandled: () => void
  /**
   * Owned by the shell, not here. Toggling `modal` swaps Radix's modal and
   * non-modal Content — different component types, so this subtree really does
   * remount on expand. Anything that must survive that lives above it.
   * null = a new chat not yet created; the conversation is minted on the first
   * send, so browsing never litters the history list.
   */
  conversationId: string | null
  onConversationChange: (id: string | null) => void
  draft: string
  onDraftChange: (value: string) => void
}) {
  const actingUser = useActingUser()
  const can = useCan()
  const viewAll = can('role.view_all')
  const queryClient = useQueryClient()

  const [pendingEcho, setPendingEcho] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Switching conversation (history pick, new chat) drops the optimistic echo
  // belonging to the previous one.
  useEffect(() => {
    setPendingEcho(null)
  }, [conversationId])

  const eventsQuery = useQuery({
    queryKey: assistantQueryKeys.events(actingUser.id, conversationId ?? 'new'),
    queryFn: () => fetchEvents(conversationId as string),
    enabled: conversationId !== null,
    refetchInterval: (query) => (isTurnLive(query.state.data?.turn_status) ? LIVE_POLL_MS : false),
  })

  const events = conversationId === null ? [] : (eventsQuery.data?.events ?? [])
  const turnStatus = conversationId === null ? null : (eventsQuery.data?.turn_status ?? null)
  const partial = eventsQuery.data?.partial ?? null
  const isLive = isTurnLive(turnStatus)
  const latestTurnId = events.at(-1)?.turn_id ?? null
  const timeline = buildTimeline(events)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [timeline.length, partial, pendingEcho])

  const sendMutation = useMutation({
    mutationFn: async (body: string) => {
      const id = conversationId ?? (await createConversation(actingUser.id, viewAll)).id
      onConversationChange(id)
      await postMessage(id, body)
      return id
    },
    onSuccess: async (id) => {
      setPendingEcho(null)
      await queryClient.invalidateQueries({ queryKey: assistantQueryKeys.events(actingUser.id, id) })
      // A brand-new chat only becomes a history row once it has a message.
      await queryClient.invalidateQueries({ queryKey: ['assistant', 'history', actingUser.id] })
    },
    onError: () => setPendingEcho(null),
  })

  const stopMutation = useMutation({
    mutationFn: () => cancelTurn(conversationId as string, latestTurnId as string),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: assistantQueryKeys.events(actingUser.id, conversationId as string),
      }),
  })

  const busy = isLive || sendMutation.isPending

  function send(body: string) {
    const text = body.trim()
    if (!text || busy) return
    onHistoryHandled()
    setPendingEcho(text)
    onDraftChange('')
    sendMutation.mutate(text)
  }

  function startNewChat() {
    onConversationChange(null)
    onDraftChange('')
  }

  function selectConversation(id: string) {
    onConversationChange(id)
    onHistoryHandled()
  }

  const isEmpty = timeline.length === 0 && pendingEcho === null
  const showPanelHistory = showHistoryPanel && !expanded

  return (
    <div className={cn('flex min-h-0 flex-1', expanded ? 'gap-0' : 'flex-col')}>
      {expanded && (
        <aside className="flex w-64 shrink-0 flex-col gap-2 border-r border-border/70 p-3">
          <AssistantHistory
            actingUserId={actingUser.id}
            currentConversationId={conversationId}
            onSelect={selectConversation}
            onNewChat={startNewChat}
            showNewChat
          />
        </aside>
      )}

      <div className="flex min-h-0 flex-1 flex-col">
        {expanded && (
          <div className="flex items-center justify-between border-b border-border/70 px-4 py-2.5">
            <span className="text-sm font-medium">
              {isEmpty ? 'New chat' : 'Chat'}
            </span>
            <ScopeBadge viewAll={viewAll} />
          </div>
        )}

        {showPanelHistory ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3">
            <AssistantHistory
              actingUserId={actingUser.id}
              currentConversationId={conversationId}
              onSelect={selectConversation}
            />
          </div>
        ) : (
          <ScrollArea className="min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]>div]:!block">
            <div
              className={cn(
                'flex flex-col gap-3 px-4 py-4',
                expanded && 'mx-auto w-full max-w-3xl',
                isEmpty && 'h-full justify-center',
              )}
            >
              {isEmpty ? (
                <Hero viewAll={viewAll} expanded={expanded} />
              ) : (
                timeline.map((item) => <TimelineRow key={item.id} item={item} />)
              )}
              {pendingEcho !== null && (
                <Bubble align="right" preserveWhitespace>
                  {pendingEcho}
                </Bubble>
              )}
              {isLive && partial ? (
                <Bubble align="left">
                  <AssistantMarkdown body={partial} />
                </Bubble>
              ) : (
                busy && <Thinking />
              )}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>
        )}

        {!showPanelHistory && (
          <div className={cn('px-4 pb-4', expanded && 'mx-auto w-full max-w-3xl')}>
            <Composer
              draft={draft}
              onDraftChange={onDraftChange}
              onSend={() => send(draft)}
              onStop={() => stopMutation.mutate()}
              isLive={isLive}
              busy={busy}
              canStop={Boolean(latestTurnId)}
              expanded={expanded}
            />
            {isEmpty && <Starters expanded={expanded} onPick={send} disabled={busy} />}
          </div>
        )}
      </div>
    </div>
  )
}

function ScopeBadge({ viewAll }: { viewAll: boolean }) {
  // Spec §7: the surface must state whose scope the conversation uses.
  return <Badge variant="outline">{viewAll ? 'All roles' : 'Your assigned roles'}</Badge>
}

function Hero({ viewAll, expanded }: { viewAll: boolean; expanded: boolean }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 text-center',
        expanded ? 'py-16' : 'py-10',
      )}
    >
      <div className="mb-1 flex size-11 items-center justify-center rounded-xl bg-primary/10">
        <MessageCircle className="size-5 text-primary" />
      </div>
      <h2 className="text-base font-semibold">How can BrynzIT help?</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Ask about your roles, pipeline and candidates. Read-only — it can&apos;t make changes for
        you.
      </p>
      {!expanded && (
        <div className="pt-1">
          <ScopeBadge viewAll={viewAll} />
        </div>
      )}
    </div>
  )
}

function Starters({
  expanded,
  onPick,
  disabled,
}: {
  expanded: boolean
  onPick: (prompt: string) => void
  disabled: boolean
}) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {startersFor(expanded).map((starter) => (
        <button
          key={starter.title}
          type="button"
          disabled={disabled}
          onClick={() => onPick(starter.prompt)}
          className="rounded-xl border border-border/70 bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/60 disabled:opacity-50"
        >
          <span className="block truncate text-sm font-medium">{starter.title}</span>
        </button>
      ))}
    </div>
  )
}

function Composer({
  draft,
  onDraftChange,
  onSend,
  onStop,
  isLive,
  busy,
  canStop,
  expanded,
}: {
  draft: string
  onDraftChange: (value: string) => void
  onSend: () => void
  onStop: () => void
  isLive: boolean
  busy: boolean
  canStop: boolean
  expanded: boolean
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-2 shadow-sm focus-within:border-primary/40">
      <Textarea
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            onSend()
          }
        }}
        placeholder="Ask about your roles, pipeline, or workload…"
        disabled={busy}
        rows={1}
        className="min-h-9 resize-none border-0 bg-transparent px-2 py-1.5 shadow-none focus-visible:ring-0"
      />
      <div className="flex items-center justify-end gap-2 px-1 pt-1">
        {expanded && (
          <span className="mr-auto text-xs text-muted-foreground">
            Enter to send · Shift+Enter for a new line
          </span>
        )}
        {isLive ? (
          <Button variant="outline" size="sm" onClick={onStop} disabled={!canStop}>
            <Square className="size-3.5" />
            Stop
          </Button>
        ) : (
          <Button
            size="icon-sm"
            onClick={onSend}
            disabled={!draft.trim() || busy}
            aria-label="Send"
            className="rounded-full"
          >
            <ArrowUp className="size-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

function TimelineRow({ item }: { item: TimelineItem }) {
  if (item.kind === 'user')
    return (
      <Bubble align="right" preserveWhitespace>
        {item.body}
      </Bubble>
    )
  if (item.kind === 'assistant') {
    return (
      <Bubble align="left">
        <AssistantMarkdown body={item.body} />
      </Bubble>
    )
  }
  if (item.kind === 'error') {
    return <p className="px-2 text-xs text-destructive">{item.message}</p>
  }
  return <Activity labels={item.labels} />
}

/**
 * Native `<details>` rather than a Collapsible primitive: this repo has none,
 * and the spec calls for the same "native element over a new dependency"
 * precedent the console already set with `title` over a Tooltip lib.
 */
function Activity({ labels }: { labels: string[] }) {
  return (
    <details className="group px-2">
      <summary className="cursor-pointer list-none text-xs text-muted-foreground marker:content-none hover:text-foreground">
        <span className="underline decoration-dotted underline-offset-2">
          {activitySummary(labels)}
        </span>
        {labels.length > 1 && <span className="ml-1 text-[10px]">(details)</span>}
      </summary>
      <ul className="mt-1 space-y-0.5 border-l border-border/70 pl-3">
        {labels.map((label, index) => (
          <li key={index} className="text-xs text-muted-foreground">
            {label}
          </li>
        ))}
      </ul>
    </details>
  )
}

function Thinking() {
  return (
    <p className="px-2 text-xs italic text-muted-foreground" role="status">
      Thinking…
    </p>
  )
}

function Bubble({
  children,
  align,
  preserveWhitespace = false,
}: {
  children: React.ReactNode
  align: 'left' | 'right'
  // Plain-text bodies keep their line breaks; markdown bodies must not, or
  // every rendered block picks up the source newlines on top of its own margins.
  preserveWhitespace?: boolean
}) {
  return (
    <div className={cn('flex', align === 'right' ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
          preserveWhitespace && 'whitespace-pre-wrap',
          align === 'right' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
        )}
      >
        {children}
      </div>
    </div>
  )
}
