'use client'

import { useState } from 'react'
import { Button } from '@brynzit/ui/components/ui/button'
import { Input } from '@brynzit/ui/components/ui/input'
import { Label } from '@brynzit/ui/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@brynzit/ui/components/ui/select'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

export interface SearchFilters {
  q: string
  title: string
  skills: string
  location: string
  seniority: string
  limit: number
}

const SENIORITY_OPTIONS = [
  { value: '', label: 'Any seniority' },
  { value: 'intern', label: 'Intern' },
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
  { value: 'director', label: 'Director' },
  { value: 'vp', label: 'VP' },
]

const LIMIT_OPTIONS = [
  { value: '10', label: '10' },
  { value: '25', label: '25' },
  { value: '50', label: '50' },
]

interface FilterSidebarProps {
  onSubmit: (filters: SearchFilters) => void
  isLoading: boolean
}

export function FilterSidebar({ onSubmit, isLoading }: FilterSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [liveFilters, setLiveFilters] = useState<SearchFilters>({
    q: '',
    title: '',
    skills: '',
    location: '',
    seniority: '',
    limit: 10,
  })

  function handleSubmit() {
    onSubmit(liveFilters)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  function updateFilter<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) {
    setLiveFilters((prev) => ({ ...prev, [key]: value }))
  }

  if (isCollapsed) {
    return (
      <div className="flex w-12 flex-shrink-0 flex-col items-center border-r border-[#ECEAE4] pt-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
          aria-label="Expand filter sidebar"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex w-[280px] flex-shrink-0 flex-col overflow-y-auto border-r border-[#ECEAE4]">
      {/* Sidebar header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <span className="text-[11px] font-medium tracking-[0.09em] text-[#908E8B] uppercase">
          Filters
        </span>
        <button
          onClick={() => setIsCollapsed(true)}
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
          aria-label="Collapse filter sidebar"
        >
          <ChevronLeft className="size-4" />
        </button>
      </div>

      {/* Filter form */}
      <div className="flex flex-1 flex-col gap-4 px-4 pb-4">
        {/* Search query */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-[13px] font-medium text-foreground">Search</Label>
          <Input
            placeholder="e.g. Python engineer with distributed systems experience"
            value={liveFilters.q}
            onChange={(e) => updateFilter('q', e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-card text-sm"
          />
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-[13px] font-medium text-foreground">Title</Label>
          <Input
            placeholder="e.g. Backend Engineer"
            value={liveFilters.title}
            onChange={(e) => updateFilter('title', e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-card text-sm"
          />
        </div>

        {/* Skills */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-[13px] font-medium text-foreground">Skills</Label>
          <Input
            placeholder="python, react, fastapi — comma-separated"
            value={liveFilters.skills}
            onChange={(e) => updateFilter('skills', e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-card text-sm"
          />
        </div>

        {/* Location */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-[13px] font-medium text-foreground">Location</Label>
          <Input
            placeholder="e.g. London, Remote"
            value={liveFilters.location}
            onChange={(e) => updateFilter('location', e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-card text-sm"
          />
        </div>

        {/* Seniority */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-[13px] font-medium text-foreground">Seniority</Label>
          <Select
            value={liveFilters.seniority}
            onValueChange={(val) => updateFilter('seniority', val)}
          >
            <SelectTrigger className="w-full bg-card text-sm">
              <SelectValue placeholder="Any seniority" />
            </SelectTrigger>
            <SelectContent>
              {SENIORITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value || '__any__'} value={opt.value || '__any__'}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Max results */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-[13px] font-medium text-foreground">Max results</Label>
          <Select
            value={String(liveFilters.limit)}
            onValueChange={(val) => updateFilter('limit', parseInt(val, 10))}
          >
            <SelectTrigger className="w-full bg-card text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LIMIT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sidebar footer */}
      <div className="mt-auto border-t border-[#ECEAE4] px-4 py-3">
        <Button
          variant="default"
          className="w-full"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Searching…
            </>
          ) : (
            <>
              <Search className="size-4" />
              Search Candidates
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
