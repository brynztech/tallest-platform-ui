'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCandidateAuth } from '../_components/candidate-auth-context'
import { safeRedirect } from '../_lib/safe-redirect'
import { ClerkSignIn } from './_components/clerk-sign-in'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
const DEMO_EMAIL = 'demo@brynzit.local'
const DEMO_PASSWORD = 'demo-password'

export default function LoginPage() {
  const router = useRouter()
  const { signIn } = useCandidateAuth()
  const [email, setEmail] = useState(DEMO_EMAIL)
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const response = await fetch(`${API_BASE}/api/v1/candidate/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    setIsSubmitting(false)

    if (!response.ok) {
      setError('Invalid email or password.')
      return
    }

    const data = (await response.json()) as { access_token: string }
    signIn(data.access_token, { id: 'mock-candidate-id', email })
    router.push(
      safeRedirect(new URLSearchParams(window.location.search).get('redirect')) ?? '/jobs',
    )
  }

  return (
    <main className="wrap page narrow">
      <div className="page-head">
        <h1 className="d2">
          Sign <em>in</em>
        </h1>
        <p className="lede">Continue to your Brynz candidate account.</p>
      </div>

      <div className="panel">
        {clerkPublishableKey ? (
          <ClerkSignIn />
        ) : (
          <>
            <div className="notice">
              <p>
                <strong>Demo user</strong>
              </p>
              <p className="mt-1">
                Use <code>{DEMO_EMAIL}</code> with password <code>{DEMO_PASSWORD}</code>.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4">
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
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              {error && <p className="notice err">{error}</p>}

              <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <p className="small text-center">
              New here?{' '}
              <Link href="/signup" className="inline-link">
                Join free
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  )
}
