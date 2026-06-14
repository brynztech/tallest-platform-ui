'use client'

import type { IngestJob } from './ingest-job-card'

interface CsvFormProps {
  onJobAdded: (job: IngestJob) => void
}

export function CsvForm({ onJobAdded: _onJobAdded }: CsvFormProps) {
  return <div>CSV form — coming soon</div>
}
