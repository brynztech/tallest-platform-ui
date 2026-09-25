'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@brynzit/ui/components/ui/button'
import { Progress } from '@brynzit/ui/components/ui/progress'
import { useCandidateAuth } from '../../_components/candidate-auth-context'
import { candidateAuthHeaders } from '../../_lib/candidate-api'
import type { ResumeParseStatus } from '../../_lib/candidate-types'
import { ResumeDropzone } from '../_components/resume-dropzone'
import { PANEL, PRIMARY_BTN } from '../../_lib/ui-classes'

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
    <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-[560px] flex-col justify-center px-4 py-10">
      <div className={PANEL}>
        <div className="mb-6 space-y-2">
          <p className="text-[14px] leading-5 text-muted-foreground">Step 1 of 3</p>
          <Progress value={33} className="h-1.5" />
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-[24px] leading-[30px] font-semibold tracking-[-0.02em] text-foreground">Upload your resume</h1>
          <p className="text-[14px] leading-5 text-muted-foreground">
            {isResumeScanIntent
              ? "We'll parse it to reveal your strongest-fit roles and prefill your profile."
              : "We'll parse it to prefill your profile."}{' '}
            PDF, DOC, and DOCX are supported.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <ResumeDropzone file={file} status={status} disabled={isBusy} onChange={setFile} />

          {status === 'processing' && (
            <p className="text-center text-[14px] leading-5 text-muted-foreground">Parsing your resume...</p>
          )}
          {error && <p className="text-center text-[14px] leading-5 text-destructive">{error}</p>}

          <div className="flex gap-3">
            <Button type="submit" className={`${PRIMARY_BTN} flex-1`} disabled={isBusy}>
              {isBusy ? 'Working...' : 'Upload and continue'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-10 rounded-full px-5 text-[14px] leading-5 font-medium text-muted-foreground hover:bg-muted"
              onClick={() => router.push('/onboarding/2')}
            >
              Skip
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}
