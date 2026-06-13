'use client'

import { useEffect, useState } from 'react'

export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_API_MOCKING !== 'enabled') {
      setReady(true)
      return
    }
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
