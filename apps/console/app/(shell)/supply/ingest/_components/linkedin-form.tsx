'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { toast } from 'sonner'
import { Button } from '@brynzit/ui/components/ui/button'
import { Input } from '@brynzit/ui/components/ui/input'
import { Label } from '@brynzit/ui/components/ui/label'
import type { IngestJob } from './ingest-job-card'
import { createClientId } from '../_lib/client-id'

const schema = z.object({
  linkedin_url: z
    .string()
    .min(1, 'URL is required')
    .url('Must be a valid URL')
    .refine((url) => url.startsWith('https://linkedin.com') || url.startsWith('https://www.linkedin.com'), {
      message: 'Must be a LinkedIn URL (https://linkedin.com/...)',
    }),
})

type FormValues = z.infer<typeof schema>

interface LinkedInFormProps {
  onJobAdded: (job: IngestJob) => void
}

export function LinkedInForm({ onJobAdded }: LinkedInFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      apiClient.POST('/api/v1/supply/candidates/ingest', {
        body: { linkedin_url: values.linkedin_url } as components['schemas']['IngestLinkedInRequest'],
      }),
    onSuccess: (response) => {
      const result = response.data as components['schemas']['IngestLinkedInResponse']
      reset()
      toast.success(`Candidate added: ${result?.name ?? 'unknown'}.`)
      onJobAdded({
        id: createClientId(),
        type: 'linkedin',
        label: 'LinkedIn',
        status: 'done',
        progressText: `Candidate added: ${result?.name ?? 'unknown'}`,
        candidateId: result?.candidate_id,
        timestamp: new Date(),
      })
    },
    onError: () => {
      toast.error('Ingest failed — try again.')
    },
  })

  return (
    <div className="mt-4 max-w-lg">
      <p className="mb-4 text-sm text-muted-foreground">
        Enter a LinkedIn profile URL to ingest a single candidate via Proxycurl.
      </p>
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <div>
          <Label htmlFor="linkedin_url" className="mb-1 block text-sm">
            LinkedIn Profile URL
          </Label>
          <Input
            id="linkedin_url"
            type="url"
            placeholder="https://linkedin.com/in/username"
            {...register('linkedin_url')}
          />
          {errors.linkedin_url && (
            <p className="mt-1 text-xs text-destructive">{errors.linkedin_url.message}</p>
          )}
        </div>
        <Button
          type="submit"
          size="sm"
          className="mt-3"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <>
              <svg className="mr-1.5 h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Adding…
            </>
          ) : (
            'Add Candidate'
          )}
        </Button>
      </form>
    </div>
  )
}
