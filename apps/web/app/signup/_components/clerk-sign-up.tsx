'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useAuth, useClerk, useSignUp } from '@clerk/nextjs'
import { Button } from '@brynzit/ui/components/ui/button'
import { Input } from '@brynzit/ui/components/ui/input'
import { Label } from '@brynzit/ui/components/ui/label'
import { FIELD, NOTICE, PRIMARY_BTN, SECONDARY_BTN } from '../../_lib/ui-classes'
import { safeRedirect } from '../../_lib/safe-redirect'
import {
  SSO_CALLBACK_URL,
  SSO_DESTINATION_KEY,
  SSO_DONE_URL,
  readableAuthError,
  useFinishAuth,
  type AuthDestination,
} from '../../_lib/use-finish-auth'
import { FormError, OrDivider, TextAction } from '../../_components/auth-parts'

const DESTINATION: AuthDestination = { next: '/onboarding/1', onboarding: true }

/**
 * Our own sign-up card: details, then a 6-digit email code, then onboarding. The hosted
 * identity service runs underneath, but none of its screens or branding are shown.
 * Only mounted when a publishable key is configured (the demo form covers local dev).
 */
export function ClerkSignUp() {
  const { isLoaded, isSignedIn } = useAuth()
  const clerk = useClerk()
  const { signUp } = useSignUp()
  const finish = useFinishAuth()

  const [step, setStep] = useState<'details' | 'verify'>('details')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [slow, setSlow] = useState(false)

  async function run(task: () => Promise<void>) {
    setError(null)
    setInfo(null)
    setBusy(true)
    // A bot check can hold the request until the person ticks its box. Say so, but only if it is taking a while.
    const slowTimer = window.setTimeout(() => setSlow(true), 2500)
    try {
      await task()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      window.clearTimeout(slowTimer)
      setSlow(false)
      setBusy(false)
    }
  }

  /** Same hand-off the demo form does: onboarding prefills from this, and applies to the redirect afterwards. */
  function rememberOnboarding() {
    localStorage.setItem(
      'candidate_onboarding_profile',
      JSON.stringify({ first_name: firstName.trim(), last_name: lastName.trim(), email: email.trim() }),
    )
    rememberRedirect()
  }

  function rememberRedirect() {
    const redirect = safeRedirect(new URLSearchParams(window.location.search).get('redirect'))
    if (redirect) localStorage.setItem('candidate_redirect_after_onboarding', redirect)
  }

  async function complete() {
    const finalized = await signUp.finalize()
    if (finalized.error) return setError(readableAuthError(finalized.error))
    rememberOnboarding()
    const message = await finish(DESTINATION)
    if (message) setError(message)
  }

  function submitDetails(event: FormEvent) {
    event.preventDefault()
    run(async () => {
      const created = await signUp.password({
        emailAddress: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      })
      if (created.error) return setError(readableAuthError(created.error))
      if (signUp.status === 'complete') return complete()
      const sent = await signUp.verifications.sendEmailCode()
      if (sent.error) return setError(readableAuthError(sent.error))
      setCode('')
      setStep('verify')
    })
  }

  function submitCode(event: FormEvent) {
    event.preventDefault()
    run(async () => {
      const verified = await signUp.verifications.verifyEmailCode({ code: code.trim() })
      if (verified.error) return setError(readableAuthError(verified.error))
      if (signUp.status === 'complete') return complete()
      setError("We couldn't finish creating your account. Please try again.")
    })
  }

  function resendCode() {
    run(async () => {
      const sent = await signUp.verifications.sendEmailCode()
      if (sent.error) return setError(readableAuthError(sent.error))
      setInfo('We sent you a new code.')
    })
  }

  function changeEmail() {
    run(async () => {
      await signUp.reset()
      setCode('')
      setStep('details')
    })
  }

  function continueWithGoogle() {
    run(async () => {
      sessionStorage.setItem(SSO_DESTINATION_KEY, JSON.stringify(DESTINATION))
      rememberRedirect()
      // Classic redirect, for the same reason as the sign-in card: signUp.sso() can silently do nothing.
      await clerk.client?.signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: SSO_CALLBACK_URL,
        redirectUrlComplete: SSO_DONE_URL,
      })
    })
  }

  if (isSignedIn) {
    return (
      <div className="mt-6 space-y-4">
        <div className={NOTICE}>You&apos;re already signed in.</div>
        <FormError message={error} />
        <Button
          type="button"
          className={`${PRIMARY_BTN} w-full`}
          disabled={busy}
          onClick={() =>
            run(async () => {
              rememberRedirect()
              const message = await finish(DESTINATION)
              if (message) setError(message)
            })
          }
        >
          {busy ? 'Starting scan...' : 'Continue to resume scan'}
        </Button>
        <p className="text-center">
          <TextAction onClick={() => clerk.signOut()}>Use a different account</TextAction>
        </p>
      </div>
    )
  }

  if (step === 'verify') {
    return (
      <form onSubmit={submitCode} className="mt-6 space-y-4">
        <p className="text-[14px] leading-5 text-muted-foreground">
          We sent a 6-digit code to {email.trim()}. Enter it to verify your email.
        </p>
        <div className="space-y-2">
          <Label htmlFor="code">Code</Label>
          <Input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            className={FIELD}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            required
          />
        </div>

        <FormError message={error} />
        {info && (
          <p role="status" className="text-[14px] leading-5 text-muted-foreground">
            {info}
          </p>
        )}

        <Button type="submit" className={`${PRIMARY_BTN} w-full`} disabled={busy}>
          {busy ? 'Verifying...' : 'Verify and continue'}
        </Button>
        <p className="flex items-center justify-center gap-4">
          <TextAction onClick={resendCode} disabled={busy}>
            Resend code
          </TextAction>
          <TextAction onClick={changeEmail} disabled={busy}>
            Use a different email
          </TextAction>
        </p>
      </form>
    )
  }

  return (
    <>
      <form onSubmit={submitDetails} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              autoComplete="given-name"
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
              autoComplete="family-name"
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
            className={FIELD}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        {/* Bot protection is on for sign-up. The service draws its challenge into this element by id, and only when it needs one. */}
        <div id="clerk-captcha" className="flex justify-center empty:hidden" />

        <FormError message={error} />
        {slow && (
          <p role="status" className="text-center text-[14px] leading-5 text-muted-foreground">
            If a &quot;Verify you are human&quot; box appears above, tick it to continue.
          </p>
        )}

        <Button type="submit" className={`${PRIMARY_BTN} w-full`} disabled={!isLoaded || busy}>
          {busy ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <OrDivider />

      <Button
        type="button"
        variant="outline"
        className={`${SECONDARY_BTN} w-full`}
        disabled={!isLoaded || busy}
        onClick={continueWithGoogle}
      >
        Continue with Google
      </Button>

      <p className="mt-5 text-center text-[14px] leading-5 text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </>
  )
}
