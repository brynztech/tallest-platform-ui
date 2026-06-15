export function getFocusedIndexForLead<T extends { id: string }>(
  leads: T[],
  leadId: string,
  fallbackIndex: number,
) {
  const nextIndex = leads.findIndex((lead) => lead.id === leadId)
  return nextIndex === -1 ? fallbackIndex : nextIndex
}
