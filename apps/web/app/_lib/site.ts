/** The talent site's public origin. Canonical URLs for jobs and the sitemap's
 *  job entries point here, so search engines credit a single host. */
export const SITE_URL = 'https://talent.trybrynz.com'

/** The company homepage (audience hub) and its pages for companies. */
export const HOME_URL = 'https://trybrynz.com'

/** Pages that live on the homepage host. Any other page belongs to the talent
 *  host. proxy.ts redirects a visitor who asks the wrong host for a page. */
export const HOME_PAGES = ['/startups', '/enterprises', '/frontier-ai', '/iit-talent', '/contact']

/** Which site a request's Host header names. 'other' (an IP, localhost) gets
 *  no redirects, so dev and the plain-IP address keep serving every page. */
export function siteForHost(host: string | null): 'home' | 'talent' | 'other' {
  const name = (host ?? '').split(':')[0].toLowerCase()
  if (name === 'trybrynz.com' || name === 'www.trybrynz.com') return 'home'
  if (name === 'talent.trybrynz.com') return 'talent'
  return 'other'
}

export function isHomePage(pathname: string): boolean {
  return pathname === '/' || HOME_PAGES.some((page) => pathname === page || pathname.startsWith(`${page}/`))
}

/** Where every company-side form sends a visitor: a 15-minute call. */
export const BOOKING_URL = 'https://cal.com/brynztech'
