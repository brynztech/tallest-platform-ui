'use client'

import type { IngestJob } from './ingest-job-card'

interface ResumeFormProps {
  onJobAdded: (job: IngestJob) => void
  onJobUpdated: (id: string, updates: Partial<IngestJob>) => void
}

export function ResumeForm({ onJobAdded: _onJobAdded, onJobUpdated: _onJobUpdated }: ResumeFormProps) {
  return <div>Resume form — coming soon</div>
}
