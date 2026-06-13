'use client'

import { useEffect, useState } from 'react'

export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function init() {
      if (process.env.NEXT_PUBLIC_API_MOCKING === 'enabled') {
        const { worker } = await import('@brynzit/mocks/browser')
        await worker.start({ onUnhandledRequest: 'bypass' })
      }
      setReady(true)
    }
    init()
  }, [])

  if (!ready) return null
  return <>{children}</>
}
