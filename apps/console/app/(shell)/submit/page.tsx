'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@brynzit/ui/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@brynzit/ui/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@brynzit/ui/components/ui/tabs'
import { Separator } from '@brynzit/ui/components/ui/separator'
import { IngestJobCard, type IngestJob } from '../supply/ingest/_components/ingest-job-card'
import { LinkedInForm } from '../supply/ingest/_components/linkedin-form'
import { CsvForm } from '../supply/ingest/_components/csv-form'
import { ResumeForm } from '../supply/ingest/_components/resume-form'
import {
  clientIdsKey,
  fetchOpsClients,
  fetchRequisitionsForClients,
  recruiterQueryKeys,
  RECRUITER_STALE_TIME_MS,
} from '../_lib/recruiter-data'
import { requisitionStatusLabel } from '../_lib/requisition-status'

export default function SubmitCandidatePage() {
  const searchParams = useSearchParams()
  const [jobs, setJobs] = useState<IngestJob[]>([])

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

  const requestedReqId = searchParams.get('requisition_id')
  const initialReqId =
    requestedReqId && requisitions.some((req) => req.id === requestedReqId)
      ? requestedReqId
      : (requisitions[0]?.id ?? '')
  const [selectedReqId, setSelectedReqId] = useState('')
  const activeReqId = selectedReqId || initialReqId
  const activeReq = useMemo(
    () => requisitions.find((requisition) => requisition.id === activeReqId),
    [activeReqId, requisitions],
  )

  function addJob(job: IngestJob) {
    setJobs((prev) => [job, ...prev])
  }

  function updateJob(id: string, updates: Partial<IngestJob>) {
    setJobs((prev) => prev.map((job) => (job.id === id ? { ...job, ...updates } : job)))
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em]">Submit Candidate</h1>
        <p className="text-sm text-muted-foreground">
          Submit into the existing Supply ingest flow with a live requisition context from Ops.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Submission Context</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <p className="mb-2 text-sm font-medium">Requisition</p>
            <Select value={activeReqId} onValueChange={setSelectedReqId} disabled={!requisitions.length}>
              <SelectTrigger>
                <SelectValue placeholder="Select a requisition" />
              </SelectTrigger>
              <SelectContent>
                {requisitions.map((requisition) => (
                  <SelectItem key={requisition.id} value={requisition.id}>
                    {requisition.client?.name ?? 'Client'} — {requisition.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            {activeReq ? (
              <>
                <p className="font-medium">{activeReq.title}</p>
                <p className="text-muted-foreground">
                  {activeReq.client?.name ?? 'Unassigned client'} ·{' '}
                  {requisitionStatusLabel(activeReq.status)}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {activeReq.compensation_range ?? 'Compensation not set'}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">
                No requisitions are available yet. Create one in Ops before submitting candidates.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Candidate Ingest</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="linkedin">
            <TabsList className="w-fit">
              <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
              <TabsTrigger value="csv">CSV</TabsTrigger>
              <TabsTrigger value="resume">Resume</TabsTrigger>
            </TabsList>
            <TabsContent value="linkedin">
              <LinkedInForm onJobAdded={addJob} />
            </TabsContent>
            <TabsContent value="csv">
              <CsvForm onJobAdded={addJob} />
            </TabsContent>
            <TabsContent value="resume">
              <ResumeForm onJobAdded={addJob} onJobUpdated={updateJob} />
            </TabsContent>
          </Tabs>

          <Separator className="my-6" />

          <h2 className="mb-4 text-base font-semibold">Recent Ingest Jobs</h2>
          <div className="flex flex-col gap-2">
            {jobs.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No recent ingest jobs. Submit above to get started.
              </p>
            ) : (
              jobs.map((job) => <IngestJobCard key={job.id} job={job} />)
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
