'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@brynzit/ui/components/ui/button'
import { Input } from '@brynzit/ui/components/ui/input'
import { Label } from '@brynzit/ui/components/ui/label'
import { useCandidateAuth } from '../_components/candidate-auth-context'
import type { CandidateAuthResponse } from '../_lib/candidate-types'
import { FIELD, NOTICE, PANEL, PRIMARY_BTN, SECONDARY_BTN } from '../_lib/ui-classes'
import { safeRedirect } from '../_lib/safe-redirect'
import { ClerkSignUp } from './_components/clerk-sign-up'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
const DEMO_EMAIL = 'demo@brynzit.local'
const DEMO_PASSWORD = 'demo-password'

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
    <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-[420px] flex-col justify-center px-4 py-10">
      <div className={PANEL}>
        <div className="space-y-2 text-center">
          <p className="text-[14px] leading-5 text-muted-foreground">Free resume scan</p>
          <h1 className="text-[24px] leading-[30px] font-semibold tracking-[-0.02em] text-balance text-foreground">
            Reveal your best-fit roles
          </h1>
          <p className="text-[14px] leading-5 text-muted-foreground">
            Create your profile, upload your resume, and let Brynz rank the jobs worth your time.
          </p>
        </div>

        {clerkPublishableKey ? (
          <ClerkSignUp />
        ) : (
          <div className={`mt-6 ${NOTICE}`}>
            <p className="font-medium text-foreground">Demo user for local verification</p>
            <p className="mt-1">
              Use <span className="font-mono text-foreground">{DEMO_EMAIL}</span> with password{' '}
              <span className="font-mono text-foreground">{DEMO_PASSWORD}</span>, or create any mock
              account while sign-in isn't configured.
            </p>
            <Button
              type="button"
              variant="outline"
              className={`mt-3 ${SECONDARY_BTN}`}
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
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  className={FIELD}
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  className={FIELD}
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
                className={FIELD}
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
                className={FIELD}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            {error && <p className="text-[14px] leading-5 text-destructive">{error}</p>}

            <Button type="submit" className={`${PRIMARY_BTN} w-full`} disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
        )}

        {!clerkPublishableKey && (
          <p className="mt-5 text-center text-[14px] leading-5 text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </main>
  )
}
