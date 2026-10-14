'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCandidateAuth } from '../../_components/candidate-auth-context'
import { candidateAuthHeaders } from '../../_lib/candidate-api'
import type { ResumeParseStatus } from '../../_lib/candidate-types'
import { ResumeDropzone } from '../_components/resume-dropzone'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export default function OnboardingResumePage() {
  const router = useRouter()
  const { isLoggedIn } = useCandidateAuth()
  const [file, setFile] = useState<File | null>(null)
  const [parseId, setParseId] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'failed'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isResumeScanIntent, setIsResumeScanIntent] = useState(false)

  useEffect(() => {
    if (!isLoggedIn) router.replace('/signup')
    setIsResumeScanIntent(localStorage.getItem('candidate_onboarding_intent') === 'resume_scan')
  }, [isLoggedIn, router])

  useEffect(() => {
    if (!parseId) return

    const timer = window.setInterval(async () => {
      const response = await fetch(`${API_BASE}/api/v1/candidate/profile/resume/status/${parseId}`, {
        headers: candidateAuthHeaders(),
      })
      if (!response.ok) {
        setStatus('failed')
        setError('Resume parsing failed. You can continue manually.')
        window.clearInterval(timer)
        return
      }

      const data = (await response.json()) as ResumeParseStatus
      if (data.status === 'complete') {
        if (data.profile_snapshot) {
          localStorage.setItem('candidate_profile_snapshot', JSON.stringify(data.profile_snapshot))
        }
        window.clearInterval(timer)
        router.push('/onboarding/2')
      } else if (data.status === 'failed') {
        setStatus('failed')
        setError('Resume parsing failed. You can continue manually.')
        window.clearInterval(timer)
      } else {
        setStatus('processing')
      }
    }, 800)

    return () => window.clearInterval(timer)
  }, [parseId, router])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) {
      setError('Choose a resume file first.')
      return
    }

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
      setError('Resume upload failed. You can continue manually.')
      return
    }

    const data = (await response.json()) as { parse_id: string }
    setParseId(data.parse_id)
    setStatus('processing')
  }

  if (!isLoggedIn) return null

  const isBusy = status === 'uploading' || status === 'processing'

  return (
    <main className="wrap page narrow">
      <div className="page-head">
        <div className="steps" aria-label="Step 1 of 3"><i className="on" /><i /><i /></div>
        <h1 className="d2">Upload your <em>resume</em></h1>
        <p className="lede">
          {isResumeScanIntent
            ? "We'll parse it to reveal your strongest-fit roles and prefill your profile."
            : "We'll parse it to prefill your profile."}{' '}
          PDF, DOC, and DOCX are supported.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="panel">
        <ResumeDropzone file={file} status={status} disabled={isBusy} onChange={setFile} />

        {status === 'processing' && <p className="notice">Parsing your resume...</p>}
        {error && <p className="notice err">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" className="btn btn-primary flex-1" disabled={isBusy}>
            {isBusy ? 'Working...' : 'Upload and continue'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => router.push('/onboarding/2')}>
            Skip
          </button>
        </div>
      </form>
    </main>
  )
}
