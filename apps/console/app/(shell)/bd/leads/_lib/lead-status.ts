export type LeadStatusTab = 'review_queue' | 'processing' | 'suppressed' | 'all'

export const LEAD_STATUS_TABS: Array<{
  id: LeadStatusTab
  label: string
  description: string
}> = [
  {
    id: 'review_queue',
    label: 'Review Queue',
    description: 'Qualified leads ready for approve, reject, or snooze.',
  },
  {
    id: 'processing',
    label: 'Processing',
    description: 'Imported leads that are discovered, enriching, or scored outside review.',
  },
  {
    id: 'suppressed',
    label: 'Suppressed',
    description: 'Leads scored below the ICP threshold or otherwise removed from review.',
  },
  {
    id: 'all',
    label: 'All Leads',
    description: 'Every lead the backend currently knows about.',
  },
]

const PROCESSING_STATUSES = new Set(['discovered', 'enriching', 'icp_scored'])
const TAB_IDS = new Set<LeadStatusTab>(LEAD_STATUS_TABS.map((tab) => tab.id))

export function parseLeadStatusTab(value: string | null | undefined): LeadStatusTab {
  return value && TAB_IDS.has(value as LeadStatusTab) ? (value as LeadStatusTab) : 'review_queue'
}

export function getQueryStatusForTab(tab: LeadStatusTab) {
  return tab === 'processing' || tab === 'all' ? 'all' : tab
}

export function filterLeadsForStatusTab<T extends { status?: string | null }>(
  leads: T[],
  tab: LeadStatusTab,
) {
  if (tab === 'processing') return leads.filter((lead) => PROCESSING_STATUSES.has(lead.status ?? ''))
  if (tab === 'all') return leads
  return leads.filter((lead) => lead.status === tab)
}

export function canReviewLead(lead: { status?: string | null }) {
  return lead.status === 'review_queue'
}

export function getLeadStatusLabel(status: string | null | undefined) {
  if (!status) return 'Unknown'
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
