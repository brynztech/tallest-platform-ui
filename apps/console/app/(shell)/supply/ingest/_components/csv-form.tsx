'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import type { components } from '@brynzit/api-client'
import { toast } from 'sonner'
import { Button } from '@brynzit/ui/components/ui/button'
import { cn } from '@brynzit/ui/lib/utils'
import { UploadCloud } from 'lucide-react'
import type { IngestJob } from './ingest-job-card'

interface CsvFormProps {
  onJobAdded: (job: IngestJob) => void
}

export function CsvForm({ onJobAdded }: CsvFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    onDropRejected: (rejections) => {
      setUploadError(
        rejections[0]?.errors[0]?.message ?? 'File type not accepted — upload a CSV file.',
      )
    },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles[0]) {
        setFile(acceptedFiles[0])
        setUploadError(null)
      }
    },
  })

  async function handleSubmit() {
    if (!file) return
    setIsSubmitting(true)
    setUploadError(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      // IMPORTANT: native fetch, NOT apiClient.POST — browser sets multipart/form-data boundary
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/v1/supply/candidates/ingest/csv`,
        { method: 'POST', body: formData },
      )
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Upload failed (${res.status}). ${text.slice(0, 200)}`)
      }
      const data = (await res.json()) as components['schemas']['CsvIngestResponse']
      setFile(null)
      toast.success(`Imported ${data.imported} candidates.`)
      onJobAdded({
        id: crypto.randomUUID(),
        type: 'csv',
        label: 'CSV Import',
        status: 'done',
        progressText: `Imported ${data.imported} candidates, ${data.skipped_duplicates ?? 0} duplicates skipped`,
        timestamp: new Date(),
      })
    } catch {
      setUploadError('CSV upload failed — check file format and try again.')
      toast.error('CSV upload failed — check file format and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-4 max-w-lg">
      <p className="mb-4 text-sm text-muted-foreground">
        Upload a CSV file containing candidate records to import them into the talent pool.
      </p>
      <div className="flex flex-col gap-4">
        {file ? (
          <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
            <span className="truncate text-sm text-foreground">{file.name}</span>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="ml-3 shrink-0 text-xs text-muted-foreground hover:text-foreground"
            >
              × clear
            </button>
          </div>
        ) : (
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
              <p className="text-sm font-medium">Drop CSV file here</p>
            ) : (
              <>
                <p className="text-sm font-medium">Drop a CSV file here, or click to browse</p>
                <p className="mt-1 text-xs">CSV files only, one at a time</p>
              </>
            )}
          </div>
        )}
        {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
        <Button
          size="sm"
          className="mt-3 self-start"
          disabled={!file || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <>
              <svg className="mr-1.5 h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
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
              Uploading…
            </>
          ) : (
            'Upload CSV'
          )}
        </Button>
      </div>
    </div>
  )
}
