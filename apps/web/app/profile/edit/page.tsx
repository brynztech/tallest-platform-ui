'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import Link from 'next/link'
import { Button } from '@brynzit/ui/components/ui/button'
import { Input } from '@brynzit/ui/components/ui/input'
import { Label } from '@brynzit/ui/components/ui/label'
import { Textarea } from '@brynzit/ui/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@brynzit/ui/components/ui/select'
import { Progress } from '@brynzit/ui/components/ui/progress'
import { Separator } from '@brynzit/ui/components/ui/separator'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Skeleton } from '@brynzit/ui/components/ui/skeleton'
import { Popover, PopoverContent, PopoverTrigger } from '@brynzit/ui/components/ui/popover'
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from '@brynzit/ui/components/ui/command'
import { useCandidateAuth } from '../../_components/candidate-auth-context'
import type { CandidateProfile, CandidateProfileUpdate } from '../../_lib/candidate-types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// T-05-04: reject javascript: and data: protocols for external URLs
function safeHref(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return url
  } catch {
    if (url.startsWith('/')) return url
  }
  return undefined
}

const SKILL_SUGGESTIONS = [
  'TypeScript',
  'JavaScript',
  'React',
  'Node.js',
  'Python',
  'Go',
  'Rust',
  'AWS',
  'Docker',
  'Kubernetes',
  'PostgreSQL',
  'GraphQL',
  'Next.js',
  'Vue',
  'Design Systems',
  'Figma',
  'Product Management',
  'Swift',
  'Kotlin',
  'Terraform',
]

const profileEditSchema = z.object({
  first_name: z.string().min(1, 'First name required'),
  last_name: z.string().min(1, 'Last name required'),
  headline: z.string().optional(),
  experience_summary: z.string().max(500).optional(),
  location: z.string().optional(),
  remote_preference: z
    .enum(['remote_only', 'hybrid', 'onsite', 'flexible'])
    .optional(),
  seniority: z
    .enum(['junior', 'mid', 'senior', 'staff', 'principal'])
    .optional(),
  github_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  linkedin_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
})

type ProfileEditValues = z.infer<typeof profileEditSchema>

export default function ProfileEditPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isLoggedIn } = useCandidateAuth()
  const [skills, setSkills] = useState<string[]>([])
  const [skillsOpen, setSkillsOpen] = useState(false)

  // Protected route — redirect to /login when not logged in
  useEffect(() => {
    if (!isLoggedIn) router.replace('/login')
  }, [isLoggedIn, router])

  const { data: profile, isLoading } = useQuery({
    queryKey: ['candidate-profile'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/v1/candidate/profile`)
      if (!res.ok) throw new Error('Profile fetch failed')
      return res.json() as Promise<CandidateProfile>
    },
    enabled: isLoggedIn,
  })

  const form = useForm<ProfileEditValues>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      headline: '',
      experience_summary: '',
      location: '',
      github_url: '',
      linkedin_url: '',
    },
  })

  // Populate form from loaded profile (pattern from 05-PATTERNS.md)
  useEffect(() => {
    if (profile) {
      form.reset({
        first_name: profile.first_name ?? '',
        last_name: profile.last_name ?? '',
        headline: profile.headline ?? '',
        experience_summary: '',
        location: profile.location ?? '',
        remote_preference: profile.remote_preference ?? undefined,
        seniority: profile.seniority ?? undefined,
        // T-05-04: display existing URLs only if they pass safeHref protocol check
        github_url: safeHref(profile.github_url) ?? '',
        linkedin_url: safeHref(profile.linkedin_url) ?? '',
      })
      setSkills(profile.skills ?? [])
    }
  }, [profile, form])

  const mutation = useMutation({
    mutationFn: async (values: ProfileEditValues) => {
      const body: CandidateProfileUpdate = {
        first_name: values.first_name,
        last_name: values.last_name,
        headline: values.headline || undefined,
        location: values.location || undefined,
        remote_preference: values.remote_preference,
        seniority: values.seniority,
        skills,
        github_url: values.github_url || undefined,
        linkedin_url: values.linkedin_url || undefined,
      }
      const res = await fetch(`${API_BASE}/api/v1/candidate/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`PUT failed: ${res.status}`)
      return res.json() as Promise<CandidateProfile>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate-profile'] })
      toast('Profile saved.')
    },
    onError: () => toast.error("Couldn't save profile. Try again."),
  })

  function toggleSkill(skill: string) {
    setSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : prev.length >= 10
          ? prev
          : [...prev, skill],
    )
  }

  // Prevent rendering protected content before redirect
  if (!isLoggedIn) return null

  const score = profile?.completeness_score ?? 0

  return (
    <main className="mx-auto max-w-[640px] px-6 py-12 space-y-8">
      <div>
        <Link href="/jobs" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; Back to jobs
        </Link>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-normal text-foreground">Edit profile</h1>
        {/* PUB-05: Completeness meter — value from API only, never computed in UI (D-18) */}
        {!isLoading && (
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3">
              <Progress value={score} className="h-2 flex-1 [&>div]:bg-primary" />
              <span className="shrink-0 text-sm text-muted-foreground">{score}% complete</span>
            </div>
            {score < 70 && (
              <p className="text-sm text-muted-foreground">Reach 70% to unlock 1-click apply</p>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <form
          onSubmit={form.handleSubmit(v => mutation.mutate(v))}
          className="space-y-8"
        >
          {/* Personal section */}
          <section className="space-y-4">
            <h2 className="text-base font-normal text-foreground">Personal</h2>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="first_name">First name</Label>
                <Input id="first_name" {...form.register('first_name')} />
                {form.formState.errors.first_name && (
                  <p className="mt-1 text-xs text-destructive">
                    {form.formState.errors.first_name.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="last_name">Last name</Label>
                <Input id="last_name" {...form.register('last_name')} />
                {form.formState.errors.last_name && (
                  <p className="mt-1 text-xs text-destructive">
                    {form.formState.errors.last_name.message}
                  </p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                placeholder="e.g. Senior Product Engineer"
                {...form.register('headline')}
              />
            </div>
            <div>
              <Label htmlFor="experience_summary">Experience summary (optional)</Label>
              <Textarea
                id="experience_summary"
                rows={4}
                {...form.register('experience_summary')}
              />
            </div>
          </section>

          {/* Skills section */}
          <section className="space-y-4">
            <h2 className="text-base font-normal text-foreground">Skills</h2>
            <Separator />
            <Popover open={skillsOpen} onOpenChange={setSkillsOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" type="button" className="w-full justify-start">
                  {skills.length === 0 ? 'Add skills…' : `${skills.length} selected`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Search skills…" />
                  <CommandList>
                    {SKILL_SUGGESTIONS.map(skill => (
                      <CommandItem key={skill} onSelect={() => toggleSkill(skill)}>
                        {skills.includes(skill) ? '✓ ' : '  '}
                        {skill}
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {skills.map(skill => (
                  <Badge key={skill} variant="secondary" className="gap-1">
                    {skill}
                    <button
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      aria-label={`Remove ${skill}`}
                      className="ml-1 text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </section>

          {/* Preferences section */}
          <section className="space-y-4">
            <h2 className="text-base font-normal text-foreground">Preferences</h2>
            <Separator />
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="City, Country"
                {...form.register('location')}
              />
            </div>
            <div>
              <Label>Remote preference</Label>
              <Select
                defaultValue={profile?.remote_preference ?? undefined}
                onValueChange={v =>
                  form.setValue(
                    'remote_preference',
                    v as ProfileEditValues['remote_preference'],
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select preference…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remote_only">Remote only</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Seniority</Label>
              <Select
                defaultValue={profile?.seniority ?? undefined}
                onValueChange={v =>
                  form.setValue('seniority', v as ProfileEditValues['seniority'])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="junior">Junior</SelectItem>
                  <SelectItem value="mid">Mid</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="principal">Principal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>

          {/* Links section */}
          <section className="space-y-4">
            <h2 className="text-base font-normal text-foreground">Links</h2>
            <Separator />
            <div>
              <Label htmlFor="github_url">GitHub URL (optional)</Label>
              <Input
                id="github_url"
                type="url"
                placeholder="https://github.com/username"
                {...form.register('github_url')}
              />
              {form.formState.errors.github_url && (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.github_url.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="linkedin_url">LinkedIn URL (optional)</Label>
              <Input
                id="linkedin_url"
                type="url"
                placeholder="https://linkedin.com/in/username"
                {...form.register('linkedin_url')}
              />
              {form.formState.errors.linkedin_url && (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.linkedin_url.message}
                </p>
              )}
            </div>
          </section>

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      )}
    </main>
  )
}
