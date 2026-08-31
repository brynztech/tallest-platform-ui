'use client'

import { useEffect, useState } from 'react'
import { History, Maximize2, MessageCircle, Minimize2, SquarePen, X } from 'lucide-react'
import { useActingUser, useCan } from '@brynzit/identity'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@brynzit/ui/components/ui/dialog'
import { cn } from '@brynzit/ui/lib/utils'
import { AssistantChat } from './assistant-chat'

/**
 * The assistant's shell: a floating button that opens a docked panel, which
 * can expand to a full working view.
 *
 * Gated by `assistant.view` inline rather than in
 * ../../_lib/route-capabilities.ts — that file governs routes, and this has no
 * route of its own.
 *
 * One Dialog, two geometries. Note that toggling `modal` makes Radix swap its
 * modal and non-modal Content — different component types, so the chat subtree
 * genuinely remounts on expand. The conversation id and the draft therefore
 * live HERE, above that boundary, so expanding mid-conversation keeps your
 * chat instead of silently starting a new one.
 *
 * `modal` tracks `expanded`, and that single flag carries the whole behavioural
 * difference. Docked, it is false: no backdrop, no focus trap, the console
 * stays interactive — you want to read a requisition while asking about it.
 * Expanded, it is true: Radix supplies the backdrop and focus trap, which is
 * right when the assistant genuinely is the foreground.
 *
 * (Radix renders Dialog.Overlay only while modal — so this flag is the only
 * lever needed; a separate "show a backdrop" prop would be dead code.)
 */
export function AssistantWidget() {
  const actingUser = useActingUser()
  const can = useCan()
  const viewAll = can('role.view_all')
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  // A persona switch starts a fresh chat and shows that persona's own history:
  // a conversation's scope is captured once at creation and never widened (§3).
  useEffect(() => {
    setConversationId(null)
    setDraft('')
    setShowHistory(false)
  }, [actingUser.id, viewAll])

  if (!can('assistant.view')) return null

  function close() {
    setOpen(false)
    setShowHistory(false)
  }

  function startNewChat() {
    setConversationId(null)
    setDraft('')
    setShowHistory(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
        aria-expanded={open}
        className="fixed bottom-6 right-6 z-50 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform duration-150 ease-out hover:scale-105"
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) close()
        }}
        modal={expanded}
      >
        <DialogContent
          showCloseButton={false}
          className={cn(
            'flex flex-col gap-0 overflow-hidden p-0',
            expanded
              ? 'h-[85vh] w-[calc(100%-3rem)] max-w-6xl sm:max-w-6xl'
              : // Docked bottom-right, clearing the floating button beneath it.
                'top-auto bottom-24 left-auto right-6 h-[min(640px,calc(100vh-9rem))] w-[400px] max-w-[calc(100vw-3rem)] translate-x-0 translate-y-0 sm:max-w-[400px]',
          )}
        >
          <header className="flex shrink-0 items-center gap-2 border-b border-border/70 px-3 py-2.5">
            <MessageCircle className="size-4 shrink-0 text-primary" />
            <DialogTitle className="min-w-0 flex-1 truncate text-sm font-semibold">
              BrynzIT Assistant
            </DialogTitle>
            {/* Radix needs an accessible description; the visible version of
                this lives in the hero, so it must not be shown twice. */}
            <DialogDescription className="sr-only">
              Ask about your requisitions, pipeline and workload. Read-only — it can&apos;t make
              changes for you.
            </DialogDescription>

            {/* Expanded keeps both of these in the sidebar, where the list is
                always visible — repeating them up here is just noise. */}
            {!expanded && (
              <>
                <HeaderButton label="New chat" onClick={startNewChat}>
                  <SquarePen className="size-4" />
                </HeaderButton>
                <HeaderButton
                  label="History"
                  pressed={showHistory}
                  onClick={() => setShowHistory((shown) => !shown)}
                >
                  <History className="size-4" />
                </HeaderButton>
              </>
            )}
            <HeaderButton
              label={expanded ? 'Collapse' : 'Expand'}
              onClick={() => {
                setExpanded((wide) => !wide)
                setShowHistory(false)
              }}
            >
              {expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </HeaderButton>
            <HeaderButton label="Close assistant" onClick={close}>
              <X className="size-4" />
            </HeaderButton>
          </header>

          <AssistantChat
            expanded={expanded}
            showHistoryPanel={showHistory}
            onHistoryHandled={() => setShowHistory(false)}
            conversationId={conversationId}
            onConversationChange={setConversationId}
            draft={draft}
            onDraftChange={setDraft}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

function HeaderButton({
  label,
  onClick,
  pressed,
  children,
}: {
  label: string
  onClick: () => void
  pressed?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
        pressed && 'bg-muted text-foreground',
      )}
    >
      {children}
    </button>
  )
}
