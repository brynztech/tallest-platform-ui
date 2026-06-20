'use client'

import { FormEvent, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Button } from '@brynzit/ui/components/ui/button'
import { Input } from '@brynzit/ui/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@brynzit/ui/components/ui/table'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

type AdminCandidate = {
  id: string
  name: string
  email: string | null
  current_title: string | null
  current_company: string | null
  source: string
  status: string
  skills: string[]
  location: string | null
  seniority: string | null
  availability_status: string | null
  resume_file_path: string | null
  extraction_method: string | null
}

type AdminCandidatesResponse = {
  results: AdminCandidate[]
  total: number
  limit: number
  offset: number
}

type CandidateDeleteResponse = {
  candidate_id: string
  deleted: boolean
  deleted_talent_pool_rows: number
  deleted_submissions: number
  deleted_engagement_sequences: number
  deleted_alerts: number
  updated_requisition_shortlists: number
  updated_matching_histories: number
}

export function AdminCandidatesTab() {
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [deletingCandidateId, setDeletingCandidateId] = useState<string | null>(null)

  const candidatesQuery = useQuery({
    queryKey: ['admin-candidates', query],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50', offset: '0' })
      if (query) params.set('q', query)
      const response = await fetch(`${API_BASE}/api/v1/supply/candidates?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`Failed to load candidates (${response.status})`)
      }
      return (await response.json()) as AdminCandidatesResponse
    },
    staleTime: 30_000,
  })

  const deleteMutation = useMutation({
    mutationFn: async (candidate: AdminCandidate) => {
      setDeletingCandidateId(candidate.id)
      const response = await fetch(`${API_BASE}/api/v1/supply/candidates/${candidate.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || `Failed to delete candidate (${response.status})`)
      }
      return (await response.json()) as CandidateDeleteResponse
    },
    onSuccess: (result) => {
      toast.success('Candidate permanently removed', {
        description: `Deleted ${result.deleted_submissions} submissions and updated ${result.updated_requisition_shortlists} shortlists.`,
      })
      void queryClient.invalidateQueries({ queryKey: ['admin-candidates'] })
    },
    onError: (error) => {
      toast.error('Could not delete candidate', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    },
    onSettled: () => setDeletingCandidateId(null),
  })

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setQuery(searchInput.trim())
  }

  function handleDelete(candidate: AdminCandidate) {
    const confirmed = window.confirm(
      `Permanently delete ${candidate.name}?\n\nThis removes their candidate profile, parsed resume data, talent pool record, shortlist references, engagement sequences, alerts, and vector-search chunks. This cannot be undone.`,
    )
    if (!confirmed) return
    deleteMutation.mutate(candidate)
  }

  const candidates = candidatesQuery.data?.results ?? []

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <h2 className="text-base font-semibold">All Candidates</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Use this Admin-only screen for permanent candidate removal. Deleting a candidate removes
          their parsed resume/profile data and cleans up shortlist, engagement, alert, and matching
          references across the platform.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex max-w-xl gap-2">
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by name, email, company, or title"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
        {query && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSearchInput('')
              setQuery('')
            }}
          >
            Clear
          </Button>
        )}
      </form>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Profile</TableHead>
              <TableHead>Parsed Data</TableHead>
              <TableHead>Skills</TableHead>
              <TableHead className="w-[150px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.map((candidate) => (
              <TableRow key={candidate.id}>
                <TableCell>
                  <div className="font-medium">{candidate.name}</div>
                  <div className="text-xs text-muted-foreground">{candidate.email ?? 'No email'}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{candidate.current_title ?? 'No title'}</div>
                  <div className="text-xs text-muted-foreground">
                    {[candidate.current_company, candidate.location].filter(Boolean).join(' · ') ||
                      'No company/location'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary">{candidate.source}</Badge>
                    <Badge variant="outline">{candidate.status}</Badge>
                    {candidate.extraction_method && (
                      <Badge variant="outline">{candidate.extraction_method}</Badge>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {candidate.resume_file_path ? 'Resume parsed' : 'No resume file'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex max-w-md flex-wrap gap-1">
                    {candidate.skills.slice(0, 5).map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                    {candidate.skills.length > 5 && (
                      <Badge variant="outline">+{candidate.skills.length - 5}</Badge>
                    )}
                    {candidate.skills.length === 0 && (
                      <span className="text-xs text-muted-foreground">No skills</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={deletingCandidateId === candidate.id}
                    onClick={() => handleDelete(candidate)}
                  >
                    {deletingCandidateId === candidate.id ? 'Removing…' : 'Remove'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!candidatesQuery.isLoading && candidates.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  No candidates found.
                </TableCell>
              </TableRow>
            )}
            {candidatesQuery.isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  Loading candidates…
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {candidates.length} of {candidatesQuery.data?.total ?? 0} candidates.
      </p>
    </div>
  )
}
