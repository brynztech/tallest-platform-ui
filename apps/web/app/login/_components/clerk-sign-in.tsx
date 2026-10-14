'use client'

import { FormEvent, ReactNode, useState } from 'react'
import Link from 'next/link'
import { useAuth, useClerk, useSignIn } from '@clerk/nextjs'
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

type Step = 'credentials' | 'forgot' | 'reset' | 'second-factor' | 'new-password'
type Factor = 'email_code' | 'totp'

/**
 * Our own sign-in card. The account system underneath is the same hosted identity service,
 * but none of its screens or branding are shown: every step below is this app's own UI.
 * Only mounted when a publishable key is configured (the demo form covers local dev).
 */
export function ClerkSignIn() {
  const { isLoaded, isSignedIn } = useAuth()
  const clerk = useClerk()
  const { signIn } = useSignIn()
  const finish = useFinishAuth()

  const [step, setStep] = useState<Step>('credentials')
  const [factor, setFactor] = useState<Factor>('email_code')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function destination(): AuthDestination {
    const next =
      safeRedirect(new URLSearchParams(window.location.search).get('redirect')) ?? '/dashboard'
    return { next, onboarding: false }
  }

  async function run(task: () => Promise<void>) {
    setError(null)
    setBusy(true)
    try {
      await task()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  function goTo(next: Step) {
    setError(null)
    setCode('')
    setNewPassword('')
    setStep(next)
  }

  async function complete() {
    const finalized = await signIn.finalize()
    if (finalized.error) return setError(readableAuthError(finalized.error))
    const message = await finish(destination())
    if (message) setError(message)
  }

  async function startSecondFactor() {
    const strategies = signIn.supportedSecondFactors.map((f) => f.strategy)
    if (strategies.includes('email_code')) {
      const sent = await signIn.mfa.sendEmailCode()
      if (sent.error) return setError(readableAuthError(sent.error))
      setFactor('email_code')
      goTo('second-factor')
    } else if (strategies.includes('totp')) {
      setFactor('totp')
      goTo('second-factor')
    } else {
      setError(
        "This account needs a verification step we can't show here yet. Please contact support.",
      )
    }
  }

  async function continueSignIn() {
    switch (signIn.status) {
      case 'complete':
        return complete()
      case 'needs_second_factor':
      case 'needs_client_trust':
        return startSecondFactor()
      case 'needs_new_password':
        return goTo('new-password')
      default:
        setError("We couldn't finish signing you in. Please try again.")
    }
  }

  function submitCredentials(event: FormEvent) {
    event.preventDefault()
    run(async () => {
      const { error: failure } = await signIn.password({ emailAddress: email.trim(), password })
      if (failure) return setError(readableAuthError(failure))
      await continueSignIn()
    })
  }

  function submitForgot(event: FormEvent) {
    event.preventDefault()
    run(async () => {
      const created = await signIn.create({ identifier: email.trim() })
      if (created.error) return setError(readableAuthError(created.error))
      const sent = await signIn.resetPasswordEmailCode.sendCode()
      if (sent.error) return setError(readableAuthError(sent.error))
      goTo('reset')
    })
  }

  function submitReset(event: FormEvent) {
    event.preventDefault()
    run(async () => {
      const verified = await signIn.resetPasswordEmailCode.verifyCode({ code: code.trim() })
      if (verified.error) return setError(readableAuthError(verified.error))
      const saved = await signIn.resetPasswordEmailCode.submitPassword({ password: newPassword })
      if (saved.error) return setError(readableAuthError(saved.error))
      await continueSignIn()
    })
  }

  function submitNewPassword(event: FormEvent) {
    event.preventDefault()
    run(async () => {
      const saved = await signIn.resetPasswordEmailCode.submitPassword({ password: newPassword })
      if (saved.error) return setError(readableAuthError(saved.error))
      await continueSignIn()
    })
  }

  function submitSecondFactor(event: FormEvent) {
    event.preventDefault()
    run(async () => {
      const verified =
        factor === 'email_code'
          ? await signIn.mfa.verifyEmailCode({ code: code.trim() })
          : await signIn.mfa.verifyTOTP({ code: code.trim() })
      if (verified.error) return setError(readableAuthError(verified.error))
      await continueSignIn()
    })
  }

  function continueWithGoogle() {
    run(async () => {
      sessionStorage.setItem(SSO_DESTINATION_KEY, JSON.stringify(destination()))
      // The classic redirect always starts a fresh attempt. signIn.sso() reuses the current one
      // and silently does nothing after any earlier try (even a failed password), so it is not used.
      await clerk.client?.signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: SSO_CALLBACK_URL,
        redirectUrlComplete: SSO_DONE_URL,
      })
    })
  }

  if (isSignedIn) {
    return (
      <div className="grid gap-4">
        <div className="notice">You&apos;re already signed in.</div>
        <FormError message={error} />
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={busy}
          onClick={() =>
            run(async () => {
              const message = await finish(destination())
              if (message) setError(message)
            })
          }
        >
          {busy ? 'Loading profile...' : 'Continue to dashboard'}
        </button>
        <p className="text-center">
          <TextAction onClick={() => clerk.signOut()}>Use a different account</TextAction>
        </p>
      </div>
    )
  }

  if (step === 'forgot') {
    return (
      <StepForm
        lead="Enter your email and we'll send you a code to reset your password."
        onSubmit={submitForgot}
        submitLabel="Send code"
        busyLabel="Sending..."
        busy={busy}
        disabled={!isLoaded}
        error={error}
        onBack={() => goTo('credentials')}
      >
        <EmailField value={email} onChange={setEmail} autoFocus />
      </StepForm>
    )
  }

  if (step === 'reset') {
    return (
      <StepForm
        lead={`We sent a code to ${email.trim()}. Enter it and choose a new password.`}
        onSubmit={submitReset}
        submitLabel="Reset password"
        busyLabel="Resetting..."
        busy={busy}
        error={error}
        onBack={() => goTo('credentials')}
      >
        <CodeField value={code} onChange={setCode} />
        <PasswordField
          id="new-password"
          label="New password"
          value={newPassword}
          onChange={setNewPassword}
          autoComplete="new-password"
        />
      </StepForm>
    )
  }

  if (step === 'new-password') {
    return (
      <StepForm
        lead="Choose a new password to continue."
        onSubmit={submitNewPassword}
        submitLabel="Save password"
        busyLabel="Saving..."
        busy={busy}
        error={error}
        onBack={() => goTo('credentials')}
      >
        <PasswordField
          id="new-password"
          label="New password"
          value={newPassword}
          onChange={setNewPassword}
          autoComplete="new-password"
          autoFocus
        />
      </StepForm>
    )
  }

  if (step === 'second-factor') {
    return (
      <StepForm
        lead={
          factor === 'email_code'
            ? `For your security, enter the code we sent to ${email.trim()}.`
            : 'For your security, enter the code from your authenticator app.'
        }
        onSubmit={submitSecondFactor}
        submitLabel="Verify"
        busyLabel="Verifying..."
        busy={busy}
        error={error}
        onBack={() => goTo('credentials')}
      >
        <CodeField value={code} onChange={setCode} />
      </StepForm>
    )
  }

  return (
    <>
      <form onSubmit={submitCredentials} className="grid gap-4">
        <EmailField value={email} onChange={setEmail} />
        <div className="field">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="password">Password</label>
            <TextAction onClick={() => goTo('forgot')}>Forgot password?</TextAction>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <FormError message={error} />

        <button type="submit" className="btn btn-primary btn-block" disabled={!isLoaded || busy}>
          {busy ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <OrDivider />

      <button
        type="button"
        className="btn btn-ghost btn-block"
        disabled={!isLoaded || busy}
        onClick={continueWithGoogle}
      >
        Continue with Google
      </button>

      <p className="small text-center">
        New here?{' '}
        <Link href="/signup" className="inline-link">
          Join free
        </Link>
      </p>
    </>
  )
}

function StepForm({
  lead,
  onSubmit,
  submitLabel,
  busyLabel,
  busy,
  disabled,
  error,
  onBack,
  children,
}: {
  lead: string
  onSubmit: (event: FormEvent) => void
  submitLabel: string
  busyLabel: string
  busy: boolean
  disabled?: boolean
  error: string | null
  onBack: () => void
  children: ReactNode
}) {
  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <p className="small">{lead}</p>
      {children}
      <FormError message={error} />
      <button type="submit" className="btn btn-primary btn-block" disabled={busy || disabled}>
        {busy ? busyLabel : submitLabel}
      </button>
      <p className="text-center">
        <TextAction onClick={onBack}>Back to sign in</TextAction>
      </p>
    </form>
  )
}

function EmailField({
  value,
  onChange,
  autoFocus,
}: {
  value: string
  onChange: (value: string) => void
  autoFocus?: boolean
}) {
  return (
    <div className="field">
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        autoComplete="email"
        autoFocus={autoFocus}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      />
    </div>
  )
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  autoFocus,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: string
  autoFocus?: boolean
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="password"
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      />
    </div>
  )
}

function CodeField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="field">
      <label htmlFor="code">Code</label>
      <input
        id="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      />
    </div>
  )
}
