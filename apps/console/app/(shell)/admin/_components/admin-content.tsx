'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@brynzit/ui/components/ui/tabs'
import { AdminOverviewTab } from './admin-overview-tab'
import { AdminCostsTab } from './admin-costs-tab'
import { AdminEventsTab } from './admin-events-tab'
import { AdminQuotasTab } from './admin-quotas-tab'
import { AdminPipelineTab } from './admin-pipeline-tab'
import { AdminPromptsTab } from './admin-prompts-tab'
import { AdminCandidatesTab } from './admin-candidates-tab'
import { AdminJobSourcesTab } from './admin-job-sources-tab'
import { AdminLinkedInSearchTab } from './admin-linkedin-search-tab'
import { AdminGmailTab } from './admin-gmail-tab'

const VALID_TABS = [
  'overview',
  'costs',
  'events',
  'quotas',
  'pipeline',
  'prompts',
  'candidates',
  'job-sources',
  'linkedin-search',
  'gmail',
] as const
type AdminTab = (typeof VALID_TABS)[number]

const DEFAULT_TAB: AdminTab = 'overview'

function isAdminTab(value: string): value is AdminTab {
  return (VALID_TABS as readonly string[]).includes(value)
}

/** WR-06: whitelist tab values so arbitrary URL params can't be injected. */
function normalizeTab(raw: string | null): AdminTab {
  return raw && isAdminTab(raw) ? raw : DEFAULT_TAB
}

export function AdminContent() {
  const searchParams = useSearchParams()
  const urlTab = normalizeTab(searchParams.get('tab'))

  // Local state is the rendering source of truth, NOT useSearchParams.
  //
  // /admin is a statically prerendered route, and Next.js keys its client router
  // cache by pathname. A `router.push('/admin?tab=x')` therefore looks like
  // "already have this route" and gets elided, so useSearchParams() never
  // updated — and because <Tabs> is controlled by that value, neither the URL nor
  // the panel changed. It only showed up after a hard load (refresh or direct URL
  // entry); soft-navigating into /admin leaves a live tree where the update does
  // propagate, which is why it looked intermittent.
  //
  // Driving the render from state makes a tab switch instant and independent of
  // the router cache entirely. Covered by e2e/admin-tabs.spec.ts.
  const [activeTab, setActiveTab] = useState<AdminTab>(urlTab)

  // Follow the URL when it changes underneath us: browser back/forward, and the
  // initial value once search params resolve after hydration.
  useEffect(() => {
    setActiveTab(urlTab)
  }, [urlTab])

  const handleTabChange = useCallback(
    (value: string) => {
      if (!isAdminTab(value)) return
      setActiveTab(value)

      // Native history API rather than router.push: Next.js merges pushState into
      // usePathname/useSearchParams, and unlike the router it cannot be dropped as
      // a no-op for a query-only change on a static route. pushState rather than
      // replaceState so browser back still walks through visited tabs.
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', value)
      window.history.pushState(null, '', `?${params.toString()}`)
    },
    [searchParams],
  )

  function renderActiveTab() {
    switch (activeTab) {
      case 'overview':
        return <AdminOverviewTab onNavigate={handleTabChange} />
      case 'costs':
        return <AdminCostsTab />
      case 'events':
        return <AdminEventsTab />
      case 'quotas':
        return <AdminQuotasTab />
      case 'pipeline':
        return <AdminPipelineTab />
      case 'prompts':
        return <AdminPromptsTab />
      case 'candidates':
        return <AdminCandidatesTab />
      case 'job-sources':
        return <AdminJobSourcesTab />
      case 'linkedin-search':
        return <AdminLinkedInSearchTab />
      case 'gmail':
        return <AdminGmailTab />
      default:
        return <AdminOverviewTab onNavigate={handleTabChange} />
    }
  }

  return (
    <div className="overflow-y-auto px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admin</h1>
      </div>
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="quotas">Quotas</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="prompts">Prompts</TabsTrigger>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="job-sources">Job sources</TabsTrigger>
          <TabsTrigger value="linkedin-search">LinkedIn search</TabsTrigger>
          <TabsTrigger value="gmail">Gmail</TabsTrigger>
        </TabsList>
      </Tabs>
      {renderActiveTab()}
    </div>
  )
}
