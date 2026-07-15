'use client'

import { FormEvent, useState } from 'react'
import { SignUpButton, useAuth, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@brynzit/ui/components/ui/button'
import { Input } from '@brynzit/ui/components/ui/input'
import { Label } from '@brynzit/ui/components/ui/label'
import { useCandidateAuth } from '../_components/candidate-auth-context'
import type { CandidateAuthResponse } from '../_lib/candidate-types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
const DEMO_EMAIL = 'demo@brynzit.local'
const DEMO_PASSWORD = 'demo-password'

function safeRedirect(value: string | null): string | null {
  if (!value) return null
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null
  return value
}

export default function SignupPage() {
  const router = useRouter()
  const { signIn } = useCandidateAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const response = await fetch(`${API_BASE}/api/v1/candidate/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
      }),
    })

    setIsSubmitting(false)

    if (!response.ok) {
      setError('Could not create your account. Please try again.')
      return
    }

    const data = (await response.json()) as CandidateAuthResponse
    signIn(data.access_token, { id: data.id, email: data.email })

    localStorage.setItem(
      'candidate_onboarding_profile',
      JSON.stringify({ first_name: firstName, last_name: lastName, email }),
    )

    const params = new URLSearchParams(window.location.search)
    const intent = params.get('intent')
    if (intent === 'resume_scan') {
      localStorage.setItem('candidate_onboarding_intent', 'resume_scan')
    }

    const redirect = safeRedirect(params.get('redirect'))
    if (redirect) {
      localStorage.setItem('candidate_redirect_after_onboarding', redirect)
    }

    router.push('/onboarding/1')
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-[420px] flex-col justify-center px-6 py-10">
      <div className="rounded-[1.75rem] border border-border/70 bg-card/80 p-7 shadow-2xl shadow-foreground/[0.05] backdrop-blur">
      <div className="space-y-2 text-center">
        <p className="text-sm font-medium text-primary">Free resume scan</p>
        <h1 className="text-3xl font-light tracking-tight text-foreground">Reveal your best-fit roles</h1>
        <p className="text-sm text-muted-foreground">
          Create your profile, upload your resume, and let Brynzit rank the jobs worth your time.
        </p>
      </div>

      {clerkPublishableKey ? (
        <div className="mt-6 rounded-2xl border border-primary/10 bg-primary/[0.03] p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Clerk signup is ready</p>
          <p className="mt-1">
            Use Clerk to create your account, then continue here to upload your resume and run the
            AI match scan.
          </p>
          <SignUpButton mode="modal">
            <Button type="button" variant="outline" size="sm" className="mt-3 rounded-full">
              Continue with Clerk
            </Button>
          </SignUpButton>
          <ClerkOnboardingStart />
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-border/70 bg-muted/35 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Demo user for local verification</p>
          <p className="mt-1">
            Use <span className="font-mono text-foreground">{DEMO_EMAIL}</span> with password{' '}
            <span className="font-mono text-foreground">{DEMO_PASSWORD}</span>, or create any mock
            account while Clerk keys are not configured.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 rounded-full"
            onClick={() => {
              setFirstName('Demo')
              setLastName('Candidate')
              setEmail(DEMO_EMAIL)
              setPassword(DEMO_PASSWORD)
            }}
          >
            Fill demo candidate
          </Button>
        </div>
      )}

      {!clerkPublishableKey && (
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
      )}

      {!clerkPublishableKey && (
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
      )}
      </div>
    </main>
  )
}

function ClerkOnboardingStart() {
  const router = useRouter()
  const { isSignedIn, userId, getToken } = useAuth()
  const { user } = useUser()
  const { signIn } = useCandidateAuth()
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isSignedIn || !userId) return null
  const clerkUserId = userId

  async function startOnboarding() {
    setIsStarting(true)
    setError(null)

    const token = await getToken()
    if (!token) {
      setIsStarting(false)
      setError('Could not read your Clerk session. Please try again.')
      return
    }

    const email = user?.primaryEmailAddress?.emailAddress ?? ''
    signIn(token, { id: clerkUserId, clerk_user_id: clerkUserId, email })

    const response = await fetch(`${API_BASE}/api/v1/candidate/onboarding/start`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        full_name: user?.fullName || undefined,
      }),
    })

    setIsStarting(false)
    if (!response.ok) {
      setError('Could not start your candidate profile. Please try again.')
      return
    }

    localStorage.setItem('candidate_onboarding_intent', 'resume_scan')
    router.push('/onboarding/1')
  }

  return (
    <div className="mt-3">
      <Button
        type="button"
        size="sm"
        className="rounded-full"
        onClick={startOnboarding}
        disabled={isStarting}
      >
        {isStarting ? 'Starting scan...' : 'Continue to resume scan'}
      </Button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  )
}
