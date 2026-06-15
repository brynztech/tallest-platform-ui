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
  remote: boolean
}

interface FilterBarProps {
  onSearchChange: (text: string) => void
  onFiltersChange: (filters: JobFilters) => void
}

const ROLE_TYPES = ['full_time', 'part_time', 'contract']
const ROLE_LABELS: Record<string, string> = { full_time: 'Full-time', part_time: 'Part-time', contract: 'Contract' }
const SENIORITY_LEVELS = ['junior', 'mid', 'senior', 'staff', 'principal']

export function FilterBar({ onSearchChange, onFiltersChange }: FilterBarProps) {
  const [filters, setFilters] = useState<JobFilters>({
    role_type: '',
    seniority: '',
    location: '',
    skills: '',
    remote: false,
  })
  const [searchText, setSearchText] = useState('')

  function handleFilterChange(key: keyof JobFilters, value: string | boolean) {
    const next = { ...filters, [key]: value }
    setFilters(next)
    onFiltersChange(next)  // immediate — no debounce per D-08
  }

  function clearAll() {
    const reset = { role_type: '', seniority: '', location: '', skills: '', remote: false }
    setFilters(reset)
    onFiltersChange(reset)
    setSearchText('')
    onSearchChange('')
  }

  const hasActiveFilters =
    filters.role_type || filters.seniority || filters.location || filters.skills || filters.remote

  return (
    <div>
      <div className="flex h-14 items-center gap-3 border-b border-border bg-background px-6">
        <Input
          className="w-[280px]"
          placeholder="Search roles, skills…"
          value={searchText}
          onChange={e => { setSearchText(e.target.value); onSearchChange(e.target.value) }}
        />
        <Input
          className="w-[180px]"
          placeholder="Location"
          value={filters.location}
          onChange={e => handleFilterChange('location', e.target.value)}
        />
        <Input
          className="w-[180px]"
          placeholder="Skills"
          value={filters.skills}
          onChange={e => handleFilterChange('skills', e.target.value)}
        />
        <Select
          value={filters.role_type || 'all'}
          onValueChange={v => handleFilterChange('role_type', v === 'all' ? '' : v)}
        >
          <SelectTrigger className="w-[140px]">
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
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Seniority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            {SENIORITY_LEVELS.map(s => (
              <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={filters.remote ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFilterChange('remote', !filters.remote)}
        >
          Remote
        </Button>
        {hasActiveFilters && (
          <button onClick={clearAll} className="ml-auto rounded-sm text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1">
            Clear all
          </button>
        )}
      </div>
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 px-6 py-2">
          {filters.role_type && (
            <Badge variant="secondary" className="h-9 gap-1 rounded-full px-3">
              {ROLE_LABELS[filters.role_type]}
              <button
                onClick={() => handleFilterChange('role_type', '')}
                aria-label="Remove role type filter"
                className="ml-1 rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              >×</button>
            </Badge>
          )}
          {filters.seniority && (
            <Badge variant="secondary" className="h-9 gap-1 rounded-full px-3">
              {filters.seniority.charAt(0).toUpperCase() + filters.seniority.slice(1)}
              <button
                onClick={() => handleFilterChange('seniority', '')}
                aria-label="Remove seniority filter"
                className="ml-1 rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              >×</button>
            </Badge>
          )}
          {filters.location && (
            <Badge variant="secondary" className="h-9 gap-1 rounded-full px-3">
              {filters.location}
              <button
                onClick={() => handleFilterChange('location', '')}
                aria-label="Remove location filter"
                className="ml-1 rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              >×</button>
            </Badge>
          )}
          {filters.skills && (
            <Badge variant="secondary" className="h-9 gap-1 rounded-full px-3">
              {filters.skills}
              <button
                onClick={() => handleFilterChange('skills', '')}
                aria-label="Remove skills filter"
                className="ml-1 rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              >×</button>
            </Badge>
          )}
          {filters.remote && (
            <Badge variant="secondary" className="h-9 gap-1 rounded-full px-3">
              Remote
              <button
                onClick={() => handleFilterChange('remote', false)}
                aria-label="Remove remote filter"
                className="ml-1 rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              >×</button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
