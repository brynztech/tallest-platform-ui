'use client'

import { useEffect, useState } from 'react'

const MOCKING = process.env.NEXT_PUBLIC_API_MOCKING === 'enabled'

export function MSWProvider({ children }: { children: React.ReactNode }) {
  // Only a mocked dev session waits for the worker. Starting every render at
  // "not ready" made the server send an empty <body> in production, so search
  // engines saw no content on any page.
  const [ready, setReady] = useState(!MOCKING)

  useEffect(() => {
    if (!MOCKING) return
    async function init() {
      try {
        const { worker } = await import('@brynzit/mocks/browser')
        await worker.start({ onUnhandledRequest: 'bypass' })
      } catch (err) {
        console.error('[MSW] Failed to start service worker:', err)
      } finally {
        setReady(true)
      }
    }
    init()
  }, [])

  if (!ready) return null
  return <>{children}</>
}
