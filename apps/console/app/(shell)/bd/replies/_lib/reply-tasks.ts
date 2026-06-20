import type { components } from '@brynzit/api-client'

type LeadFatCardResponse = components['schemas']['LeadFatCardResponse']
type BDTaskSummary = components['schemas']['BDTaskSummary']

export interface BDReplyTask {
  id: string
  classification: 'interested' | 'ooo' | 'not_now' | 'unsubscribe'
  company_name: string
  contact_name: string
  ai_briefing: string | null
}

export const REPLY_LEAD_STATUSES = ['interested', 'ooo_snoozed', 'not_now', 'unsubscribed'] as const

export function normaliseReplyTask(raw: BDTaskSummary, lead: LeadFatCardResponse): BDReplyTask | null {
  const ctx = raw.context_json as
    | {
        company_name?: string
        contact_name?: string
        classification?: string
        ai_briefing?: string | null
        company_summary?: string | null
      }
    | null
  const classification = (ctx?.classification ?? raw.category) as BDReplyTask['classification']
  if (!['interested', 'ooo', 'not_now', 'unsubscribe'].includes(classification)) return null

  return {
    id: raw.id,
    classification,
    company_name: ctx?.company_name ?? lead.contact.company_name ?? lead.contact.name ?? 'Unknown',
    contact_name: ctx?.contact_name ?? lead.contact.name ?? '',
    ai_briefing: ctx?.ai_briefing ?? ctx?.company_summary ?? null,
  }
}

export function getReplyTasksFromLead(lead: LeadFatCardResponse): BDReplyTask[] {
  return (lead.tasks ?? [])
    .map((task) => normaliseReplyTask(task, lead))
    .filter((task): task is BDReplyTask => task !== null)
}
