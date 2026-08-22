/**
 * Native-fetch helpers for the generate-first create wizard.
 *
 * `status: "draft"` is not in the generated api.d.ts yet — same convention as
 * `_lib/jd.ts` and `_lib/assignments.ts`.
 */

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
}

export interface DraftRequisition {
  id: string
  title: string
  status: string
  client_id: string | null
}

export async function createDraftRequisition(input: {
  client_id: string
  title: string
}): Promise<DraftRequisition> {
  const response = await fetch(`${apiBase()}/api/v1/ops/requisitions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: input.client_id,
      title: input.title,
      status: 'draft',
    }),
  })
  if (!response.ok) {
    throw new Error(`Failed to create requisition: ${response.status}`)
  }
  return (await response.json()) as DraftRequisition
}

export async function patchRequisitionTitle(reqId: string, title: string): Promise<void> {
  const response = await fetch(`${apiBase()}/api/v1/ops/requisitions/${encodeURIComponent(reqId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
  if (!response.ok) {
    throw new Error(`Failed to update title: ${response.status}`)
  }
}
