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

export default function JobsPage() {
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
  const isLoading = clientsQuery.isLoading || requisitionsQuery.isLoading
  const hasError = clientsQuery.error || requisitionsQuery.error

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Loading jobs...</p>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">Couldn&apos;t load open jobs right now.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em]">Browse Jobs</h1>
          <p className="text-sm text-muted-foreground">
            Live client roles ready for matching, shortlist, interviews, and placement work.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/my-roles">Open My Roles</Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Seniority</TableHead>
              <TableHead>Compensation</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Target Start</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requisitions.map((requisition) => (
              <TableRow key={requisition.id}>
                <TableCell className="font-medium">
                  {requisition.client?.name ?? 'Unassigned client'}
                </TableCell>
                <TableCell className="max-w-[260px] whitespace-normal font-medium">
                  {requisition.title}
                </TableCell>
                <TableCell>{requisition.seniority ?? 'Not set'}</TableCell>
                <TableCell>{requisition.compensation_range ?? 'Not set'}</TableCell>
                <TableCell>
                  <Badge variant={requisition.status === 'open' ? 'default' : 'secondary'}>
                    {requisition.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatShortDate(requisition.target_start_date)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/submit?requisition_id=${requisition.id}`}>Submit</Link>
                    </Button>
                    <Button asChild size="sm">
                      <Link href={`/ops/requisitions/${requisition.id}`}>Open</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
