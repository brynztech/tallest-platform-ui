'use client'

/**
 * JD generation section on the requisition detail screen.
 *
 * One centred dialog with two faces: the generation inputs (requirement
 * paragraph + company website + reference memos) and, once generated, the
 * paper-faithful preview with Download and Regenerate. Never a new route —
 * the account manager stays on the requisition.
 */

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { components } from '@brynzit/api-client'
import { toast } from 'sonner'
import { Button } from '@brynzit/ui/components/ui/button'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Input } from '@brynzit/ui/components/ui/input'
import { Label } from '@brynzit/ui/components/ui/label'
import { Textarea } from '@brynzit/ui/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@brynzit/ui/components/ui/dialog'
import { Download, FileText, RefreshCw, Sparkles } from 'lucide-react'
import {
  fetchJd,
  generateJd,
  jdDownloadUrl,
  type GenerateJdInput,
  type JobDescription,
} from '../_lib/jd'
import { fetchUploadedJdUrl, openDocumentInNewTab } from '@/(shell)/_lib/documents'
import { ResdexCriteria } from '@/(shell)/_components/resdex-criteria'
import { JdPreview } from './jd-preview'

type RequisitionResponse = components['schemas']['RequisitionResponse']

interface CachedInputs {
  requirement_text?: string
  website_url?: string | null
  reference_memos?: string[] | null
  resdex_memo?: string | null
  extra_green_flags?: string | null
  extra_red_flags?: string | null
}

/** The backend caches the generation inputs on the requisition so Regenerate prefills. */
function cachedInputs(req: RequisitionResponse): CachedInputs {
  const intake = req.intake_details as Record<string, unknown> | null
  const inputs = intake?.jd_inputs
  return inputs && typeof inputs === 'object' ? (inputs as CachedInputs) : {}
}

interface UploadedJd {
  text?: string
  filename?: string
  object_key?: string | null
  uploaded_at?: string
}

/** The client's original JD document of record, stored at upload time. */
function uploadedJdOf(req: RequisitionResponse): UploadedJd | null {
  const intake = req.intake_details as Record<string, unknown> | null
  const uploaded = intake?.uploaded_jd
  return uploaded && typeof uploaded === 'object' ? (uploaded as UploadedJd) : null
}

export function JdPanel({ req }: { req: RequisitionResponse }) {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [isEditingInputs, setIsEditingInputs] = useState(false)

  const prefill = useMemo(() => cachedInputs(req), [req])
  const uploadedJd = useMemo(() => uploadedJdOf(req), [req])
  // Option C: the uploaded JD text doubles as the generator's requirement
  // input — "Generate formatted version" is the existing generate flow, just
  // prefilled with the client's own JD.
  const [requirementText, setRequirementText] = useState(
    prefill.requirement_text ?? uploadedJd?.text ?? '',
  )
  const [websiteUrl, setWebsiteUrl] = useState(prefill.website_url ?? '')
  const [referenceMemo, setReferenceMemo] = useState((prefill.reference_memos ?? []).join('\n\n'))
  const [resdexMemo, setResdexMemo] = useState(prefill.resdex_memo ?? '')
  const [greenFlags, setGreenFlags] = useState(prefill.extra_green_flags ?? '')
  const [redFlags, setRedFlags] = useState(prefill.extra_red_flags ?? '')

  // Cached with the requisition so re-opening the preview never regenerates.
  const { data: jd, isLoading } = useQuery({
    queryKey: ['ops-requisition-jd', req.id],
    queryFn: () => fetchJd(req.id),
    staleTime: 5 * 60 * 1000,
  })

  const generateMutation = useMutation({
    mutationFn: (): Promise<JobDescription> => {
      const input: GenerateJdInput = {
        requirement_text: requirementText.trim(),
        website_url: websiteUrl.trim() || undefined,
        reference_memos: referenceMemo.trim() ? [referenceMemo.trim()] : [],
        resdex_memo: resdexMemo.trim() || undefined,
        extra_green_flags: greenFlags.trim() || undefined,
        extra_red_flags: redFlags.trim() || undefined,
      }
      return generateJd(req.id, input)
    },
    onSuccess: (generated) => {
      queryClient.setQueryData(['ops-requisition-jd', req.id], generated)
      // intake_details now carries the JD and its ranking signals.
      queryClient.invalidateQueries({ queryKey: ['ops-requisition', req.id] })
      setIsEditingInputs(false)
      toast('JD generated.')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'JD generation failed — try again.')
    },
  })

  const hasUploaded = Boolean(uploadedJd?.text)
  // Three dialog faces: generated preview (jd wins), uploaded-JD preview
  // (document of record, exact text), or the generation form.
  const showUploadedPreview = !jd && !isEditingInputs && hasUploaded
  const showForm = isEditingInputs || (!jd && !hasUploaded)
  const canGenerate =
    requirementText.trim().length >= 20 &&
    websiteUrl.trim().length > 0 &&
    !generateMutation.isPending

  async function openOriginal() {
    try {
      const opened = await openDocumentInNewTab(() => fetchUploadedJdUrl(req.id))
      if (!opened) toast.error('The original file is not stored — only its extracted text.')
    } catch {
      toast.error('Could not open the original document — try again.')
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <FileText className="size-4 text-muted-foreground" />
            Job Description
            {jd ? (
              <Badge variant="secondary" className="text-xs">
                generated
              </Badge>
            ) : hasUploaded ? (
              <Badge variant="secondary" className="text-xs">
                uploaded
              </Badge>
            ) : null}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isLoading
              ? 'Checking…'
              : jd
                ? `Preview the JD, download the .docx, or regenerate after editing the requirement.`
                : hasUploaded
                  ? `Uploaded from ${uploadedJd?.filename ?? 'a document'} — preview the exact JD, or generate a formatted version from it.`
                  : 'Generate the JD from the requirement paragraph, the company website, and a reference memo.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {jd ? (
            <Button variant="outline" size="sm" asChild>
              <a href={jdDownloadUrl(req.id)} download>
                <Download className="mr-1 size-4" />
                Download
              </a>
            </Button>
          ) : null}
          <Button
            size="sm"
            variant={jd || hasUploaded ? 'outline' : 'default'}
            onClick={() => {
              setIsEditingInputs(!jd && !hasUploaded)
              setIsOpen(true)
            }}
          >
            {jd || hasUploaded ? (
              <>
                <FileText className="mr-1 size-4" />
                Preview JD
              </>
            ) : (
              <>
                <Sparkles className="mr-1 size-4" />
                Generate JD
              </>
            )}
          </Button>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>
              {showForm
                ? 'Generate job description'
                : showUploadedPreview
                  ? `Uploaded job description${uploadedJd?.filename ? ` — ${uploadedJd.filename}` : ''}`
                  : 'Job description'}
            </DialogTitle>
            <DialogDescription>
              {showForm
                ? 'The requirement paragraph and the company website are both required — the generator refuses to write a JD from the paragraph alone.'
                : showUploadedPreview
                  ? 'The exact text extracted from the uploaded document — the JD of record for this role.'
                  : 'This is exactly what the downloaded .docx contains.'}
            </DialogDescription>
          </DialogHeader>

          {showUploadedPreview ? (
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {uploadedJd?.text}
              </pre>
            </div>
          ) : showForm ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="jd-requirement">Requirement paragraph</Label>
                <Textarea
                  id="jd-requirement"
                  rows={6}
                  value={requirementText}
                  onChange={(event) => setRequirementText(event.target.value)}
                  placeholder="Role, must-haves, comp, location, stage, non-negotiables (visa, timezone overlap, mandatory application artifacts)…"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="jd-website">Company website</Label>
                <Input
                  id="jd-website"
                  value={websiteUrl}
                  onChange={(event) => setWebsiteUrl(event.target.value)}
                  placeholder="https://company.com"
                />
                <p className="text-xs text-muted-foreground">
                  Scraped server-side for the “About the company” section only.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="jd-memo">Reference memo (optional)</Label>
                <Textarea
                  id="jd-memo"
                  rows={4}
                  value={referenceMemo}
                  onChange={(event) => setReferenceMemo(event.target.value)}
                  placeholder="A prior JD for a similar role — used for tone and level of detail only."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="jd-resdex">Resdex criteria memo (optional)</Label>
                <Textarea
                  id="jd-resdex"
                  rows={3}
                  value={resdexMemo}
                  onChange={(event) => setResdexMemo(event.target.value)}
                  placeholder="How search criteria are phrased for this role family."
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="jd-green">Extra green flags (optional)</Label>
                  <Textarea
                    id="jd-green"
                    rows={3}
                    value={greenFlags}
                    onChange={(event) => setGreenFlags(event.target.value)}
                    placeholder="Merged with the generated green flags."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="jd-red">Extra red flags (optional)</Label>
                  <Textarea
                    id="jd-red"
                    rows={3}
                    value={redFlags}
                    onChange={(event) => setRedFlags(event.target.value)}
                    placeholder="Merged with the generated red flags."
                  />
                </div>
              </div>
            </div>
          ) : jd ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <JdPreview jd={jd} />
              </div>
              <ResdexCriteria criteria={jd.resdex_search_criteria} />
              {jd.hard_requirements.length + jd.application_requirements.length > 0 ? (
                <MetaBlock title="Hard filters applied to candidate matching">
                  <ul className="list-disc space-y-0.5 pl-5">
                    {[...jd.hard_requirements, ...jd.application_requirements].map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </MetaBlock>
              ) : null}
            </div>
          ) : null}

          <DialogFooter>
            {showUploadedPreview ? (
              <>
                {uploadedJd?.object_key ? (
                  <Button variant="outline" onClick={openOriginal}>
                    <Download className="mr-1 size-4" />
                    Download original
                  </Button>
                ) : null}
                <Button onClick={() => setIsEditingInputs(true)}>
                  <Sparkles className="mr-1 size-4" />
                  Generate formatted version
                </Button>
              </>
            ) : showForm ? (
              <>
                {jd || hasUploaded ? (
                  <Button variant="ghost" onClick={() => setIsEditingInputs(false)}>
                    Back to preview
                  </Button>
                ) : null}
                <Button disabled={!canGenerate} onClick={() => generateMutation.mutate()}>
                  {generateMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-1 size-4 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-1 size-4" />
                      Generate
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setIsEditingInputs(true)}>
                  <RefreshCw className="mr-1 size-4" />
                  Regenerate
                </Button>
                <Button variant="outline" asChild>
                  <a href={jdDownloadUrl(req.id)} download>
                    <Download className="mr-1 size-4" />
                    Download .docx
                  </a>
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MetaBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border p-3 text-sm">
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  )
}
