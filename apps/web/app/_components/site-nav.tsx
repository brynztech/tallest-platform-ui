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
    <nav className="sticky top-0 z-40 flex h-16 items-center border-b border-border/60 bg-background/85 px-6 backdrop-blur-xl">
      <Link href="/" className="text-[15px] font-semibold tracking-[-0.03em] text-foreground">
        Brynzit
      </Link>

      <div className="flex flex-1 justify-center">
        <Link
          href="/jobs"
          className={cn(
            'rounded-full px-3 py-1 text-sm transition-colors duration-150 ease-out',
            pathname === '/jobs' || pathname.startsWith('/jobs/')
              ? 'bg-secondary text-foreground'
              : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
          )}
        >
          Jobs
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {isLoggedIn ? (
          <>
            <Link href="/dashboard" className="rounded-full px-3 py-1 text-sm text-muted-foreground transition-colors duration-150 ease-out hover:bg-secondary/70 hover:text-foreground">
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
            <Button variant="default" size="sm" className="rounded-full px-4 shadow-sm shadow-primary/15" asChild>
              <Link href="/signup">Join free</Link>
            </Button>
          </>
        )}
      </div>
    </nav>
  )
}
