'use client'

import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Button } from '@brynzit/ui/components/ui/button'
import { Input } from '@brynzit/ui/components/ui/input'
import { Label } from '@brynzit/ui/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@brynzit/ui/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@brynzit/ui/components/ui/select'
import {
  createStaffUser,
  listStaffUsers,
  STAFF_ROLE_LABELS,
  STAFF_ROLES,
  updateStaffUser,
  type StaffRole,
  type StaffUser,
} from '../../../_lib/staff-auth'
import { useStaffAuth } from '../../../_lib/staff-auth-context'

const USERS_QUERY_KEY = ['staff-auth', 'users'] as const

export function UserManagementPanel() {
  const queryClient = useQueryClient()
  const { user: currentUser } = useStaffAuth()
  const [createOpen, setCreateOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: users, isLoading } = useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: listStaffUsers,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY })

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: StaffRole }) => updateStaffUser(id, { role }),
    onSuccess: () => {
      setError(null)
      void invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      updateStaffUser(id, { is_active }),
    onSuccess: () => {
      setError(null)
      void invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Staff users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create logins for staff, assign a role, and deactivate accounts that should no longer
            sign in.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>New user</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New user</DialogTitle>
              <DialogDescription>
                Set a username, password, and role. Hand the password to them out of band — it
                isn&apos;t shown again.
              </DialogDescription>
            </DialogHeader>
            <CreateUserForm
              onCreated={() => {
                setCreateOpen(false)
                setError(null)
                void invalidate()
              }}
              onError={setError}
            />
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <p className="mb-4 flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted-foreground">
            <tr className="border-b border-border">
              <th className="py-2 pl-4 pr-4 text-left font-medium">Username</th>
              <th className="py-2 pr-4 text-left font-medium">Role</th>
              <th className="py-2 pr-4 text-left font-medium">Status</th>
              <th className="py-2 pr-4 text-left font-medium">Created</th>
              <th className="py-2 pr-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isSelf={user.id === currentUser?.id}
                onRoleChange={(role) => updateRole.mutate({ id: user.id, role })}
                onToggleActive={() =>
                  toggleActive.mutate({ id: user.id, is_active: !user.is_active })
                }
                busy={
                  (updateRole.isPending && updateRole.variables?.id === user.id) ||
                  (toggleActive.isPending && toggleActive.variables?.id === user.id)
                }
              />
            ))}
            {!isLoading && (users ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-muted-foreground">
                  No staff users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function UserRow({
  user,
  isSelf,
  onRoleChange,
  onToggleActive,
  busy,
}: {
  user: StaffUser
  isSelf: boolean
  onRoleChange: (role: StaffRole) => void
  onToggleActive: () => void
  busy: boolean
}) {
  return (
    <tr className="border-b border-border/60">
      <td className="py-2 pl-4 pr-4 font-medium">
        {user.username}
        {isSelf && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>}
      </td>
      <td className="py-2 pr-4">
        <Select
          value={user.role}
          onValueChange={(value) => onRoleChange(value as StaffRole)}
          disabled={busy || isSelf}
        >
          <SelectTrigger className="h-8 w-44" title={isSelf ? 'Ask another admin to change your role.' : undefined}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STAFF_ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {STAFF_ROLE_LABELS[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="py-2 pr-4">
        <Badge variant={user.is_active ? 'default' : 'outline'}>
          {user.is_active ? 'active' : 'deactivated'}
        </Badge>
      </td>
      <td className="py-2 pr-4 text-muted-foreground">{user.created_at.slice(0, 10)}</td>
      <td className="py-2 pr-4 text-right">
        <Button
          variant="outline"
          size="sm"
          disabled={busy || isSelf}
          title={isSelf ? 'Ask another admin to deactivate your account.' : undefined}
          onClick={onToggleActive}
        >
          {user.is_active ? 'Deactivate' : 'Activate'}
        </Button>
      </td>
    </tr>
  )
}

function CreateUserForm({
  onCreated,
  onError,
}: {
  onCreated: () => void
  onError: (message: string) => void
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<StaffRole>('recruiter')

  const create = useMutation({
    mutationFn: () => createStaffUser({ username, password, role }),
    onSuccess: () => {
      setUsername('')
      setPassword('')
      setRole('recruiter')
      onCreated()
    },
    onError: (err: Error) => onError(err.message),
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    create.mutate()
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <Label htmlFor="new-username">Username</Label>
        <Input
          id="new-username"
          required
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-password">Initial password</Label>
        <Input
          id="new-password"
          required
          minLength={8}
          value={password}
          placeholder="At least 8 characters"
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-role">Role</Label>
        <Select value={role} onValueChange={(value) => setRole(value as StaffRole)}>
          <SelectTrigger id="new-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STAFF_ROLES.map((item) => (
              <SelectItem key={item} value={item}>
                {STAFF_ROLE_LABELS[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? 'Creating…' : 'Create user'}
        </Button>
      </div>
    </form>
  )
}
