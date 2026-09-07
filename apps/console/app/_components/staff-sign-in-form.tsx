'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Card } from '@brynzit/ui/components/ui/card'
import { Label } from '@brynzit/ui/components/ui/label'
import { Input } from '@brynzit/ui/components/ui/input'
import { Button } from '@brynzit/ui/components/ui/button'
import { staffLogin } from '../_lib/staff-auth'
import { STAFF_ME_QUERY_KEY } from '../_lib/staff-auth-context'

export function StaffSignInForm({
  title,
  subtitle,
  redirectTo,
}: {
  title: string
  subtitle: string
  redirectTo: string
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const user = await staffLogin(username, password)
      queryClient.setQueryData(STAFF_ME_QUERY_KEY, user)
      router.replace(redirectTo)
    } catch {
      // Same message regardless of cause — the backend already collapses
      // bad-username/bad-password/deactivated into one response.
      setError('Invalid username or password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="brynz-page-wash flex min-h-dvh items-center justify-center p-6">
      <Card className="w-full max-w-sm gap-6 p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5 text-center">
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {error && (
            <p role="alert" className="rounded-lg border border-[#F0D9D6] bg-[#FAF0EE] px-3 py-2 text-sm text-[#BA4642]">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              autoComplete="username"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <Button type="submit" disabled={busy} className="mt-1 w-full">
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
