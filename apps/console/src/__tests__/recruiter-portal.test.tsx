import { describe, expect, it } from 'vitest'
import * as mocks from '@brynzit/mocks'
import * as recruiterPortal from '../../app/(shell)/_lib/recruiter-portal'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { dedupeRequisitionsById } from '../../app/(shell)/_lib/recruiter-data'

const {
  RECRUITER_ROUTE_ALIASES,
  RECRUITER_ROUTES,
  INTERNAL_OPS_ITEMS,
  SIDEBAR_PRIMARY_ITEMS,
  SIDEBAR_STAGE_ITEMS,
  TOP_NAV_ITEMS,
} = recruiterPortal

describe('Recruiter portal IA', () => {
  it('keeps the requested top navigation structure', () => {
    expect(TOP_NAV_ITEMS.map(({ href, label }) => ({ href, label }))).toEqual([
      { href: '/jobs', label: 'Browse Jobs' },
      { href: '/clients', label: 'Your Clients' },
      { href: '/dashboard', label: 'Dashboard' },
    ])
  })

  it('keeps recruiter workflow labels in the sidebar', () => {
    expect(SIDEBAR_PRIMARY_ITEMS.map((item) => item.label)).toEqual([
      'Submit Candidate',
      'Pipeline',
      'Overview',
      'Calendar',
      'Client Messages',
      'Cross List',
      'AI Matchmaker',
    ])
    expect(SIDEBAR_STAGE_ITEMS.map((item) => item.label)).toEqual(['Active', 'Rejected'])
  })

  it('exposes internal ops navigation including the admin panel', () => {
    expect(INTERNAL_OPS_ITEMS.map((item) => item.label)).toEqual([
      'BD Lead Review',
      'Ops Clients',
      'Ops Requisitions',
      'Ops Interviews',
      'Supply Search',
      'Supply Ingest',
      'Quality Review',
      'Admin Panel',
    ])
    expect(INTERNAL_OPS_ITEMS.find((item) => item.href === '/admin')?.label).toBe('Admin Panel')
  })

  it('defines route aliases for every recruiter portal surface', () => {
    expect(RECRUITER_ROUTES.map((route) => route.href)).toEqual([
      '/dashboard',
      '/overview',
      '/jobs',
      '/clients',
      '/submit',
      '/pipeline',
      '/matchmaker',
      '/calendar',
      '/messages',
      '/cross-list',
      '/rewards',
    ])
  })

  it('maps recruiter aliases onto existing Brynzit flows or honest placeholders', () => {
    expect(RECRUITER_ROUTE_ALIASES).toEqual([
      {
        href: '/jobs',
        targetHref: '/ops/requisitions',
        dataSource: 'ops-requisitions',
      },
      {
        href: '/clients',
        targetHref: '/ops/clients',
        dataSource: 'ops-clients',
      },
      {
        href: '/submit',
        targetHref: '/supply/ingest',
        dataSource: 'supply-ingest',
      },
      {
        href: '/pipeline',
        targetHref: '/ops/requisitions',
        dataSource: 'ops-shortlists',
      },
      {
        href: '/matchmaker',
        targetHref: '/supply/search',
        dataSource: 'supply-search',
      },
      {
        href: '/calendar',
        targetHref: '/ops/interviews',
        dataSource: 'ops-interviews',
      },
      {
        href: '/messages',
        targetHref: '/ops/clients',
        dataSource: 'ops-client-notes',
      },
      {
        href: '/cross-list',
        targetHref: '/supply/search',
        dataSource: 'supply-search',
      },
      {
        href: '/rewards',
        targetHref: '/ops/requisitions',
        dataSource: 'ops-placements',
      },
    ])
  })

  it('does not export static recruiter demo data', () => {
    expect(Object.keys(recruiterPortal)).not.toEqual(
      expect.arrayContaining([
        'CLIENT_ASSIGNMENTS',
        'CANDIDATE_PIPELINE_COLUMNS',
        'DASHBOARD_METRICS',
        'CONVERSION_METRICS',
        'ACTIVE_PROMOTIONS',
        'CLIENT_MESSAGES',
        'CALENDAR_EVENTS',
        'CROSS_LIST_SUGGESTIONS',
        'countClientAssignments',
      ]),
    )
  })

  it('does not carry copied demo-domain content in recruiter route config', () => {
    const serialized = JSON.stringify(recruiterPortal)
    expect(serialized).not.toMatch(
      /Contrario|Kinect|Mem0|Specific Labs|Siva Kumar|Logesh|Akash|Alice Chen|David Park|Sara Okonkwo|Pipeline Value|Amount Earned/i,
    )
  })
})

describe('Recruiter mock contracts', () => {
  it('does not export mock-only recruiter handlers', () => {
    expect(Object.keys(mocks as Record<string, unknown>)).not.toContain('recruiterHandlers')
  })

  it('does not register recruiter-only MSW endpoints', () => {
    const exportedHandlers = Object.entries(mocks as Record<string, unknown>)
      .filter(([name]) => name.endsWith('Handlers'))
      .flatMap(([, handlers]) => handlers as unknown[])

    expect(exportedHandlers.some((handler) => String(handler).includes('/api/v1/recruiter/'))).toBe(
      false,
    )
  })
})

describe('Recruiter route implementations', () => {
  const appRoot = join(process.cwd(), 'app/(shell)')

  it('implements primary recruiter routes as real pages instead of redirect-only aliases', () => {
    const realRoutes = [
      'jobs',
      'clients',
      'submit',
      'pipeline',
      'matchmaker',
      'calendar',
      'messages',
      'cross-list',
      'rewards',
    ]

    for (const route of realRoutes) {
      const source = readFileSync(join(appRoot, route, 'page.tsx'), 'utf8')
      expect(source).not.toContain("import { redirect } from 'next/navigation'")
      expect(source).not.toMatch(/redirect\('/)
    }
  })

  it('maps recruiter pages to existing Ops and Supply data flows', () => {
    const expectedSources: Record<string, RegExp[]> = {
      // Screens offering a requisition to ACT on take it from
      // useScopedRequisitions (assignment-filtered for recruiters); /jobs and
      // /rewards keep the unfiltered browse list deliberately.
      jobs: [/fetchOpsClients/, /fetchRequisitionsForClients/],
      clients: [/fetchOpsClients/, /useScopedRequisitions/],
      submit: [/supply\/ingest|LinkedInForm|ResumeForm/, /useScopedRequisitions/],
      pipeline: [/fetchPipelineSubmissions/, /getHiringProcess/, /useScopedRequisitions/],
      matchmaker: [/supply\/candidates\/search|CandidateSearchWorkspace/],
      calendar: [/fetchOpsInterviews|ops\/interviews/],
      messages: [/fetchClientNotes/, /fetchOpsClients/],
      'cross-list': [/supply\/candidates\/search/, /useScopedRequisitions/],
      rewards: [/fetchPlacementsForRequisitions/, /fetchRequisitionsForClients/],
    }

    for (const [route, patterns] of Object.entries(expectedSources)) {
      const source = readFileSync(join(appRoot, route, 'page.tsx'), 'utf8')
      for (const pattern of patterns) {
        expect(source).toMatch(pattern)
      }
    }
  })
})

describe('Recruiter data helpers', () => {
  it('deduplicates requisitions by id before feeding route selectors', async () => {
    const clientA = {
      id: 'client-a',
      name: 'Client A',
      primary_contact_name: null,
      primary_contact_email: null,
      status: 'active',
      created_by: null,
      created_by_username: null,
      agreed_fee_pct: null,
      created_at: '2026-07-01T00:00:00.000Z',
    }
    const clientB = { ...clientA, id: 'client-b', name: 'Client B' }
    const baseReq = {
      id: 'req-1',
      client_id: 'client-a',
      title: 'Frontend Engineer',
      status: 'open',
      skills: [],
      seniority: null,
      compensation_range: null,
      target_start_date: null,
      intake_details: null,
      shortlist: null,
      created_at: '2026-07-01T00:00:00.000Z',
      updated_at: '2026-07-01T00:00:00.000Z',
    }

    const requisitions = dedupeRequisitionsById([
      { ...baseReq, client: clientA },
      { ...baseReq, client_id: 'client-b', client: clientB },
    ])

    expect(requisitions).toHaveLength(1)
    expect(requisitions[0].client?.name).toBe('Client A')
  })
})
