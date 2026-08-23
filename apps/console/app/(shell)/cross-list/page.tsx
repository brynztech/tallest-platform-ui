'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import { Button } from '@brynzit/ui/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@brynzit/ui/components/ui/card'
import { Input } from '@brynzit/ui/components/ui/input'
import { Label } from '@brynzit/ui/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@brynzit/ui/components/ui/select'
import { CandidateProfileSheet } from '../_components/candidate-profile-sheet'
import {
  fetchOpsClients,
  recruiterQueryKeys,
  RECRUITER_STALE_TIME_MS,
} from '../_lib/recruiter-data'
import { useScopedRequisitions } from '../_lib/use-scoped-requisitions'

export default function CrossListPage() {
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [selectedReqId, setSelectedReqId] = useState('')
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const clientsQuery = useQuery({
    queryKey: recruiterQueryKeys.clients,
    queryFn: fetchOpsClients,
    staleTime: RECRUITER_STALE_TIME_MS,
  })
  const clients = clientsQuery.data ?? []
  // Cross-listing puts a candidate onto another role — only roles the acting
  // user is assigned to (managers/admins: all of them).
  const { requisitions } = useScopedRequisitions(clients, clientsQuery.isSuccess)
  const activeReqId = selectedReqId || requisitions[0]?.id || ''

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
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em]">Cross List</h1>
        <p className="text-sm text-muted-foreground">
          Search existing Supply candidates and move into an Ops requisition shortlist workflow.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Target Requisition</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={activeReqId} onValueChange={setSelectedReqId} disabled={!requisitions.length}>
            <SelectTrigger>
              <SelectValue placeholder="Select requisition" />
            </SelectTrigger>
            <SelectContent>
              {requisitions.map((requisition) => (
                <SelectItem key={requisition.id} value={requisition.id}>
                  {requisition.client?.name ?? 'Client'} — {requisition.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Find Candidate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="min-w-0 flex-1">
              <Label htmlFor="cross-list-search" className="sr-only">
                Candidate search
              </Label>
              <Input
                id="cross-list-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') submitSearch()
                }}
                placeholder="Search candidates by skills, title, or name"
              />
            </div>
            <Button onClick={submitSearch} disabled={!query.trim() || searchQuery.isFetching}>
              {searchQuery.isFetching ? 'Searching...' : 'Search'}
            </Button>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {!submittedQuery ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Search for an existing candidate to cross-list.
              </p>
            ) : searchQuery.error ? (
              <p className="py-8 text-center text-sm text-destructive">
                Couldn&apos;t load Supply candidates.
              </p>
            ) : results.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No candidates found.</p>
            ) : (
              results.map((candidate) => (
                <article
                  key={candidate.candidate_id}
                  className="flex flex-col gap-3 rounded-lg border bg-background p-4 md:flex-row md:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-semibold">{candidate.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {candidate.current_title ?? 'Candidate'} · {candidate.location ?? 'Location not set'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedCandidateId(candidate.candidate_id)
                        setIsDetailOpen(true)
                      }}
                    >
                      View Profile
                    </Button>
                    <Button asChild size="sm" disabled={!activeReqId}>
                      <Link href={`/ops/requisitions/${activeReqId}`}>Open Shortlist</Link>
                    </Button>
                  </div>
                </article>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <CandidateProfileSheet
        candidateId={selectedCandidateId}
        isOpen={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        source="search"
      />
    </div>
  )
}
