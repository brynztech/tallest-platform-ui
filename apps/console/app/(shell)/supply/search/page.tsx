'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { FilterSidebar } from './_components/filter-sidebar'
import type { SearchFilters } from './_components/filter-sidebar'
import { CandidateResultCard } from './_components/candidate-result-card'
import { CandidateProfileSheet } from '@/(shell)/_components/candidate-profile-sheet'
import { ShortcutOverlay } from '@/(shell)/bd/leads/_components/shortcut-overlay'

export default function SupplySearchPage() {
  // Separate live (form editing) from submitted (triggers query) filters
  const [submittedFilters, setSubmittedFilters] = useState<SearchFilters | null>(null)
  const [searchSubmitted, setSearchSubmitted] = useState(false)

  // Keyboard nav state
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isShortcutOpen, setIsShortcutOpen] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['supply-search', submittedFilters],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/supply/candidates/search', {
        params: {
          query: {
            q: submittedFilters?.q ?? '',
            skills: submittedFilters?.skills || undefined,
            location: submittedFilters?.location || undefined,
            seniority:
              submittedFilters?.seniority && submittedFilters.seniority !== '__any__'
                ? submittedFilters.seniority
                : undefined,
            top_k: submittedFilters?.limit ?? 10,
          },
        },
      })
      if (error) throw error
      return data
    },
    enabled: searchSubmitted && !!submittedFilters,
    staleTime: 30 * 1000,
  })

  const results = data?.results ?? []

  function handleSubmit(filters: SearchFilters) {
    // Fold title into q on submit
    const combinedQ = [filters.title, filters.q].filter(Boolean).join(' ')
    setSubmittedFilters({ ...filters, q: combinedQ })
    setSearchSubmitted(true)
    setFocusedIndex(0)
  }

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const activeEl = document.activeElement
      const isInputFocused =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        (activeEl as HTMLElement)?.isContentEditable
      if (isInputFocused || isDetailOpen || isShortcutOpen) return

      switch (e.key) {
        case 'j': {
          e.preventDefault()
          if (results.length > 0)
            setFocusedIndex((i) => Math.min(i + 1, results.length - 1))
          break
        }
        case 'k': {
          e.preventDefault()
          if (results.length > 0) setFocusedIndex((i) => Math.max(i - 1, 0))
          break
        }
        case 'Enter': {
          e.preventDefault()
          const candidate = results[focusedIndex]
          if (candidate) {
            setSelectedCandidateId(candidate.candidate_id)
            setIsDetailOpen(true)
          }
          break
        }
        case '?': {
          e.preventDefault()
          setIsShortcutOpen(true)
          break
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDetailOpen, isShortcutOpen, focusedIndex, results])

  // Clamp focused index when results shrink
  useEffect(() => {
    if (results.length > 0) {
      setFocusedIndex((i) => Math.min(i, results.length - 1))
    }
  }, [results.length])

  // Active filter chips (from submitted filters)
  const activeChips = submittedFilters
    ? [
        submittedFilters.q && { key: 'q', label: 'Search', value: submittedFilters.q },
        submittedFilters.skills && { key: 'skills', label: 'Skills', value: submittedFilters.skills },
        submittedFilters.location && {
          key: 'location',
          label: 'Location',
          value: submittedFilters.location,
        },
        submittedFilters.seniority &&
          submittedFilters.seniority !== '__any__' && {
            key: 'seniority',
            label: 'Seniority',
            value: submittedFilters.seniority,
          },
      ].filter(Boolean)
    : []

  function removeChip(key: string) {
    if (!submittedFilters) return
    const updated = { ...submittedFilters, [key]: key === 'limit' ? 10 : '' }
    setSubmittedFilters(updated)
    // Re-submit with updated filters
    setSearchSubmitted(true)
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Left: filter sidebar */}
      <FilterSidebar onSubmit={handleSubmit} isLoading={isLoading} />

      {/* Right: scrollable results column */}
      <div className="flex flex-1 min-w-0 flex-col overflow-y-auto">
        {/* Sticky results header */}
        <div className="sticky top-0 z-10 flex flex-wrap items-baseline gap-x-3 gap-y-2 border-b border-[#ECEAE4] bg-background px-6 py-4">
          <h1 className="text-xl font-semibold text-foreground">Supply search</h1>
          {searchSubmitted && !isLoading && (
            <span className="text-[13px] text-muted-foreground">
              {data?.total ?? results.length} candidates · ranked by match
            </span>
          )}
          {(activeChips as { key: string; label: string; value: string }[]).map((chip) => (
            <Badge
              key={chip.key}
              variant="secondary"
              className="rounded-full text-xs flex items-center gap-1"
            >
              {chip.label}: {chip.value}
              <button
                onClick={() => removeChip(chip.key)}
                className="ml-1 hover:text-foreground text-muted-foreground"
                aria-label={`Remove ${chip.label} filter`}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>

        {/* Content area */}
        {!searchSubmitted ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Enter filters above and press Search to find candidates.
          </p>
        ) : error ? (
          <p className="p-6 text-sm text-destructive">
            Couldn&apos;t load candidates. Check your connection or refresh.
          </p>
        ) : isLoading ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">Searching…</p>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <h2 className="text-xl font-semibold">No candidates found</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Try broadening your search or removing filters.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 px-6 py-5">
            {results.map((candidate, idx) => (
              <CandidateResultCard
                key={candidate.candidate_id}
                candidate={candidate}
                rank={idx}
                isFocused={idx === focusedIndex}
                onOpenDetail={(id) => {
                  setSelectedCandidateId(id)
                  setIsDetailOpen(true)
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Candidate profile sheet */}
      <CandidateProfileSheet
        candidateId={selectedCandidateId}
        isOpen={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        source="search"
      />

      {/* Shortcut overlay */}
      <ShortcutOverlay open={isShortcutOpen} onOpenChange={setIsShortcutOpen} />
    </div>
  )
}
