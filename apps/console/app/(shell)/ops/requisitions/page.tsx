'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import { Button } from '@brynzit/ui/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@brynzit/ui/components/ui/select'
import { Badge } from '@brynzit/ui/components/ui/badge'
import Link from 'next/link'
import { ChevronRight, Plus } from 'lucide-react'
import { CreateRequisitionWizard } from './_components/create-requisition-wizard'

export default function RequisitionsPage() {
  const [clientFilter, setClientFilter] = useState<string>(
    () =>
      typeof window === 'undefined'
        ? 'all'
        : (new URLSearchParams(window.location.search).get('client_id') ?? 'all'),
  )
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const { data: clientsData, isLoading: isLoadingClients } = useQuery({
    queryKey: ['ops-clients'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/ops/clients')
      if (error) throw error
      return data
    },
  })
  const clients = clientsData ?? []

  const fetchClientRequisitions = async (clientId: string) => {
    const { data, error } = await apiClient.GET('/api/v1/ops/clients/{client_id}/requisitions', {
      params: { path: { client_id: clientId } },
    })
    if (error) throw error
    return data ?? []
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['ops-requisitions', clientFilter, clients.map((client) => client.id).join(',')],
    enabled: Boolean(clientsData),
    queryFn: async () => {
      if (clientFilter !== 'all') {
        return fetchClientRequisitions(clientFilter)
      }

      const lists = await Promise.all(clients.map((client) => fetchClientRequisitions(client.id)))
      return lists
        .flat()
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    },
  })
  const requisitions = data ?? []

  if (isLoadingClients || isLoading) {
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
          Couldn&apos;t load requisitions. Check your connection or refresh the page.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-6 backdrop-blur">
        <h1 className="flex-1 text-xl font-semibold">Requisitions</h1>
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All clients</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="default" size="sm" onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-1 size-4" />
          New Requisition
        </Button>
      </div>

      <div className="flex flex-col gap-2 px-4 py-4">
        {requisitions.length === 0 ? (
          <div className="mt-16 flex flex-col items-center justify-center text-center">
            <h2 className="text-xl font-semibold">
              {clientFilter !== 'all' ? 'No requisitions for this client' : 'No requisitions'}
            </h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              {clientFilter !== 'all'
                ? 'Create one now to start matching candidates.'
                : 'Create your first requisition or select a client above to filter.'}
            </p>
            <Button
              variant="default"
              size="sm"
              className="mt-4"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="mr-1 size-4" />
              New Requisition
            </Button>
          </div>
        ) : (
          requisitions.map((req) => (
            <Link
              key={req.id}
              href={`/ops/requisitions/${req.id}`}
              className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <span className="flex-1 truncate text-sm font-semibold">{req.title}</span>
              <span className="max-w-[140px] truncate text-xs text-muted-foreground">
                {clients.find((client) => client.id === req.client_id)?.name ?? req.client_id ?? '—'}
              </span>
              <Badge variant="secondary" className="text-xs">
                {req.status}
              </Badge>
              <ChevronRight className="ml-auto size-4 text-muted-foreground" />
            </Link>
          ))
        )}
      </div>

      <CreateRequisitionWizard
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        clients={clients}
      />
    </div>
  )
}
