'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useAsyncJob } from '@brynzit/hooks'
import type { components } from '@brynzit/api-client'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Button } from '@brynzit/ui/components/ui/button'
import { cn } from '@brynzit/ui/lib/utils'
import { UploadCloud } from 'lucide-react'

type ImportStatusResponse = components['schemas']['ImportStatusResponse']

function StatusStat({
  label,
  value,
  href,
}: {
  label: string
  value: number
  href?: string
}) {
  const content = (
    <div className="rounded-2xl border border-border/60 bg-background/35 px-3 py-2">
      <p className="text-lg font-semibold tracking-[-0.03em]">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )

  return href ? (
    <Link href={href} className="block transition-opacity hover:opacity-85">
      {content}
    </Link>
  ) : content
}

export function ImportDropzone() {
  const [importId, setImportId] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const { phase, data: statusData } = useAsyncJob<ImportStatusResponse>({
    jobId: importId,
    endpoint: '/api/v1/bd/imports/{id}/status',
  })

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    onDropRejected: (rejections) => {
      setUploadError(rejections[0]?.errors[0]?.message ?? 'File type not accepted — upload a CSV file.')
    },
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0]
      if (!file) return

      setUploadError(null)
      setFileName(file.name)

      const formData = new FormData()
      formData.append('file', file)

      try {
        // IMPORTANT: Use native fetch, NOT apiClient.POST (RESEARCH.md Open Question 4)
        // No Content-Type header — browser sets multipart/form-data boundary automatically
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/v1/bd/imports`,
          { method: 'POST', body: formData },
        )
        if (!res.ok) {
          const text = await res.text()
          setUploadError(`Upload failed (${res.status}). ${text.slice(0, 200)}`)
          return
        }
        const data = (await res.json()) as { import_id: string }
        setImportId(data.import_id)
      } catch {
        setUploadError('Upload failed — check your connection.')
      }
    },
  })

  function handleReset() {
    setImportId(null)
    setFileName(null)
    setUploadError(null)
  }

  // ---- Status card (after upload) ----
  if (importId) {
    return (
      <div className="rounded-[1.35rem] border border-border/70 bg-card/80 p-6 shadow-sm shadow-black/10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">{fileName}</p>
            <div className="flex items-center gap-2">
              {phase === 'pending' && (
                <>
                  <Badge variant="secondary" className="flex items-center gap-1.5 text-xs">
                    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Processing {statusData?.total ?? '…'} leads…
                  </span>
                </>
              )}
              {phase === 'complete' && (
                <>
                  <Badge
                    className="text-xs text-white"
                    style={{ backgroundColor: 'oklch(0.45 0.15 145)' }}
                  >
                    Done
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Import complete. Leads were routed by ICP scoring.
                  </span>
                </>
              )}
              {phase === 'failed' && (
                <>
                  <Badge variant="destructive" className="text-xs">Failed</Badge>
                  <span className="text-sm text-destructive">
                    Import failed — check the file format or contact support.
                  </span>
                </>
              )}
              {phase === 'idle' && (
                <Badge variant="outline" className="text-xs">Queued</Badge>
              )}
            </div>
            {statusData && (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                <StatusStat label="Total" value={statusData.total} />
                <StatusStat
                  label="Review queue"
                  value={statusData.review_queue}
                  href="/bd/leads?status=review_queue"
                />
                <StatusStat
                  label="Processing"
                  value={statusData.enriching + statusData.icp_scored}
                  href="/bd/leads?status=processing"
                />
                <StatusStat
                  label="Suppressed"
                  value={statusData.suppressed}
                  href="/bd/leads?status=suppressed"
                />
                <StatusStat label="Failed" value={statusData.failed} />
              </div>
            )}
          </div>
          <Button size="sm" variant="ghost" onClick={handleReset}>
            New import
          </Button>
        </div>
      </div>
    )
  }

  // ---- Dropzone ----
  return (
    <div className="flex flex-col gap-4">
      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5 text-primary'
            : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground',
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mb-3 h-8 w-8" />
        {isDragActive ? (
          <p className="text-sm font-medium">Drop CSV here</p>
        ) : (
          <>
            <p className="text-sm font-medium">Drag CSV here, or click to select</p>
            <p className="mt-1 text-xs">CSV files only, one at a time</p>
          </>
        )}
      </div>
      {uploadError && (
        <p className="text-sm text-destructive">{uploadError}</p>
      )}
    </div>
  )
}
