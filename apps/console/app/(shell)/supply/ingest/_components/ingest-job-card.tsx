'use client'

import { Badge } from '@brynzit/ui/components/ui/badge'
import { cn } from '@brynzit/ui/lib/utils'

export type IngestJobStatus = 'queued' | 'processing' | 'done' | 'failed'

export interface IngestJob {
  id: string
  type: 'linkedin' | 'csv' | 'resume'
  label: string
  status: IngestJobStatus
  progressText: string
  candidateId?: string
  timestamp: Date
}

interface IngestJobCardProps {
  job: IngestJob
}

export function IngestJobCard({ job }: IngestJobCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="flex-1 text-sm font-medium text-foreground">{job.label}</span>
        <div className="flex items-center gap-2">
          {job.status === 'queued' && (
            <Badge variant="outline" className="text-xs">
              Queued
            </Badge>
          )}
          {job.status === 'processing' && (
            <Badge variant="secondary" className="flex items-center gap-1.5 text-xs">
              <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Processing
            </Badge>
          )}
          {job.status === 'done' && (
            <Badge
              className="text-xs text-white"
              style={{ backgroundColor: 'oklch(0.45 0.15 145)' }}
            >
              Done
            </Badge>
          )}
          {job.status === 'failed' && (
            <Badge variant="destructive" className="text-xs">
              Failed
            </Badge>
          )}
        </div>
        <span className="ml-auto text-xs text-muted-foreground">
          {job.timestamp.toLocaleTimeString()}
        </span>
      </div>
      <p
        className={cn(
          'mt-1 text-sm',
          job.status === 'failed' ? 'text-destructive' : 'text-muted-foreground',
        )}
      >
        {job.progressText}
      </p>
      {job.status === 'done' && job.candidateId && (
        <a
          href={`/supply/search?candidateId=${job.candidateId}`}
          className="mt-1 block text-xs text-primary hover:underline"
        >
          View Profile →
        </a>
      )}
    </div>
  )
}
