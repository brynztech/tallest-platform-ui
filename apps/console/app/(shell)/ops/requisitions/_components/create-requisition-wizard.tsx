'use client'

/**
 * Create flow with two intake modes: generate-first (define the role →
 * generate JD) and upload (upload an existing PDF/DOCX JD → server-side
 * extract + parse → editable review). Both converge on: assign recruiters →
 * publish → confirmation.
 */

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { components } from '@brynzit/api-client'
import { useActingUser } from '@brynzit/identity'
import { toast } from 'sonner'
import { Button } from '@brynzit/ui/components/ui/button'
import { Checkbox } from '@brynzit/ui/components/ui/checkbox'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@brynzit/ui/components/ui/select'
import { CheckCircle2, FileUp, RefreshCw, Sparkles } from 'lucide-react'
import { assignRecruiter, assignmentQueryKeys } from '@/(shell)/_lib/assignments'
import { updateRequisitionStatus } from '../[id]/_lib/lifecycle'
import {
  fetchJd,
  generateJd,
  titlesDiffer,
  type JobDescription,
} from '../[id]/_lib/jd'
import { ResdexCriteria } from '@/(shell)/_components/resdex-criteria'
import { JdPreview } from '../[id]/_components/jd-preview'
import {
  createDraftRequisition,
  patchRequisitionFields,
  patchRequisitionTitle,
  uploadJdDocument,
  JD_UPLOAD_EXTENSIONS,
  JD_UPLOAD_MAX_BYTES,
  type ParsedJd,
} from '../_lib/create-requisition'
import { listAssignableRecruiters } from '../../../../_lib/staff-auth'

type Client = components['schemas']['ClientResponse']
type Step = 'form' | 'preview' | 'assign' | 'done'
type IntakeMode = 'generate' | 'upload'

export function CreateRequisitionWizard({
  open,
  onOpenChange,
  clients,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  clients: Client[]
}) {
  const queryClient = useQueryClient()
  const actingUser = useActingUser()
  const { data: recruiters = [] } = useQuery({
    queryKey: ['staff-auth', 'recruiters'],
    queryFn: listAssignableRecruiters,
  })
  const [step, setStep] = useState<Step>('form')
  const [intakeMode, setIntakeMode] = useState<IntakeMode>('generate')
  const [reqId, setReqId] = useState<string | null>(null)
  const [jd, setJd] = useState<JobDescription | null>(null)
  const [parsed, setParsed] = useState<ParsedJd | null>(null)
  const [jdFile, setJdFile] = useState<File | null>(null)
  // Editable review drafts for the upload intake (pre-filled from the parse).
  const [seniorityDraft, setSeniorityDraft] = useState('')
  const [skillsDraft, setSkillsDraft] = useState('')
  const [compensationDraft, setCompensationDraft] = useState('')

  const [clientId, setClientId] = useState('')
  const [title, setTitle] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [requirementText, setRequirementText] = useState('')
  const [referenceMemo, setReferenceMemo] = useState('')
  const [resdexMemo, setResdexMemo] = useState('')
  const [greenFlags, setGreenFlags] = useState('')
  const [redFlags, setRedFlags] = useState('')
  const [useGeneratedTitle, setUseGeneratedTitle] = useState(false)
  const [selectedRecruiterIds, setSelectedRecruiterIds] = useState<string[]>([])
  const [assignedNames, setAssignedNames] = useState<string[]>([])

  const generatedTitle = jd?.title_block.role_title ?? parsed?.role ?? ''
  const showTitleChoice = titlesDiffer(title, generatedTitle)
  const finalTitle = useGeneratedTitle && showTitleChoice ? generatedTitle : title.trim()
  const clientName = clients.find((client) => client.id === clientId)?.name ?? ''

  function reset() {
    setStep('form')
    setIntakeMode('generate')
    setReqId(null)
    setJd(null)
    setParsed(null)
    setJdFile(null)
    setSeniorityDraft('')
    setSkillsDraft('')
    setCompensationDraft('')
    setClientId('')
    setTitle('')
    setWebsiteUrl('')
    setRequirementText('')
    setReferenceMemo('')
    setResdexMemo('')
    setGreenFlags('')
    setRedFlags('')
    setUseGeneratedTitle(false)
    setSelectedRecruiterIds([])
    setAssignedNames([])
  }

  function handleOpenChange(next: boolean) {
    onOpenChange(next)
    if (!next) reset()
  }

  const generateMutation = useMutation({
    mutationFn: async (): Promise<JobDescription> => {
      let id = reqId
      if (!id) {
        const created = await createDraftRequisition({
          client_id: clientId,
          title: title.trim(),
        })
        id = created.id
        setReqId(id)
      }
      return generateJd(id, {
        requirement_text: requirementText.trim(),
        website_url: websiteUrl.trim(),
        reference_memos: referenceMemo.trim() ? [referenceMemo.trim()] : [],
        resdex_memo: resdexMemo.trim() || undefined,
        extra_green_flags: greenFlags.trim() || undefined,
        extra_red_flags: redFlags.trim() || undefined,
      })
    },
    onSuccess: (generated) => {
      setJd(generated)
      setUseGeneratedTitle(titlesDiffer(title, generated.title_block.role_title))
      setStep('preview')
      queryClient.setQueryData(['ops-requisition-jd', generated.requisition_id], generated)
      toast('JD generated.')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'JD generation failed — try again.')
    },
  })

  const uploadMutation = useMutation({
    mutationFn: async (): Promise<ParsedJd> => {
      if (!jdFile) throw new Error('Choose a PDF or DOCX file first.')
      let id = reqId
      if (!id) {
        const created = await createDraftRequisition({
          client_id: clientId,
          title: title.trim(),
        })
        id = created.id
        setReqId(id)
      }
      return uploadJdDocument(id, jdFile)
    },
    onSuccess: async (result) => {
      setParsed(result)
      setSeniorityDraft(result.seniority ?? '')
      setSkillsDraft((result.skills ?? []).join(', '))
      setCompensationDraft(result.compensation_range ?? '')
      setUseGeneratedTitle(titlesDiffer(title, result.role))
      // The upload also structures the document into the JD template
      // (preserving wording) — fetch it so the review step renders the same
      // JdPreview as the generate flow. If structuring failed server-side,
      // this 404s and the flat editable review renders as the fallback.
      try {
        const structured = await fetchJd(result.requisition_id)
        setJd(structured)
        queryClient.setQueryData(['ops-requisition-jd', result.requisition_id], structured)
      } catch {
        // fall back to the flat parsed-fields review
      }
      setStep('preview')
      toast('JD parsed — review it before publishing.')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Could not parse the uploaded JD — try another file.')
    },
  })

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!reqId) throw new Error('Requisition is missing.')
      if (showTitleChoice && useGeneratedTitle && generatedTitle) {
        await patchRequisitionTitle(reqId, generatedTitle)
      } else if (parsed && showTitleChoice && !useGeneratedTitle) {
        // Upload intake: the backend already stamped the parsed role as the
        // requisition title at parse time, so "Keep yours" must restore the
        // typed title (generate intake never touches title server-side).
        await patchRequisitionTitle(reqId, title.trim())
      }
      if (parsed && !jd) {
        // Upload intake, flat-review fallback only (no structured JD): apply
        // the editable review's values. When the structured JD rendered, no
        // editable fields were shown — patching the unshown drafts here would
        // overwrite the structuring output's columns with parse values.
        await patchRequisitionFields(reqId, {
          seniority: seniorityDraft.trim() || null,
          skills: skillsDraft.split(',').map((s) => s.trim()).filter(Boolean),
          compensation_range: compensationDraft.trim() || null,
        })
      }
      await updateRequisitionStatus(reqId, 'open')
      await Promise.all(
        selectedRecruiterIds.map((userId) => assignRecruiter(userId, reqId, actingUser.id)),
      )
      return selectedRecruiterIds.map(
        (userId) => recruiters.find((r) => r.id === userId)?.username ?? userId,
      )
    },
    onSuccess: (names) => {
      setAssignedNames(names)
      setStep('done')
      queryClient.invalidateQueries({ queryKey: ['ops-requisitions'] })
      for (const userId of selectedRecruiterIds) {
        queryClient.invalidateQueries({ queryKey: assignmentQueryKeys.forUser(userId) })
      }
      if (reqId) {
        queryClient.invalidateQueries({ queryKey: assignmentQueryKeys.forRequisition(reqId) })
        queryClient.invalidateQueries({ queryKey: ['ops-requisition', reqId] })
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to publish requisition — try again.')
    },
  })

  const canGenerate =
    clientId !== '' &&
    title.trim().length > 0 &&
    requirementText.trim().length >= 20 &&
    websiteUrl.trim().length > 0 &&
    !generateMutation.isPending

  const canUpload =
    clientId !== '' && title.trim().length > 0 && jdFile !== null && !uploadMutation.isPending

  function handleFileChange(fileList: FileList | null) {
    const file = fileList?.[0] ?? null
    if (!file) {
      setJdFile(null)
      return
    }
    const name = file.name.toLowerCase()
    if (!JD_UPLOAD_EXTENSIONS.some((ext) => name.endsWith(ext))) {
      toast.error('File must be PDF or DOCX.')
      return
    }
    if (file.size > JD_UPLOAD_MAX_BYTES) {
      toast.error(`File exceeds the ${JD_UPLOAD_MAX_BYTES / (1024 * 1024)} MiB limit.`)
      return
    }
    setJdFile(file)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>
            {step === 'form' && 'New requisition'}
            {step === 'preview' && 'Review job description'}
            {step === 'assign' && 'Assign recruiters'}
            {step === 'done' && 'Requisition created'}
          </DialogTitle>
          <DialogDescription>
            {step === 'form' &&
              (intakeMode === 'generate'
                ? 'Describe the role and company. Generating the JD fills seniority, skills, and matching signals — no separate parse step.'
                : 'Upload an existing JD (PDF or DOCX). Its fields are extracted for you to review and edit before publishing.')}
            {step === 'preview' &&
              (jd
                ? 'This is the JD recruiters will search against.'
                : 'Review the fields extracted from your document — edit anything the parser got wrong before continuing.')}
            {step === 'assign' && 'Choose who sources candidates for this role, then publish.'}
            {step === 'done' &&
              'The role is open. Candidate search has started against this JD.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'form' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={intakeMode === 'generate' ? 'default' : 'outline'}
                onClick={() => setIntakeMode('generate')}
              >
                <Sparkles className="mr-1 size-4" />
                Generate from brief
              </Button>
              <Button
                type="button"
                size="sm"
                variant={intakeMode === 'upload' ? 'default' : 'outline'}
                onClick={() => setIntakeMode('upload')}
              >
                <FileUp className="mr-1 size-4" />
                Upload existing JD
              </Button>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wizard-client">Client</Label>
              <Select value={clientId} onValueChange={setClientId} disabled={Boolean(reqId)}>
                <SelectTrigger id="wizard-client" className="w-full">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wizard-title">Role title</Label>
              <Input
                id="wizard-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Senior Backend Engineer"
              />
            </div>
            {intakeMode === 'upload' && (
              <div className="space-y-1.5">
                <Label htmlFor="wizard-jd-file">JD document (PDF or DOCX, max 10 MiB)</Label>
                <Input
                  id="wizard-jd-file"
                  type="file"
                  accept=".pdf,.docx"
                  onChange={(event) => handleFileChange(event.target.files)}
                />
                {jdFile && (
                  <p className="text-xs text-muted-foreground">
                    {jdFile.name} · {(jdFile.size / 1024).toFixed(0)} KB
                  </p>
                )}
              </div>
            )}
            {intakeMode === 'generate' && (
            <>
            <div className="space-y-1.5">
              <Label htmlFor="wizard-website">Company website</Label>
              <Input
                id="wizard-website"
                value={websiteUrl}
                onChange={(event) => setWebsiteUrl(event.target.value)}
                placeholder="https://company.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wizard-requirement">Requirement paragraph</Label>
              <Textarea
                id="wizard-requirement"
                rows={6}
                value={requirementText}
                onChange={(event) => setRequirementText(event.target.value)}
                placeholder="Role, must-haves, comp, location, stage, non-negotiables…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wizard-memo">Reference memo (optional)</Label>
              <Textarea
                id="wizard-memo"
                rows={3}
                value={referenceMemo}
                onChange={(event) => setReferenceMemo(event.target.value)}
                placeholder="A prior JD for tone and level of detail only."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wizard-resdex">Resdex criteria memo (optional)</Label>
              <Textarea
                id="wizard-resdex"
                rows={3}
                value={resdexMemo}
                onChange={(event) => setResdexMemo(event.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="wizard-green">Extra green flags (optional)</Label>
                <Textarea
                  id="wizard-green"
                  rows={3}
                  value={greenFlags}
                  onChange={(event) => setGreenFlags(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wizard-red">Extra red flags (optional)</Label>
                <Textarea
                  id="wizard-red"
                  rows={3}
                  value={redFlags}
                  onChange={(event) => setRedFlags(event.target.value)}
                />
              </div>
            </div>
            </>
            )}
          </div>
        )}

        {step === 'preview' && !jd && parsed && (
          <div className="space-y-4">
            {showTitleChoice ? (
              <div className="rounded-lg border border-border p-3 text-sm">
                <p className="mb-2 font-medium">The parsed title differs from what you typed.</p>
                <label className="flex items-start gap-2">
                  <input
                    type="radio"
                    name="title-choice"
                    checked={!useGeneratedTitle}
                    onChange={() => setUseGeneratedTitle(false)}
                  />
                  <span>Keep yours: {title.trim()}</span>
                </label>
                <label className="mt-2 flex items-start gap-2">
                  <input
                    type="radio"
                    name="title-choice"
                    checked={useGeneratedTitle}
                    onChange={() => setUseGeneratedTitle(true)}
                  />
                  <span>Use parsed: {generatedTitle}</span>
                </label>
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="wizard-parsed-seniority">Seniority</Label>
              <Input
                id="wizard-parsed-seniority"
                value={seniorityDraft}
                onChange={(event) => setSeniorityDraft(event.target.value)}
                placeholder="e.g. senior"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wizard-parsed-skills">Skills (comma-separated)</Label>
              <Textarea
                id="wizard-parsed-skills"
                rows={3}
                value={skillsDraft}
                onChange={(event) => setSkillsDraft(event.target.value)}
                placeholder="Python, FastAPI, PostgreSQL"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wizard-parsed-comp">Compensation range</Label>
              <Input
                id="wizard-parsed-comp"
                value={compensationDraft}
                onChange={(event) => setCompensationDraft(event.target.value)}
                placeholder="e.g. $150k–$180k"
              />
            </div>
            {parsed.target_start_date && (
              <p className="text-sm text-muted-foreground">
                Target start date: {parsed.target_start_date}
              </p>
            )}
            {(parsed.interview_process?.length ?? 0) > 0 && (
              <div className="rounded-lg border border-border p-3 text-sm">
                <p className="mb-1 font-medium">Hiring process (from the JD)</p>
                <p className="text-muted-foreground">
                  {/* Mirrors the backend's _stages_from_interview_process: terminal
                      "Hired" dropped; the internal gate prepended unless the JD's
                      first stage already is one. */}
                  {(() => {
                    const stages = (parsed.interview_process ?? []).filter(
                      (s) => s.trim().toLowerCase() !== 'hired',
                    )
                    const withGate = /recruiter|internal|hr screen/i.test(stages[0] ?? '')
                      ? stages
                      : ['Recruiter Review', ...stages]
                    return withGate.join(' → ')
                  })()}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Configured as this role&apos;s pipeline — editable later via Edit Process.
                </p>
              </div>
            )}
          </div>
        )}

        {step === 'preview' && jd && (
          <div className="space-y-4">
            {showTitleChoice ? (
              <div className="rounded-lg border border-border p-3 text-sm">
                <p className="mb-2 font-medium">
                  The {parsed ? 'parsed' : 'generated'} title differs from what you typed.
                </p>
                <label className="flex items-start gap-2">
                  <input
                    type="radio"
                    name="title-choice"
                    checked={!useGeneratedTitle}
                    onChange={() => setUseGeneratedTitle(false)}
                  />
                  <span>Keep yours: {title.trim()}</span>
                </label>
                <label className="mt-2 flex items-start gap-2">
                  <input
                    type="radio"
                    name="title-choice"
                    checked={useGeneratedTitle}
                    onChange={() => setUseGeneratedTitle(true)}
                  />
                  <span>Use {parsed ? 'parsed' : 'generated'}: {generatedTitle}</span>
                </label>
              </div>
            ) : null}
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <JdPreview jd={jd} />
            </div>
            {(parsed?.interview_process?.length ?? 0) > 0 && (
              <div className="rounded-lg border border-border p-3 text-sm">
                <p className="mb-1 font-medium">Hiring process (from the JD)</p>
                <p className="text-muted-foreground">
                  {(() => {
                    const stages = (parsed?.interview_process ?? []).filter(
                      (s) => s.trim().toLowerCase() !== 'hired',
                    )
                    const withGate = /recruiter|internal|hr screen/i.test(stages[0] ?? '')
                      ? stages
                      : ['Recruiter Review', ...stages]
                    return withGate.join(' → ')
                  })()}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Configured as this role&apos;s pipeline — editable later via Edit Process.
                </p>
              </div>
            )}
          </div>
        )}

        {step === 'assign' && (
          <div className="space-y-3">
            {recruiters.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recruiters available to assign.</p>
            ) : (
              recruiters.map((user) => {
                const checked = selectedRecruiterIds.includes(user.id)
                return (
                  <label key={user.id} className="flex items-center gap-3 text-sm">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => {
                        setSelectedRecruiterIds((current) =>
                          value === true
                            ? [...current, user.id]
                            : current.filter((id) => id !== user.id),
                        )
                      }}
                    />
                    <span>{user.username}</span>
                  </label>
                )
              })
            )}
          </div>
        )}

        {step === 'done' && reqId && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-2 text-base font-medium">
              <CheckCircle2 className="size-5 text-primary" />
              Role published — matching started
            </div>
            <p>
              <span className="text-muted-foreground">Role: </span>
              {finalTitle}
            </p>
            <p>
              <span className="text-muted-foreground">Client: </span>
              {clientName || '—'}
            </p>
            <p>
              <span className="text-muted-foreground">Assigned to: </span>
              {assignedNames.length > 0 ? assignedNames.join(', ') : 'no recruiters yet'}
            </p>
            {jd ? (
              <>
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <JdPreview jd={jd} />
                </div>
                <ResdexCriteria criteria={jd.resdex_search_criteria} />
              </>
            ) : null}
          </div>
        )}

        <DialogFooter>
          {step === 'form' && intakeMode === 'generate' && (
            <Button disabled={!canGenerate} onClick={() => generateMutation.mutate()}>
              {generateMutation.isPending ? (
                <>
                  <RefreshCw className="mr-1 size-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="mr-1 size-4" />
                  Generate job description
                </>
              )}
            </Button>
          )}
          {step === 'form' && intakeMode === 'upload' && (
            <Button disabled={!canUpload} onClick={() => uploadMutation.mutate()}>
              {uploadMutation.isPending ? (
                <>
                  <RefreshCw className="mr-1 size-4 animate-spin" />
                  Parsing…
                </>
              ) : (
                <>
                  <FileUp className="mr-1 size-4" />
                  Upload &amp; parse
                </>
              )}
            </Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="ghost" onClick={() => setStep('form')}>
                Edit inputs
              </Button>
              <Button onClick={() => setStep('assign')}>Continue</Button>
            </>
          )}
          {step === 'assign' && (
            <>
              <Button variant="ghost" onClick={() => setStep('preview')}>
                Back to preview
              </Button>
              <Button
                disabled={publishMutation.isPending}
                onClick={() => publishMutation.mutate()}
              >
                {publishMutation.isPending ? 'Publishing…' : 'Publish & assign'}
              </Button>
            </>
          )}
          {step === 'done' && reqId && (
            <Button onClick={() => handleOpenChange(false)}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
