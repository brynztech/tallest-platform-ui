import type { Metadata } from 'next'

// /jobs reads ?q= (useSearchParams) for its first render. Rendering per request
// lets the server use the real query instead of skipping the page's HTML.
export const dynamic = 'force-dynamic'

// /jobs itself is a client page, so its metadata lives here. Filtered views
// (/jobs?q=…) point their canonical at /jobs; job pages set their own.
export const metadata: Metadata = {
  title: 'Jobs in India and the US',
  description:
    'Open roles from company career pages across India and the US. Filter by remote, hybrid or on-site, role type and level.',
  alternates: { canonical: '/jobs' },
}

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return children
}
