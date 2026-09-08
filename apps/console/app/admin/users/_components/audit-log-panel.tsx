'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  listStaffAuditLog,
  listStaffUsers,
  type StaffAuditLogEntry,
} from '../../../_lib/staff-auth'

const ACTION_LABELS: Record<string, string> = {
  'auth.login_success': 'Login',
  'auth.login_failed': 'Failed login',
}

export function AuditLogPanel() {
  const [actorStaffId, setActorStaffId] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  const { data: users } = useQuery({ queryKey: ['staff-auth', 'users'], queryFn: listStaffUsers })

  const { data: entries, isLoading } = useQuery({
    queryKey: ['staff-auth', 'audit-log', actorStaffId, start, end],
    queryFn: () =>
      listStaffAuditLog({
        actorStaffId: actorStaffId || undefined,
        start: start ? new Date(start).toISOString() : undefined,
        // Include the whole end day, not just its midnight.
        end: end ? new Date(`${end}T23:59:59`).toISOString() : undefined,
      }),
  })

  return (
    <div className="mt-10">
      <h2 className="text-lg font-semibold">Login activity</h2>
      <p className="mt-1 text-sm text-muted-foreground">Every sign-in attempt, successful or not.</p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          User
          <select
            className="h-8 rounded-md border border-border bg-background px-2 text-sm"
            value={actorStaffId}
            onChange={(event) => setActorStaffId(event.target.value)}
          >
            <option value="">All users</option>
            {(users ?? []).map((user) => (
              <option key={user.id} value={user.id}>
                {user.username}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          From
          <input
            type="date"
            className="h-8 rounded-md border border-border bg-background px-2 text-sm"
            value={start}
            onChange={(event) => setStart(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          To
          <input
            type="date"
            className="h-8 rounded-md border border-border bg-background px-2 text-sm"
            value={end}
            onChange={(event) => setEnd(event.target.value)}
          />
        </label>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted-foreground">
            <tr className="border-b border-border">
              <th className="py-2 pl-4 pr-4 text-left font-medium">User</th>
              <th className="py-2 pr-4 text-left font-medium">Event</th>
              <th className="py-2 pr-4 text-left font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {(entries ?? []).map((entry) => (
              <AuditLogRow key={entry.id} entry={entry} />
            ))}
            {!isLoading && (entries ?? []).length === 0 && (
              <tr>
                <td colSpan={3} className="py-6 text-center text-muted-foreground">
                  No activity recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AuditLogRow({ entry }: { entry: StaffAuditLogEntry }) {
  const label = ACTION_LABELS[entry.action] ?? entry.action
  const context = entry.context as { username_attempted?: string } | null
  const username = entry.actor_username ?? context?.username_attempted ?? 'unknown'
  const failed = entry.action === 'auth.login_failed'

  return (
    <tr className="border-b border-border/60">
      <td className="py-2 pl-4 pr-4 font-medium">{username}</td>
      <td className="py-2 pr-4">
        <span className={failed ? 'text-destructive' : undefined}>{label}</span>
      </td>
      <td className="py-2 pr-4 text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</td>
    </tr>
  )
}
