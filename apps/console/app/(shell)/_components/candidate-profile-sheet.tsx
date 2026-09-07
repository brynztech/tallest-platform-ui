'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components, TalentPoolSummaryExtended } from '@brynzit/api-client'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@brynzit/ui/components/ui/sheet'
import { Avatar, AvatarFallback } from '@brynzit/ui/components/ui/avatar'
import { Button } from '@brynzit/ui/components/ui/button'
import { Skeleton } from '@brynzit/ui/components/ui/skeleton'
import { toast } from 'sonner'
import {
  X,
  Sparkles,
  Code2,
  Mail,
  ExternalLink,
  FileText,
  Zap,
  Bookmark,
  BookmarkCheck,
  MapPin,
  Briefcase,
  CalendarDays,
  Link2,
  Star,
  ClipboardList,
  FolderOpen,
  CalendarCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCan, useActingUser } from '@brynzit/identity'
import { isBookmarked } from '@brynzit/recruiting'
import { CandidateRelationshipSection } from './candidate-relationship-section'
import { MatchEvidenceSections } from './match-evidence'
import { companyStatLine, parseMatchEvidence } from './match-evidence-data'
import {
  availabilityToneClass,
  humanizeStatus,
  matchScoreToneClass,
  statusToneClass,
  NEUTRAL_TONE,
} from '../_lib/status-tone'
import { addBookmark, bookmarkQueryKeys, deleteBookmark, fetchBookmarks } from '../_lib/bookmarks'
import { fetchResumeUrl, openDocumentInNewTab } from '../_lib/documents'

interface CandidateProfileSheetProps {
  candidateId: string | null
  submissionId?: string | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  /**
   * Which screen opened the panel. It only decides the action bar:
   * `search` offers engagement generation, `shortlist` offers the
   * approve/hold/pass triage, and `pipeline` offers neither — the board card
   * already carries advance/notes/remove, so repeating them here would be two
   * controls for one action. Bookmark and Enrich are available everywhere.
   */
  source?: 'search' | 'shortlist' | 'pipeline'
  requisitionId?: string
}

type PanelTab = 'profile' | 'application' | 'resume' | 'history'

const PANEL_TABS: { value: PanelTab; label: string; icon: typeof MapPin }[] = [
  { value: 'profile', label: 'Profile', icon: Star },
  { value: 'application', label: 'Application', icon: ClipboardList },
  { value: 'resume', label: 'Resume', icon: FolderOpen },
  { value: 'history', label: 'History', icon: CalendarCheck },
]

// CR-04: Reject javascript: / data: URLs from API-supplied href values
function safeHref(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return url
  } catch {
    // relative paths — allow
    if (url.startsWith('/')) return url
  }
  return undefined
}

function availabilityLabel(status: string | null | undefined): string {
  if (!status) return 'Unknown'
  return humanizeStatus(status).replace(/\b\w/g, (c) => c.toUpperCase())
}

function initials(name: string | null | undefined): string {
  return (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/** Uppercase eyebrow above a section (app/CLAUDE.md §3.7). */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium tracking-[0.09em] text-[#908E8B] uppercase">{children}</p>
  )
}

/** Two-letter company monogram for the experience tile. */
function monogram(value: string | null | undefined): string {
  const words = (value ?? '').split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase()
  return `${words[0]![0]}${words[1]![0]}`.toUpperCase()
}

/** One icon + label item in the summary meta bar. */
function MetaItem({ icon: Icon, children }: { icon: typeof MapPin; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="size-3.5 shrink-0" />
      {children}
    </span>
  )
}

/** Tinted square behind a fixed band's icon — the design system's IconTile. */
function IconTile({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-[#FAF0EE] text-[#BA4642]">
      {children}
    </span>
  )
}

/**
 * Vertical icon rail — the panel's section switcher. Selection is azure
 * (app/CLAUDE.md §3.2): a tinted tile behind the icon, label goes ink+semibold.
 */
function IconRail({
  value,
  onChange,
}: {
  value: PanelTab
  onChange: (next: PanelTab) => void
}) {
  return (
    <nav
      aria-label="Candidate sections"
      className="flex w-[76px] shrink-0 flex-col gap-1 overflow-y-auto border-r border-[#ECEAE4] px-2 py-3"
    >
      {PANEL_TABS.map(({ value: tab, label, icon: Icon }) => {
        const selected = tab === value
        return (
          <button
            key={tab}
            type="button"
            aria-current={selected ? 'page' : undefined}
            onClick={() => onChange(tab)}
            className="flex flex-col items-center gap-1.5 rounded-lg px-1 py-2 transition-colors duration-150 hover:bg-muted"
          >
            <span
              className={cn(
                'flex size-9 items-center justify-center rounded-[10px] border transition-colors duration-150',
                selected
                  ? 'border-[#C0DBFE] bg-[#F0F6FF] text-[#1550CC]'
                  : 'border-transparent text-muted-foreground',
              )}
            >
              <Icon className="size-[18px]" />
            </span>
            <span
              className={cn(
                'text-[11px] leading-none',
                selected ? 'font-semibold text-foreground' : 'text-muted-foreground',
              )}
            >
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

/** One role in the Experience list: company monogram tile + role + meta lines. */
function ExperienceRow({
  title,
  company,
  meta,
  note,
}: {
  title: string
  company: string | null
  meta: string | null
  note?: string | null
}) {
  return (
    <div className="flex items-start gap-3 border-b border-[#ECEAE4] py-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-border bg-secondary text-[13px] font-medium text-muted-foreground">
        {monogram(company ?? title) || '—'}
      </span>
      <div className="min-w-0">
        <p className="text-[15px] leading-tight font-semibold text-foreground">{title}</p>
        {company && <p className="mt-1 text-sm text-[#3A3B3B]">{company}</p>}
        {meta && <p className="mt-1 text-xs text-muted-foreground">{meta}</p>}
        {note && <p className="mt-1.5 text-[13px] text-muted-foreground">{note}</p>}
      </div>
    </div>
  )
}

function Pill({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-[5px] rounded-full border px-2 py-[3px] text-[11px] leading-none font-medium whitespace-nowrap',
        className ?? NEUTRAL_TONE,
      )}
    >
      <span className="size-[5px] rounded-full bg-current" />
      {children}
    </span>
  )
}

export function CandidateProfileSheet({
  candidateId,
  submissionId,
  isOpen,
  onOpenChange,
  source = 'search',
  requisitionId,
}: CandidateProfileSheetProps) {
  const queryClient = useQueryClient()
  const can = useCan()
  const canBookmark = can('candidate.bookmark')
  const actingUser = useActingUser()

  // ---- Candidate query ----
  const { data, isLoading } = useQuery({
    queryKey: ['supply-candidate', candidateId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        '/api/v1/supply/candidates/{candidate_id}',
        { params: { path: { candidate_id: candidateId! } } },
      )
      if (error) throw error
      return data
    },
    enabled: !!candidateId && isOpen,
    staleTime: 30 * 1000,
  })

  // ---- Match context (shortlist only) ----
  // Fit score and skill evidence live on the *submission*, not the candidate —
  // a free-text search result has no requisition and therefore no score. The
  // requisition shortlist is the only endpoint that exposes them, so those
  // sections simply do not render when this sheet is opened from search.
  const { data: shortlist } = useQuery({
    queryKey: ['supply-shortlist', requisitionId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        '/api/v1/supply/shortlists/{requisition_id}',
        { params: { path: { requisition_id: requisitionId! } } },
      )
      if (error) throw error
      return data
    },
    enabled: Boolean(requisitionId && submissionId) && isOpen,
    staleTime: 30 * 1000,
  })

  const submission = useMemo(
    () => shortlist?.submissions?.find((entry) => entry.id === submissionId) ?? null,
    [shortlist, submissionId],
  )
  const fitScore = submission?.match_score ?? null
  const evidence = useMemo(
    () =>
      parseMatchEvidence(
        (submission?.match_rationale ?? null) as Record<string, unknown> | null,
      ),
    [submission],
  )
  const matchedSkills = useMemo(() => {
    const raw = (submission?.match_rationale ?? {}) as Record<string, unknown>
    return new Set(
      Array.isArray(raw['top_matching_skills'])
        ? raw['top_matching_skills'].filter((s): s is string => typeof s === 'string')
        : [],
    )
  }, [submission])

  const [tab, setTab] = useState<PanelTab>('profile')

  // ---- Enrichment state (manual interval — CandidateProfileResponse has no .status field) ----
  const [isEnriching, setIsEnriching] = useState(false)
  const [enrichError, setEnrichError] = useState(false)

  useEffect(() => {
    if (!isEnriching || !candidateId) return
    setEnrichError(false)
    const interval = setInterval(async () => {
      // refetchQueries awaits the actual network response; invalidateQueries only
      // marks stale and triggers a background refetch — getQueryData after it returns
      // the old value, causing the success path to never fire (CR-01).
      await queryClient.refetchQueries({ queryKey: ['supply-candidate', candidateId] })
      const cached = queryClient.getQueryData(['supply-candidate', candidateId]) as
        | components['schemas']['supply__schemas__candidates__CandidateProfileResponse']
        | undefined
      const tp = cached?.talent_pool
      if (tp?.email_verified !== null || tp?.github_public_repos !== null) {
        setIsEnriching(false)
        toast.success('Candidate enriched.')
      }
    }, 2000)
    const timeout = setTimeout(() => {
      setIsEnriching(false)
      setEnrichError(true)
    }, 30000)
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [isEnriching, candidateId, queryClient])

  // Reset enrichment state and the open section when candidate changes
  useEffect(() => {
    setIsEnriching(false)
    setEnrichError(false)
    setTab('profile')
  }, [candidateId])

  // ---- Enrich mutation ----
  const enrichMutation = useMutation({
    mutationFn: () =>
      apiClient.POST('/api/v1/supply/candidates/{candidate_id}/enrich', {
        params: { path: { candidate_id: candidateId! } },
      }),
    onSuccess: () => setIsEnriching(true),
    onError: () => setEnrichError(true),
  })

  // ---- Bookmarks (per acting recruiter) ----
  const { data: bookmarks = [] } = useQuery({
    queryKey: bookmarkQueryKeys.list(actingUser.id),
    queryFn: () => fetchBookmarks(actingUser.id),
    enabled: canBookmark && isOpen,
    staleTime: 30 * 1000,
  })
  const bookmarked = candidateId ? isBookmarked(bookmarks, candidateId) : false

  const bookmarkMutation = useMutation({
    mutationFn: () => {
      if (!candidateId) return Promise.resolve()
      const name = (data as components['schemas']['supply__schemas__candidates__CandidateProfileResponse'] | undefined)?.name
      return bookmarked
        ? deleteBookmark({ userId: actingUser.id, candidateId })
        : addBookmark({ userId: actingUser.id, candidateId, candidateName: name ?? undefined })
    },
    onSuccess: () => {
      const wasBookmarked = bookmarked
      queryClient.invalidateQueries({ queryKey: bookmarkQueryKeys.list(actingUser.id) })
      toast(wasBookmarked ? 'Removed bookmark.' : 'Bookmarked candidate.')
    },
    onError: () => toast.error('Could not update bookmark — try again.'),
  })

  // ---- Shortlist action mutation (source='shortlist' only) ----
  const [pendingTimeouts] = useState(() => new Map<string, ReturnType<typeof setTimeout>>())

  const actionMutation = useMutation({
    mutationFn: ({ status }: { status: string }) =>
      apiClient.PATCH('/api/v1/supply/shortlists/{submission_id}', {
        params: { path: { submission_id: submissionId! } },
        body: { status } satisfies components['schemas']['PatchSubmissionRequest'],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops-shortlist'] })
      queryClient.invalidateQueries({ queryKey: ['supply-shortlist'] })
    },
    onError: () => {
      toast.error('Failed to update — try again.')
    },
  })

  function handleShortlistAction(newStatus: 'approved' | 'hold' | 'passed') {
    if (!submissionId) return
    const candidate = data as components['schemas']['supply__schemas__candidates__CandidateProfileResponse'] | undefined
    const name = candidate?.name ?? 'Candidate'
    const toastMsg =
      newStatus === 'approved'
        ? `${name} approved.`
        : newStatus === 'hold'
          ? `Marked ${name} as hold.`
          : `Passed on ${name}.`

    // Cancel any pending timeout for this submission
    const existing = pendingTimeouts.get(submissionId)
    if (existing) {
      clearTimeout(existing)
      pendingTimeouts.delete(submissionId)
    }

    const timeoutId = setTimeout(() => {
      pendingTimeouts.delete(submissionId)
      actionMutation.mutate({ status: newStatus })
    }, 5000)
    pendingTimeouts.set(submissionId, timeoutId)

    toast(toastMsg, {
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => {
          const t = pendingTimeouts.get(submissionId)
          if (t) {
            clearTimeout(t)
            pendingTimeouts.delete(submissionId)
          }
          queryClient.invalidateQueries({ queryKey: ['ops-shortlist'] })
          queryClient.invalidateQueries({ queryKey: ['supply-shortlist'] })
        },
      },
    })
  }

  const candidate = data as components['schemas']['supply__schemas__candidates__CandidateProfileResponse'] | undefined
  const talentPool = candidate?.talent_pool as TalentPoolSummaryExtended | null | undefined
  const skills = talentPool?.skills ?? []
  const needsEnrichment =
    talentPool?.github_public_repos == null && talentPool?.email_verified == null

  const currentTitle = talentPool?.current_title ?? candidate?.current_title ?? null
  const currentCompany = candidate?.current_company ?? null
  // Header carries the role only; where / how long / where-from live in the
  // summary meta bar below it, so the subline stays one line (§5.1).
  const roleLine = [currentTitle, currentCompany ? `at ${currentCompany}` : null]
    .filter(Boolean)
    .join(' ')

  // Seniority is deliberately absent here — it belongs to the experience row,
  // and repeating it in both places is the noise §5.1 warns about.
  const summaryMeta: { key: string; icon: typeof MapPin; label: string }[] = [
    talentPool?.location ? { key: 'location', icon: MapPin, label: talentPool.location } : null,
    talentPool?.total_years_experience != null
      ? {
          key: 'experience',
          icon: Briefcase,
          label: `${talentPool.total_years_experience} yrs experience`,
        }
      : null,
    candidate?.source
      ? {
          key: 'source',
          icon: CalendarDays,
          label: `Sourced via ${candidate.source.replace(/_/g, ' ')}`,
        }
      : null,
  ].filter((item) => item !== null)

  const githubMeta = [
    talentPool?.github_public_repos != null
      ? `${talentPool.github_public_repos} public repos`
      : null,
    talentPool?.github_top_languages?.length
      ? talentPool.github_top_languages.join(', ')
      : null,
  ]
    .filter(Boolean)
    .join(' · ')

  // Work history, best source first:
  //   1. `talent_pool.experience` — the parsed resume, every role, always
  //      present once the candidate has been through resume ingest.
  //   2. `match_rationale.career` — only exists for a shortlisted candidate.
  //   3. the single current role the candidate record carries.
  const poolExperience = talentPool?.experience ?? []
  const careerRoles = evidence?.career ?? []
  const hasResume = Boolean(talentPool?.resume_available || talentPool?.resume_file_path)

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      {/* Width: a little over half the viewport — enough for the rail plus a
          readable body, and proportional on a large monitor instead of
          stranded at a fixed 640px. `min-w` keeps it usable on a laptop;
          `max-w` always leaves the screen behind it visible. */}
      <SheetContent
        side="right"
        // The header carries its own close button, styled to the system.
        // Without this, Radix stacks its default X on top of it.
        showCloseButton={false}
        className="flex w-[56vw] max-w-[94vw] min-w-[680px] flex-col gap-0 overflow-hidden border-l border-border bg-card p-0"
      >
        {/* Identity header */}
        <div className="shrink-0 border-b border-border bg-card px-6 py-5">
          <SheetDescription className="sr-only">Enriched candidate profile.</SheetDescription>
          {isLoading ? (
            <>
              <SheetTitle className="sr-only">Candidate detail</SheetTitle>
              <div className="flex items-center gap-4">
                <Skeleton className="size-11 rounded-full" />
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-3 w-64" />
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-start gap-4 pr-8">
              <Avatar className="size-11">
                <AvatarFallback className="bg-[#E5E3DC] text-[13px] font-medium text-muted-foreground">
                  {initials(candidate?.name) || '—'}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <SheetTitle className="text-xl leading-tight font-semibold text-foreground">
                    {candidate?.name ?? 'Unknown Candidate'}
                  </SheetTitle>
                  {talentPool?.availability_status && (
                    <Pill className={availabilityToneClass(talentPool.availability_status)}>
                      {availabilityLabel(talentPool.availability_status)}
                    </Pill>
                  )}
                  {/* Candidate record status (`sourced`, `contacted`, …) — a
                      different axis from availability, so it gets its own pill. */}
                  {candidate?.status && (
                    <Pill className={statusToneClass(candidate.status)}>
                      {humanizeStatus(candidate.status)}
                    </Pill>
                  )}
                </div>
                {roleLine && <p className="text-[13px] text-muted-foreground">{roleLine}</p>}
              </div>
              {/* Real score only — a search result carries none, so nothing is shown there. */}
              {fitScore != null && (
                <div className="shrink-0 text-right">
                  <Eyebrow>Fit score</Eyebrow>
                  <p className="mt-1 flex items-center justify-end gap-1.5">
                    <span className={cn('size-1.5 rounded-full bg-current', matchScoreToneClass(fitScore))} />
                    <span className={cn('text-lg leading-none font-semibold', matchScoreToneClass(fitScore))}>
                      {fitScore}%
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            onClick={() => onOpenChange(false)}
            aria-label="Close candidate panel"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Action bar */}
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border px-6 py-3">
          {source === 'search' && (
            <Button size="sm">
              <Zap className="size-4" />
              Generate engagement
            </Button>
          )}
          {source === 'shortlist' && submissionId && (
            <>
              <Button
                size="sm"
                disabled={actionMutation.isPending}
                onClick={() => handleShortlistAction('approved')}
              >
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={actionMutation.isPending}
                onClick={() => handleShortlistAction('hold')}
              >
                Hold
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-[#F0D9D6] bg-[#FAF0EE] text-[#BA4642] hover:bg-[#f6e4e1] hover:text-[#BA4642]"
                disabled={actionMutation.isPending}
                onClick={() => handleShortlistAction('passed')}
              >
                Pass on Candidate
              </Button>
            </>
          )}
          {canBookmark && candidateId && !isLoading && (
            <Button
              variant="outline"
              size="sm"
              disabled={bookmarkMutation.isPending}
              onClick={() => bookmarkMutation.mutate()}
              aria-pressed={bookmarked}
              aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark candidate'}
            >
              {bookmarked ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
              {bookmarked ? 'Bookmarked' : 'Bookmark'}
            </Button>
          )}
          {!isLoading && needsEnrichment && !isEnriching && !enrichError && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => enrichMutation.mutate()}
              disabled={enrichMutation.isPending}
            >
              <Sparkles className="size-4" />
              Enrich
            </Button>
          )}
          {isEnriching && (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
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
              Enriching…
            </span>
          )}
          {enrichError && (
            <span className="text-xs text-[#BA4642]">
              Enrichment failed —{' '}
              <button className="underline" onClick={() => enrichMutation.mutate()}>
                retry
              </button>
            </span>
          )}
        </div>

        {/* Contact band — fixed above the rail: you need the address whichever
            section is open, so it is not one of the switchable sections. */}
        {!isLoading && candidate && (
          <div className="flex shrink-0 items-start gap-4 border-b border-[#ECEAE4] px-6 py-4">
            <IconTile>
              <Mail className="size-5" />
            </IconTile>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-foreground">Contact details</h3>
                {talentPool?.email_verified && (
                  <Pill className="border-[#D3E2D7] bg-[#EFF4EF] text-[#317A4F]">
                    email verified
                  </Pill>
                )}
              </div>
              {isEnriching ? (
                <Skeleton className="h-4 w-[220px]" />
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    {candidate.email ? (
                      <a
                        href={`mailto:${candidate.email}`}
                        className="inline-flex items-center gap-1.5 text-foreground hover:underline"
                      >
                        <Mail className="size-4 shrink-0 text-muted-foreground" />
                        {candidate.email}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">No email on file</span>
                    )}
                    {candidate.linkedin_url && (
                      <a
                        href={safeHref(candidate.linkedin_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[#1E4ED8] hover:underline"
                      >
                        <Link2 className="size-4 shrink-0" />
                        LinkedIn profile
                        <ExternalLink className="size-3.5" />
                      </a>
                    )}
                    {talentPool?.github_url && (
                      <a
                        href={safeHref(talentPool.github_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[#1E4ED8] hover:underline"
                      >
                        <Code2 className="size-4 shrink-0" />
                        GitHub profile
                        <ExternalLink className="size-3.5" />
                      </a>
                    )}
                  </div>
                  {githubMeta && (
                    <p className="text-[13px] text-muted-foreground">{githubMeta}</p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Sections: icon rail + the open section's body */}
        <div className="flex min-h-0 flex-1">
          <IconRail value={tab} onChange={setTab} />
          <div className="flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-5">
            {isLoading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : !candidate ? null : tab === 'profile' ? (
              <>
                {/* Summary — where / how long / where from, so the header subline
                    stays a single role line. */}
                {summaryMeta.length > 0 && (
                  <section className="flex flex-col gap-2">
                    <Eyebrow>Summary</Eyebrow>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-muted-foreground">
                      {summaryMeta.map((item) => (
                        <MetaItem key={item.key} icon={item.icon}>
                          {item.label}
                        </MetaItem>
                      ))}
                    </div>
                  </section>
                )}

                {/* Skills */}
                {(skills.length > 0 || isEnriching) && (
                  <section className="flex flex-col gap-2.5">
                    <Eyebrow>
                      Skills{' '}
                      <span className="text-muted-foreground normal-case">
                        {skills.length} listed
                        {matchedSkills.size > 0
                          ? ` · ${matchedSkills.size} matched to this role`
                          : ''}
                      </span>
                    </Eyebrow>
                    {isEnriching ? (
                      <div className="flex flex-wrap gap-1.5">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <Skeleton key={i} className="h-6 w-16 rounded-md" />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {skills.map((skill) => {
                          const matched = matchedSkills.has(skill)
                          return (
                            <span
                              key={skill}
                              className={cn(
                                'inline-flex items-center rounded-md border px-2.5 py-1.5 text-[13px] leading-none',
                                matched
                                  ? 'border-[#C0DBFE] bg-[#F0F6FF] font-medium text-[#1E4ED8]'
                                  : 'border-border bg-secondary text-[#3A3B3B]',
                              )}
                            >
                              {skill}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </section>
                )}

                {/* Experience — see the source order where poolExperience is
                    derived. */}
                {(poolExperience.length > 0 ||
                  careerRoles.length > 0 ||
                  currentTitle ||
                  currentCompany) && (
                  <section className="flex flex-col gap-2">
                    <Eyebrow>
                      Experience{' '}
                      {poolExperience.length > 0 && (
                        <span className="text-muted-foreground normal-case">
                          {poolExperience.length} roles
                        </span>
                      )}
                    </Eyebrow>
                    <div className="flex flex-col">
                      {poolExperience.length > 0 ? (
                        poolExperience.map((role, index) => (
                          <ExperienceRow
                            key={`${role.company}-${index}`}
                            title={role.title || 'Role'}
                            company={role.company || null}
                            meta={role.duration || null}
                            note={role.description || null}
                          />
                        ))
                      ) : careerRoles.length > 0 ? (
                        careerRoles.map((role, index) => (
                          <ExperienceRow
                            key={`${role.company}-${index}`}
                            title={role.title ?? 'Role'}
                            company={role.company || null}
                            meta={
                              [role.duration, companyStatLine(role.company_info)]
                                .filter(Boolean)
                                .join(' · ') || null
                            }
                          />
                        ))
                      ) : (
                        <ExperienceRow
                          title={currentTitle ?? 'Current role'}
                          company={currentCompany}
                          meta={
                            talentPool?.seniority
                              ? talentPool.seniority.replace(/^\w/, (c) => c.toUpperCase())
                              : null
                          }
                        />
                      )}
                    </div>
                  </section>
                )}
              </>
            ) : tab === 'application' ? (
              !submission ? (
                <p className="text-base text-[#908E8B]">
                  Open this candidate from a role to see their application.
                </p>
              ) : (
                <>
                  <section className="flex flex-col gap-2">
                    <Eyebrow>Sourcing fit</Eyebrow>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      {fitScore != null ? (
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              'size-1.5 rounded-full bg-current',
                              matchScoreToneClass(fitScore),
                            )}
                          />
                          <span
                            className={cn(
                              'text-xl leading-none font-semibold',
                              matchScoreToneClass(fitScore),
                            )}
                          >
                            {fitScore}%
                          </span>
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not scored</span>
                      )}
                      <Pill className={statusToneClass(submission.status)}>
                        {humanizeStatus(submission.status)}
                      </Pill>
                    </div>
                  </section>

                  {/* Career is hidden here — the Profile section already lists
                      the same roles. */}
                  {evidence ? (
                    <section className="flex flex-col gap-2.5">
                      <Eyebrow>Skill evidence</Eyebrow>
                      <MatchEvidenceSections evidence={evidence} hideCareer />
                    </section>
                  ) : (
                    <p className="text-base text-[#908E8B]">
                      No skill evidence recorded for this submission.
                    </p>
                  )}
                </>
              )
            ) : tab === 'resume' ? (
              /* A real preview only when the file is stored in the documents
                 bucket (resume_available); older candidates show just the
                 original filename. Presigned URLs are fetched on click, never
                 cached (they expire). */
              isEnriching ? (
                <Skeleton className="h-4 w-[160px]" />
              ) : !hasResume ? (
                <p className="text-base text-[#908E8B]">No resume on file.</p>
              ) : talentPool?.resume_available && candidateId ? (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const opened = await openDocumentInNewTab(() => fetchResumeUrl(candidateId))
                      if (!opened) toast.error('No stored resume file for this candidate.')
                    } catch {
                      toast.error('Could not open the resume — try again.')
                    }
                  }}
                  className="flex w-fit items-center gap-2 text-sm text-[#1E4ED8] hover:underline"
                >
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  View resume
                  {talentPool.resume_file_path ? ` (${talentPool.resume_file_path})` : ''}
                  <ExternalLink className="size-3.5" />
                </button>
              ) : (
                <div className="flex flex-col gap-1">
                  <p className="flex items-center gap-2 text-sm text-foreground">
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    {talentPool?.resume_file_path}
                  </p>
                  <p className="pl-6 text-xs text-muted-foreground">
                    (file not stored — parsed profile only)
                  </p>
                </div>
              )
            ) : (
              <CandidateRelationshipSection
                candidateId={candidateId}
                requisitionId={requisitionId}
              />
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
