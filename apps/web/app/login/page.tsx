'use client'

import { FormEvent, useState } from 'react'
import { SignInButton, useAuth, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@brynzit/ui/components/ui/button'
import { Input } from '@brynzit/ui/components/ui/input'
import { Label } from '@brynzit/ui/components/ui/label'
import { useCandidateAuth } from '../_components/candidate-auth-context'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
const DEMO_EMAIL = 'demo@brynzit.local'
const DEMO_PASSWORD = 'demo-password'

function safeRedirect(value: string | null): string | null {
  if (!value) return null
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null
  return value
}

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
    router.push(safeRedirect(new URLSearchParams(window.location.search).get('redirect')) ?? '/jobs')
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-[420px] flex-col justify-center px-6">
      <div className="rounded-[1.75rem] border border-border/70 bg-card/80 p-7 shadow-2xl shadow-foreground/[0.05] backdrop-blur">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-light tracking-tight text-foreground">Sign in</h1>
        <p className="text-sm text-muted-foreground">Continue to your Brynzit candidate account.</p>
      </div>

      {clerkPublishableKey ? (
        <div className="mt-6 rounded-2xl border border-primary/10 bg-primary/[0.03] p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Use your Clerk account</p>
          <p className="mt-1">
            Sign in to see your applications, finish your profile, and continue your resume match scan.
          </p>
          <SignInButton mode="modal">
            <Button type="button" variant="outline" size="sm" className="mt-3 rounded-full">
              Sign in with Clerk
            </Button>
          </SignInButton>
          <ClerkLoginContinue />
        </div>
      ) : (
      <>
      <div className="mt-6 rounded-2xl border border-border/70 bg-muted/35 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Demo user</p>
        <p className="mt-1">
          Use <span className="font-mono text-foreground">{DEMO_EMAIL}</span> with password{' '}
          <span className="font-mono text-foreground">{DEMO_PASSWORD}</span>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here?{' '}
        <Link href="/signup" className="text-foreground underline underline-offset-4">
          Join free
        </Link>
      </p>
      </>
      )}
      </div>
    </main>
  )
}

function ClerkLoginContinue() {
  const router = useRouter()
  const { isSignedIn, userId, getToken } = useAuth()
  const { user } = useUser()
  const { signIn } = useCandidateAuth()
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isSignedIn || !userId) return null
  const clerkUserId = userId

  async function continueToApp() {
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
      setError('Could not load your candidate profile. Please try again.')
      return
    }

    router.push(safeRedirect(new URLSearchParams(window.location.search).get('redirect')) ?? '/dashboard')
  }

  return (
    <div className="mt-3">
      <Button
        type="button"
        size="sm"
        className="rounded-full"
        onClick={continueToApp}
        disabled={isStarting}
      >
        {isStarting ? 'Loading profile...' : 'Continue to dashboard'}
      </Button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  )
}
