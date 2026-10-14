'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { startMotion } from '../_lib/motion'

/** Runs the data-* motion hooks for whatever page is on screen, and stops them on navigation. */
export function SiteMotion() {
  const pathname = usePathname()
  useEffect(() => startMotion(document), [pathname])
  return null
}
