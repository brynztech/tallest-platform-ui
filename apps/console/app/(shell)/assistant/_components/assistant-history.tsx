'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MessageSquare, Plus, Search } from 'lucide-react'
import { Button } from '@brynzit/ui/components/ui/button'
import { Input } from '@brynzit/ui/components/ui/input'
import { ScrollArea } from '@brynzit/ui/components/ui/scroll-area'
import { Skeleton } from '@brynzit/ui/components/ui/skeleton'
import { cn } from '@brynzit/ui/lib/utils'
import { formatHistoryTimestamp } from '../_lib/activity'
import { assistantQueryKeys, fetchConversations } from '../_lib/assistant-data'

/**
 * Past chats for the acting user. Scoped server-side by `acting_user_id`, so
 * switching persona shows that persona's own history and never another's —
 * the same scoping model as the rest of the recruiter module.
 *
 * One component, two homes: a swap-in list in the docked panel, and the
 * permanent left sidebar when expanded. Only `showNewChat` differs, because
 * the panel already has a new-chat button in its header.
 */
export function AssistantHistory({
  actingUserId,
  currentConversationId,
  onSelect,
  onNewChat,
  showNewChat = false,
}: {
  actingUserId: string
  currentConversationId: string | null
  onSelect: (conversationId: string) => void
  onNewChat?: () => void
  showNewChat?: boolean
}) {
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')

  // Search hits the database on every keystroke otherwise, and the query is an
  // unindexed ILIKE by design (see the endpoint's ponytail note).
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 250)
    return () => clearTimeout(timer)
  }, [search])

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: assistantQueryKeys.history(actingUserId, debounced),
    queryFn: () => fetchConversations(actingUserId, debounced),
    // Keeps the previous results on screen while a new search resolves, so the
    // list does not flash empty between keystrokes.
    placeholderData: (previous) => previous,
  })

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {showNewChat && onNewChat && (
        <Button variant="outline" size="sm" onClick={onNewChat} className="w-full justify-start">
          <Plus className="size-4" />
          New chat
        </Button>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search chats"
          aria-label="Search chats"
          className="h-8 pl-8 text-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2 pt-1">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      ) : conversations.length === 0 ? (
        <p className="px-1 py-8 text-center text-sm text-muted-foreground">
          {debounced.trim() ? 'No chats match that.' : 'No past chats yet.'}
        </p>
      ) : (
        // Radix's viewport wraps children in a display:table div, which lets
        // them size to content and quietly defeats `truncate` on long chat
        // titles. Force it back to a block.
        <ScrollArea className="min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]>div]:!block">
          <ul className="flex flex-col gap-0.5 pr-2">
            {conversations.map((conversation) => {
              const isCurrent = conversation.id === currentConversationId
              return (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(conversation.id)}
                    aria-current={isCurrent ? 'true' : undefined}
                    className={cn(
                      'flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left transition-colors',
                      isCurrent ? 'bg-primary/10' : 'hover:bg-muted/70',
                    )}
                  >
                    <MessageSquare
                      className={cn(
                        'mt-0.5 size-3.5 shrink-0',
                        isCurrent ? 'text-primary' : 'text-muted-foreground',
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block truncate text-sm',
                          isCurrent && 'font-medium text-primary',
                        )}
                      >
                        {conversation.preview ?? 'Untitled chat'}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {formatHistoryTimestamp(conversation.created_at)}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </ScrollArea>
      )}
    </div>
  )
}
