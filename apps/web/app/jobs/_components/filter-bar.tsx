'use client'
import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@brynzit/ui/components/ui/select'
import { Button } from '@brynzit/ui/components/ui/button'
import { SearchField } from '../../_components/search-field'
import { CategoryLinks } from '../../_components/category-links'
import { RemovableChip } from '../../_components/removable-chip'

export interface JobFilters {
  role_type: string
  seniority: string
  location: string
  skills: string
  /** Legacy boolean, kept so existing callers keep working. `remote_mode` wins
   *  when both are set. */
  remote: boolean
  country: string
  /** onsite | hybrid | remote — supersedes `remote`, which cannot say "hybrid". */
  remote_mode: string
  /** Freshness window in days. '' means no limit. */
  posted_within_days: string
  has_compensation: boolean
  /** Opt-in: hide jobs that do not match the profile at all. Off by default,
   *  because a candidate who cannot find a role they know exists stops trusting
   *  the platform. */
  match_only: boolean
}

export const EMPTY_FILTERS: JobFilters = {
  role_type: '',
  seniority: '',
  location: '',
  skills: '',
  remote: false,
  country: '',
  remote_mode: '',
  posted_within_days: '',
  has_compensation: false,
  match_only: false,
}

interface FilterBarProps {
  /** Every keystroke. The page debounces it before querying. */
  onSearchChange: (text: string) => void
  /** Enter, the arrow button or a category link. The page queries immediately. */
  onSearchSubmit: (text: string) => void
  onFiltersChange: (filters: JobFilters) => void
  /** Shows the "Match my profile" toggle only when there is a profile to match. */
  isPersonalized?: boolean
  /** Seeds the search input, e.g. from a `?q=` handed off by the hero search. */
  initialSearch?: string
}

const ROLE_TYPES = ['full_time', 'part_time', 'contract', 'internship', 'temporary']
const ROLE_LABELS: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  temporary: 'Temporary',
}
const SENIORITY_LEVELS = ['intern', 'junior', 'mid', 'senior', 'staff', 'lead', 'principal', 'director']
const COUNTRIES: Array<{ value: string; label: string }> = [
  { value: 'US', label: 'United States' },
  { value: 'IN', label: 'India' },
]
const REMOTE_MODES: Array<{ value: string; label: string }> = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
]
const POSTED_WINDOWS: Array<{ value: string; label: string }> = [
  { value: '1', label: 'Last 24 hours' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
]
const CATEGORIES = ['AI Engineer', 'Backend', 'Product Engineer', 'Frontend', 'Devops & AI', 'Design', 'Recruiting']

function labelFor(options: Array<{ value: string; label: string }>, value: string): string {
  return options.find(option => option.value === value)?.label ?? value
}

// The trigger already ships h-9 (36px), text-sm and gap-2, which is the pill size.
// Anything taller needs `data-[size=default]:h-*`: a plain `h-*` loses to it on specificity.
// Phones get 40px pills that sit in one swipeable row (shrink-0 keeps them from squashing).
const PILL = 'shrink-0 rounded-full border-border-control bg-card px-4 shadow-none data-[size=default]:h-10 sm:data-[size=default]:h-9'
const TOGGLE = 'h-10 shrink-0 rounded-full px-4 text-[14px] leading-5 font-normal shadow-none sm:h-9'
const TOGGLE_OFF = 'border-border-control bg-card hover:bg-background'

export function FilterBar({ onSearchChange, onSearchSubmit, onFiltersChange, isPersonalized, initialSearch }: FilterBarProps) {
  const [filters, setFilters] = useState<JobFilters>(EMPTY_FILTERS)
  const [searchText, setSearchText] = useState(initialSearch ?? '')

  function handleFilterChange(key: keyof JobFilters, value: string | boolean) {
    const next = { ...filters, [key]: value }
    setFilters(next)
    onFiltersChange(next)  // immediate — no debounce per D-08
  }

  function handleSearchChange(text: string) {
    setSearchText(text)
    onSearchChange(text)
  }

  function selectCategory(label: string) {
    setSearchText(label)
    onSearchSubmit(label)
  }

  function clearAll() {
    setFilters(EMPTY_FILTERS)
    onFiltersChange(EMPTY_FILTERS)
    setSearchText('')
    onSearchSubmit('')
  }

  const activeChips: Array<{ key: keyof JobFilters; label: string; reset: string | boolean }> = []
  if (filters.role_type) activeChips.push({ key: 'role_type', label: ROLE_LABELS[filters.role_type] ?? filters.role_type, reset: '' })
  if (filters.seniority) activeChips.push({ key: 'seniority', label: filters.seniority.charAt(0).toUpperCase() + filters.seniority.slice(1), reset: '' })
  if (filters.country) activeChips.push({ key: 'country', label: labelFor(COUNTRIES, filters.country), reset: '' })
  if (filters.remote_mode) activeChips.push({ key: 'remote_mode', label: labelFor(REMOTE_MODES, filters.remote_mode), reset: '' })
  if (filters.posted_within_days) activeChips.push({ key: 'posted_within_days', label: labelFor(POSTED_WINDOWS, filters.posted_within_days), reset: '' })
  if (filters.remote) activeChips.push({ key: 'remote', label: 'Remote', reset: false })
  if (filters.has_compensation) activeChips.push({ key: 'has_compensation', label: 'Pay listed', reset: false })
  if (filters.match_only) activeChips.push({ key: 'match_only', label: 'Matches my profile', reset: false })

  const hasActiveFilters = activeChips.length > 0

  return (
    <div className="flex flex-col items-center">
      <SearchField
        id="jobs-search"
        placeholder="Search roles or companies"
        value={searchText}
        onChange={handleSearchChange}
        onSubmit={() => onSearchSubmit(searchText)}
      />

      <div className="-mx-4 mt-3 flex items-center gap-2 self-stretch overflow-x-auto px-4 py-1 [scrollbar-width:none] sm:mx-0 sm:mt-4 sm:flex-wrap sm:justify-center sm:self-center sm:overflow-visible sm:px-0 sm:py-0 [&::-webkit-scrollbar]:hidden">
        <Select
          value={filters.country || 'all'}
          onValueChange={v => handleFilterChange('country', v === 'all' ? '' : v)}
        >
          <SelectTrigger className={PILL} aria-label="Country">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All countries</SelectItem>
            {COUNTRIES.map(c => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.remote_mode || 'all'}
          onValueChange={v => handleFilterChange('remote_mode', v === 'all' ? '' : v)}
        >
          <SelectTrigger className={PILL} aria-label="Work setup">
            <SelectValue placeholder="Work setup" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any setup</SelectItem>
            {REMOTE_MODES.map(m => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.role_type || 'all'}
          onValueChange={v => handleFilterChange('role_type', v === 'all' ? '' : v)}
        >
          <SelectTrigger className={PILL} aria-label="Role type">
            <SelectValue placeholder="Role type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {ROLE_TYPES.map(t => (
              <SelectItem key={t} value={t}>{ROLE_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.seniority || 'all'}
          onValueChange={v => handleFilterChange('seniority', v === 'all' ? '' : v)}
        >
          <SelectTrigger className={PILL} aria-label="Seniority">
            <SelectValue placeholder="Seniority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            {SENIORITY_LEVELS.map(s => (
              <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.posted_within_days || 'all'}
          onValueChange={v => handleFilterChange('posted_within_days', v === 'all' ? '' : v)}
        >
          <SelectTrigger className={PILL} aria-label="Date posted">
            <SelectValue placeholder="Date posted" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any time</SelectItem>
            {POSTED_WINDOWS.map(w => (
              <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={filters.has_compensation ? 'default' : 'outline'}
          size="sm"
          className={`${TOGGLE} ${filters.has_compensation ? '' : TOGGLE_OFF}`}
          aria-pressed={filters.has_compensation}
          onClick={() => handleFilterChange('has_compensation', !filters.has_compensation)}
        >
          Pay listed
        </Button>
        {isPersonalized && (
          <Button
            variant={filters.match_only ? 'default' : 'outline'}
            size="sm"
            className={`${TOGGLE} ${filters.match_only ? '' : TOGGLE_OFF}`}
            aria-pressed={filters.match_only}
            onClick={() => handleFilterChange('match_only', !filters.match_only)}
          >
            Match my profile
          </Button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {activeChips.map(chip => (
            <RemovableChip
              key={chip.key}
              label={chip.label}
              removeLabel={`Remove ${chip.label} filter`}
              onRemove={() => handleFilterChange(chip.key, chip.reset)}
            />
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="rounded-full px-3 py-1 text-[14px] leading-5 text-muted-foreground underline underline-offset-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-link"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="mt-1 self-stretch sm:mt-4 sm:self-center">
        <CategoryLinks items={CATEGORIES} onSelect={selectCategory} />
      </div>
    </div>
  )
}
