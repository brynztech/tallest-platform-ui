'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthenticateWithRedirectCallback, useAuth } from '@clerk/nextjs'
import { PANEL } from '../_lib/ui-classes'
import { safeRedirect } from '../_lib/safe-redirect'
import { SSO_DESTINATION_KEY, SSO_DONE_URL, useFinishAuth, type AuthDestination } from '../_lib/use-finish-auth'
import { FormError } from '../_components/auth-parts'

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

// Where Google sends people back to, in two phases on one route: first the provider's
// callback is completed, then (?done=1) we hand the session to the candidate app.
// Only meaningful when sign-in is configured; anyone opening it directly (or in local
// demo mode) is sent to the sign-in page.
export default function SsoCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    if (!clerkPublishableKey) router.replace('/login')
  }, [router])

  if (!clerkPublishableKey) return null
  return <Callback />
}

function Callback() {
  const done = useSearchParams().get('done') === '1'
  return done ? <Finish /> : <Handoff />
}

function Handoff() {
  return (
    <CallbackCard error={null}>
      <AuthenticateWithRedirectCallback
        signInForceRedirectUrl={SSO_DONE_URL}
        signUpForceRedirectUrl={SSO_DONE_URL}
        signInUrl="/login"
        signUpUrl="/signup"
        firstFactorUrl="/login"
        secondFactorUrl="/login"
        continueSignUpUrl="/signup"
      />
      {/* Bot protection can ask for a challenge when a new account is created; it draws here. */}
      <div id="clerk-captcha" className="mt-4 empty:hidden" />
    </CallbackCard>
  )
}

function readDestination(): AuthDestination {
  try {
    const raw = sessionStorage.getItem(SSO_DESTINATION_KEY)
    if (raw) {
      const saved = JSON.parse(raw) as Partial<AuthDestination>
      return { next: safeRedirect(saved.next ?? null) ?? '/dashboard', onboarding: saved.onboarding === true }
    }
  } catch {
    /* corrupt or unavailable storage: fall through to the default */
  }
  return { next: '/dashboard', onboarding: false }
}

function Finish() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const finish = useFinishAuth()
  const [error, setError] = useState<string | null>(null)
  const started = useRef(false)

  useEffect(() => {
    if (!isLoaded || started.current) return
    started.current = true
    if (!isSignedIn) {
      router.replace('/login')
      return
    }
    finish(readDestination()).then((message) => {
      if (message) setError(message)
      else sessionStorage.removeItem(SSO_DESTINATION_KEY)
    })
  }, [isLoaded, isSignedIn, finish, router])

  return <CallbackCard error={error} />
}

function CallbackCard({ error, children }: { error: string | null; children?: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-[420px] flex-col justify-center px-4 py-10">
      <div className={`${PANEL} text-center`}>
        <h1 className="text-[24px] leading-[30px] font-semibold tracking-[-0.02em] text-foreground">Signing you in</h1>
        <p className="mt-2 text-[14px] leading-5 text-muted-foreground">One moment while we finish up.</p>
        <div className="mt-4">
          <FormError message={error} />
        </div>
        {children}
      </div>
    </main>
  )
}
