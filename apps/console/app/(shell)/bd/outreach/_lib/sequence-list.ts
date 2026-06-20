import type { components } from '@brynzit/api-client'

type LeadFatCardResponse = components['schemas']['LeadFatCardResponse']
type OutreachSequenceResponse = components['schemas']['OutreachSequenceResponse']

export interface OutreachReviewItem {
  sequence: OutreachSequenceResponse
  leadName: string
}

export function getOutreachReviewItemFromLead(
  lead: LeadFatCardResponse,
): OutreachReviewItem | null {
  if (!lead.active_sequence) return null

  return {
    leadName: lead.contact.company_name ?? lead.contact.name ?? 'Lead',
    sequence: {
      sequence_id: lead.active_sequence.id,
      lead_id: lead.id,
      status: lead.active_sequence.status,
      outreach_angle: lead.active_sequence.outreach_angle,
      rejection_notes: lead.active_sequence.rejection_notes,
      failure_reason: null,
      created_at: lead.active_sequence.created_at,
      steps: lead.active_sequence.steps.map((step) => ({
        ...step,
        original_subject: step.original_subject ?? step.subject,
        original_body: step.original_body ?? step.body,
      })),
    },
  }
}
