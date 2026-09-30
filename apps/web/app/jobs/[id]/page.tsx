import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JobDetail } from './_components/job-detail'
import { jobPostingJsonLd } from '../../_lib/job-posting'
import type { PublicJobItem } from '../../_lib/candidate-types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

type Props = { params: Promise<{ id: string }> }

// Fetched on the server so the job is in the HTML search engines read.
// Anonymous on purpose: a signed-in candidate's match is added by the client
// fetch. Next dedupes this call between generateMetadata and the page.
async function getJob(id: string): Promise<PublicJobItem | null> {
  const res = await fetch(`${API_BASE}/api/v1/public/jobs/${encodeURIComponent(id)}`).catch(
    () => null,
  )
  // 404: closed, hidden or deleted. 422: not a job id at all. Both get a real
  // 404, not a 200 page that says "not found". Any other failure falls back to
  // the client fetch, as before.
  if (res?.status === 404 || res?.status === 422) notFound()
  return res?.ok ? res.json() : null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const job = await getJob(id)
  const alternates = { canonical: `/jobs/${id}` }
  if (!job) return { alternates }
  const place = job.location ?? (job.remote_mode === 'remote' ? 'Remote' : null)
  return {
    title: `${job.title}${job.company_name ? ` at ${job.company_name}` : ''}${place ? ` · ${place}` : ''}`,
    description: job.description_summary ?? undefined,
    alternates,
  }
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params
  const job = await getJob(id)
  return (
    <>
      {job && (
        <script
          type="application/ld+json"
          // Escaped so a "</script>" inside a job description cannot end the tag.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jobPostingJsonLd(job)).replace(/</g, '\\u003c'),
          }}
        />
      )}
      <JobDetail id={id} initialJob={job ?? undefined} />
    </>
  )
}
