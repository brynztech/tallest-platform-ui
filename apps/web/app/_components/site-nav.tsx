'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@brynzit/ui/components/ui/dropdown-menu'
import { BrynzLogo } from './brynz-logo'
import { useCandidateAuth } from './candidate-auth-context'

const NAV_ITEMS = [
  { href: '/jobs', label: 'For Talent' },
  { href: '/startups', label: 'Startups' },
  { href: '/enterprises', label: 'Enterprises' },
  { href: '/frontier-ai', label: 'Frontier AI' },
  { href: '/iit-talent', label: 'IIT Talent' },
]

// Each page's header button points at that page's own form, as in the design source.
const PAGE_CTA: Record<string, { href: string; label: string }> = {
  '/startups': { href: '#brief', label: 'Get 5 vetted profiles' },
  '/enterprises': { href: '#talk', label: 'Talk to us' },
  '/frontier-ai': { href: '#lab', label: 'Hire for Frontier' },
  '/iit-talent': { href: '#apply', label: 'Apply to join' },
  '/jobs': { href: '/signup', label: 'Create profile' },
}
const DEFAULT_CTA = { href: '/startups#brief', label: 'Hire talent' }

export function SiteNav() {
  const { isLoggedIn, candidate, signOut } = useCandidateAuth()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // A route change closes the phone menu.
  useEffect(() => setMenuOpen(false), [pathname])

  const cta = (pathname === '/jobs' && isLoggedIn ? null : PAGE_CTA[pathname]) ?? DEFAULT_CTA
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <header className={scrolled ? 'nav scrolled' : 'nav'}>
      <div className="wrap nav-in">
        <BrynzLogo />
        <nav className="nav-links" aria-label="Main">
          {NAV_ITEMS.map(item => (
            <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? 'page' : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="nav-cta">
          {isLoggedIn ? (
            <>
              <Link className="text-link" href="/dashboard" aria-current={isActive('/dashboard') ? 'page' : undefined}>
                Dashboard
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="avatar-btn" aria-label="Account menu">
                    {candidate?.email?.[0]?.toUpperCase() ?? 'C'}
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
            <Link className="text-link" href="/login">
              Log in
            </Link>
          )}
          <Link className="btn btn-primary btn-sm" href={cta.href}>
            {cta.label}
          </Link>
          <button
            className="menu-btn"
            type="button"
            aria-label="Menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(open => !open)}
          >
            <span />
          </button>
        </div>
      </div>
      <div className="mobile-menu wrap" id="mobile-menu" hidden={!menuOpen}>
        {NAV_ITEMS.map(item => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
        <Link href="/contact">Contact</Link>
        {isLoggedIn ? (
          <>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/profile/edit">My Profile</Link>
            <button type="button" className="mobile-menu-link" onClick={signOut}>
              Sign out
            </button>
          </>
        ) : (
          <Link href="/login">Log in</Link>
        )}
        <Link className="btn btn-primary" href={cta.href}>
          {cta.label}
        </Link>
      </div>
    </header>
  )
}
