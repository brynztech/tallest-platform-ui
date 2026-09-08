import { isLiveRequisitionStatus } from './requisition-status'

/**
 * A requisition's health is a proxy for "is this actually moving" — days
 * open, per the product call: <=30d on track, <=60d at risk, beyond that
 * stalled. A paused/closed/filled/draft requisition is always stalled
 * regardless of age — it isn't progressing at all. Computed client-side,
 * `created_at` is the only input, no backend change needed.
 */
export type RequisitionHealth = 'on_track' | 'at_risk' | 'stalled'

const DAY_MS = 24 * 60 * 60 * 1000

export function computeRequisitionHealth(createdAt: string, status: string): RequisitionHealth {
  if (!isLiveRequisitionStatus(status)) return 'stalled'
  const daysOpen = (Date.now() - new Date(createdAt).getTime()) / DAY_MS
  if (daysOpen <= 30) return 'on_track'
  if (daysOpen <= 60) return 'at_risk'
  return 'stalled'
}

const HEALTH_LABEL: Record<RequisitionHealth, string> = {
  on_track: 'on track',
  at_risk: 'at risk',
  stalled: 'stalled',
}

const HEALTH_TONE: Record<RequisitionHealth, string> = {
  on_track: '#317A4F',
  at_risk: '#905300',
  stalled: '#BA4642',
}

export function healthLabel(health: RequisitionHealth): string {
  return HEALTH_LABEL[health]
}

export function healthTone(health: RequisitionHealth): string {
  return HEALTH_TONE[health]
}
