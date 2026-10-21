'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCandidateAuth } from '../../_components/candidate-auth-context'
import { LocationField } from '../../_components/location-field'
import { candidateJsonHeaders } from '../../_lib/candidate-api'
import type { CandidateProfileUpdate } from '../../_lib/candidate-types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

function safeRedirect(value: string | null): string | null {
  if (!value) return null
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null
  return value
}

type OnboardingProfile = CandidateProfileUpdate & {
  email?: string
  experience_summary?: string
}

export default function OnboardingPreferencesPage() {
  const router = useRouter()
  const { isLoggedIn, isReady } = useCandidateAuth()
  const [location, setLocation] = useState('')
  const [remotePreference, setRemotePreference] =
    useState<NonNullable<CandidateProfileUpdate['remote_preference']>>('flexible')
  const [seniority, setSeniority] =
    useState<NonNullable<CandidateProfileUpdate['seniority']>>('senior')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isReady && !isLoggedIn) router.replace('/signup')
  }, [isReady, isLoggedIn, router])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const profile = readJson<OnboardingProfile>('candidate_onboarding_profile') ?? {}
    const body: CandidateProfileUpdate = {
      first_name: profile.first_name,
      last_name: profile.last_name,
      headline: profile.headline,
      skills: profile.skills,
      location,
      remote_preference: remotePreference,
      seniority,
      linkedin_url: linkedinUrl || undefined,
      github_url: githubUrl || undefined,
    }

    const response = await fetch(`${API_BASE}/api/v1/candidate/profile`, {
      method: 'PUT',
      headers: candidateJsonHeaders(),
      body: JSON.stringify(body),
    })

    setIsSubmitting(false)

    if (!response.ok) {
      setError('Could not save your profile. Please try again.')
      return
    }

    localStorage.removeItem('candidate_profile_snapshot')
    localStorage.removeItem('candidate_onboarding_profile')
    const redirect = safeRedirect(localStorage.getItem('candidate_redirect_after_onboarding'))
    localStorage.removeItem('candidate_redirect_after_onboarding')
    router.push(redirect ?? '/jobs')
  }

  if (!isLoggedIn) return null

  return (
    <main className="wrap page narrow">
      <div className="page-head">
        <div className="steps" aria-label="Step 3 of 3"><i className="on" /><i className="on" /><i className="on" /></div>
        <h1 className="d2">Set your <em>preferences</em></h1>
        <p className="lede">Tell us what kind of roles you want so Brynz can rank matches better.</p>
      </div>

      <form onSubmit={handleSubmit} className="panel">
        <LocationField id="location" value={location} onChange={setLocation} />

        <div className="row2">
          <div className="field">
            <label htmlFor="remote_preference">Remote preference</label>
            <select
              id="remote_preference"
              value={remotePreference}
              onChange={(event) => setRemotePreference(event.target.value as typeof remotePreference)}
            >
              <option value="flexible">Flexible</option>
              <option value="remote_only">Remote only</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">Onsite</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="seniority">Seniority</label>
            <select
              id="seniority"
              value={seniority}
              onChange={(event) => setSeniority(event.target.value as typeof seniority)}
            >
              <option value="junior">Junior</option>
              <option value="mid">Mid</option>
              <option value="senior">Senior</option>
              <option value="staff">Staff</option>
              <option value="principal">Principal</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="linkedin">LinkedIn</label>
          <input
            id="linkedin"
            type="url"
            placeholder="https://linkedin.com/in/you"
            value={linkedinUrl}
            onChange={(event) => setLinkedinUrl(event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="github">GitHub</label>
          <input
            id="github"
            type="url"
            placeholder="https://github.com/you"
            value={githubUrl}
            onChange={(event) => setGithubUrl(event.target.value)}
          />
        </div>

        {error && <p className="notice err">{error}</p>}

        <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Complete profile'}
        </button>
      </form>
    </main>
  )
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}
