import { Suspense } from 'react'
import { AdminContent } from './_components/admin-content'

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <AdminContent />
    </Suspense>
  )
}
