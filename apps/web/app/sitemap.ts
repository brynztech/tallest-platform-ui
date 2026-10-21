import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { HOME_PAGES, HOME_URL, SITE_URL, siteForHost } from './_lib/site'
import type { PublicJobsResponse } from './_lib/candidate-types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// Built per request from the live feed, so it never lists a closed job and the
// build does not depend on the API being up.
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // The homepage host lists its own pages; every other host lists the talent site.
  if (siteForHost((await headers()).get('host')) === 'home') {
    return [{ url: HOME_URL }, ...HOME_PAGES.map((page) => ({ url: `${HOME_URL}${page}` }))]
  }

  const jobs: MetadataRoute.Sitemap = []
  // ponytail: walks the public feed, which ranks at most 2,000 jobs. Add a
  // backend endpoint listing every visible job id once inventory passes that.
  let cursor: string | null = null
  do {
    const res: Response | null = await fetch(
      `${API_BASE}/api/v1/public/jobs?limit=50${cursor ? `&cursor=${cursor}` : ''}`,
    ).catch(() => null)
    if (!res?.ok) break
    const page: PublicJobsResponse = await res.json()
    for (const job of page.items) {
      jobs.push({ url: `${SITE_URL}/jobs/${job.id}`, lastModified: job.date_posted || undefined })
    }
    cursor = page.next_cursor
  } while (cursor)

  return [{ url: `${SITE_URL}/jobs` }, ...jobs]
}
