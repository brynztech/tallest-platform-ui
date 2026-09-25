'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SearchField } from './search-field'
import { CategoryLinks } from './category-links'

const CATEGORIES = [
  'AI Engineer',
  'Backend',
  'FWP',
  'Product Engineer',
  'Frontend',
  'Devops & AI',
  'Design',
  'Recruiting',
]

export function HeroSection() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  function submitSearch() {
    const q = query.trim()
    router.push(q ? `/jobs?q=${encodeURIComponent(q)}` : '/jobs')
  }

  return (
    <div className="flex w-full max-w-[1120px] flex-col items-center text-center">
      <span className="mb-5 flex items-center gap-2 rounded-full border border-border-control bg-card px-3.5 py-1.5 text-[14px] leading-5 text-muted-foreground shadow-badge">
        Trusted by
        <span className="flex h-5 w-5 items-center justify-center rounded-[6px] bg-[#F26B21] text-[11px] font-bold text-white">
          Y
        </span>
        Combinator
      </span>

      <h1 className="text-[34px] leading-[38px] font-semibold tracking-[-0.035em] text-balance text-foreground sm:text-[48px] sm:leading-[52px]">
        Your AI Job Search Engine
      </h1>

      <p className="mt-4 max-w-[600px] text-[16px] leading-[26px] text-balance text-muted-foreground">
        Brynz watches 50,000+ career pages across Workday, Greenhouse, Lever, Ashby and 15+ more
        ATSes, and submits a tailored resume the moment a fitting role goes live.
      </p>

      <div className="mt-8 flex w-full justify-center">
        <SearchField
          id="hero-search"
          label="Let's Find Your Next Role?"
          placeholder="Frontend"
          value={query}
          onChange={setQuery}
          onSubmit={submitSearch}
        />
      </div>

      <div className="mt-5">
        <CategoryLinks items={CATEGORIES} />
      </div>
    </div>
  )
}
