'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { toast } from 'sonner'
import { Button } from '@brynzit/ui/components/ui/button'
import { cn } from '@brynzit/ui/lib/utils'
import { UploadCloud } from 'lucide-react'
import type { IngestJob } from './ingest-job-card'
import { createClientId } from '../_lib/client-id'
import { isResumeParsingComplete } from '../_lib/resume-status'

const MAX_POLL_DURATION_MS = 60_000
const POLL_INTERVAL_MS = 3_000

interface ResumeFormProps {
  onJobAdded: (job: IngestJob) => void
  onJobUpdated: (id: string, updates: Partial<IngestJob>) => void
}

export function ResumeForm({ onJobAdded, onJobUpdated }: ResumeFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    onDropRejected: (rejections) => {
      setUploadError(
        rejections[0]?.errors[0]?.message ?? 'File type not accepted — upload a PDF or DOCX.',
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
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/v1/supply/resumes/upload`,
        { method: 'POST', body: formData },
      )
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Upload failed (${res.status}). ${text.slice(0, 200)}`)
      }

      const data = (await res.json()) as components['schemas']['ResumeUploadResponse']
      const jobId = createClientId()
      const fileName = file.name

      setFile(null)

      // Add processing job card immediately
      onJobAdded({
        id: jobId,
        type: 'resume',
        label: `Resume: ${fileName}`,
        status: 'processing',
        progressText: 'Parsing resume…',
        candidateId: data.candidate_id ?? undefined,
        timestamp: new Date(),
      })

      if (data.candidate_id) {
        startPolling(jobId, data.candidate_id)
      } else {
        onJobUpdated(jobId, {
          status: 'failed',
          progressText: 'Resume upload did not return a candidate ID',
        })
        toast.error('Resume upload did not return a candidate ID.')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Resume upload failed — try again.'
      setUploadError(msg)
      toast.error('Resume upload failed — try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function startPolling(jobId: string, candidateId: string) {
    let attempts = 0
    const maxAttempts = Math.floor(MAX_POLL_DURATION_MS / POLL_INTERVAL_MS) // 20 attempts

    const intervalId = setInterval(async () => {
      attempts++
      try {
        const { data, error } = await apiClient.GET('/api/v1/supply/candidates/{candidate_id}', {
          params: { path: { candidate_id: candidateId } },
        })

        if (error) {
          // Non-fatal — keep polling
          return
        }

        const candidate = data as components['schemas']['CandidateProfileResponse']

        if (isResumeParsingComplete(candidate)) {
          clearInterval(intervalId)
          const displayName = candidate.name ?? candidate.email ?? 'Unknown'
          onJobUpdated(jobId, {
            status: 'done',
            progressText: `Candidate created: ${displayName}`,
            candidateId: candidate.id,
          })
          toast.success(`Resume parsed: ${displayName}`)
          return
        }
      } catch {
        // Non-fatal polling error — continue
      }

      // Timeout after max attempts
      if (attempts >= maxAttempts) {
        clearInterval(intervalId)
        onJobUpdated(jobId, {
          status: 'failed',
          progressText: 'Parsing failed — timed out',
        })
        toast.error('Resume parsing timed out — try again.')
      }
    }, POLL_INTERVAL_MS)
  }

  return (
    <div className="mt-4 max-w-lg">
      <p className="mb-4 text-sm text-muted-foreground">
        Upload a resume PDF or DOCX. A new candidate record is created and async parsing extracts
        profile fields.
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
              <p className="text-sm font-medium">Drop resume here</p>
            ) : (
              <>
                <p className="text-sm font-medium">
                  Drop a PDF or DOCX resume here, or click to browse
                </p>
                <p className="mt-1 text-xs">PDF, DOC, DOCX — one file at a time</p>
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
            'Upload Resume'
          )}
        </Button>
      </div>
    </div>
  )
}
