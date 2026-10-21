import { NextResponse, type NextRequest } from 'next/server'
import { HOME_URL, SITE_URL, isHomePage, siteForHost } from './app/_lib/site'

/** One app, two hosts: trybrynz.com serves the homepage and company pages,
 *  talent.trybrynz.com serves jobs, sign-in and the candidate's account. A page
 *  asked of the wrong host redirects to the right one, so in-app links like
 *  href="/jobs" on the homepage still land on the talent site. */
export function proxy(request: NextRequest) {
  const site = siteForHost(request.headers.get('host'))
  if (site === 'other') return NextResponse.next()

  const { pathname, search } = request.nextUrl
  if (site === 'home' && request.headers.get('host')?.startsWith('www.')) {
    return NextResponse.redirect(`${HOME_URL}${pathname}${search}`, 308)
  }
  if (site === 'talent' && pathname === '/') {
    return NextResponse.redirect(`${SITE_URL}/jobs${search}`, 307)
  }
  const home = isHomePage(pathname)
  if (site === 'home' && !home) return NextResponse.redirect(`${SITE_URL}${pathname}${search}`, 307)
  if (site === 'talent' && home) return NextResponse.redirect(`${HOME_URL}${pathname}${search}`, 307)
  return NextResponse.next()
}

export const config = {
  // Pages only: framework assets, files and the per-host robots/sitemap pass through.
  matcher: ['/((?!_next/|api/|robots\\.txt|sitemap\\.xml|favicon\\.ico|.*\\.[a-zA-Z0-9]+$).*)'],
}
