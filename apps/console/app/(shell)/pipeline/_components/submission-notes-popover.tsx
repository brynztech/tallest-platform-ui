'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@brynzit/ui/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@brynzit/ui/components/ui/popover'
import { Textarea } from '@brynzit/ui/components/ui/textarea'
import { MessageSquare } from 'lucide-react'
import {
  addSubmissionNote,
  fetchSubmissionNotes,
} from '../_lib/pipeline-actions'

// Mirrors ops/clients/[id]/_components/client-notes.tsx's list/input shape
// and styling exactly (professional-UI precedent for this app), adapted into
// a Popover (consistent with this app's other card-level popovers, e.g.
// bd/leads/_components/snooze-popover.tsx) instead of a full-height panel.
export function SubmissionNotesPopover({
  submissionId,
  readOnly = false,
}: {
  submissionId: string
  /** Hides the composer — notes stay readable for users without
   * `pipeline.advance` (recruiters follow the conversation on their
   * candidates; the Account Manager writes it). */
  readOnly?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const queryClient = useQueryClient()
  const notesQueryKey = ['submission-notes', submissionId] as const

  const notesQuery = useQuery({
    queryKey: notesQueryKey,
    queryFn: () => fetchSubmissionNotes(submissionId),
    enabled: open,
  })

  // API returns oldest-first; re-sort newest-first for display, same as
  // client-notes.tsx's "Reverse-chronological sort".
  const sortedNotes = [...(notesQuery.data ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  const addNoteMutation = useMutation({
    mutationFn: () => addSubmissionNote(submissionId, noteText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesQueryKey })
      setNoteText('')
    },
    onError: () => toast.error('Failed to save note — try again.'),
  })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="icon-sm" variant="ghost" aria-label="Notes">
          <MessageSquare className="size-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" sideOffset={4} className="w-80 rounded-xl p-4">
        <h4 className="mb-3 text-sm font-semibold text-foreground">Notes</h4>

        <div className="mb-3 flex max-h-60 flex-col gap-3 overflow-y-auto">
          {notesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading notes…</p>
          ) : notesQuery.isError ? (
            <p className="text-sm text-[#BA4642]">Couldn&apos;t load notes.</p>
          ) : sortedNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes yet.</p>
          ) : (
            sortedNotes.map((note) => (
              <div key={note.id} className="rounded-lg bg-muted px-3 py-2">
                <p className="mb-1 text-xs text-muted-foreground">
                  {new Date(note.created_at).toLocaleString()}
                  {note.author ? ` · ${note.author}` : ''}
                </p>
                <p className="text-sm whitespace-pre-wrap text-foreground">{note.text}</p>
              </div>
            ))
          )}
        </div>

        {!readOnly && (
          <div className="border-t border-border pt-3">
            <Textarea
              value={noteText}
              onChange={(event) => setNoteText(event.target.value)}
              placeholder="Add a note…"
              className="min-h-[70px] resize-none rounded-lg text-sm"
            />
            <Button
              className="mt-2 ml-auto block"
              size="sm"
              disabled={noteText.trim().length === 0 || addNoteMutation.isPending}
              onClick={() => addNoteMutation.mutate()}
            >
              {addNoteMutation.isPending ? 'Saving…' : 'Add Note'}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
