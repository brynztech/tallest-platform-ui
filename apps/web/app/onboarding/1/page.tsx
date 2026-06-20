'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@brynzit/ui/components/ui/button'
import { Progress } from '@brynzit/ui/components/ui/progress'
import { useCandidateAuth } from '../../_components/candidate-auth-context'
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

  useEffect(() => {
    if (!isLoggedIn) router.replace('/signup')
  }, [isLoggedIn, router])

  useEffect(() => {
    if (!parseId) return

    const timer = window.setInterval(async () => {
      const response = await fetch(`${API_BASE}/api/v1/candidate/profile/resume/status/${parseId}`)
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
    <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-[620px] flex-col justify-center px-6 py-10">
      <div className="rounded-[1.75rem] border border-border/70 bg-card/80 p-7 shadow-2xl shadow-foreground/[0.05] backdrop-blur">
      <div className="mb-8 space-y-2">
        <p className="text-sm text-muted-foreground">Step 1 of 3</p>
        <Progress value={33} className="h-2" />
      </div>

      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-normal text-foreground">Upload your resume</h1>
        <p className="text-sm text-muted-foreground">
          We'll parse it to prefill your profile. PDF, DOC, and DOCX are supported.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <ResumeDropzone file={file} status={status} disabled={isBusy} onChange={setFile} />

        {status === 'processing' && (
          <p className="text-center text-sm text-muted-foreground">Parsing your resume...</p>
        )}
        {error && <p className="text-center text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" className="flex-1" disabled={isBusy}>
            {isBusy ? 'Working...' : 'Upload and continue'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.push('/onboarding/2')}>
            Skip
          </Button>
        </div>
      </form>
      </div>
    </main>
  )
}
