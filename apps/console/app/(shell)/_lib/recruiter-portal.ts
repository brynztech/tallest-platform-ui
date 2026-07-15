export type RecruiterRoute = {
  href: string
  label: string
  activePrefixes?: string[]
}

export type RecruiterAliasDataSource =
  | 'ops-requisitions'
  | 'ops-clients'
  | 'supply-ingest'
  | 'ops-shortlists'
  | 'supply-search'
  | 'ops-interviews'
  | 'ops-client-notes'
  | 'ops-placements'

export type RecruiterRouteAlias = {
  href: string
  targetHref: string | null
  dataSource: RecruiterAliasDataSource
}

export const TOP_NAV_ITEMS: RecruiterRoute[] = [
  { href: '/jobs', label: 'Browse Jobs' },
  { href: '/clients', label: 'Your Clients' },
  { href: '/dashboard', label: 'Dashboard', activePrefixes: ['/dashboard', '/overview'] },
]

export const SIDEBAR_PRIMARY_ITEMS: RecruiterRoute[] = [
  { href: '/submit', label: 'Submit Candidate' },
  { href: '/pipeline', label: 'Pipeline' },
  { href: '/overview', label: 'Overview', activePrefixes: ['/overview', '/dashboard'] },
  { href: '/calendar', label: 'Calendar' },
  { href: '/messages', label: 'Client Messages' },
  { href: '/cross-list', label: 'Cross List' },
  { href: '/matchmaker', label: 'AI Matchmaker' },
]

export const INTERNAL_OPS_ITEMS: RecruiterRoute[] = [
  { href: '/bd/leads', label: 'BD Lead Review', activePrefixes: ['/bd'] },
  { href: '/ops/clients', label: 'Ops Clients', activePrefixes: ['/ops/clients'] },
  { href: '/ops/requisitions', label: 'Ops Requisitions', activePrefixes: ['/ops/requisitions'] },
  { href: '/ops/interviews', label: 'Ops Interviews', activePrefixes: ['/ops/interviews'] },
  { href: '/supply/search', label: 'Supply Search', activePrefixes: ['/supply/search'] },
  { href: '/supply/ingest', label: 'Supply Ingest', activePrefixes: ['/supply/ingest'] },
  {
    href: '/ops/quality-review',
    label: 'Quality Review',
    activePrefixes: ['/ops/quality-review'],
  },
  { href: '/admin', label: 'Admin Panel', activePrefixes: ['/admin'] },
]

export const SIDEBAR_STAGE_ITEMS: RecruiterRoute[] = [
  { href: '/pipeline?stage=active', label: 'Active' },
  { href: '/pipeline?stage=rejected', label: 'Rejected' },
]

export const RECRUITER_ROUTES: RecruiterRoute[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/overview', label: 'Overview' },
  { href: '/jobs', label: 'Browse Jobs' },
  { href: '/clients', label: 'Your Clients' },
  { href: '/submit', label: 'Submit Candidate' },
  { href: '/pipeline', label: 'Candidate Pipeline' },
  { href: '/matchmaker', label: 'AI Matchmaker' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/messages', label: 'Client Messages' },
  { href: '/cross-list', label: 'Cross List' },
  { href: '/rewards', label: 'Referrals and Promotions' },
]

export const RECRUITER_ROUTE_ALIASES: RecruiterRouteAlias[] = [
  { href: '/jobs', targetHref: '/ops/requisitions', dataSource: 'ops-requisitions' },
  { href: '/clients', targetHref: '/ops/clients', dataSource: 'ops-clients' },
  { href: '/submit', targetHref: '/supply/ingest', dataSource: 'supply-ingest' },
  { href: '/pipeline', targetHref: '/ops/requisitions', dataSource: 'ops-shortlists' },
  { href: '/matchmaker', targetHref: '/supply/search', dataSource: 'supply-search' },
  { href: '/calendar', targetHref: '/ops/interviews', dataSource: 'ops-interviews' },
  { href: '/messages', targetHref: '/ops/clients', dataSource: 'ops-client-notes' },
  { href: '/cross-list', targetHref: '/supply/search', dataSource: 'supply-search' },
  { href: '/rewards', targetHref: '/ops/requisitions', dataSource: 'ops-placements' },
]
