'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Button } from '@brynzit/ui/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@brynzit/ui/components/ui/table'
import {
  clientIdsKey,
  fetchOpsClients,
  fetchRequisitionsForClients,
  formatShortDate,
  recruiterQueryKeys,
  RECRUITER_STALE_TIME_MS,
} from '../_lib/recruiter-data'
import { isLiveRequisitionStatus } from '../_lib/requisition-status'

export default function ClientsPage() {
  const clientsQuery = useQuery({
    queryKey: recruiterQueryKeys.clients,
    queryFn: fetchOpsClients,
    staleTime: RECRUITER_STALE_TIME_MS,
  })

  const clients = clientsQuery.data ?? []
  const requisitionsQuery = useQuery({
    queryKey: recruiterQueryKeys.requisitions(clientIdsKey(clients)),
    queryFn: () => fetchRequisitionsForClients(clients),
    enabled: clientsQuery.isSuccess,
    staleTime: RECRUITER_STALE_TIME_MS,
  })

  const requisitions = requisitionsQuery.data ?? []
  const requisitionsByClient = new Map<string, typeof requisitions>()
  for (const requisition of requisitions) {
    const clientId = requisition.client_id ?? '__unassigned__'
    requisitionsByClient.set(clientId, [...(requisitionsByClient.get(clientId) ?? []), requisition])
  }

  const isLoading = clientsQuery.isLoading || requisitionsQuery.isLoading
  const hasError = clientsQuery.error || requisitionsQuery.error

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Loading clients...</p>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">Couldn&apos;t load clients from Ops.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em]">Your Clients</h1>
          <p className="text-sm text-muted-foreground">
            Live clients from Ops with requisition counts and direct access to client detail pages.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/ops/clients">Manage Clients</Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Primary Contact</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Open Reqs</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => {
              const clientRequisitions = requisitionsByClient.get(client.id) ?? []
              const openCount = clientRequisitions.filter((req) =>
                isLiveRequisitionStatus(req.status),
              ).length
              return (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.primary_contact_name ?? 'Not set'}</TableCell>
                  <TableCell>{client.primary_contact_email ?? 'Not set'}</TableCell>
                  <TableCell>{openCount}</TableCell>
                  <TableCell>
                    <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatShortDate(client.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/ops/clients/${client.id}`}>Open</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
