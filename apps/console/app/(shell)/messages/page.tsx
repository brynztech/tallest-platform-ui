'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@brynzit/ui/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@brynzit/ui/components/ui/card'
import {
  clientIdsKey,
  fetchClientNotes,
  fetchOpsClients,
  formatShortDate,
  recruiterQueryKeys,
  RECRUITER_STALE_TIME_MS,
} from '../_lib/recruiter-data'

export default function MessagesPage() {
  const clientsQuery = useQuery({
    queryKey: recruiterQueryKeys.clients,
    queryFn: fetchOpsClients,
    staleTime: RECRUITER_STALE_TIME_MS,
  })
  const clients = clientsQuery.data ?? []
  const notesQuery = useQuery({
    queryKey: recruiterQueryKeys.clientNotes(clientIdsKey(clients)),
    queryFn: () => fetchClientNotes(clients),
    enabled: clientsQuery.isSuccess,
    staleTime: RECRUITER_STALE_TIME_MS,
  })

  const notes = notesQuery.data ?? []
  const isLoading = clientsQuery.isLoading || notesQuery.isLoading
  const hasError = clientsQuery.error || notesQuery.error

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Loading client messages...</p>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">Couldn&apos;t load client notes.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em]">Client Messages</h1>
          <p className="text-sm text-muted-foreground">
            Aggregated from existing Ops client notes until a dedicated messaging API exists.
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/ops/clients">Open Clients</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Latest Client Notes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {notes.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No client notes found. Notes added in Ops client details will appear here.
            </p>
          ) : (
            notes.map((note) => (
              <article key={note.id} className="rounded-lg border bg-background p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold">{note.client.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {note.channel} · {formatShortDate(note.created_at)}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/ops/clients/${note.client.id}`}>Open Client</Link>
                  </Button>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                  {note.text}
                </p>
              </article>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
