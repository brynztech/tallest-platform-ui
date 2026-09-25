'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@brynzit/ui/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@brynzit/ui/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@brynzit/ui/components/ui/avatar'
import { cn } from '@brynzit/ui/lib/utils'
import { useCandidateAuth } from './candidate-auth-context'

const NAV_ITEMS = [{ href: '/jobs', label: 'Jobs' }]

export function SiteNav() {
  const { isLoggedIn, candidate, signOut } = useCandidateAuth()
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-40 flex h-16 items-center border-b border-canvas-rule bg-background px-4 sm:px-6">
      <Link href="/" className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-background" />
        </span>
        <span className="text-[18px] leading-6 font-semibold tracking-[-0.02em] text-foreground">Brynz</span>
      </Link>

      <div className="flex flex-1 justify-center">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex h-9 items-center rounded-full px-3 text-[14px] leading-5 font-medium transition-colors duration-150 ease-out sm:px-4',
                active ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted',
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </div>

      <div className="flex items-center gap-2">
        {isLoggedIn ? (
          <>
            <Link
              href="/dashboard"
              className={cn(
                'flex h-9 items-center rounded-full px-3 text-[14px] leading-5 font-medium transition-colors duration-150 ease-out sm:px-4',
                pathname === '/dashboard' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted',
              )}
            >
              Dashboard
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border-control bg-card"
                  aria-label="Account menu"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>{candidate?.email?.[0]?.toUpperCase() ?? 'C'}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile/edit">My Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              className="h-10 rounded-full border-border-control bg-card px-3 text-[14px] leading-5 font-medium shadow-none hover:bg-background sm:px-5"
              asChild
            >
              <Link href="/login">Log in</Link>
            </Button>
            <Button
              className="h-10 rounded-full px-3 text-[14px] leading-5 font-medium text-primary-foreground sm:px-5"
              asChild
            >
              <Link href="/signup">Sign up</Link>
            </Button>
          </>
        )}
      </div>
    </nav>
  )
}
