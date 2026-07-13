'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@brynzit/ui/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@brynzit/ui/components/ui/card'
import {
  clientIdsKey,
  fetchOpsClients,
  fetchPlacementsForRequisitions,
  fetchRequisitionsForClients,
  formatShortDate,
  recruiterQueryKeys,
  RECRUITER_STALE_TIME_MS,
  requisitionIdsKey,
} from '../_lib/recruiter-data'

export default function RewardsPage() {
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
  const placementsQuery = useQuery({
    queryKey: recruiterQueryKeys.placements(requisitionIdsKey(requisitions)),
    queryFn: () => fetchPlacementsForRequisitions(requisitions),
    enabled: requisitionsQuery.isSuccess && requisitions.length > 0,
    staleTime: RECRUITER_STALE_TIME_MS,
  })

  const placements = placementsQuery.data ?? []
  const totalFees = placements.reduce((sum, placement) => sum + (placement.fee_usd ?? 0), 0)
  const pendingFees = placements
    .filter((placement) => placement.billing_status !== 'paid')
    .reduce((sum, placement) => sum + (placement.fee_usd ?? 0), 0)
  const isLoading =
    clientsQuery.isLoading || requisitionsQuery.isLoading || placementsQuery.isLoading
  const hasError = clientsQuery.error || requisitionsQuery.error || placementsQuery.error

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Loading rewards...</p>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">Couldn&apos;t load placement rewards.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em]">
            Referrals and Promotions
          </h1>
          <p className="text-sm text-muted-foreground">
            Placement-value summary from existing Ops placement records.
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/ops/requisitions">Open Requisitions</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric title="Logged Placements" value={placements.length} />
        <Metric title="Total Placement Fees" value={formatUsd(totalFees)} />
        <Metric title="Pending Billing Value" value={formatUsd(pendingFees)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Placement Records</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {placements.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No placement records found. Log placements from approved requisition candidates to
              populate rewards.
            </p>
          ) : (
            placements.map((placement) => (
              <article key={placement.id} className="rounded-lg border bg-background p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold">{placement.requisition.title}</h2>
                    <p className="text-xs text-muted-foreground">
                      {placement.requisition.client?.name ?? 'Client'} · {placement.billing_status}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-sm font-semibold">{formatUsd(placement.fee_usd ?? 0)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatShortDate(placement.confirmed_at)}
                    </p>
                  </div>
                </div>
              </article>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Metric({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <p className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{value}</p>
      </CardContent>
    </Card>
  )
}

function formatUsd(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}
