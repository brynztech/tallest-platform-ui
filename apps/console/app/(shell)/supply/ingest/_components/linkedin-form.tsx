'use client'

import type { IngestJob } from './ingest-job-card'

interface LinkedInFormProps {
  onJobAdded: (job: IngestJob) => void
}

export function LinkedInForm({ onJobAdded: _onJobAdded }: LinkedInFormProps) {
  return <div>LinkedIn form — coming soon</div>
}
