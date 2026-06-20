'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
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
import { ChevronRight, Plus } from 'lucide-react'

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

export default function ClientsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['ops-clients'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/ops/clients')
      if (error) throw error
      return data
    },
  })
  const clients = data ?? []

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      primary_contact_name: '',
      primary_contact_email: '',
    },
  })

  const createMutation = useMutation({
    mutationFn: async (values: ClientFormValues) => {
      const body: components['schemas']['CreateClientRequest'] = {
        name: values.name,
        primary_contact_name: values.primary_contact_name ?? null,
        primary_contact_email:
          values.primary_contact_email === '' ? null : (values.primary_contact_email ?? null),
      }
      const { data, error } = await apiClient.POST('/api/v1/ops/clients', { body })
      if (error) throw error
      return data
    },
    onSuccess: (newClient) => {
      queryClient.invalidateQueries({ queryKey: ['ops-clients'] })
      toast('Client created — ' + newClient.name)
      setIsCreateOpen(false)
      reset()
      router.push('/ops/clients/' + newClient.id)
    },
    onError: () => {
      toast.error('Failed to create client.')
    },
  })

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-destructive text-sm">
          Couldn&apos;t load clients. Check your connection or refresh the page.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Sticky toolbar */}
      <div className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-background/90 px-6 backdrop-blur">
        <h1 className="text-xl font-semibold">Clients</h1>
        <span className="text-sm text-muted-foreground">{clients.length} clients</span>
        <Button className="ml-auto" size="sm" onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-1 size-4" />
          New Client
        </Button>
      </div>

      {/* Client list */}
      <div className="flex flex-col gap-2 px-4 py-4">
        {clients.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-4">
            <h2 className="text-xl font-semibold">No clients yet</h2>
            <p className="text-muted-foreground text-sm">
              Add your first client to start tracking requisitions and placements.
            </p>
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              New Client
            </Button>
          </div>
        ) : (
          clients.map((client) => (
            <Link
              key={client.id}
              href={`/ops/clients/${client.id}`}
              className="border-border bg-card hover:bg-muted/50 flex cursor-pointer items-center gap-4 rounded-lg border px-4 py-3 transition-colors"
            >
              <span className="flex-1 text-sm font-semibold">{client.name}</span>
              {client.primary_contact_name && (
                <span className="text-muted-foreground max-w-[200px] truncate text-xs">
                  {client.primary_contact_name}
                </span>
              )}
              <ChevronRight className="text-muted-foreground ml-auto size-4" />
            </Link>
          ))
        )}
      </div>

      {/* Create Client Dialog */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (!open) reset()
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Client</DialogTitle>
            <DialogDescription className="sr-only">
              Add a client with optional primary contact details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit((values) => createMutation.mutate(values))} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="client-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="client-name"
                placeholder="Acme Corp"
                {...register('name')}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-destructive text-xs">{errors.name.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact-name">Primary Contact Name</Label>
              <Input
                id="contact-name"
                placeholder="Jane Smith"
                {...register('primary_contact_name')}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact-email">Primary Contact Email</Label>
              <Input
                id="contact-email"
                type="email"
                placeholder="jane@acme.com"
                {...register('primary_contact_email')}
                aria-invalid={!!errors.primary_contact_email}
              />
              {errors.primary_contact_email && (
                <p className="text-destructive text-xs">{errors.primary_contact_email.message}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false)
                  reset()
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create Client'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
