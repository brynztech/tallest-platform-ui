'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@brynzit/ui/components/ui/button'
import { Input } from '@brynzit/ui/components/ui/input'
import { Label } from '@brynzit/ui/components/ui/label'
import { apiClient } from '@brynzit/api-client'
import { CandidateProfileSheet } from '../_components/candidate-profile-sheet'
import { CandidateResultCard } from '../supply/search/_components/candidate-result-card'
import {
  recruiterQueryKeys,
  RECRUITER_STALE_TIME_MS,
} from '../_lib/recruiter-data'

export default function MatchmakerPage() {
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const searchQuery = useQuery({
    queryKey: recruiterQueryKeys.candidateSearch(submittedQuery, 10),
    enabled: submittedQuery.trim().length > 0,
    staleTime: RECRUITER_STALE_TIME_MS,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/supply/candidates/search', {
        params: { query: { q: submittedQuery, top_k: 10 } },
      })
      if (error) throw error
      return data
    },
  })

  const results = searchQuery.data?.results ?? []

  function submitSearch() {
    setSubmittedQuery(query.trim())
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden">
      <div className="border-b bg-background/90 px-6 py-5">
        <h1 className="text-2xl font-semibold tracking-[-0.03em]">AI Matchmaker</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search live Supply candidates and open their existing profile sheet.
        </p>
        <div className="mt-4 flex max-w-2xl gap-2">
          <div className="min-w-0 flex-1">
            <Label htmlFor="candidate-search" className="sr-only">
              Candidate search
            </Label>
            <Input
              id="candidate-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') submitSearch()
              }}
              placeholder="Search by role, skills, location, or candidate background"
            />
          </div>
          <Button onClick={submitSearch} disabled={!query.trim() || searchQuery.isFetching}>
            {searchQuery.isFetching ? 'Searching...' : 'Search Candidates'}
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
        {!submittedQuery ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Enter a search query to find candidates from the Supply talent pool.
          </p>
        ) : searchQuery.error ? (
          <p className="py-12 text-center text-sm text-destructive">
            Couldn&apos;t load candidates from Supply search.
          </p>
        ) : searchQuery.isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Searching...</p>
        ) : results.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No candidates found.</p>
        ) : (
          <div className="mx-auto flex max-w-4xl flex-col gap-2">
            {results.map((candidate, index) => (
              <CandidateResultCard
                key={candidate.candidate_id}
                candidate={candidate}
                rank={index}
                isFocused={false}
                onOpenDetail={(id) => {
                  setSelectedCandidateId(id)
                  setIsDetailOpen(true)
                }}
              />
            ))}
          </div>
        )}
      </div>

      <CandidateProfileSheet
        candidateId={selectedCandidateId}
        isOpen={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        source="search"
      />
    </div>
  )
}
