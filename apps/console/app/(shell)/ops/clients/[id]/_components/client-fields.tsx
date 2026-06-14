'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { toast } from 'sonner'
import { Button } from '@brynzit/ui/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@brynzit/ui/components/ui/dialog'
import { Input } from '@brynzit/ui/components/ui/input'
import { Label } from '@brynzit/ui/components/ui/label'
import { Pencil } from 'lucide-react'

const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  primary_contact_name: z.string().nullable().optional(),
  primary_contact_email: z
    .string()
    .email('Invalid email')
    .nullable()
    .optional()
    .or(z.literal('')),
})

type ClientFormValues = z.infer<typeof clientSchema>

interface ClientFieldsProps {
  client: components['schemas']['ClientResponse']
}

export function ClientFields({ client }: ClientFieldsProps) {
  const queryClient = useQueryClient()
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
    },
  })

  const patchMutation = useMutation({
    mutationFn: async (values: ClientFormValues) => {
      const body: components['schemas']['PatchClientRequest'] = {
        name: values.name,
        primary_contact_name: values.primary_contact_name ?? null,
        primary_contact_email:
          values.primary_contact_email === '' ? null : (values.primary_contact_email ?? null),
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
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Details</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            reset({
              name: client.name,
              primary_contact_name: client.primary_contact_name ?? '',
              primary_contact_email: client.primary_contact_email ?? '',
            })
            setIsEditOpen(true)
          }}
        >
          <Pencil className="mr-1 size-3.5" />
          Edit
        </Button>
      </div>

      {/* Read-only field display */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground text-xs">Status</span>
          <span className="text-sm">{client.status}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground text-xs">Primary Contact</span>
          <span className="text-sm">{client.primary_contact_name ?? '—'}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground text-xs">Contact Email</span>
          {client.primary_contact_email ? (
            <a
              href={`mailto:${client.primary_contact_email}`}
              className="text-primary text-sm hover:underline"
            >
              {client.primary_contact_email}
            </a>
          ) : (
            <span className="text-sm">—</span>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((values) => patchMutation.mutate(values))}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-client-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-client-name"
                {...register('name')}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-destructive text-xs">{errors.name.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-contact-name">Primary Contact Name</Label>
              <Input
                id="edit-contact-name"
                {...register('primary_contact_name')}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-contact-email">Primary Contact Email</Label>
              <Input
                id="edit-contact-email"
                type="email"
                {...register('primary_contact_email')}
                aria-invalid={!!errors.primary_contact_email}
              />
              {errors.primary_contact_email && (
                <p className="text-destructive text-xs">
                  {errors.primary_contact_email.message}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={patchMutation.isPending}>
                {patchMutation.isPending ? 'Saving…' : 'Update Client'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
