'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCandidateAuth } from '../../_components/candidate-auth-context'
import { useResumeUpload } from '../../_lib/use-resume-upload'
import type { CandidateProfile } from '../../_lib/candidate-types'
import { ResumeDropzone } from '../_components/resume-dropzone'

export default function OnboardingResumePage() {
  const router = useRouter()
  const { isLoggedIn, isReady } = useCandidateAuth()
  const [file, setFile] = useState<File | null>(null)
  const [isResumeScanIntent, setIsResumeScanIntent] = useState(false)
  const onParsed = useCallback(
    (snapshot: Partial<CandidateProfile> | undefined) => {
      if (snapshot) localStorage.setItem('candidate_profile_snapshot', JSON.stringify(snapshot))
      router.push('/onboarding/2')
    },
    [router],
  )
  const { status, error, setError, upload } = useResumeUpload(onParsed)

  useEffect(() => {
    if (isReady && !isLoggedIn) router.replace('/signup')
    setIsResumeScanIntent(localStorage.getItem('candidate_onboarding_intent') === 'resume_scan')
  }, [isReady, isLoggedIn, router])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) {
      setError('Choose a resume file first.')
      return
    }
    void upload(file)
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
