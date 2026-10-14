'use client'

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

type Option = { value: string; label: string }

const SELECTS: Array<{ key: 'country' | 'remote_mode' | 'role_type' | 'seniority' | 'posted_within_days'; label: string; any: string; options: Option[] }> = [
  { key: 'country', label: 'Country', any: 'Any country', options: [{ value: 'US', label: 'United States' }, { value: 'IN', label: 'India' }] },
  { key: 'remote_mode', label: 'Workplace', any: 'Any workplace', options: [{ value: 'remote', label: 'Remote' }, { value: 'hybrid', label: 'Hybrid' }, { value: 'onsite', label: 'Onsite' }] },
  {
    key: 'role_type',
    label: 'Role type',
    any: 'Any type',
    options: [
      { value: 'full_time', label: 'Full-time' },
      { value: 'part_time', label: 'Part-time' },
      { value: 'contract', label: 'Contract' },
      { value: 'internship', label: 'Internship' },
      { value: 'temporary', label: 'Temporary' },
    ],
  },
  {
    key: 'seniority',
    label: 'Seniority',
    any: 'Any level',
    options: ['intern', 'junior', 'mid', 'senior', 'staff', 'lead', 'principal', 'director'].map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) })),
  },
  { key: 'posted_within_days', label: 'Date posted', any: 'Any time', options: [{ value: '1', label: 'Last 24 hours' }, { value: '7', label: 'Last 7 days' }, { value: '30', label: 'Last 30 days' }] },
]

interface FilterBarProps {
  filters: JobFilters
  onFiltersChange: (filters: JobFilters) => void
  /** Shows the "Match my profile" toggle only when there is a profile to match. */
  isPersonalized?: boolean
  /** Shows "Clear filters" when the search or any filter is set. */
  canClear: boolean
  onClear: () => void
}

export function FilterBar({ filters, onFiltersChange, isPersonalized, canClear, onClear }: FilterBarProps) {
  const set = (key: keyof JobFilters, value: string | boolean) => onFiltersChange({ ...filters, [key]: value })

  return (
    <div className="filters">
      {SELECTS.map(s => (
        <select key={s.key} aria-label={s.label} value={filters[s.key]} onChange={e => set(s.key, e.target.value)}>
          <option value="">{s.any}</option>
          {s.options.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}
      <button className="toggle" type="button" aria-pressed={filters.has_compensation} onClick={() => set('has_compensation', !filters.has_compensation)}>
        Pay listed
      </button>
      {isPersonalized && (
        <button className="toggle" type="button" aria-pressed={filters.match_only} onClick={() => set('match_only', !filters.match_only)}>
          Match my profile
        </button>
      )}
      {canClear && (
        <button className="clear" type="button" onClick={onClear}>
          Clear filters
        </button>
      )}
    </div>
  )
}
