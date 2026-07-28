/**
 * Console "Job sources" admin tab and its server-side proxy.
 *
 * The security-relevant assertion is the first one: the admin token must never
 * appear in anything the browser can read. The rest guard the operator
 * safeguards — a double-clickable button that cannot start two crawls, and a
 * visibility-rule form that shows you it is about to empty the candidate site
 * before you save it.
 */
import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

const APP_DIR = path.resolve(__dirname, '../../app')

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(APP_DIR, relPath), 'utf-8')
}

describe('Admin token never reaches the browser', () => {
  const proxy = readFile('api/job-board/[...path]/route.ts')
  const tab = readFile('(shell)/admin/_components/admin-job-sources-tab.tsx')
  const client = readFile('(shell)/admin/_lib/job-board-api.ts')

  it('reads the token from server-only env in the route handler', () => {
    expect(proxy).toContain('process.env.ADMIN_API_TOKEN')
    // A NEXT_PUBLIC_ prefix would inline the secret into the client bundle.
    expect(proxy).not.toContain('NEXT_PUBLIC_ADMIN')
  })

  it('never references the token from client components', () => {
    for (const src of [tab, client]) {
      expect(src).not.toContain('ADMIN_API_TOKEN')
      expect(src).not.toContain('X-Admin-Token')
    }
  })

  it('has the client talk to the same-origin proxy, not the backend', () => {
    expect(client).toContain("const BASE = '/api/job-board'")
    expect(client).not.toContain('NEXT_PUBLIC_API_URL')
  })

  it('rebuilds the forwarded path instead of passing it through raw', () => {
    // Guards against a crafted path escaping the /job-board prefix.
    expect(proxy).toContain('encodeURIComponent')
    expect(proxy).toContain('/api/v1/job-board/')
  })

  it('restricts which methods it will forward', () => {
    expect(proxy).toContain('ALLOWED_METHODS')
    expect(proxy).toContain('405')
  })

  it('never caches admin reads', () => {
    expect(proxy).toContain("cache: 'no-store'")
  })

  it('reports a missing token distinctly from a backend failure', () => {
    expect(proxy).toContain('503')
    expect(proxy).toContain('502')
  })
})

describe('Run job search button', () => {
  const src = readFile('(shell)/admin/_components/admin-job-sources-tab.tsx')

  it('renders the trigger the recruiter asked for', () => {
    expect(src).toContain('Run job search now')
  })

  it('disables itself while a crawl is in flight', () => {
    expect(src).toContain('disabled={running || startRun.isPending}')
  })

  it('polls the run for progress', () => {
    expect(src).toContain('refetchInterval')
    expect(src).toContain('RUN_POLL_MS')
  })

  it('shows a progress bar with accessible values', () => {
    expect(src).toContain('role="progressbar"')
    expect(src).toContain('aria-valuenow')
  })

  it('adopts an in-flight run on mount so a page reload still shows progress', () => {
    expect(src).toContain('if (!activeRunId && isRunActive(latest))')
  })

  it('surfaces the backend error message, including the 409 conflict', () => {
    expect(src).toContain('setError(err.message)')
  })

  it('explains a smaller-than-expected result via the out-of-scope count', () => {
    expect(src).toContain('Out of scope')
    expect(src).toContain('jobs_rejected')
  })

  it('shows per-company errors without failing the whole run', () => {
    expect(src).toContain('company error')
    expect(src).toContain('current.errors')
  })
})

describe('Visibility rules form', () => {
  const src = readFile('(shell)/admin/_components/admin-job-sources-tab.tsx')

  it('previews the impact of the draft, not the saved rules', () => {
    // Saving max_age_days=7 against a stale crawl shows candidates zero jobs;
    // the admin has to see that before saving, not after.
    expect(src).toContain('previewVisibilityRules(draft!)')
    expect(src).toContain("queryKey: ['job-board-visibility-impact', draft]")
  })

  it('renders the zero-jobs warning prominently', () => {
    expect(src).toContain('impact.warning')
    expect(src).toContain('border-destructive')
  })

  it('reports how many of the ingested jobs would be visible', () => {
    expect(src).toContain('would be visible')
    expect(src).toContain('impact.total_active')
  })

  it('offers the freshness window the recruiter asked for', () => {
    expect(src).toContain('Last 7 days')
    expect(src).toContain('No age limit')
  })

  it('only enables save when something actually changed', () => {
    expect(src).toContain('disabled={!isDirty || save.isPending}')
  })

  it('shows the rules version so cache invalidation is visible', () => {
    expect(src).toContain('rules_version')
  })

  it('warns that requiring pay hides most inventory', () => {
    expect(src).toContain('publish no pay')
  })
})

describe('Tracked companies panel', () => {
  const src = readFile('(shell)/admin/_components/admin-job-sources-tab.tsx')

  it('only offers sources that are enabled and take a board token', () => {
    expect(src).toContain('item.enabled && item.requires_board_token')
  })

  it('explains why unavailable sources are unavailable', () => {
    expect(src).toContain('Unavailable sources')
    expect(src).toContain('item.notes')
  })

  it('offers the starter list for a first run', () => {
    expect(src).toContain('Add starter list')
  })

  it('explains why companies must be added one at a time', () => {
    expect(src).toContain('per-company')
  })
})

describe('Job sources tab is reachable', () => {
  const src = readFile('(shell)/admin/_components/admin-content.tsx')

  it('is whitelisted as a tab value', () => {
    // WR-06: arbitrary URL params must not be injectable.
    expect(src).toContain("'job-sources'")
    expect(src).toContain('VALID_TABS')
  })

  it('is rendered and has a trigger', () => {
    expect(src).toContain('<AdminJobSourcesTab />')
    expect(src).toContain('<TabsTrigger value="job-sources">')
  })
})

describe('Job board API client', () => {
  const src = readFile('(shell)/admin/_lib/job-board-api.ts')

  it('exposes every endpoint the tab needs', () => {
    for (const method of [
      'listSources',
      'listCompanies',
      'seedCompanies',
      'addCompany',
      'startRun',
      'getRun',
      'listRuns',
      'getVisibilityRules',
      'saveVisibilityRules',
      'previewVisibilityRules',
    ]) {
      expect(src).toContain(method)
    }
  })

  it('propagates the backend detail message rather than a generic failure', () => {
    expect(src).toContain('body?.detail')
  })

  it('treats queued and running as in-progress', () => {
    expect(src).toContain('RUN_IN_PROGRESS')
    expect(src).toContain("'queued'")
    expect(src).toContain("'running'")
  })
})
