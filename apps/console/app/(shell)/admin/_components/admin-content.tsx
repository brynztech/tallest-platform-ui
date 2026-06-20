'use client'

import { useCallback, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@brynzit/ui/components/ui/tabs'
import { toast } from 'sonner'
import { AdminOverviewTab } from './admin-overview-tab'
import { AdminCostsTab } from './admin-costs-tab'
import { AdminEventsTab } from './admin-events-tab'
import { AdminQuotasTab } from './admin-quotas-tab'
import { AdminPipelineTab } from './admin-pipeline-tab'
import { AdminPromptsTab } from './admin-prompts-tab'
import { AdminCandidatesTab } from './admin-candidates-tab'

const VALID_TABS = ['overview', 'costs', 'events', 'quotas', 'pipeline', 'prompts', 'candidates'] as const

export function AdminContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const rawTab = searchParams.get('tab') ?? 'overview'
  // WR-06: whitelist tab values so arbitrary URL params can't be injected
  const activeTab = (VALID_TABS as readonly string[]).includes(rawTab) ? rawTab : 'overview'

  const isPromptsDirtyRef = useRef(false)
  const handlePromptsDirtyChange = useCallback((dirty: boolean) => {
    isPromptsDirtyRef.current = dirty
  }, [])

  function handleTabChange(value: string) {
    // CR-03: guard in-app tab navigation when prompt editor has unsaved changes
    if (isPromptsDirtyRef.current && activeTab === 'prompts') {
      toast('Unsaved prompt changes — save or discard before switching tabs.', {
        duration: 5000,
        action: {
          label: 'Discard & switch',
          onClick: () => {
            isPromptsDirtyRef.current = false
            router.push(`${pathname}?tab=${value}`)
          },
        },
      })
      return
    }
    router.push(`${pathname}?tab=${value}`)
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
        </TabsList>
        <TabsContent value="overview">
          <AdminOverviewTab onNavigate={handleTabChange} />
        </TabsContent>
        <TabsContent value="costs">
          <AdminCostsTab />
        </TabsContent>
        <TabsContent value="events">
          <AdminEventsTab />
        </TabsContent>
        <TabsContent value="quotas">
          <AdminQuotasTab />
        </TabsContent>
        <TabsContent value="pipeline">
          <AdminPipelineTab />
        </TabsContent>
        <TabsContent value="prompts">
          <AdminPromptsTab onDirtyChange={handlePromptsDirtyChange} />
        </TabsContent>
        <TabsContent value="candidates">
          <AdminCandidatesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
