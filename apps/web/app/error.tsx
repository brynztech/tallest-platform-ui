'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground text-sm">
        Reload the page — if the problem continues, the team has been notified.
      </p>
      <button
        onClick={reset}
        className="text-primary text-sm underline underline-offset-4"
      >
        Try again
      </button>
    </div>
  )
}
