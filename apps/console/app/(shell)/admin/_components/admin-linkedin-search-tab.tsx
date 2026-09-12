'use client'

/**
 * Admin -> LinkedIn search: everything for the Apify-backed LinkedIn keyword
 * search, kept apart from the Job sources tab on purpose.
 *
 * The two are easy to confuse and must not be: Job sources crawls per-company
 * ATS boards (Greenhouse/Ashby) for free, this one runs a global keyword
 * search through Apify and is billed per result. Separate tabs, separate run
 * history, separate schedules — a saved search here never runs because someone
 * pressed "Run job search now" over there.
 */

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Button } from '@brynzit/ui/components/ui/button'
import { Input } from '@brynzit/ui/components/ui/input'
import { Label } from '@brynzit/ui/components/ui/label'
import { Checkbox } from '@brynzit/ui/components/ui/checkbox'
import { Textarea } from '@brynzit/ui/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@brynzit/ui/components/ui/select'
import { AlertTriangle, ChevronDown } from 'lucide-react'
import {
  isRunActive,
  jobBoardApi,
  type SearchQuery,
  type SearchQueryCreate,
} from '../_lib/job-board-api'
import { RUN_POLL_MS, RunHistoryPanel, relativeTime, runsQueryKey } from './job-board-run-history'

const APIFY_ENGINE = 'apify_linkedin' as const

export function AdminLinkedInSearchTab() {
  return (
    <div className="space-y-6">
      <SearchQueriesPanel />
      <RunHistoryPanel
        engine={APIFY_ENGINE}
        title="Recent LinkedIn search runs"
        emptyLabel="No LinkedIn searches have run yet."
      />
    </div>
  )
}

// Radix's Select.Item forbids an empty-string value (reserved internally for
// "no selection") — this sentinel stands in for "no override" in form state
// and is translated to/from null at the form/payload boundary below.
const AUTO_DATE_POSTED = 'auto'

const DATE_POSTED_OPTIONS: Array<{ value: string; label: string }> = [
  { value: AUTO_DATE_POSTED, label: 'Auto (widens if a run was missed)' },
  { value: 'past24Hours', label: 'Past 24 hours' },
  { value: 'pastWeek', label: 'Past week' },
  { value: 'pastMonth', label: 'Past month' },
  { value: 'anyTime', label: 'Any time' },
]

type SearchForm = {
  name: string
  keywords: string
  location: string
  geo_id: string
  distance: string
  company_ids: string
  under_10_applicants: boolean
  limit_per_source: string
  search_urls: string
  date_posted_override: string
  is_active: boolean
}

const EMPTY_SEARCH_FORM: SearchForm = {
  name: '',
  keywords: '',
  location: '',
  geo_id: '',
  distance: '',
  company_ids: '',
  under_10_applicants: false,
  limit_per_source: '100',
  search_urls: '',
  date_posted_override: AUTO_DATE_POSTED,
  is_active: true,
}

function searchToForm(search: SearchQuery): SearchForm {
  return {
    name: search.name,
    keywords: search.keywords ?? '',
    location: search.location ?? '',
    geo_id: search.geo_id ?? '',
    distance: search.distance != null ? String(search.distance) : '',
    company_ids: (search.company_ids ?? []).join('\n'),
    under_10_applicants: search.under_10_applicants,
    limit_per_source: String(search.limit_per_source),
    search_urls: (search.search_urls ?? []).join('\n'),
    date_posted_override: search.date_posted_override ?? AUTO_DATE_POSTED,
    is_active: search.is_active,
  }
}

function linesOrNull(value: string): string[] | null {
  const lines = value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  return lines.length > 0 ? lines : null
}

function formToPayload(form: SearchForm): SearchQueryCreate {
  return {
    name: form.name.trim(),
    keywords: form.keywords.trim() || null,
    location: form.location.trim() || null,
    geo_id: form.geo_id.trim() || null,
    distance: form.distance.trim() ? Number(form.distance) : null,
    company_ids: linesOrNull(form.company_ids),
    under_10_applicants: form.under_10_applicants,
    limit_per_source: form.limit_per_source.trim() ? Number(form.limit_per_source) : 100,
    search_urls: linesOrNull(form.search_urls),
    date_posted_override:
      form.date_posted_override === AUTO_DATE_POSTED ? null : form.date_posted_override,
    is_active: form.is_active,
  }
}

/** What the search actually runs against, for the table — search_urls
 *  supersedes keywords/location entirely once set (see the backend adapter),
 *  so showing both would be misleading. */
function querySummary(search: SearchQuery): string {
  if (search.search_urls && search.search_urls.length > 0) {
    return `${search.search_urls.length} pasted URL${search.search_urls.length === 1 ? '' : 's'}`
  }
  const parts = [search.keywords, search.location].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : '—'
}

function SearchQueriesPanel() {
  const queryClient = useQueryClient()
  const [formState, setFormState] = useState<SearchForm | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [runError, setRunError] = useState<string | null>(null)
  const [watching, setWatching] = useState(false)

  const { data: searches } = useQuery({
    queryKey: ['job-board-search-queries'],
    queryFn: jobBoardApi.listSearchQueries,
  })

  // After triggering, watch this engine's runs until the one we started
  // finishes, so last_run_at refreshes without a manual reload.
  const { data: runs } = useQuery({
    queryKey: runsQueryKey(APIFY_ENGINE),
    queryFn: () => jobBoardApi.listRuns(10, APIFY_ENGINE),
    refetchInterval: watching ? RUN_POLL_MS : false,
  })
  const anyRunActive = isRunActive(runs?.items[0])

  useEffect(() => {
    if (watching && !anyRunActive) {
      setWatching(false)
      void queryClient.invalidateQueries({ queryKey: ['job-board-search-queries'] })
    }
  }, [watching, anyRunActive, queryClient])

  const save = useMutation({
    mutationFn: () => {
      const payload = formToPayload(formState!)
      return editingId
        ? jobBoardApi.updateSearchQuery(editingId, payload)
        : jobBoardApi.createSearchQuery(payload)
    },
    onSuccess: () => {
      setFormError(null)
      setFormState(null)
      setEditingId(null)
      void queryClient.invalidateQueries({ queryKey: ['job-board-search-queries'] })
    },
    onError: (err: Error) => setFormError(err.message),
  })

  const remove = useMutation({
    mutationFn: (id: string) => jobBoardApi.deleteSearchQuery(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['job-board-search-queries'] }),
    onError: (err: Error) => setRunError(err.message),
  })

  const runNow = useMutation({
    mutationFn: (id: string) => jobBoardApi.runSearchQuery(id),
    onSuccess: () => {
      setRunError(null)
      setWatching(true)
      void queryClient.invalidateQueries({ queryKey: runsQueryKey(APIFY_ENGINE) })
    },
    onError: (err: Error) => setRunError(err.message),
  })

  function openCreateForm() {
    setEditingId(null)
    setFormState(EMPTY_SEARCH_FORM)
    setFormError(null)
  }

  function openEditForm(search: SearchQuery) {
    setEditingId(search.id)
    setFormState(searchToForm(search))
    setFormError(null)
  }

  function closeForm() {
    setFormState(null)
    setEditingId(null)
    setFormError(null)
  }

  const runDisabled = watching || anyRunActive || runNow.isPending

  return (
    <section className="border-border bg-card rounded-lg border p-6">
      <details className="group" open>
        <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-4 [&::-webkit-details-marker]:hidden">
          <div>
            <h2 className="text-base font-semibold">
              Saved searches{' '}
              <span className="text-muted-foreground font-normal">({searches?.length ?? 0})</span>
            </h2>
            <p className="text-muted-foreground mt-1 max-w-[560px] text-sm">
              A global LinkedIn keyword search via Apify, billed per result — unlike the per-company
              boards above, one search can match postings from any employer.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              onClick={(event) => {
                event.stopPropagation()
                formState ? closeForm() : openCreateForm()
              }}
            >
              {formState ? 'Cancel' : 'Add search'}
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
            <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
          </div>
        </summary>

        {runError && (
          <p className="text-destructive mt-4 flex items-start gap-2 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {runError}
          </p>
        )}

        {formState && (
          <div className="border-border bg-background/60 mt-5 space-y-4 rounded-md border p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="search-name">Name</Label>
                <Input
                  id="search-name"
                  value={formState.name}
                  placeholder="e.g. Bay Area backend, senior+"
                  onChange={(event) => setFormState({ ...formState, name: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="search-keywords">Keywords (the natural-language query)</Label>
                <Input
                  id="search-keywords"
                  value={formState.keywords}
                  placeholder="e.g. senior backend engineer"
                  onChange={(event) => setFormState({ ...formState, keywords: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="search-location">Location</Label>
                <Input
                  id="search-location"
                  value={formState.location}
                  placeholder="United States or India"
                  onChange={(event) => setFormState({ ...formState, location: event.target.value })}
                />
                <p className="text-muted-foreground text-xs">
                  Must resolve to a country the candidate portal shows, or saving is rejected.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="search-date-posted">Posted within</Label>
                <Select
                  value={formState.date_posted_override}
                  onValueChange={(value) =>
                    setFormState({ ...formState, date_posted_override: value })
                  }
                >
                  <SelectTrigger id="search-date-posted">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_POSTED_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="search-limit">Result cap per run</Label>
                <Input
                  id="search-limit"
                  type="number"
                  min={1}
                  value={formState.limit_per_source}
                  onChange={(event) =>
                    setFormState({ ...formState, limit_per_source: event.target.value })
                  }
                />
                <p className="text-muted-foreground text-xs">
                  Hard cap sent to Apify (both its own search limit and its platform spend cap) —
                  billed at roughly $0.002 per result, so this number is the most you can spend on
                  one run.
                </p>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 pt-6 text-sm">
                  <Checkbox
                    checked={formState.under_10_applicants}
                    onCheckedChange={(checked) =>
                      setFormState({ ...formState, under_10_applicants: checked === true })
                    }
                  />
                  Only jobs with under 10 applicants
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={formState.is_active}
                    onCheckedChange={(checked) =>
                      setFormState({ ...formState, is_active: checked === true })
                    }
                  />
                  Include in the nightly schedule
                </label>
              </div>
            </div>

            {/* Native disclosure — no Collapsible primitive in this kit. Rarely
                needed, so tucked away rather than cluttering the common case. */}
            <details>
              <summary className="cursor-pointer text-sm font-medium">Advanced</summary>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="search-geo-id">LinkedIn geo ID (optional)</Label>
                  <Input
                    id="search-geo-id"
                    value={formState.geo_id}
                    onChange={(event) => setFormState({ ...formState, geo_id: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="search-distance">Distance in miles (optional)</Label>
                  <Input
                    id="search-distance"
                    type="number"
                    min={0}
                    value={formState.distance}
                    onChange={(event) =>
                      setFormState({ ...formState, distance: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="search-company-ids">
                    LinkedIn numeric company IDs (one per line)
                  </Label>
                  <Textarea
                    id="search-company-ids"
                    rows={2}
                    value={formState.company_ids}
                    onChange={(event) =>
                      setFormState({ ...formState, company_ids: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="search-urls">
                    Pasted LinkedIn search URLs (one per line — overrides keywords/location)
                  </Label>
                  <Textarea
                    id="search-urls"
                    rows={2}
                    value={formState.search_urls}
                    onChange={(event) =>
                      setFormState({ ...formState, search_urls: event.target.value })
                    }
                  />
                </div>
              </div>
            </details>

            {formError && (
              <p className="text-destructive flex items-start gap-2 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {formError}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => save.mutate()}
                disabled={!formState.name.trim() || save.isPending}
              >
                {save.isPending ? 'Saving…' : editingId ? 'Save changes' : 'Create search'}
              </Button>
              <Button variant="outline" onClick={closeForm}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground text-xs uppercase tracking-wide">
              <tr className="border-border border-b">
                <th className="py-2 pr-4 text-left font-medium">Name</th>
                <th className="py-2 pr-4 text-left font-medium">Query</th>
                <th className="py-2 pr-4 text-left font-medium">Cap</th>
                <th className="py-2 pr-4 text-left font-medium">Last run</th>
                <th className="py-2 pr-4 text-left font-medium">Status</th>
                <th className="py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(searches ?? []).map((search) => (
                <tr key={search.id} className="border-border/60 border-b">
                  <td className="py-2 pr-4 font-medium">{search.name}</td>
                  <td className="text-muted-foreground py-2 pr-4">{querySummary(search)}</td>
                  <td className="text-muted-foreground py-2 pr-4">{search.limit_per_source}</td>
                  <td className="text-muted-foreground py-2 pr-4">
                    {relativeTime(search.last_run_at)}
                  </td>
                  <td className="py-2 pr-4">
                    <Badge variant={search.is_active ? 'default' : 'outline'}>
                      {search.is_active ? 'scheduled' : 'paused'}
                    </Badge>
                  </td>
                  <td className="py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runNow.mutate(search.id)}
                        disabled={runDisabled}
                      >
                        Run now
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEditForm(search)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (window.confirm(`Delete saved search "${search.name}"?`)) {
                            remove.mutate(search.id)
                          }
                        }}
                        disabled={remove.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {(searches ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="text-muted-foreground py-6 text-center">
                    No saved searches yet. Add one to start pulling LinkedIn postings by keyword.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  )
}
