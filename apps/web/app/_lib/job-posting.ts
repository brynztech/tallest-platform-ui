import type { PublicJobItem } from './candidate-types'

// schema.org employmentType vocabulary.
const EMPLOYMENT_TYPE_MAP: Record<PublicJobItem['employment_type'], string> = {
  full_time: 'FULL_TIME',
  part_time: 'PART_TIME',
  contract: 'CONTRACTOR',
  internship: 'INTERN',
  temporary: 'TEMPORARY',
}

const PERIOD_UNIT: Record<'year' | 'month' | 'hour', string> = {
  year: 'YEAR',
  month: 'MONTH',
  hour: 'HOUR',
}

// The job pipeline only keeps US and India postings.
const COUNTRY_NAMES: Record<string, string> = { US: 'USA', IN: 'India' }

/** schema.org JobPosting for Google's job search, built from what the job page
 *  shows. Unknown fields are left out (JSON.stringify drops undefined), never
 *  guessed. */
export function jobPostingJsonLd(job: PublicJobItem): Record<string, unknown> {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description_summary ?? job.title,
    datePosted: job.date_posted || undefined,
    employmentType: EMPLOYMENT_TYPE_MAP[job.employment_type],
    identifier: { '@type': 'PropertyValue', name: 'Brynz', value: job.id },
    // Scraped roles are applied for on the employer's own site, not here.
    directApply: job.job_kind !== 'scraped',
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company_name ?? 'Brynzit Client',
      logo: job.company_logo_url ?? undefined,
    },
  }
  if (job.city || job.country) {
    jsonLd.jobLocation = {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.city ?? undefined,
        addressCountry: job.country ?? undefined,
      },
    }
  }
  if (job.remote_mode === 'remote') {
    jsonLd.jobLocationType = 'TELECOMMUTE'
    if (job.country) {
      jsonLd.applicantLocationRequirements = {
        '@type': 'Country',
        name: COUNTRY_NAMES[job.country] ?? job.country,
      }
    }
  }
  // Only emit baseSalary when the currency and period are actually known.
  // This previously hardcoded USD/YEAR, which would publish an INR salary to
  // Google as dollars — a ~85x misstatement in indexed structured data.
  if (job.compensation_min && job.compensation_currency && job.compensation_period) {
    jsonLd.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: job.compensation_currency,
      value: {
        '@type': 'QuantitativeValue',
        minValue: job.compensation_min,
        maxValue: job.compensation_max ?? job.compensation_min,
        unitText: PERIOD_UNIT[job.compensation_period],
      },
    }
  }
  return jsonLd
}
