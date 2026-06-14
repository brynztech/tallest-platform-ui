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

export function SiteNav() {
  const { isLoggedIn, candidate, signOut } = useCandidateAuth()
  const pathname = usePathname()

  return (
    <nav className="flex h-12 items-center border-b border-border bg-background px-6">
      <Link href="/" className="text-base font-semibold tracking-tight text-foreground">
        Brynzit
      </Link>

      <div className="flex flex-1 justify-center">
        <Link
          href="/jobs"
          className={cn(
            'text-sm transition-colors',
            pathname === '/jobs' || pathname.startsWith('/jobs/')
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Jobs
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {isLoggedIn ? (
          <>
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2" aria-label="Account menu">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>
                      {candidate?.email?.[0]?.toUpperCase() ?? 'C'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile/edit">My Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={signOut}
                  className="text-destructive focus:text-destructive"
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button variant="default" size="sm" asChild>
              <Link href="/signup">Join free</Link>
            </Button>
          </>
        )}
      </div>
    </nav>
  )
}
