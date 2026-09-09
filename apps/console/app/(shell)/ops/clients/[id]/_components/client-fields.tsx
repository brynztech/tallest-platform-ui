'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { toast } from 'sonner'
import { useCan } from '@brynzit/identity'
import { Button } from '@brynzit/ui/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@brynzit/ui/components/ui/dialog'
import { Input } from '@brynzit/ui/components/ui/input'
import { Label } from '@brynzit/ui/components/ui/label'
import { Pencil } from 'lucide-react'
import { listAssignableRecruiters } from '@/_lib/staff-auth'

const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  primary_contact_name: z.string().nullable().optional(),
  primary_contact_email: z
    .string()
    .email('Invalid email')
    .nullable()
    .optional()
    .or(z.literal('')),
  agreed_fee_pct: z
    .string()
    .nullable()
    .optional()
    .refine(
      (v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100),
      'Enter a percentage between 0 and 100',
    ),
})

type ClientFormValues = z.infer<typeof clientSchema>

interface ClientFieldsProps {
  client: components['schemas']['ClientResponse']
}

export function ClientFields({ client }: ClientFieldsProps) {
  const queryClient = useQueryClient()
  const can = useCan()
  const canManage = can('client.manage')
  const [isEditOpen, setIsEditOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client.name,
      primary_contact_name: client.primary_contact_name ?? '',
      primary_contact_email: client.primary_contact_email ?? '',
      agreed_fee_pct: client.agreed_fee_pct != null ? String(client.agreed_fee_pct) : '',
    },
  })

  const patchMutation = useMutation({
    mutationFn: async (values: ClientFormValues) => {
      const body: components['schemas']['PatchClientRequest'] = {
        name: values.name,
        primary_contact_name: values.primary_contact_name ?? null,
        primary_contact_email:
          values.primary_contact_email === '' ? null : (values.primary_contact_email ?? null),
        agreed_fee_pct: values.agreed_fee_pct ? Number(values.agreed_fee_pct) : null,
      }
      const { data, error } = await apiClient.PATCH('/api/v1/ops/clients/{client_id}', {
        params: { path: { client_id: client.id } },
        body,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops-client', client.id] })
      queryClient.invalidateQueries({ queryKey: ['ops-clients'] })
      toast('Client updated.')
      setIsEditOpen(false)
    },
    onError: () => {
      toast.error('Failed to update client.')
    },
  })

  return (
    <div className="mb-4 rounded-xl border border-border bg-card p-4">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Details</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Who to reach at this client, and the terms ops agreed with them.
          </p>
        </div>
        {canManage && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              reset({
                name: client.name,
                primary_contact_name: client.primary_contact_name ?? '',
                primary_contact_email: client.primary_contact_email ?? '',
                agreed_fee_pct: client.agreed_fee_pct != null ? String(client.agreed_fee_pct) : '',
              })
              setIsEditOpen(true)
            }}
          >
            <Pencil className="mr-1 size-4" />
            Edit
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label="Primary contact" value={client.primary_contact_name} />
        <Field
          label="Contact email"
          value={client.primary_contact_email}
          href={client.primary_contact_email ? `mailto:${client.primary_contact_email}` : undefined}
        />
        <Field label="Client since" value={new Date(client.created_at).toLocaleDateString()} />
        <Field label="Created by" value={client.created_by_username} />
        <Field
          label="Agreed fee"
          value={client.agreed_fee_pct != null ? `${client.agreed_fee_pct}% of CTC` : null}
        />
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit client</DialogTitle>
            <DialogDescription className="sr-only">
              Update the client name and primary contact details.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((values) => patchMutation.mutate(values))}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-client-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input id="edit-client-name" {...register('name')} aria-invalid={!!errors.name} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-contact-name">Primary contact name</Label>
              <Input id="edit-contact-name" {...register('primary_contact_name')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-contact-email">Primary contact email</Label>
              <Input
                id="edit-contact-email"
                type="email"
                {...register('primary_contact_email')}
                aria-invalid={!!errors.primary_contact_email}
              />
              {errors.primary_contact_email && (
                <p className="text-xs text-destructive">
                  {errors.primary_contact_email.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-agreed-fee">Agreed fee (% of CTC)</Label>
              <Input
                id="edit-agreed-fee"
                type="number"
                min={0}
                max={100}
                step="0.01"
                placeholder="8.33"
                {...register('agreed_fee_pct')}
                aria-invalid={!!errors.agreed_fee_pct}
              />
              {errors.agreed_fee_pct && (
                <p className="text-xs text-destructive">{errors.agreed_fee_pct.message}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={patchMutation.isPending}>
                {patchMutation.isPending ? 'Saving…' : 'Update client'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Field({
  label,
  value,
  href,
}: {
  label: string
  value: string | null | undefined
  href?: string
}) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-medium tracking-[0.09em] text-[#908E8B] uppercase">
        {label}
      </p>
      {value ? (
        href ? (
          <a href={href} className="text-sm hover:underline">
            {value}
          </a>
        ) : (
          <p className="text-sm">{value}</p>
        )
      ) : (
        <p className="text-sm text-muted-foreground">Not set</p>
      )}
    </div>
  )
}
