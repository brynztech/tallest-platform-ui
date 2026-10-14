'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCandidateAuth } from '../_components/candidate-auth-context'
import type { CandidateAuthResponse } from '../_lib/candidate-types'
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
    <main className="wrap page narrow">
      <div className="page-head">
        <span className="chip on justify-self-start">Free resume scan</span>
        <h1 className="d2">
          Reveal your best-fit <em>roles</em>
        </h1>
        <p className="lede">
          Create your profile, upload your resume, and let Brynz rank the jobs worth your time.
        </p>
      </div>

      <div className="panel">
        {clerkPublishableKey ? (
          <ClerkSignUp />
        ) : (
          <div className="notice">
            <p>
              <strong>Demo user for local verification</strong>
            </p>
            <p className="mt-1">
              Use <code>{DEMO_EMAIL}</code> with password <code>{DEMO_PASSWORD}</code>, or create
              any mock account while sign-in isn't configured.
            </p>
            <button
              type="button"
              className="btn btn-ghost btn-sm mt-3"
              onClick={() => {
                setFirstName('Demo')
                setLastName('Candidate')
                setEmail(DEMO_EMAIL)
                setPassword(DEMO_PASSWORD)
              }}
            >
              Fill demo candidate
            </button>
          </div>
        )}

        {!clerkPublishableKey && (
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="row2">
              <div className="field">
                <label htmlFor="firstName">First name</label>
                <input
                  id="firstName"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="lastName">Last name</label>
                <input
                  id="lastName"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            {error && <p className="notice err">{error}</p>}

            <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        )}

        {!clerkPublishableKey && (
          <p className="small text-center">
            Already have an account?{' '}
            <Link href="/login" className="inline-link">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </main>
  )
}
