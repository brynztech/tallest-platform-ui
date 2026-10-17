'use client'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Progress } from '@brynzit/ui/components/ui/progress'
import { Popover, PopoverContent, PopoverTrigger } from '@brynzit/ui/components/ui/popover'
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from '@brynzit/ui/components/ui/command'
import { useCandidateAuth } from '../../_components/candidate-auth-context'
import { RemovableChip } from '../../_components/removable-chip'
import { candidateAuthHeaders, candidateJsonHeaders } from '../../_lib/candidate-api'
import type { CandidateProfile, CandidateProfileUpdate } from '../../_lib/candidate-types'
import { useResumeUpload } from '../../_lib/use-resume-upload'
import { ResumeDropzone } from '../../onboarding/_components/resume-dropzone'

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
      const res = await fetch(`${API_BASE}/api/v1/candidate/profile`, {
        headers: candidateAuthHeaders(),
      })
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
        headers: candidateJsonHeaders(),
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

  // A new resume re-parses the profile, so skills and match suggestions follow it.
  // Saved jobs live apart from the profile and are not touched.
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const onResumeParsed = useCallback(() => {
    setResumeFile(null)
    queryClient.invalidateQueries({ queryKey: ['candidate-profile'] })
    queryClient.invalidateQueries({ queryKey: ['public-jobs'] })
    toast('Resume updated. Your profile and job matches now use it.')
  }, [queryClient])
  const resume = useResumeUpload(onResumeParsed)
  const resumeBusy = resume.status === 'uploading' || resume.status === 'processing'

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
  const errors = form.formState.errors
  // Empty select option means "not set": keep it undefined so the optional enums validate.
  const unsetIfEmpty = { setValueAs: (v: string) => v || undefined }

  return (
    <main className="wrap page mid">
      <Link href="/jobs" className="inline-link inline-flex items-center gap-2 justify-self-start">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        Back to jobs
      </Link>

      <div className="page-head">
        <h1 className="d2">
          Edit <em>profile</em>
        </h1>
        {/* PUB-05: Completeness meter — value from API only, never computed in UI (D-18) */}
        {!isLoading && (
          <div className="grid gap-1">
            <div className="flex items-center justify-between gap-3">
              <Progress value={score} className="flex-1" />
              <span className="small shrink-0">{score}% complete</span>
            </div>
            {score < 70 && <p className="small">Reach 70% to unlock 1-click apply</p>}
          </div>
        )}
      </div>

      <section className="panel">
        <h2 className="d3">Resume</h2>
        <p className="small">Upload a newer resume to refresh your profile and job matches. Your saved jobs stay as they are.</p>
        <ResumeDropzone file={resumeFile} status={resume.status} disabled={resumeBusy} onChange={setResumeFile} />
        {resume.status === 'processing' && <p className="notice">Reading your resume…</p>}
        {resume.error && <p className="notice err">{resume.error}</p>}
        <button
          type="button"
          className="btn btn-ghost justify-self-start"
          disabled={!resumeFile || resumeBusy}
          onClick={() => resumeFile && resume.upload(resumeFile)}
        >
          {resumeBusy ? 'Working…' : 'Upload new resume'}
        </button>
      </section>

      {isLoading ? (
        <div className="job skeleton" aria-hidden="true" />
      ) : (
        <form onSubmit={form.handleSubmit(v => mutation.mutate(v))} className="panel">
          {/* Personal section */}
          <section className="grid gap-4">
            <h2 className="d3">Personal</h2>
            <div className="row2">
              <div className={errors.first_name ? 'field invalid' : 'field'}>
                <label htmlFor="first_name">First name</label>
                <input id="first_name" {...form.register('first_name')} />
                {errors.first_name && <span className="err">{errors.first_name.message}</span>}
              </div>
              <div className={errors.last_name ? 'field invalid' : 'field'}>
                <label htmlFor="last_name">Last name</label>
                <input id="last_name" {...form.register('last_name')} />
                {errors.last_name && <span className="err">{errors.last_name.message}</span>}
              </div>
            </div>
            <div className="field">
              <label htmlFor="headline">Headline</label>
              <input id="headline" placeholder="e.g. Senior Product Engineer" {...form.register('headline')} />
            </div>
            <div className="field">
              <label htmlFor="experience_summary">
                Experience summary <span className="opt">(optional)</span>
              </label>
              <textarea id="experience_summary" rows={4} {...form.register('experience_summary')} />
            </div>
          </section>

          {/* Skills section */}
          <section className="grid gap-4">
            <h2 className="d3">Skills</h2>
            <Popover open={skillsOpen} onOpenChange={setSkillsOpen}>
              <PopoverTrigger asChild>
                <button type="button" className="btn btn-ghost justify-self-start">
                  {skills.length === 0 ? 'Add skills…' : `${skills.length} selected`}
                </button>
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
              <div className="chips">
                {skills.map(skill => (
                  <RemovableChip
                    key={skill}
                    label={skill}
                    removeLabel={`Remove ${skill}`}
                    onRemove={() => toggleSkill(skill)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Preferences section */}
          <section className="grid gap-4">
            <h2 className="d3">Preferences</h2>
            <div className="field">
              <label htmlFor="location">Location</label>
              <input id="location" placeholder="City, Country" {...form.register('location')} />
            </div>
            <div className="row2">
              <div className="field">
                <label htmlFor="remote_preference">Remote preference</label>
                <select id="remote_preference" {...form.register('remote_preference', unsetIfEmpty)}>
                  <option value="">Select preference…</option>
                  <option value="remote_only">Remote only</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-site</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="seniority">Seniority</label>
                <select id="seniority" {...form.register('seniority', unsetIfEmpty)}>
                  <option value="">Select level…</option>
                  <option value="junior">Junior</option>
                  <option value="mid">Mid</option>
                  <option value="senior">Senior</option>
                  <option value="staff">Staff</option>
                  <option value="principal">Principal</option>
                </select>
              </div>
            </div>
          </section>

          {/* Links section */}
          <section className="grid gap-4">
            <h2 className="d3">Links</h2>
            <div className={errors.github_url ? 'field invalid' : 'field'}>
              <label htmlFor="github_url">
                GitHub URL <span className="opt">(optional)</span>
              </label>
              <input
                id="github_url"
                type="url"
                placeholder="https://github.com/username"
                {...form.register('github_url')}
              />
              {errors.github_url && <span className="err">{errors.github_url.message}</span>}
            </div>
            <div className={errors.linkedin_url ? 'field invalid' : 'field'}>
              <label htmlFor="linkedin_url">
                LinkedIn URL <span className="opt">(optional)</span>
              </label>
              <input
                id="linkedin_url"
                type="url"
                placeholder="https://linkedin.com/in/username"
                {...form.register('linkedin_url')}
              />
              {errors.linkedin_url && <span className="err">{errors.linkedin_url.message}</span>}
            </div>
          </section>

          <button type="submit" className="btn btn-primary btn-block" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      )}
    </main>
  )
}
