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
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-base font-semibold">Notes</h2>

      <div className="mt-3">
        <Textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Paste notes, Slack threads, or WhatsApp logs…"
          className="min-h-[80px] resize-none"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Notes are visible to every ops user on this client.
          </p>
          <Button
            size="sm"
            disabled={noteText.trim().length === 0 || addNoteMutation.isPending}
            onClick={() => addNoteMutation.mutate(noteText)}
          >
            {addNoteMutation.isPending ? 'Saving…' : 'Add note'}
          </Button>
        </div>
      </div>

      {/* Notes log */}
      <div className="mt-4 flex flex-col gap-2 border-t border-[#ECEAE4] pt-4">
        {sortedNotes.length === 0 ? (
          <p className="text-[15px] text-[#908E8B]">No notes yet.</p>
        ) : (
          sortedNotes.map((note) => (
            <div key={note.id} className="rounded-lg bg-[#F8F7F3] px-4 py-3">
              <p className="mb-1 text-xs text-muted-foreground">
                {new Date(note.created_at).toLocaleString()}
              </p>
              <p className="text-sm whitespace-pre-wrap">{note.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
