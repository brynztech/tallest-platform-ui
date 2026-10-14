'use client'
import type { ComponentProps } from 'react'

export function OrDivider() {
  return (
    <div className="divider" aria-hidden="true">
      or
    </div>
  )
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="notice err">
      {message}
    </p>
  )
}

/** A quiet in-card action: forgot password, resend the code, go back. */
export function TextAction(props: ComponentProps<'button'>) {
  return (
    <button type="button" {...props} className="inline-link cursor-pointer disabled:opacity-50" />
  )
}
