'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Button } from '@brynzit/ui/components/ui/button'
import { Checkbox } from '@brynzit/ui/components/ui/checkbox'
import { Label } from '@brynzit/ui/components/ui/label'
import { AlertTriangle, Inbox, Mail, RefreshCw } from 'lucide-react'
import { gmailApi, type GmailIngestStatusValue } from '../_lib/gmail-api'

/** The backend polls every 5 minutes; refresh a little faster than that so a
 *  scheduled run shows up without the operator reaching for reload. */
const STATUS_POLL_MS = 30_000

const STATUS_LABEL: Record<GmailIngestStatusValue, string> = {
  ingested: 'Ingested',
  parse_failed: 'Parse failed',
  no_attachment: 'No resume attached',
  too_large: 'Too large',
  duplicate: 'Already in pool',
}

const STATUS_VARIANT: Record<
  GmailIngestStatusValue,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  ingested: 'default',
  parse_failed: 'destructive',
  no_attachment: 'outline',
  too_large: 'secondary',
  duplicate: 'secondary',
}

function relativeTime(iso: string | null): string {
  if (!iso) return 'never'
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h ago`
  return `${Math.round(seconds / 86400)}d ago`
}

export function AdminGmailTab() {
  const queryClient = useQueryClient()
  const { data: status, isLoading } = useQuery({
    queryKey: ['gmail-ingest-status'],
    queryFn: gmailApi.getStatus,
    refetchInterval: STATUS_POLL_MS,
  })

  const [draftFilters, setDraftFilters] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // Seed the editor once, then leave it alone — background refetches must not
  // overwrite what the admin is in the middle of typing.
  useEffect(() => {
    if (status && draftFilters === null) {
      setDraftFilters(status.subject_filters.join('\n'))
    }
  }, [status, draftFilters])

  const parsedFilters = useMemo(
    () =>
      (draftFilters ?? '')
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean),
    [draftFilters],
  )

  const isDirty = useMemo(() => {
    if (!status || draftFilters === null) return false
    return parsedFilters.join('\n') !== status.subject_filters.join('\n')
  }, [status, draftFilters, parsedFilters])

  const save = useMutation({
    mutationFn: () => gmailApi.updateConfig({ subject_filters: parsedFilters }),
    onSuccess: data => {
      setError(null)
      setNotice('Filters saved.')
      setDraftFilters(data.subject_filters.join('\n'))
      queryClient.setQueryData(['gmail-ingest-status'], data)
    },
    onError: (err: Error) => setError(err.message),
  })

  const toggleActive = useMutation({
    mutationFn: (isActive: boolean) => gmailApi.updateConfig({ is_active: isActive }),
    onSuccess: data => {
      setError(null)
      setNotice(null)
      queryClient.setQueryData(['gmail-ingest-status'], data)
    },
    onError: (err: Error) => setError(err.message),
  })

  const pollNow = useMutation({
    mutationFn: gmailApi.pollNow,
    onSuccess: response => {
      setError(null)
      setNotice(response.detail)
      // The poll runs in the worker, so the result lands a few seconds later.
      setTimeout(
        () => void queryClient.invalidateQueries({ queryKey: ['gmail-ingest-status'] }),
        4000,
      )
    },
    onError: (err: Error) => setError(err.message),
  })

  if (isLoading || !status) {
    return (
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-base font-semibold">Gmail resume ingest</h2>
        <p className="mt-2 text-sm text-muted-foreground">Loading…</p>
      </section>
    )
  }

  const filtersEmpty = status.subject_filters.length === 0
  const running = status.configured && status.is_active && !filtersEmpty

  return (
    <div className="max-w-[820px] space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Connection                                                          */}
      {/* ------------------------------------------------------------------ */}
      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Mail className="size-4" />
              Gmail resume ingest
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Resumes emailed to the watched inbox are parsed into the talent pool, exactly
              as if they had been uploaded by hand.
            </p>
          </div>
          <Badge variant={running ? 'default' : 'outline'}>
            {running ? 'Watching' : 'Not running'}
          </Badge>
        </div>

        <dl className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Mailbox</dt>
            <dd className="mt-1 text-sm font-medium">{status.email_address ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Last checked</dt>
            <dd className="mt-1 text-sm font-medium">{relativeTime(status.last_polled_at)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Checked every</dt>
            <dd className="mt-1 text-sm font-medium">5 minutes</dd>
          </div>
        </dl>

        {!status.configured && (
          // Credentials live in backend env, so there is nothing the admin can
          // click here to fix this — say exactly what to set and where.
          <div className="mt-5 rounded-md border border-border bg-muted/40 p-4 text-sm">
            <p className="font-medium">No mailbox connected.</p>
            <p className="mt-1 text-muted-foreground">
              Set <code className="font-mono text-xs">GMAIL_ADDRESS</code> and{' '}
              <code className="font-mono text-xs">GMAIL_APP_PASSWORD</code> in the backend
              environment, then restart it. The app password is generated at{' '}
              <span className="font-mono text-xs">myaccount.google.com/apppasswords</span> and
              requires 2-Step Verification on that Google account — it is not the account
              password.
            </p>
          </div>
        )}

        {status.last_error && (
          <div className="mt-5 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 flex-shrink-0" />
            <div>
              <p className="font-medium">Last check failed</p>
              <p className="mt-1">{status.last_error}</p>
            </div>
          </div>
        )}

        <div className="mt-5 flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={!status.configured || pollNow.isPending}
            onClick={() => pollNow.mutate()}
          >
            <RefreshCw className={`size-4 ${pollNow.isPending ? 'animate-spin' : ''}`} />
            Check now
          </Button>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={status.is_active}
              disabled={toggleActive.isPending}
              onCheckedChange={checked => toggleActive.mutate(checked === true)}
            />
            Watch this inbox
          </label>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Subject filters                                                     */}
      {/* ------------------------------------------------------------------ */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-base font-semibold">Which emails count</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          An email is picked up when its subject contains any of these, ignoring case.
          Everything else in the inbox is left alone.
        </p>

        <div className="mt-4 space-y-2">
          <Label htmlFor="subject-filters">Subject contains (one per line)</Label>
          <textarea
            id="subject-filters"
            rows={4}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={draftFilters ?? ''}
            onChange={event => {
              setDraftFilters(event.target.value)
              setNotice(null)
            }}
            placeholder={'Resume Submission\nCV drop\nApplication for'}
          />
          {parsedFilters.length === 0 && (
            // The safe default is silence, but silence is indistinguishable
            // from breakage unless it is stated.
            <p className="text-xs text-muted-foreground">
              With no filters, nothing is ingested — an empty list never means “match
              everything”.
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button size="sm" disabled={!isDirty || save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? 'Saving…' : 'Save filters'}
          </Button>
          {isDirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
          {notice && !isDirty && <span className="text-xs text-muted-foreground">{notice}</span>}
        </div>

        {error && (
          <p className="mt-3 flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="size-4 flex-shrink-0" />
            {error}
          </p>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Recent activity                                                     */}
      {/* ------------------------------------------------------------------ */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-base font-semibold">Recent emails</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every matching email the poller has looked at, including the ones it could not
          use — so a resume that never arrived can be told apart from one that failed.
        </p>

        {status.recent.length === 0 ? (
          <div className="mt-5 flex flex-col items-center gap-2 py-8 text-center">
            <Inbox className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nothing yet. Matching emails will appear here after the next check.
            </p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Subject</th>
                  <th className="pb-2 pr-4 font-medium">From</th>
                  <th className="pb-2 pr-4 font-medium">File</th>
                  <th className="pb-2 pr-4 font-medium">Result</th>
                  <th className="pb-2 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {status.recent.map(item => (
                  <tr
                    key={`${item.message_id}:${item.filename}`}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="max-w-[240px] truncate py-2 pr-4" title={item.subject ?? ''}>
                      {item.subject ?? '—'}
                    </td>
                    <td
                      className="max-w-[180px] truncate py-2 pr-4 text-muted-foreground"
                      title={item.from_address ?? ''}
                    >
                      {item.from_address ?? '—'}
                    </td>
                    <td className="max-w-[160px] truncate py-2 pr-4" title={item.filename}>
                      {item.filename || '—'}
                    </td>
                    <td className="py-2 pr-4">
                      <Badge variant={STATUS_VARIANT[item.status]}>
                        {STATUS_LABEL[item.status] ?? item.status}
                      </Badge>
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {relativeTime(item.ingested_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
