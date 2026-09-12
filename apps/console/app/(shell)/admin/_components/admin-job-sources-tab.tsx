'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Button } from '@brynzit/ui/components/ui/button'
import { Input } from '@brynzit/ui/components/ui/input'
import { Label } from '@brynzit/ui/components/ui/label'
import { Checkbox } from '@brynzit/ui/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@brynzit/ui/components/ui/select'
import { AlertTriangle, ChevronDown, Play, RefreshCw } from 'lucide-react'
import { isRunActive, jobBoardApi, type VisibilityRulesUpdate } from '../_lib/job-board-api'
import {
  RUN_POLL_MS,
  RunHistoryPanel,
  STATUS_VARIANT,
  duration,
  relativeTime,
  runsQueryKey,
} from './job-board-run-history'

/** This tab is the ATS half only — per-company boards (Greenhouse/Ashby),
 *  free to crawl. The Apify LinkedIn keyword search has its own tab, its own
 *  schedule and its own run history; neither button triggers the other. */
const ATS_ENGINE = 'ats' as const

export function AdminJobSourcesTab() {
  return (
    <div className="space-y-6">
      <RunSearchPanel />
      <VisibilityRulesPanel />
      <TrackedCompaniesPanel />
      <RunHistoryPanel
        engine={ATS_ENGINE}
        title="Recent board crawls"
        emptyLabel="No board crawls yet."
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Run the job search
// ---------------------------------------------------------------------------

function RunSearchPanel() {
  const queryClient = useQueryClient()
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { data: runs } = useQuery({
    queryKey: runsQueryKey(ATS_ENGINE),
    queryFn: () => jobBoardApi.listRuns(10, ATS_ENGINE),
    refetchInterval: activeRunId ? RUN_POLL_MS : false,
  })

  const latest = runs?.items[0]

  // Adopt an in-flight run found on mount, so reloading the page mid-crawl still
  // shows progress instead of an idle button.
  useEffect(() => {
    if (!activeRunId && isRunActive(latest)) setActiveRunId(latest!.id)
  }, [latest, activeRunId])

  const { data: polled } = useQuery({
    queryKey: ['job-board-run', activeRunId],
    queryFn: () => jobBoardApi.getRun(activeRunId!),
    enabled: activeRunId != null,
    refetchInterval: RUN_POLL_MS,
  })

  const current = polled ?? latest
  const running = isRunActive(current)

  // Stop polling and refresh dependent panels once the run finishes.
  useEffect(() => {
    if (activeRunId && polled && !isRunActive(polled)) {
      setActiveRunId(null)
      void queryClient.invalidateQueries({ queryKey: runsQueryKey(ATS_ENGINE) })
      void queryClient.invalidateQueries({ queryKey: ['job-board-visibility-impact'] })
    }
  }, [activeRunId, polled, queryClient])

  const startRun = useMutation({
    mutationFn: jobBoardApi.startRun,
    onSuccess: (run) => {
      setError(null)
      setActiveRunId(run.id)
      void queryClient.invalidateQueries({ queryKey: runsQueryKey(ATS_ENGINE) })
    },
    onError: (err: Error) => setError(err.message),
  })

  const progress =
    current && current.companies_total > 0
      ? Math.round((current.companies_done / current.companies_total) * 100)
      : 0

  return (
    <section className="border-border bg-card rounded-lg border p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Job search engine</h2>
          <p className="text-muted-foreground mt-1 max-w-[560px] text-sm">
            Crawls every active company board and ingests new postings. Runs automatically each
            night; use this to pull fresh jobs right now.
          </p>
        </div>
        <Button
          onClick={() => startRun.mutate()}
          disabled={running || startRun.isPending}
          className="shrink-0"
        >
          {running ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Running…
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Run job search now
            </>
          )}
        </Button>
      </div>

      {error && (
        <p className="text-destructive mt-4 flex items-start gap-2 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {current && (
        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-3">
            <Badge variant={STATUS_VARIANT[current.status] ?? 'outline'}>{current.status}</Badge>
            <span className="text-muted-foreground text-sm">
              {current.companies_done}/{current.companies_total} companies · {duration(current)}
              {current.finished_at ? ` · finished ${relativeTime(current.finished_at)}` : ''}
            </span>
          </div>

          <div className="bg-primary/20 relative h-2 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full transition-all"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-5">
            <Stat label="Fetched" value={current.jobs_fetched} />
            <Stat label="New" value={current.jobs_inserted} />
            <Stat label="Updated" value={current.jobs_updated} />
            <Stat label="Closed" value={current.jobs_closed} />
            {/* Explains a smaller-than-expected result: these were fetched but
                fall outside the supported countries. */}
            <Stat label="Out of scope" value={current.jobs_rejected} />
          </dl>

          {current.errors.length > 0 && (
            <details className="border-border bg-background/60 rounded-md border p-3">
              <summary className="cursor-pointer text-sm font-medium">
                {current.errors.length} company error
                {current.errors.length === 1 ? '' : 's'}
              </summary>
              <ul className="text-muted-foreground mt-2 space-y-1 text-sm">
                {current.errors.map((item, index) => (
                  <li key={`${item.company_id ?? index}`}>
                    <span className="text-foreground font-medium">
                      {item.display_name ?? item.stage ?? 'run'}
                    </span>{' '}
                    — {item.error}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </section>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs uppercase tracking-wide">{label}</dt>
      <dd className="font-medium">{value.toLocaleString()}</dd>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Visibility rules
// ---------------------------------------------------------------------------

const AGE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '1', label: 'Last 24 hours' },
  { value: '7', label: 'Last 7 days' },
  { value: '14', label: 'Last 14 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'none', label: 'No age limit' },
]

function VisibilityRulesPanel() {
  const queryClient = useQueryClient()
  const { data: saved } = useQuery({
    queryKey: ['job-board-visibility-rules'],
    queryFn: jobBoardApi.getVisibilityRules,
  })

  const [draft, setDraft] = useState<VisibilityRulesUpdate | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (saved && draft === null) {
      setDraft({
        max_age_days: saved.max_age_days,
        allowed_countries: saved.allowed_countries,
        min_quality_score: saved.min_quality_score,
        require_compensation: saved.require_compensation,
        blocked_title_patterns: saved.blocked_title_patterns,
      })
    }
  }, [saved, draft])

  // Preview the DRAFT, not the saved rules. Saving `max_age_days = 7` against a
  // stale crawl shows candidates zero jobs; the admin has to see that first.
  const { data: impact } = useQuery({
    queryKey: ['job-board-visibility-impact', draft],
    queryFn: () => jobBoardApi.previewVisibilityRules(draft!),
    enabled: draft != null,
  })

  const save = useMutation({
    mutationFn: () => jobBoardApi.saveVisibilityRules(draft!),
    onSuccess: () => {
      setSaveError(null)
      void queryClient.invalidateQueries({ queryKey: ['job-board-visibility-rules'] })
    },
    onError: (err: Error) => setSaveError(err.message),
  })

  const isDirty = useMemo(() => {
    if (!saved || !draft) return false
    return (
      draft.max_age_days !== saved.max_age_days ||
      draft.min_quality_score !== saved.min_quality_score ||
      draft.require_compensation !== saved.require_compensation ||
      (draft.allowed_countries ?? []).join(',') !== saved.allowed_countries.join(',') ||
      (draft.blocked_title_patterns ?? []).join('\n') !== saved.blocked_title_patterns.join('\n')
    )
  }, [saved, draft])

  if (!draft) {
    return (
      <section className="border-border bg-card rounded-lg border p-6">
        <h2 className="text-base font-semibold">What candidates can see</h2>
        <p className="text-muted-foreground mt-2 text-sm">Loading…</p>
      </section>
    )
  }

  const countries = draft.allowed_countries ?? []

  function toggleCountry(code: string, checked: boolean) {
    const next = checked
      ? [...new Set([...countries, code])]
      : countries.filter((item) => item !== code)
    setDraft({ ...draft, allowed_countries: next })
  }

  return (
    <section className="border-border bg-card rounded-lg border p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">What candidates can see</h2>
          <p className="text-muted-foreground mt-1 max-w-[560px] text-sm">
            Applied when the feed is read, so changes take effect immediately and nothing is deleted
            — loosening a rule brings jobs straight back.
          </p>
        </div>
        <Button
          onClick={() => save.mutate()}
          disabled={!isDirty || save.isPending}
          className="shrink-0"
        >
          {save.isPending ? 'Saving…' : 'Save rules'}
        </Button>
      </div>

      {impact && (
        <div
          className={
            impact.warning
              ? 'border-destructive/40 bg-destructive/5 mt-5 rounded-md border p-4'
              : 'border-border bg-background/60 mt-5 rounded-md border p-4'
          }
        >
          <p className="text-sm">
            <span className="font-medium">
              {impact.visible.toLocaleString()} of {impact.total_active.toLocaleString()}
            </span>{' '}
            ingested jobs would be visible
            {Object.keys(impact.by_country).length > 0 && (
              <span className="text-muted-foreground">
                {' '}
                (
                {Object.entries(impact.by_country)
                  .map(([code, count]) => `${code.toUpperCase()} ${count}`)
                  .join(' · ')}
                )
              </span>
            )}
          </p>
          {impact.warning && (
            <p className="text-destructive mt-2 flex items-start gap-2 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {impact.warning}
            </p>
          )}
        </div>
      )}

      {saveError && (
        <p className="text-destructive mt-4 flex items-start gap-2 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {saveError}
        </p>
      )}

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="max-age">Only show jobs posted within</Label>
          <Select
            value={draft.max_age_days == null ? 'none' : String(draft.max_age_days)}
            onValueChange={(value) =>
              setDraft({ ...draft, max_age_days: value === 'none' ? null : Number(value) })
            }
          >
            <SelectTrigger id="max-age">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="min-quality">Minimum job quality (0–100)</Label>
          <Input
            id="min-quality"
            type="number"
            min={0}
            max={100}
            value={draft.min_quality_score ?? 0}
            onChange={(event) =>
              setDraft({ ...draft, min_quality_score: Number(event.target.value) })
            }
          />
          <p className="text-muted-foreground text-xs">
            Scores how complete a posting is (skills, pay, description, freshness) — not how good
            the job is.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Countries</Label>
          <div className="flex gap-4 pt-1">
            {[
              { code: 'US', label: 'United States' },
              { code: 'IN', label: 'India' },
            ].map((item) => (
              <label key={item.code} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={countries.includes(item.code)}
                  onCheckedChange={(checked) => toggleCountry(item.code, checked === true)}
                />
                {item.label}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Require listed pay</Label>
          <label className="flex items-center gap-2 pt-1 text-sm">
            <Checkbox
              checked={draft.require_compensation === true}
              onCheckedChange={(checked) =>
                setDraft({ ...draft, require_compensation: checked === true })
              }
            />
            Hide jobs with no salary information
          </label>
          <p className="text-muted-foreground text-xs">
            Most ATS boards publish no pay, so this hides a large share of inventory.
          </p>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="blocked-titles">Blocked title patterns (one per line)</Label>
          <textarea
            id="blocked-titles"
            rows={3}
            className="border-input bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1"
            value={(draft.blocked_title_patterns ?? []).join('\n')}
            onChange={(event) =>
              setDraft({
                ...draft,
                blocked_title_patterns: event.target.value
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean),
              })
            }
            placeholder={'commission.only\nunpaid\n100% commission'}
          />
          <p className="text-muted-foreground text-xs">
            Case-insensitive regular expressions matched against the job title. An invalid pattern
            is rejected on save rather than silently ignored.
          </p>
        </div>
      </div>

      {saved && (
        <p className="text-muted-foreground mt-4 text-xs">
          Version {saved.rules_version} · updated {relativeTime(saved.updated_at)}
          {saved.updated_by ? ` by ${saved.updated_by}` : ''}
        </p>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Tracked companies
// ---------------------------------------------------------------------------

function TrackedCompaniesPanel() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    source: '',
    board_token: '',
    website_url: '',
    display_name: '',
  })
  const [error, setError] = useState<string | null>(null)

  const { data: sources } = useQuery({
    queryKey: ['job-board-sources'],
    queryFn: jobBoardApi.listSources,
  })
  const { data: companies } = useQuery({
    queryKey: ['job-board-companies'],
    queryFn: jobBoardApi.listCompanies,
  })

  const registerable = (sources ?? []).filter((item) => item.enabled && item.requires_board_token)

  const addCompany = useMutation({
    mutationFn: () =>
      jobBoardApi.addCompany({
        source: form.source,
        board_token: form.board_token.trim(),
        website_url: form.website_url.trim(),
        display_name: form.display_name.trim() || undefined,
      }),
    onSuccess: () => {
      setError(null)
      setForm({ source: '', board_token: '', website_url: '', display_name: '' })
      void queryClient.invalidateQueries({ queryKey: ['job-board-companies'] })
    },
    onError: (err: Error) => setError(err.message),
  })

  const seed = useMutation({
    mutationFn: jobBoardApi.seedCompanies,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job-board-companies'] }),
    onError: (err: Error) => setError(err.message),
  })

  return (
    <section className="border-border bg-card rounded-lg border p-6">
      <details className="group" open>
        <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-4 [&::-webkit-details-marker]:hidden">
          <div>
            <h2 className="text-base font-semibold">
              Tracked companies{' '}
              <span className="text-muted-foreground font-normal">({companies?.length ?? 0})</span>
            </h2>
            <p className="text-muted-foreground mt-1 max-w-[560px] text-sm">
              These board APIs are per-company, so each employer must be added with its own board
              token — there is no global keyword search to discover them.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              onClick={(event) => {
                event.stopPropagation()
                seed.mutate()
              }}
              disabled={seed.isPending}
            >
              {seed.isPending ? 'Adding…' : 'Add starter list'}
            </Button>
            <Button
              variant="outline"
              onClick={(event) => {
                event.stopPropagation()
                setOpen((value) => !value)
              }}
            >
              Add company
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
            <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
          </div>
        </summary>

        {error && (
          <p className="text-destructive mt-4 flex items-start gap-2 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        {open && (
          <div className="border-border bg-background/60 mt-5 grid gap-4 rounded-md border p-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company-source">Source</Label>
              <Select
                value={form.source}
                onValueChange={(value) => setForm({ ...form, source: value })}
              >
                <SelectTrigger id="company-source">
                  <SelectValue placeholder="Choose a source" />
                </SelectTrigger>
                <SelectContent>
                  {registerable.map((item) => (
                    <SelectItem key={item.source} value={item.source}>
                      {item.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="board-token">Board token</Label>
              <Input
                id="board-token"
                value={form.board_token}
                placeholder="e.g. stripe"
                onChange={(event) => setForm({ ...form, board_token: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website-url">Website URL</Label>
              <Input
                id="website-url"
                value={form.website_url}
                placeholder="https://stripe.com"
                onChange={(event) => setForm({ ...form, website_url: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="display-name">Display name (optional)</Label>
              <Input
                id="display-name"
                value={form.display_name}
                onChange={(event) => setForm({ ...form, display_name: event.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Button
                onClick={() => addCompany.mutate()}
                disabled={
                  addCompany.isPending ||
                  !form.source ||
                  !form.board_token.trim() ||
                  !form.website_url.trim()
                }
              >
                {addCompany.isPending ? 'Adding…' : 'Add company'}
              </Button>
            </div>
          </div>
        )}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground text-xs uppercase tracking-wide">
              <tr className="border-border border-b">
                <th className="py-2 pr-4 text-left font-medium">Company</th>
                <th className="py-2 pr-4 text-left font-medium">Source</th>
                <th className="py-2 pr-4 text-left font-medium">Board token</th>
                <th className="py-2 pr-4 text-left font-medium">Domain</th>
                <th className="py-2 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(companies ?? []).map((company) => (
                <tr key={company.id} className="border-border/60 border-b">
                  <td className="py-2 pr-4 font-medium">{company.display_name}</td>
                  <td className="text-muted-foreground py-2 pr-4">{company.source}</td>
                  <td className="text-muted-foreground py-2 pr-4 font-mono text-xs">
                    {company.board_token}
                  </td>
                  <td className="text-muted-foreground py-2 pr-4">{company.canonical_domain}</td>
                  <td className="py-2">
                    <Badge variant={company.is_active ? 'default' : 'outline'}>
                      {company.is_active ? 'active' : 'paused'}
                    </Badge>
                  </td>
                </tr>
              ))}
              {(companies ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="text-muted-foreground py-6 text-center">
                    No companies tracked yet. Add the starter list to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {sources && sources.some((item) => !item.enabled) && (
          <p className="text-muted-foreground mt-4 text-xs">
            Unavailable sources:{' '}
            {sources
              .filter((item) => !item.enabled)
              .map((item) => `${item.display_name} (${item.notes})`)
              .join('; ')}
          </p>
        )}
      </details>
    </section>
  )
}
