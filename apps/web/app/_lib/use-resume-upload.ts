'use client'
import { useEffect, useState } from 'react'
import { candidateAuthHeaders } from './candidate-api'
import type { CandidateProfile, ResumeParseStatus } from './candidate-types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export type ResumeUploadStatus = 'idle' | 'uploading' | 'processing' | 'failed'

/** Uploads a resume, then polls the parse until it completes or fails.
 *  Shared by onboarding step 1 and profile edit (changing the resume). */
export function useResumeUpload(onComplete: (snapshot: Partial<CandidateProfile> | undefined) => void) {
  const [parseId, setParseId] = useState<string | null>(null)
  const [status, setStatus] = useState<ResumeUploadStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!parseId) return
    const fail = () => {
      setStatus('failed')
      setError('Resume parsing failed. Try another file.')
      window.clearInterval(timer)
    }
    const timer = window.setInterval(async () => {
      const response = await fetch(`${API_BASE}/api/v1/candidate/profile/resume/status/${parseId}`, {
        headers: candidateAuthHeaders(),
      })
      if (!response.ok) return fail()
      const data = (await response.json()) as ResumeParseStatus
      if (data.status === 'complete') {
        window.clearInterval(timer)
        setParseId(null)
        setStatus('idle')
        onComplete(data.profile_snapshot)
      } else if (data.status === 'failed') {
        fail()
      }
    }, 800)
    return () => window.clearInterval(timer)
  }, [parseId, onComplete])

  async function upload(file: File) {
    setError(null)
    setStatus('uploading')
    const formData = new FormData()
    formData.append('file', file)
    const response = await fetch(`${API_BASE}/api/v1/candidate/profile/resume`, {
      method: 'POST',
      headers: candidateAuthHeaders(),
      body: formData,
    })
    if (!response.ok) {
      setStatus('failed')
      setError('Resume upload failed. Try again.')
      return
    }
    const data = (await response.json()) as { parse_id: string }
    setParseId(data.parse_id)
    setStatus('processing')
  }

  return { status, error, setError, upload }
}
