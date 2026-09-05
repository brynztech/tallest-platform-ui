'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStaffAuth } from './staff-auth-context'

/**
 * Route-level session gate. A client component, not a server redirect: the
 * session cookie lives on the API's origin (cross-origin from this app), so
 * there is no cookie for a Next.js server component or middleware to read —
 * same reasoning as _components/require-capability.tsx's acting-user gate.
 */
export function RequireStaffSession({
  children,
  signInHref = '/signin',
}: {
  children: React.ReactNode
  signInHref?: string
}) {
  const { status } = useStaffAuth()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') router.replace(signInHref)
  }, [status, router, signInHref])

  if (status !== 'authenticated') {
    return (
      <div className="flex h-full min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }
  return <>{children}</>
}
