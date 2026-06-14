'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@brynzit/ui/components/ui/tabs'
import { AdminOverviewTab } from './admin-overview-tab'
import { AdminCostsTab } from './admin-costs-tab'
import { AdminEventsTab } from './admin-events-tab'
import { AdminQuotasTab } from './admin-quotas-tab'
import { AdminPipelineTab } from './admin-pipeline-tab'

export function AdminContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const activeTab = searchParams.get('tab') ?? 'overview'

  function handleTabChange(value: string) {
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
          <div className="py-8 text-center text-sm text-muted-foreground">
            Prompts editor — coming in Plan 04-05.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
