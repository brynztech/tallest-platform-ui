'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { toast } from 'sonner'
import { Button } from '@brynzit/ui/components/ui/button'
import { cn } from '@brynzit/ui/lib/utils'
import { FolderUp, UploadCloud } from 'lucide-react'
import type { IngestJob } from './ingest-job-card'
import { createClientId } from '../_lib/client-id'
import { isResumeParsingComplete } from '../_lib/resume-status'
import { RESUME_ACCEPT, selectResumesFromFolder } from '../_lib/resume-files'

const MAX_POLL_DURATION_MS = 60_000
const POLL_INTERVAL_MS = 3_000

interface ResumeFormProps {
  onJobAdded: (job: IngestJob) => void
  onJobUpdated: (id: string, updates: Partial<IngestJob>) => void
}

type UploadMode = 'files' | 'folder'

export function ResumeForm({ onJobAdded, onJobUpdated }: ResumeFormProps) {
  const [files, setFiles] = useState<File[]>([])
  const [mode, setMode] = useState<UploadMode>('files')
  const [folderNote, setFolderNote] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: RESUME_ACCEPT,
    multiple: true,
    onDropRejected: (rejections) => {
      setUploadError(
        rejections[0]?.errors[0]?.message ?? 'File type not accepted — upload a PDF or DOCX.',
      )
    },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFiles((prev) => [...prev, ...acceptedFiles])
        setUploadError(null)
      }
    },
  })

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  /** Folder pick: keep only parseable files and say what was ignored. */
  function handleFolderSelected(fileList: FileList | null) {
    const { accepted, skippedCount } = selectResumesFromFolder(Array.from(fileList ?? []))
    setUploadError(null)
    if (accepted.length === 0) {
      setFolderNote(null)
      setUploadError('No PDF or DOCX resumes found in that folder.')
      return
    }
    setFiles((prev) => [...prev, ...accepted])
    setFolderNote(
      `${accepted.length} resume${accepted.length === 1 ? '' : 's'} found` +
        (skippedCount > 0
          ? ` · ${skippedCount} other file${skippedCount === 1 ? '' : 's'} skipped`
          : ''),
    )
  }

  // Each resume is its own job card with independent upload + poll — one bad
  // file must not block or fail the others in the batch.
  async function uploadOne(file: File) {
    const jobId = createClientId()
    onJobAdded({
      id: jobId,
      type: 'resume',
      label: `Resume: ${file.name}`,
      status: 'processing',
      progressText: 'Uploading…',
      timestamp: new Date(),
    })

    try {
      const formData = new FormData()
      formData.append('file', file)

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

      if (data.candidate_id) {
        // status "duplicate" = byte-identical file already ingested; the id is
        // the existing candidate (already parsed), so the poll completes at once.
        const progressText =
          data.status === 'duplicate' ? 'Already in talent pool' : 'Parsing resume…'
        onJobUpdated(jobId, { progressText, candidateId: data.candidate_id })
        startPolling(jobId, data.candidate_id)
      } else {
        onJobUpdated(jobId, {
          status: 'failed',
          progressText: 'Resume upload did not return a candidate ID',
        })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Resume upload failed — try again.'
      onJobUpdated(jobId, { status: 'failed', progressText: msg })
    }
  }

  async function handleSubmit() {
    if (files.length === 0) return
    setIsSubmitting(true)
    setUploadError(null)
    const batch = files
    setFiles([])
    setFolderNote(null)

    try {
      await Promise.all(batch.map(uploadOne))
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

        const candidate = data as components['schemas']['supply__schemas__candidates__CandidateProfileResponse']

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
        Upload resumes (PDF or DOCX) individually or pick a whole folder. A candidate record is
        created per resume and async parsing extracts profile fields.
      </p>
      <div className="mb-4 flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === 'files' ? 'default' : 'outline'}
          onClick={() => setMode('files')}
        >
          <UploadCloud className="mr-1 size-4" />
          Upload files
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === 'folder' ? 'default' : 'outline'}
          onClick={() => setMode('folder')}
        >
          <FolderUp className="mr-1 size-4" />
          Upload folder
        </Button>
      </div>
      <div className="flex flex-col gap-4">
        {files.length > 0 && (
          <div className="flex flex-col gap-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
              >
                <span className="truncate text-sm text-foreground">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="ml-3 shrink-0 text-xs text-muted-foreground hover:text-foreground"
                >
                  × clear
                </button>
              </div>
            ))}
          </div>
        )}
        {mode === 'files' ? (
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
              <p className="text-sm font-medium">Drop resumes here</p>
            ) : (
              <>
                <p className="text-sm font-medium">
                  Drop PDF or DOCX resumes here, or click to browse
                </p>
                <p className="mt-1 text-xs">PDF, DOC, DOCX — multiple files supported</p>
              </>
            )}
          </div>
        ) : (
          <label
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-colors',
              'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground',
            )}
          >
            {/* webkitdirectory is the native folder picker — set via ref
                because React's input typings don't carry the attribute. */}
            <input
              type="file"
              multiple
              className="hidden"
              ref={(node) => {
                node?.setAttribute('webkitdirectory', '')
                node?.setAttribute('directory', '')
              }}
              onChange={(event) => {
                handleFolderSelected(event.target.files)
                // Allow re-picking the same folder after a clear.
                event.target.value = ''
              }}
            />
            <FolderUp className="mb-3 h-8 w-8" />
            <p className="text-sm font-medium">Click to choose a folder</p>
            <p className="mt-1 text-xs">
              Every PDF, DOC, and DOCX inside is queued — other files are ignored
            </p>
          </label>
        )}
        {folderNote && <p className="text-sm text-muted-foreground">{folderNote}</p>}
        {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
        <Button
          size="sm"
          className="mt-3 self-start"
          disabled={files.length === 0 || isSubmitting}
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
          ) : files.length > 1 ? (
            `Upload ${files.length} Resumes`
          ) : (
            'Upload Resume'
          )}
        </Button>
      </div>
    </div>
  )
}
