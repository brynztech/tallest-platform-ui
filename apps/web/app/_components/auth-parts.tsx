'use client'
import type { ComponentProps } from 'react'

export function OrDivider() {
  return (
    <div className="my-5 flex items-center gap-3 text-[14px] leading-5 text-muted-foreground" aria-hidden="true">
      <span className="h-px flex-1 bg-border" />
      or
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="text-[14px] leading-5 text-destructive">
      {message}
    </p>
  )
}

/** A quiet in-card action: forgot password, resend the code, go back. */
export function TextAction(props: ComponentProps<'button'>) {
  return (
    <button
      type="button"
      {...props}
      className="-my-2.5 rounded py-2.5 text-[14px] leading-5 font-medium text-foreground underline underline-offset-4 hover:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link disabled:opacity-50"
    />
  )
}
