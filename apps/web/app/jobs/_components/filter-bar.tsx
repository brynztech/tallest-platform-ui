'use client'
import { useState } from 'react'
import { Input } from '@brynzit/ui/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@brynzit/ui/components/ui/select'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Button } from '@brynzit/ui/components/ui/button'

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
  onSearchChange: (text: string) => void
  onFiltersChange: (filters: JobFilters) => void
  /** Shows the "Match my profile" toggle only when there is a profile to match. */
  isPersonalized?: boolean
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

function labelFor(options: Array<{ value: string; label: string }>, value: string): string {
  return options.find(option => option.value === value)?.label ?? value
}

const PILL = 'h-11 rounded-full border-border/80 bg-background/80 px-5 shadow-none'

export function FilterBar({ onSearchChange, onFiltersChange, isPersonalized }: FilterBarProps) {
  const [filters, setFilters] = useState<JobFilters>(EMPTY_FILTERS)
  const [searchText, setSearchText] = useState('')

  function handleFilterChange(key: keyof JobFilters, value: string | boolean) {
    const next = { ...filters, [key]: value }
    setFilters(next)
    onFiltersChange(next)  // immediate — no debounce per D-08
  }

  function clearAll() {
    setFilters(EMPTY_FILTERS)
    onFiltersChange(EMPTY_FILTERS)
    setSearchText('')
    onSearchChange('')
  }

  const activeChips: Array<{ key: keyof JobFilters; label: string; reset: string | boolean }> = []
  if (filters.role_type) activeChips.push({ key: 'role_type', label: ROLE_LABELS[filters.role_type] ?? filters.role_type, reset: '' })
  if (filters.seniority) activeChips.push({ key: 'seniority', label: filters.seniority.charAt(0).toUpperCase() + filters.seniority.slice(1), reset: '' })
  if (filters.country) activeChips.push({ key: 'country', label: labelFor(COUNTRIES, filters.country), reset: '' })
  if (filters.remote_mode) activeChips.push({ key: 'remote_mode', label: labelFor(REMOTE_MODES, filters.remote_mode), reset: '' })
  if (filters.posted_within_days) activeChips.push({ key: 'posted_within_days', label: labelFor(POSTED_WINDOWS, filters.posted_within_days), reset: '' })
  if (filters.location) activeChips.push({ key: 'location', label: filters.location, reset: '' })
  if (filters.skills) activeChips.push({ key: 'skills', label: filters.skills, reset: '' })
  if (filters.remote) activeChips.push({ key: 'remote', label: 'Remote', reset: false })
  if (filters.has_compensation) activeChips.push({ key: 'has_compensation', label: 'Pay listed', reset: false })
  if (filters.match_only) activeChips.push({ key: 'match_only', label: 'Matches my profile', reset: false })

  const hasActiveFilters = activeChips.length > 0

  return (
    <div className="rounded-[1.25rem] border border-border/70 bg-card/75 p-3 shadow-sm shadow-foreground/[0.03] backdrop-blur">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          className={`${PILL} w-full md:w-[280px]`}
          placeholder="Search roles, companies…"
          value={searchText}
          onChange={e => { setSearchText(e.target.value); onSearchChange(e.target.value) }}
        />
        <Input
          className={`${PILL} w-full sm:w-[160px]`}
          placeholder="Skills"
          value={filters.skills}
          onChange={e => handleFilterChange('skills', e.target.value)}
        />
        <Select
          value={filters.country || 'all'}
          onValueChange={v => handleFilterChange('country', v === 'all' ? '' : v)}
        >
          <SelectTrigger className={`${PILL} w-full sm:w-[150px]`} aria-label="Country">
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
          <SelectTrigger className={`${PILL} w-full sm:w-[140px]`} aria-label="Work setup">
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
          <SelectTrigger className={`${PILL} w-full sm:w-[140px]`} aria-label="Role type">
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
          <SelectTrigger className={`${PILL} w-full sm:w-[130px]`} aria-label="Seniority">
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
          <SelectTrigger className={`${PILL} w-full sm:w-[150px]`} aria-label="Date posted">
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
          className="h-11 rounded-full px-5"
          aria-pressed={filters.has_compensation}
          onClick={() => handleFilterChange('has_compensation', !filters.has_compensation)}
        >
          Pay listed
        </Button>
        {isPersonalized && (
          <Button
            variant={filters.match_only ? 'default' : 'outline'}
            size="sm"
            className="h-11 rounded-full px-5"
            aria-pressed={filters.match_only}
            onClick={() => handleFilterChange('match_only', !filters.match_only)}
          >
            Match my profile
          </Button>
        )}
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="ml-auto rounded-full px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            Clear all
          </button>
        )}
      </div>
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 px-1 pt-3">
          {activeChips.map(chip => (
            <Badge key={chip.key} variant="secondary" className="h-9 gap-1 rounded-full px-3">
              {chip.label}
              <button
                onClick={() => handleFilterChange(chip.key, chip.reset)}
                aria-label={`Remove ${chip.label} filter`}
                className="ml-1 rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
