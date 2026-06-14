# Phase 5: Public Site — Pattern Map

**Mapped:** 2026-06-14
**Files analyzed:** 18 new/modified files
**Analogs found:** 17 / 18

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `apps/web/app/page.tsx` | component (RSC page) | request-response | `apps/web/app/page.tsx` (existing placeholder) | exact-surface; borrow Geist + flex-center layout from console page.tsx |
| `apps/web/app/jobs/page.tsx` | component (client page) | CRUD + cursor-paginated | `apps/console/app/(shell)/bd/leads/page.tsx` | exact — same useInfiniteQuery + IntersectionObserver pattern |
| `apps/web/app/jobs/[id]/page.tsx` | component (client page) | request-response | `apps/console/app/(shell)/ops/clients/[id]/page.tsx` | role-match — dynamic route with useQuery + `use(params)` |
| `apps/web/app/signup/page.tsx` | component (client page) | request-response | `apps/console/app/(shell)/supply/ingest/_components/linkedin-form.tsx` | role-match — RHF + zod + useMutation + toast |
| `apps/web/app/login/page.tsx` | component (client page) | request-response | `apps/console/app/(shell)/supply/ingest/_components/linkedin-form.tsx` | role-match — RHF + zod + useMutation + toast |
| `apps/web/app/onboarding/[step]/page.tsx` | component (client page) | CRUD + file-I/O | `apps/console/app/(shell)/supply/ingest/page.tsx` + `resume-form.tsx` | role-match — multi-step, dropzone, async polling |
| `apps/web/app/profile/edit/page.tsx` | component (client page) | CRUD | `apps/console/app/(shell)/ops/requisitions/[id]/_components/requisition-fields.tsx` | role-match — RHF + zod + useMutation + PUT via native fetch |
| `apps/web/app/_components/site-nav.tsx` | component (layout) | request-response | `apps/console/app/(shell)/_components/sidebar-nav.tsx` | role-match — nav with auth-state-aware rendering, Link + usePathname |
| `apps/web/app/_components/candidate-auth-context.tsx` | provider | event-driven | `apps/web/app/_components/web-providers.tsx` + `console-providers.tsx` | partial-match — same provider wrapper structure; auth context is new |
| `apps/web/app/_components/web-providers.tsx` (modify) | provider | event-driven | `apps/web/app/_components/web-providers.tsx` (itself) | exact — add CandidateAuthProvider alongside existing providers |
| `apps/web/app/layout.tsx` (modify) | layout (RSC) | request-response | `apps/console/app/layout.tsx` | exact — add Toaster + SiteNav, mirror ThemeProvider pattern adapted for light mode |
| `apps/web/app/jobs/_components/job-card.tsx` | component | request-response | `apps/console/app/(shell)/bd/leads/_components/lead-card.tsx` | role-match — card with Badge rows, cn() for conditional classes |
| `apps/web/app/jobs/_components/filter-bar.tsx` | component | event-driven | `apps/console/app/(shell)/supply/search/_components/filter-sidebar.tsx` | role-match — Input + Select + Badge filter chips, live filter state |
| `apps/web/app/_lib/candidate-types.ts` | utility (types) | — | `packages/api-client/src/types/extensions.ts` | role-match — locally-declared types that extend/supplement generated types |
| `packages/mocks/src/handlers/candidate.ts` (modify) | handler (MSW) | request-response | `packages/mocks/src/handlers/bd.ts` | exact — MSW v2 http.get/post with HttpResponse.json, realistic mock data arrays, cursor pagination |
| `apps/web/app/onboarding/_components/resume-upload-step.tsx` | component (client) | file-I/O + async poll | `apps/console/app/(shell)/supply/ingest/_components/resume-form.tsx` | exact — react-dropzone + native fetch POST + polling |
| `apps/web/app/jobs/_components/locked-jobs-overlay.tsx` | component | request-response | `apps/console/app/(shell)/bd/leads/_components/lead-card.tsx` (blur/pointer pattern) | partial-match — overlay on blurred content |
| `apps/web/postcss.config.mjs` (new) | config | — | `apps/console/postcss.config.mjs` | exact — identical file |

---

## Pattern Assignments

### `apps/web/app/page.tsx` (RSC landing page)

**Analog:** `apps/web/app/page.tsx` (existing placeholder — extend in place)

**Imports pattern** (existing file, lines 1–10 of replacement):
```typescript
// RSC page — no 'use client' directive
// Hero CTA button must be a 'use client' leaf component
import { HeroSection } from './_components/hero-section'

export default function HomePage() {
  return (
    <main className="flex min-h-[calc(100vh-48px)] flex-col items-center justify-center px-8">
      <HeroSection />
    </main>
  )
}
```

**Core pattern — editorial hero layout** (from UI-SPEC.md, D-03):
```typescript
// apps/web/app/_components/hero-section.tsx
'use client'
import Link from 'next/link'
import { Button } from '@brynzit/ui/components/ui/button'

export function HeroSection() {
  return (
    <div className="flex max-w-[900px] flex-col items-center text-center" style={{ paddingTop: '120px' }}>
      <h1 className="text-[120px] font-light leading-[1.05] tracking-[0.04em] text-foreground">
        The talent platform built for you.
      </h1>
      <p className="mt-6 text-base leading-relaxed text-muted-foreground">
        Brynzit matches engineers and designers to the roles they actually want.
      </p>
      <Button asChild size="lg" className="mt-8">
        <Link href="/signup">Join the talent pool</Link>
      </Button>
    </div>
  )
}
```

**Key constraint:** `text-[120px] font-light` is an editorial one-off. `font-light` (weight 300) is ONLY used here — not in any other component. All other text uses weight 400 or 600 (button labels).

---

### `apps/web/app/jobs/page.tsx` (job board, client, cursor-paginated)

**Analog:** `apps/console/app/(shell)/bd/leads/page.tsx`

**Imports pattern** (lines 1–12 of analog):
```typescript
'use client'
import { useEffect, useRef, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
// Phase 5 difference: no apiClient import — use native fetch for MSW-only endpoints
// import { apiClient } from '@brynzit/api-client'   ← DO NOT import for candidate endpoints
import type { PublicJobItem, PublicJobsResponse } from '../_lib/candidate-types'
```

**Core cursor-pagination pattern** (analog lines 31–51):
```typescript
'use client'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useInfiniteQuery({
  queryKey: ['public-jobs', debouncedSearch, filters],  // resets when either changes
  queryFn: async ({ pageParam }) => {
    const params = new URLSearchParams()
    if (pageParam) params.set('cursor', pageParam as string)
    if (debouncedSearch) params.set('q', debouncedSearch)
    if (filters.role_type) params.set('role_type', filters.role_type)
    if (filters.location) params.set('location', filters.location)
    if (filters.remote) params.set('remote', 'true')
    if (filters.seniority) params.set('seniority', filters.seniority)
    filters.skills?.forEach(s => params.append('skills', s))

    const res = await fetch(`${API_BASE}/api/v1/public/jobs?${params}`)
    if (!res.ok) throw new Error(`Jobs fetch failed: ${res.status}`)
    return res.json() as Promise<PublicJobsResponse>
  },
  initialPageParam: null as string | null,
  getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
})

const jobs: PublicJobItem[] = data?.pages.flatMap(page => page.items) ?? []
```

**Debounced search pattern** (analog has no debounce — new pattern for Phase 5):
```typescript
const [searchText, setSearchText] = useState('')
const [debouncedSearch, setDebouncedSearch] = useState('')
const [filters, setFilters] = useState<JobFilters>({})

// Text: 350ms debounce (D-08)
useEffect(() => {
  const timer = setTimeout(() => setDebouncedSearch(searchText), 350)
  return () => clearTimeout(timer)
}, [searchText])

// Filter dropdowns: immediate (pass setFilters directly to FilterBar — no debounce)
```

**IntersectionObserver load-more pattern** (analog lines 262–276):
```typescript
const loadMoreRef = useRef<HTMLDivElement>(null)
useEffect(() => {
  const el = loadMoreRef.current
  if (!el) return
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
    { threshold: 0.1 },
  )
  observer.observe(el)
  return () => observer.disconnect()
}, [hasNextPage, isFetchingNextPage, fetchNextPage])
// Render: <div ref={loadMoreRef} className="h-4" />
```

**Error/empty/loading pattern** (analog lines 279–296):
```typescript
if (isLoading) return (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 px-4 py-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <Skeleton key={i} className="h-[160px] rounded-xl" />
    ))}
  </div>
)

if (error) return (
  <div className="p-6">
    <p className="text-destructive text-sm">Couldn&apos;t load jobs. Check your connection or refresh.</p>
  </div>
)
```

---

### `apps/web/app/jobs/[id]/page.tsx` (job detail, client component)

**Analog:** `apps/console/app/(shell)/ops/clients/[id]/page.tsx`

**Async params pattern** (analog line 11 — Next.js 16 required):
```typescript
'use client'
import { use } from 'react'

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  // ...
}
```

**useQuery for single resource** (analog lines 12–22):
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

const { data: job, isLoading, error } = useQuery({
  queryKey: ['public-job', id],
  queryFn: async () => {
    const res = await fetch(`${API_BASE}/api/v1/public/jobs/${id}`)
    if (!res.ok) throw new Error(`Job fetch failed: ${res.status}`)
    return res.json() as Promise<PublicJobItem>
  },
  enabled: !!id,
  staleTime: 30 * 1000,
})
```

**JSON-LD injection** (client-side pattern — avoids server-side MSW complexity, RESEARCH.md Open Question 2):
```typescript
import { useEffect } from 'react'

useEffect(() => {
  if (!job) return
  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.text = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description_summary ?? job.title,
    datePosted: job.date_posted,
    employmentType: { full_time: 'FULL_TIME', part_time: 'PART_TIME', contract: 'CONTRACTOR' }[job.employment_type],
    hiringOrganization: { '@type': 'Organization', name: job.company_name ?? 'Brynzit Client' },
    jobLocation: { '@type': 'Place', address: job.location ?? 'Remote' },
  })
  document.head.appendChild(script)
  return () => { document.head.removeChild(script) }
}, [job])
```

**safeHref utility** (analog `candidate-profile-sheet.tsx` lines 31–41 — reuse pattern):
```typescript
// Copy from apps/console/app/(shell)/_components/candidate-profile-sheet.tsx lines 31–41
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
```

---

### `apps/web/app/signup/page.tsx` and `apps/web/app/login/page.tsx` (auth forms)

**Analog:** `apps/console/app/(shell)/supply/ingest/_components/linkedin-form.tsx`

**Imports pattern** (analog lines 1–13):
```typescript
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@brynzit/ui/components/ui/button'
import { Input } from '@brynzit/ui/components/ui/input'
import { Label } from '@brynzit/ui/components/ui/label'
// Phase 5 adds: shadcn Form component (once added via shadcn CLI)
// import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@brynzit/ui/components/ui/form'
```

**Zod schema + RHF pattern** (analog lines 15–39):
```typescript
// Signup schema
const signupSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
type SignupValues = z.infer<typeof signupSchema>

const form = useForm<SignupValues>({ resolver: zodResolver(signupSchema) })

// Login schema
const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
})
```

**useMutation with native fetch** (analog adapted for MSW-only endpoint):
```typescript
const mutation = useMutation({
  mutationFn: async (values: SignupValues) => {
    const res = await fetch(`${API_BASE}/api/v1/candidate/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    if (res.status === 409) throw Object.assign(new Error('conflict'), { status: 409 })
    if (!res.ok) throw new Error(`Signup failed: ${res.status}`)
    return res.json() as Promise<{ id: string; email: string; access_token: string }>
  },
  onSuccess: (data) => {
    signIn(data.access_token, { id: data.id, email: data.email })
    const redirect = safeRedirect(searchParams.get('redirect'))
    router.push(`/onboarding/1${redirect !== '/jobs' ? `?redirect=${redirect}` : ''}`)
  },
  onError: (err) => {
    if ((err as { status?: number }).status === 409) {
      toast.error('That email is already registered. Sign in instead.')
    } else {
      toast.error('Signup failed — try again.')
    }
  },
})
```

**Open redirect mitigation** (RESEARCH.md Security section):
```typescript
function safeRedirect(param: string | null): string {
  if (!param) return '/jobs'
  if (param.startsWith('/') && !param.startsWith('//')) return param
  return '/jobs'
}
```

**Form submit pattern** (analog lines 70–80):
```typescript
<form onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
  <div>
    <Label htmlFor="email">Email</Label>
    <Input id="email" type="email" {...form.register('email')} />
    {form.formState.errors.email && (
      <p className="mt-1 text-xs text-destructive">{form.formState.errors.email.message}</p>
    )}
  </div>
  <Button type="submit" className="w-full mt-4" disabled={mutation.isPending}>
    {mutation.isPending ? 'Creating account…' : 'Create account'}
  </Button>
</form>
```

---

### `apps/web/app/onboarding/[step]/page.tsx` (stepped wizard)

**Analog:** `apps/console/app/(shell)/supply/ingest/page.tsx` (tab switching → step switching) + `resume-form.tsx` (dropzone step)

**Step routing pattern** (adapted from ingest tab pattern):
```typescript
'use client'
import { use } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingPage({ params }: { params: Promise<{ step: string }> }) {
  const { step } = use(params)
  const router = useRouter()
  const stepNum = parseInt(step, 10)

  function goToStep(n: number) {
    const redirect = searchParams.get('redirect')
    router.push(`/onboarding/${n}${redirect ? `?redirect=${redirect}` : ''}`)
  }

  if (stepNum === 1) return <ResumeUploadStep onComplete={() => goToStep(2)} />
  if (stepNum === 2) return <ProfileConfirmStep onComplete={() => goToStep(3)} />
  if (stepNum === 3) return <PreferencesStep onComplete={() => { router.push(safeRedirect(...)) }} />
  return null
}
```

**Step indicator component** (no analog — new component, follows UI-SPEC.md spec):
```typescript
// apps/web/app/onboarding/_components/step-indicator.tsx
interface StepIndicatorProps { currentStep: number; totalSteps: number }

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">Step {currentStep} of {totalSteps}</p>
      <div className="flex gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            aria-current={i + 1 === currentStep ? 'step' : undefined}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              i + 1 < currentStep ? 'bg-primary/60' :
              i + 1 === currentStep ? 'bg-primary' : 'bg-muted'
            )}
          />
        ))}
      </div>
    </div>
  )
}
```

---

### `apps/web/app/onboarding/_components/resume-upload-step.tsx` (dropzone + async poll)

**Analog:** `apps/console/app/(shell)/supply/ingest/_components/resume-form.tsx`

**Dropzone imports + config** (analog lines 1–44):
```typescript
'use client'
import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { Button } from '@brynzit/ui/components/ui/button'
import { Progress } from '@brynzit/ui/components/ui/progress'
import { cn } from '@brynzit/ui/lib/utils'
import { Upload } from 'lucide-react'
import { useAsyncJob } from '@brynzit/hooks'

const { getRootProps, getInputProps, isDragActive } = useDropzone({
  accept: {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  },
  maxFiles: 1,
  onDropRejected: (rejections) => {
    setUploadError(rejections[0]?.errors[0]?.message ?? 'File type not accepted — upload PDF or DOCX.')
  },
  onDrop: (acceptedFiles) => {
    if (acceptedFiles[0]) { setFile(acceptedFiles[0]); setUploadError(null) }
  },
})
```

**Native fetch POST for multipart** (analog lines 46–65 — CRITICAL: never apiClient.POST for multipart):
```typescript
// IMPORTANT: native fetch, NOT apiClient.POST — browser sets multipart/form-data boundary
const res = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/v1/candidate/profile/resume`,
  { method: 'POST', body: formData },
)
if (!res.ok) throw new Error(`Upload failed (${res.status})`)
const data = await res.json() as { parse_id: string }
setParseId(data.parse_id)
```

**useAsyncJob polling** (from `packages/hooks/src/use-async-job.ts` lines 78–145):
```typescript
const { phase } = useAsyncJob<{ status: string; profile_snapshot?: Partial<CandidateProfile> }>({
  jobId: parseId,
  endpoint: '/api/v1/candidate/profile/resume/status/{id}',
  statusMap: { processing: 'pending', complete: 'complete', failed: 'failed' },
  refetchInterval: 2000,
})

useEffect(() => {
  if (phase === 'complete') {
    toast.success('Resume parsed — your profile has been prefilled.')
    const timer = setTimeout(() => onComplete(), 800)
    return () => clearTimeout(timer)
  }
  if (phase === 'failed') {
    toast.error('We couldn\'t parse that file. Continue to fill in your profile manually.')
    onComplete()  // advance anyway
  }
}, [phase, onComplete])
```

**Dropzone JSX pattern** (analog lines 175–195):
```typescript
<div
  {...getRootProps()}
  className={cn(
    'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed',
    'h-[160px] text-center transition-colors',
    isDragActive
      ? 'border-primary bg-primary/5 text-primary'
      : 'border-border bg-muted text-muted-foreground hover:border-primary/50 hover:text-foreground',
  )}
>
  <input {...getInputProps()} />
  <Upload className="mb-3 h-8 w-8" />
  {isDragActive ? (
    <p className="text-sm font-medium">Drop resume here</p>
  ) : (
    <>
      <p className="text-sm font-medium">Drag & drop or click to upload</p>
      <p className="mt-1 text-xs">PDF, DOC, DOCX</p>
    </>
  )}
</div>
```

---

### `apps/web/app/profile/edit/page.tsx` (profile edit form)

**Analog:** `apps/console/app/(shell)/ops/requisitions/[id]/_components/requisition-fields.tsx`

**Imports pattern** (analog lines 1–20):
```typescript
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@brynzit/ui/components/ui/button'
import { Input } from '@brynzit/ui/components/ui/input'
import { Label } from '@brynzit/ui/components/ui/label'
import { Textarea } from '@brynzit/ui/components/ui/textarea'
import { Progress } from '@brynzit/ui/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@brynzit/ui/components/ui/select'
import type { CandidateProfile } from '../_lib/candidate-types'
```

**Native fetch PUT mutation pattern** (analog lines 52–86):
```typescript
const patchMutation = useMutation({
  mutationFn: async (values: ProfileEditValues) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/v1/candidate/profile`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      },
    )
    if (!res.ok) throw new Error(`PUT failed: ${res.status}`)
    return res.json() as Promise<CandidateProfile>
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['candidate-profile'] })
    toast('Profile saved.')
  },
  onError: () => {
    toast.error('Couldn\'t save profile. Try again.')
  },
})
```

**RHF defaultValues from query data** (analog lines 39–48):
```typescript
const { data: profile } = useQuery({
  queryKey: ['candidate-profile'],
  queryFn: async () => {
    const res = await fetch(`${API_BASE}/api/v1/candidate/profile`)
    if (!res.ok) throw new Error('Profile fetch failed')
    return res.json() as Promise<CandidateProfile>
  },
})

const form = useForm<ProfileEditValues>({
  resolver: zodResolver(profileEditSchema),
  defaultValues: {
    first_name: profile?.first_name ?? '',
    last_name: profile?.last_name ?? '',
    headline: profile?.headline ?? '',
    // ...
  },
})

// Reset form when profile loads (analog pattern)
useEffect(() => {
  if (profile) form.reset({ first_name: profile.first_name ?? '', /* ... */ })
}, [profile])
```

**Completeness meter** (Progress component from UI-SPEC.md):
```typescript
// Use Progress from @brynzit/ui/components/ui/progress
// Override fill color with Tailwind arbitrary variant
<Progress
  value={profile?.completeness_score ?? 0}
  className="h-2 [&>div]:bg-primary"
/>
<span className="text-sm text-muted-foreground">
  {profile?.completeness_score ?? 0}% complete
</span>
{(profile?.completeness_score ?? 0) < 70 && (
  <p className="text-sm text-muted-foreground">Reach 70% to unlock 1-click apply</p>
)}
```

---

### `apps/web/app/_components/site-nav.tsx` (top nav with auth state)

**Analog:** `apps/console/app/(shell)/_components/sidebar-nav.tsx`

**Imports pattern** (analog lines 1–9):
```typescript
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@brynzit/ui/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@brynzit/ui/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@brynzit/ui/components/ui/avatar'
import { cn } from '@brynzit/ui/lib/utils'
import { useCandidateAuth } from './candidate-auth-context'
```

**Auth-state-conditional nav pattern** (analog lines 39–101 adapted):
```typescript
export function SiteNav() {
  const { isLoggedIn, candidate, signOut } = useCandidateAuth()

  return (
    <nav className="flex h-12 items-center border-b border-border bg-background px-6">
      {/* Left: wordmark */}
      <Link href="/" className="text-base font-semibold tracking-tight text-foreground">
        Brynzit
      </Link>

      {/* Center: Jobs link */}
      <div className="flex flex-1 justify-center">
        <Link
          href="/jobs"
          className={cn(
            'text-sm transition-colors',
            pathname === '/jobs' || pathname.startsWith('/jobs/')
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Jobs
        </Link>
      </div>

      {/* Right: auth state */}
      <div className="flex items-center gap-2">
        {isLoggedIn ? (
          <>
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2" aria-label="Account menu">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>{candidate?.email?.[0]?.toUpperCase() ?? 'C'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile/edit">My Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button variant="default" size="sm" asChild>
              <Link href="/signup">Join free</Link>
            </Button>
          </>
        )}
      </div>
    </nav>
  )
}
```

---

### `apps/web/app/_components/candidate-auth-context.tsx` (auth context)

**Analog:** `apps/web/app/_components/web-providers.tsx` (provider structure) + RESEARCH.md Pattern 3

**Full pattern** (from RESEARCH.md Pattern 3 — no existing analog in codebase, use research pattern verbatim):
```typescript
'use client'
import { createContext, useContext, useEffect, useState } from 'react'

type CandidateAuth = {
  isLoggedIn: boolean
  candidate: { id: string; email: string } | null
  signIn: (token: string, candidate: { id: string; email: string }) => void
  signOut: () => void
}

const CandidateAuthContext = createContext<CandidateAuth>(null!)

export function CandidateAuthProvider({ children }: { children: React.ReactNode }) {
  const [candidate, setCandidate] = useState<{ id: string; email: string } | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('candidate_access_token')
    const stored = localStorage.getItem('candidate_data')
    if (token && stored) {
      try { setCandidate(JSON.parse(stored)) } catch { /* corrupt — ignore */ }
    }
  }, [])

  function signIn(token: string, data: { id: string; email: string }) {
    localStorage.setItem('candidate_access_token', token)
    localStorage.setItem('candidate_data', JSON.stringify(data))
    setCandidate(data)
  }

  function signOut() {
    localStorage.removeItem('candidate_access_token')
    localStorage.removeItem('candidate_data')
    setCandidate(null)
  }

  return (
    <CandidateAuthContext.Provider value={{ isLoggedIn: !!candidate, candidate, signIn, signOut }}>
      {children}
    </CandidateAuthContext.Provider>
  )
}

export function useCandidateAuth() {
  return useContext(CandidateAuthContext)
}
```

---

### `apps/web/app/_components/web-providers.tsx` (modify — add CandidateAuthProvider)

**Analog:** existing file (`apps/web/app/_components/web-providers.tsx` lines 1–23)

**Modified pattern:**
```typescript
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MSWProvider } from './msw-provider'
import { CandidateAuthProvider } from './candidate-auth-context'
// For Sonner: no ThemeProvider needed — pass theme="light" directly to Toaster

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30 * 1000, retry: 1 } },
})

export function WebProviders({ children }: { children: React.ReactNode }) {
  return (
    <MSWProvider>
      <QueryClientProvider client={queryClient}>
        <CandidateAuthProvider>
          {children}
        </CandidateAuthProvider>
      </QueryClientProvider>
    </MSWProvider>
  )
}
```

---

### `apps/web/app/layout.tsx` (modify — add SiteNav + Toaster)

**Analog:** `apps/console/app/layout.tsx` (lines 1–28)

**Toaster pattern** (console analog lines 4, 22–26 — adapted for light mode):
```typescript
import { Toaster } from '@brynzit/ui/components/ui/sonner'
import { SiteNav } from './_components/site-nav'

// In body: no ThemeProvider (light mode only, D-01); pass theme="light" to Toaster
// to satisfy next-themes peer dep without activating a ThemeProvider
<body className="bg-background text-foreground font-sans antialiased">
  <WebProviders>
    <SiteNav />
    {children}
  </WebProviders>
  <Toaster position="bottom-right" theme="light" />
</body>
```

**Light-mode constraint:** Do NOT add `<ThemeProvider>` or `dark` class to `<html>`. The console uses `className={\`dark ${geist.variable}\`}` — web must NOT copy that. Use only `className={geist.variable}`.

---

### `apps/web/app/jobs/_components/job-card.tsx` (job card component)

**Analog:** `apps/console/app/(shell)/bd/leads/_components/lead-card.tsx`

**Imports pattern** (analog lines 1–11):
```typescript
'use client'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Card } from '@brynzit/ui/components/ui/card'
import { cn } from '@brynzit/ui/lib/utils'
import { MapPin } from 'lucide-react'
import Link from 'next/link'
import type { PublicJobItem } from '../../_lib/candidate-types'
```

**Badge row pattern** (analog lines 95–115):
```typescript
// Employment type + skills badges (from UI-SPEC.md D-09)
<div className="flex flex-wrap gap-1 mt-2">
  <Badge variant="secondary">
    {job.employment_type === 'full_time' ? 'Full-time' :
     job.employment_type === 'part_time' ? 'Part-time' : 'Contract'}
  </Badge>
  {job.skills.slice(0, 3).map(skill => (
    <Badge key={skill} variant="outline">{skill}</Badge>
  ))}
  {job.skills.length > 3 && (
    <Badge variant="outline">+{job.skills.length - 3} more</Badge>
  )}
  {/* Match badge — logged-in only */}
  {isLoggedIn && job.match_strength === 'strong' && (
    <Badge variant="default">Strong match</Badge>
  )}
  {isLoggedIn && job.match_strength === 'partial' && (
    <Badge variant="secondary">Partial match</Badge>
  )}
</div>
```

**cn() conditional class pattern** (analog line 73–79):
```typescript
<Card
  className={cn(
    'cursor-pointer p-4 transition-colors hover:bg-muted',
    isLocked && 'blur-[4px] pointer-events-none select-none',
  )}
>
```

---

### `apps/web/app/jobs/_components/filter-bar.tsx` (horizontal filter bar)

**Analog:** `apps/console/app/(shell)/supply/search/_components/filter-sidebar.tsx`

**Filter state + immediate-change pattern** (analog lines 47–68):
```typescript
'use client'
import { useState } from 'react'
import { Input } from '@brynzit/ui/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@brynzit/ui/components/ui/select'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Button } from '@brynzit/ui/components/ui/button'

export interface JobFilters {
  role_type: string
  location: string
  remote: boolean
  seniority: string
  skills: string[]
}

interface FilterBarProps {
  onSearchChange: (text: string) => void  // caller debounces 350ms
  onFiltersChange: (filters: JobFilters) => void  // immediate — no debounce
}

// Select onValueChange triggers onFiltersChange immediately (no debounce per D-08)
function handleFilterChange(key: keyof JobFilters, value: string | boolean | string[]) {
  setFilters(prev => {
    const next = { ...prev, [key]: value }
    onFiltersChange(next)  // immediate
    return next
  })
}
```

**Active filter pills pattern** (analog lines 108–124):
```typescript
// Render active filter pills below the filter bar
{Object.entries(activeFilters).filter(([, v]) => v && v !== false && v !== '').map(([key, value]) => (
  <Badge key={key} variant="secondary" className="h-9 gap-1 rounded-full px-3">
    {typeof value === 'string' ? value : key}
    <button
      onClick={() => handleFilterChange(key as keyof JobFilters, '' as never)}
      aria-label={`Remove ${key} filter`}
      className="ml-1 text-muted-foreground hover:text-foreground"
    >
      ×
    </button>
  </Badge>
))}
```

---

### `apps/web/app/_lib/candidate-types.ts` (local type declarations)

**Analog:** `packages/api-client/src/types/extensions.ts`

**Pattern** (extensions.ts shows the "extend/supplement generated types" convention):
```typescript
// apps/web/app/_lib/candidate-types.ts
// Types derived from .planning/contracts/*.yaml
// DELETE and import from api.d.ts when candidate backend endpoints ship.
// Until then: manually typed, co-located with consuming module.

export type PublicJobItem = { /* ... as defined in RESEARCH.md Code Examples */ }
export type PublicJobsResponse = { items: PublicJobItem[]; next_cursor: string | null }
export type CandidateProfile = { /* ... as defined in RESEARCH.md Code Examples */ }
export type CandidateProfileUpdate = Partial<Omit<CandidateProfile, 'id' | 'email' | 'enrichment_status'>>
export type CandidateAuthResponse = { id: string; email: string; access_token: string }
export type CandidateApplication = {
  id: string
  job_id: string
  status: 'applied' | 'reviewing' | 'interview' | 'offer' | 'rejected'
  substep_label: string | null
  applied_at: string
}
```

---

### `packages/mocks/src/handlers/candidate.ts` (expand stub handlers)

**Analog:** `packages/mocks/src/handlers/bd.ts`

**Handler file structure** (analog lines 1–10):
```typescript
import { http, HttpResponse } from 'msw'
import type { HttpHandler } from 'msw'
import { API_BASE } from '../base-url'

export const candidateHandlers: HttpHandler[] = [
  // Route ordering matters: specific paths (e.g. /resume/status/:id) BEFORE wildcard paths
  // Same rule as bd.ts lines 56–62: more specific → less specific
```

**Cursor pagination mock pattern** (analog lines 31–53):
```typescript
http.get(`${API_BASE}/api/v1/public/jobs`, ({ request }) => {
  const url = new URL(request.url)
  const cursor = url.searchParams.get('cursor')
  const q = url.searchParams.get('q')?.toLowerCase()
  const allJobs: PublicJobItem[] = MOCK_JOBS  // define 12 jobs as const above
  const filtered = q ? allJobs.filter(j => j.title.toLowerCase().includes(q)) : allJobs
  const offset = cursor ? 6 : 0
  const page = filtered.slice(offset, offset + 6)
  return HttpResponse.json({
    items: page,
    next_cursor: page.length === 6 && offset === 0 ? 'cursor-page-2' : null,
  })
}),
```

**Stateful poll simulation pattern** (analog lines 125–145 — poll cycle):
```typescript
// Simulate parse progression across multiple poll calls
const resumeParsePollCounts: Record<string, number> = {}
http.get(`${API_BASE}/api/v1/candidate/profile/resume/status/:parse_id`, ({ params }) => {
  const id = params.parse_id as string
  resumeParsePollCounts[id] = (resumeParsePollCounts[id] ?? 0) + 1
  const count = resumeParsePollCounts[id]
  const status = count <= 2 ? 'processing' : 'complete'
  return HttpResponse.json({ status, profile_snapshot: status === 'complete' ? MOCK_PROFILE_SNAPSHOT : undefined })
}),
```

**MSW request body parsing** (analog lines 96–103):
```typescript
http.put(`${API_BASE}/api/v1/candidate/profile`, async ({ request }) => {
  const body = await request.json() as CandidateProfileUpdate
  // Merge with mock profile, recalculate completeness_score stub
  const updated = { ...MOCK_PROFILE, ...body, completeness_score: computeMockScore(body) }
  return HttpResponse.json(updated)
}),
```

---

### `apps/web/postcss.config.mjs` (new config)

**Analog:** `apps/console/postcss.config.mjs`

**Exact copy** (RESEARCH.md confirmed identical):
```js
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
export default config
```

---

## Shared Patterns

### Native Fetch for Candidate Endpoints
**Source:** `apps/console/app/(shell)/supply/ingest/_components/resume-form.tsx` (lines 56–65) and `apps/console/app/(shell)/ops/requisitions/[id]/_components/requisition-fields.tsx` (lines 67–74)
**Apply to:** ALL candidate API calls — signup, login, profile GET/PUT, resume upload, jobs fetch, applications POST
**Reason:** Candidate endpoints are NOT in `packages/api-client/src/types/api.d.ts`. Using `apiClient.GET/POST` will give TypeScript errors and runtime failures.

```typescript
// Standard pattern for all candidate fetch calls
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

const res = await fetch(`${API_BASE}/api/v1/candidate/...`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})
if (!res.ok) throw new Error(`Request failed: ${res.status}`)
return res.json() as Promise<LocallyDeclaredType>
```

### Toast Notifications
**Source:** `apps/console/app/(shell)/bd/leads/page.tsx` (lines 8, 95, 96)
**Apply to:** All async operations — signup, login, resume parse, profile save, apply action, auth errors
```typescript
import { toast } from 'sonner'
toast.success('Message')         // success state
toast.error('Message')           // error state
toast('Message')                 // neutral
```

### Skeleton Loading State
**Source:** `apps/console/app/(shell)/_components/candidate-profile-sheet.tsx` (lines 14–15, used throughout)
**Apply to:** Job cards loading, profile fields loading during async parse
```typescript
import { Skeleton } from '@brynzit/ui/components/ui/skeleton'
// 6× job card skeletons:
{Array.from({ length: 6 }).map((_, i) => (
  <Skeleton key={i} className="h-[160px] w-full rounded-xl" />
))}
```

### cn() for Conditional Classes
**Source:** `apps/console/app/(shell)/bd/leads/_components/lead-card.tsx` (line 8, used throughout)
**Apply to:** All components with state-conditional styling
```typescript
import { cn } from '@brynzit/ui/lib/utils'
// Pattern: cn('base-classes', condition && 'conditional-class', condition2 && 'conditional2')
```

### Protected Route Redirect
**Source:** No direct analog — new pattern for Phase 5. Based on CONTEXT.md D-12.
**Apply to:** `/onboarding/[step]`, `/profile/edit` — redirect if not logged in
```typescript
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCandidateAuth } from '../_components/candidate-auth-context'

// In page component:
const { isLoggedIn } = useCandidateAuth()
const router = useRouter()
useEffect(() => {
  if (!isLoggedIn) router.replace('/login')
}, [isLoggedIn, router])
if (!isLoggedIn) return null  // prevents flash of protected content
```

### MSW Handler Import in node.ts
**Source:** `packages/mocks/src/node.ts` and `packages/mocks/src/browser.ts` (already wired)
**Apply to:** New candidate handlers automatically included if `candidateHandlers` array is already imported in `node.ts` and `browser.ts` — verify before adding explicit imports.

---

## No Analog Found

Files with no close match in the codebase (use RESEARCH.md patterns directly):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `apps/web/app/_components/candidate-auth-context.tsx` | provider | event-driven | No auth context exists anywhere in the codebase; the MSW provider is structurally similar but does not handle auth state |
| `apps/web/app/onboarding/_components/step-indicator.tsx` | component | — | No multi-step wizard component exists; tabs are the closest analog but the UX is different |
| `apps/web/app/jobs/_components/locked-jobs-overlay.tsx` | component | — | No logged-out gating overlay exists; the blur+overlay pattern is new to Phase 5 |

---

## Metadata

**Analog search scope:** `apps/console/app/`, `apps/web/app/`, `packages/hooks/src/`, `packages/mocks/src/`, `packages/ui/src/`
**Files scanned:** 28 source files
**Pattern extraction date:** 2026-06-14

### Critical Anti-Patterns (from RESEARCH.md)
1. **Never `apiClient.GET/POST` for candidate endpoints** — paths absent from `api.d.ts`; use native `fetch()`
2. **Never access `params` synchronously** — must `use(params)` in client pages or `await params` in async RSC
3. **Never add `dark` class to `<html>` in `apps/web`** — light mode only; `globals.css` has `.dark` block that must not activate
4. **Never compute `completeness_score` in the UI** — read from API response only
5. **Never `apiClient.POST` for multipart/form-data** — use native fetch (browser sets boundary automatically)
