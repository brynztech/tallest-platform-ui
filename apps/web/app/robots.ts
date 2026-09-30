import type { MetadataRoute } from 'next'
import { SITE_URL } from './_lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Signed-in and sign-in pages: nothing to rank, and no crawl budget to spend.
      disallow: ['/dashboard', '/profile', '/onboarding', '/login', '/signup', '/sso-callback'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
