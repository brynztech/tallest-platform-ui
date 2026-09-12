'use client'

/**
 * Run history, shared by the two job-source tabs.
 *
 * ATS crawls and Apify LinkedIn searches write to the same run table and share
 * one active-run slot, but they are separate pipelines on separate schedules
 * with separate costs — so each tab shows only its own engine's runs rather
 * than one mixed list nobody can read. The `engine` prop is what scopes both
 * the request and the react-query cache key; two tabs mounting the same key
 * with different filters would otherwise serve each other's data.
 */

import { useQuery } from '@tanstack/react-query'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { jobBoardApi, type IngestionRun, type RunEngine } from '../_lib/job-board-api'

/** Poll cadence while a run is in flight. Fast enough that the progress bar
 *  visibly moves; the run commits progress per item, so there is something
 *  new to show. */
export const RUN_POLL_MS = 2000

export const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  queued: 'outline',
  running: 'secondary',
  succeeded: 'default',
  partial: 'secondary',
  failed: 'destructive',
}

/** Cache key for a run list. Always include the engine — see the file docstring. */
export function runsQueryKey(engine: RunEngine): [string, RunEngine] {
  return ['job-board-runs', engine]
}

export function relativeTime(iso: string | null): string {
  if (!iso) return '—'
  const then = new Date(iso).getTime()
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h ago`
  return `${Math.round(seconds / 86400)}d ago`
}

export function duration(run: IngestionRun): string {
  if (!run.started_at) return '—'
  const end = run.finished_at ? new Date(run.finished_at).getTime() : Date.now()
  const seconds = Math.max(0, Math.round((end - new Date(run.started_at).getTime()) / 1000))
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

/** Whatever the failing unit was called: a company for an ATS crawl, a saved
 *  search for an Apify run. Falling through to "run" alone (the old behaviour)
 *  made every Apify failure read as an anonymous "run — <message>". */
export function errorLabel(item: { display_name?: string; name?: string; stage?: string }): string {
  return item.display_name ?? item.name ?? item.stage ?? 'run'
}

export function RunHistoryPanel({
  engine,
  title = 'Recent runs',
  emptyLabel = 'No runs yet.',
}: {
  engine: RunEngine
  title?: string
  emptyLabel?: string
}) {
  const { data } = useQuery({
    queryKey: runsQueryKey(engine),
    queryFn: () => jobBoardApi.listRuns(10, engine),
  })

  return (
    <section className="border-border bg-card rounded-lg border p-6">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground text-xs uppercase tracking-wide">
            <tr className="border-border border-b">
              <th className="py-2 pr-4 text-left font-medium">Started</th>
              <th className="py-2 pr-4 text-left font-medium">Trigger</th>
              <th className="py-2 pr-4 text-left font-medium">Status</th>
              <th className="py-2 pr-4 text-left font-medium">Duration</th>
              <th className="py-2 pr-4 text-right font-medium">New</th>
              <th className="py-2 pr-4 text-right font-medium">Updated</th>
              <th className="py-2 pr-4 text-right font-medium">Closed</th>
              <th className="py-2 text-right font-medium">Errors</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((run) => (
              <tr key={run.id} className="border-border/60 border-b align-top">
                <td className="py-2 pr-4">
                  <div className="text-muted-foreground">
                    {relativeTime(run.started_at ?? run.created_at)}
                  </div>
                  {/* A failed run's reason belongs next to the run, not hidden
                      behind a click — this table is where an operator looks
                      first when something did not ingest. */}
                  {run.errors.length > 0 && (
                    <ul className="text-destructive mt-1 space-y-0.5 text-xs">
                      {run.errors.slice(0, 3).map((item, index) => (
                        <li key={`${item.company_id ?? item.search_id ?? index}`}>
                          <span className="font-medium">{errorLabel(item)}</span> — {item.error}
                        </li>
                      ))}
                      {run.errors.length > 3 && (
                        <li className="text-muted-foreground">+{run.errors.length - 3} more</li>
                      )}
                    </ul>
                  )}
                </td>
                <td className="text-muted-foreground py-2 pr-4">{run.trigger}</td>
                <td className="py-2 pr-4">
                  <Badge variant={STATUS_VARIANT[run.status] ?? 'outline'}>{run.status}</Badge>
                </td>
                <td className="text-muted-foreground py-2 pr-4">{duration(run)}</td>
                <td className="py-2 pr-4 text-right">{run.jobs_inserted}</td>
                <td className="py-2 pr-4 text-right">{run.jobs_updated}</td>
                <td className="py-2 pr-4 text-right">{run.jobs_closed}</td>
                <td className="py-2 text-right">
                  {run.errors.length > 0 ? (
                    <span className="text-destructive">{run.errors.length}</span>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </td>
              </tr>
            ))}
            {(data?.items ?? []).length === 0 && (
              <tr>
                <td colSpan={8} className="text-muted-foreground py-6 text-center">
                  {emptyLabel}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
