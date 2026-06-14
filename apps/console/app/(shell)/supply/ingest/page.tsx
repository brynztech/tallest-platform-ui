'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@brynzit/ui/components/ui/tabs'
import { Separator } from '@brynzit/ui/components/ui/separator'
import { IngestJobCard, type IngestJob } from './_components/ingest-job-card'
import { LinkedInForm } from './_components/linkedin-form'
import { CsvForm } from './_components/csv-form'
import { ResumeForm } from './_components/resume-form'

export default function IngestPage() {
  const [jobs, setJobs] = useState<IngestJob[]>([])

  function addJob(job: IngestJob) {
    setJobs((prev) => [job, ...prev])
  }

  function updateJob(id: string, updates: Partial<IngestJob>) {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...updates } : j)))
  }

  return (
    <div className="overflow-y-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Ingest Candidates</h1>
      </div>

      <Tabs defaultValue="linkedin" className="mb-6">
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

      <h2 className="mb-4 text-base font-semibold">Recent Jobs</h2>
      <div className="flex flex-col gap-2">
        {jobs.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No recent ingest jobs. Submit above to get started.
          </p>
        ) : (
          jobs.map((job) => <IngestJobCard key={job.id} job={job} />)
        )}
      </div>
    </div>
  )
}
