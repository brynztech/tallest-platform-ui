'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@brynzit/ui/components/ui/button'
import { Input } from '@brynzit/ui/components/ui/input'
import { Label } from '@brynzit/ui/components/ui/label'
import { Progress } from '@brynzit/ui/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@brynzit/ui/components/ui/select'
import { useCandidateAuth } from '../../_components/candidate-auth-context'
import { candidateJsonHeaders } from '../../_lib/candidate-api'
import type { CandidateProfileUpdate } from '../../_lib/candidate-types'
import { FIELD, PANEL, PRIMARY_BTN, SELECT } from '../../_lib/ui-classes'

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
  const { isLoggedIn } = useCandidateAuth()
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
    if (!isLoggedIn) router.replace('/signup')
  }, [isLoggedIn, router])

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
    <main className="mx-auto max-w-[560px] px-4 py-10">
      <div className={PANEL}>
        <div className="mb-6 space-y-2">
          <p className="text-[14px] leading-5 text-muted-foreground">Step 3 of 3</p>
          <Progress value={100} className="h-1.5" />
        </div>

        <div className="space-y-2">
          <h1 className="text-[24px] leading-[30px] font-semibold tracking-[-0.02em] text-foreground">Set your preferences</h1>
          <p className="text-[14px] leading-5 text-muted-foreground">
            Tell us what kind of roles you want so Brynz can rank matches better.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              className={FIELD}
              placeholder="San Francisco, CA"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Remote preference</Label>
              <Select value={remotePreference} onValueChange={(value) => setRemotePreference(value as typeof remotePreference)}>
                <SelectTrigger className={SELECT}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flexible">Flexible</SelectItem>
                  <SelectItem value="remote_only">Remote only</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="onsite">Onsite</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Seniority</Label>
              <Select value={seniority} onValueChange={(value) => setSeniority(value as typeof seniority)}>
                <SelectTrigger className={SELECT}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="junior">Junior</SelectItem>
                  <SelectItem value="mid">Mid</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="principal">Principal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input
              id="linkedin"
              type="url"
              className={FIELD}
              placeholder="https://linkedin.com/in/you"
              value={linkedinUrl}
              onChange={(event) => setLinkedinUrl(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="github">GitHub</Label>
            <Input
              id="github"
              type="url"
              className={FIELD}
              placeholder="https://github.com/you"
              value={githubUrl}
              onChange={(event) => setGithubUrl(event.target.value)}
            />
          </div>

          {error && <p className="text-[14px] leading-5 text-destructive">{error}</p>}

          <Button type="submit" className={`${PRIMARY_BTN} w-full`} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Complete profile'}
          </Button>
        </form>
      </div>
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
