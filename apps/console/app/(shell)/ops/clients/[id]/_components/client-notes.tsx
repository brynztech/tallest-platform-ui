'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import { toast } from 'sonner'
import { Textarea } from '@brynzit/ui/components/ui/textarea'
import { Button } from '@brynzit/ui/components/ui/button'

interface ClientNotesProps {
  clientId: string
}

export function ClientNotes({ clientId }: ClientNotesProps) {
  const [noteText, setNoteText] = useState('')
  const queryClient = useQueryClient()

  const { data: notes } = useQuery({
    queryKey: ['client-notes', clientId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/ops/clients/{client_id}/notes', {
        params: { path: { client_id: clientId } },
      })
      if (error) throw error
      return data
    },
  })

  // Reverse-chronological sort
  const sortedNotes = [...(notes ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  const addNoteMutation = useMutation({
    mutationFn: async (text: string) => {
      const { data, error } = await apiClient.POST('/api/v1/ops/clients/{client_id}/notes', {
        params: { path: { client_id: clientId } },
        body: { text, channel: 'other' },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-notes', clientId] })
      setNoteText('')
    },
    onError: () => {
      toast.error('Failed to save note — try again.')
    },
  })

  return (
    <div className="flex h-full flex-col">
      <h2 className="mb-4 text-base font-semibold">Notes</h2>

      {/* Notes log */}
      <div className="mb-4 flex flex-1 flex-col gap-3 overflow-y-auto">
        {sortedNotes.length === 0 ? (
          <p className="text-muted-foreground text-sm italic">
            No notes yet. Paste Slack or WhatsApp logs here.
          </p>
        ) : (
          sortedNotes.map((note) => (
            <div key={note.id} className="bg-muted/30 rounded-lg px-4 py-3">
              <p className="text-muted-foreground mb-1 text-xs">
                {new Date(note.created_at).toLocaleString()}
              </p>
              <p className="text-sm whitespace-pre-wrap">{note.text}</p>
            </div>
          ))
        )}
      </div>

      {/* Note input — sticky at bottom */}
      <div className="border-border border-t pt-3">
        <Textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Paste notes, Slack threads, or WhatsApp logs…"
          className="min-h-[80px] resize-none"
        />
        <Button
          className="mt-2 ml-auto block"
          size="sm"
          disabled={noteText.trim().length === 0 || addNoteMutation.isPending}
          onClick={() => addNoteMutation.mutate(noteText)}
        >
          {addNoteMutation.isPending ? 'Saving…' : 'Add Note'}
        </Button>
      </div>
    </div>
  )
}
