import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { HOME_URL, SITE_URL, siteForHost } from './_lib/site'

// Per host: each site's robots.txt names its own sitemap, since a sitemap may
// only list URLs on the host that serves it.
export const dynamic = 'force-dynamic'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = siteForHost((await headers()).get('host')) === 'home' ? HOME_URL : SITE_URL
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Signed-in and sign-in pages: nothing to rank, and no crawl budget to spend.
      disallow: ['/dashboard', '/profile', '/onboarding', '/login', '/signup', '/sso-callback'],
    },
    sitemap: `${origin}/sitemap.xml`,
  }
}
