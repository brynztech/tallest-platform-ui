'use client'

/**
 * Generate-first create flow: define the role → generate JD → assign recruiters
 * → confirmation. parse-jd is not part of this path.
 */

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { components } from '@brynzit/api-client'
import { SEED_USERS } from '@brynzit/identity'
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
import { CheckCircle2, RefreshCw, Sparkles } from 'lucide-react'
import Link from 'next/link'
import {
  assignableRecruiters,
  assignRecruiter,
  assignmentQueryKeys,
} from '@/(shell)/_lib/assignments'
import { updateRequisitionStatus } from '../[id]/_lib/lifecycle'
import {
  generateJd,
  titlesDiffer,
  type JobDescription,
} from '../[id]/_lib/jd'
import { JdPreview } from '../[id]/_components/jd-preview'
import { createDraftRequisition, patchRequisitionTitle } from '../_lib/create-requisition'

type Client = components['schemas']['ClientResponse']
type Step = 'form' | 'preview' | 'assign' | 'done'

function recruiterName(userId: string) {
  return SEED_USERS.find((user) => user.id === userId)?.name ?? userId
}

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
  const [step, setStep] = useState<Step>('form')
  const [reqId, setReqId] = useState<string | null>(null)
  const [jd, setJd] = useState<JobDescription | null>(null)

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

  const generatedTitle = jd?.title_block.role_title ?? ''
  const showTitleChoice = titlesDiffer(title, generatedTitle)
  const finalTitle = useGeneratedTitle && showTitleChoice ? generatedTitle : title.trim()
  const clientName = clients.find((client) => client.id === clientId)?.name ?? ''
  const recruiters = assignableRecruiters(SEED_USERS, [])

  function reset() {
    setStep('form')
    setReqId(null)
    setJd(null)
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

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!reqId) throw new Error('Requisition is missing.')
      if (showTitleChoice && useGeneratedTitle && generatedTitle) {
        await patchRequisitionTitle(reqId, generatedTitle)
      }
      await updateRequisitionStatus(reqId, 'open')
      await Promise.all(selectedRecruiterIds.map((userId) => assignRecruiter(userId, reqId)))
      return selectedRecruiterIds.map(recruiterName)
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
              'Describe the role and company. Generating the JD fills seniority, skills, and matching signals — no separate parse step.'}
            {step === 'preview' && 'This is the JD recruiters will search against.'}
            {step === 'assign' && 'Choose who sources candidates for this role, then publish.'}
            {step === 'done' && 'The role is open and assigned.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'form' && (
          <div className="space-y-4">
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
          </div>
        )}

        {step === 'preview' && jd && (
          <div className="space-y-4">
            {showTitleChoice ? (
              <div className="rounded-lg border border-border p-3 text-sm">
                <p className="mb-2 font-medium">The generated title differs from what you typed.</p>
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
                  <span>Use generated: {generatedTitle}</span>
                </label>
              </div>
            ) : null}
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <JdPreview jd={jd} />
            </div>
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
                    <span>
                      {user.name}
                      {user.title ? (
                        <span className="text-muted-foreground"> · {user.title}</span>
                      ) : null}
                    </span>
                  </label>
                )
              })
            )}
          </div>
        )}

        {step === 'done' && reqId && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-base font-medium">
              <CheckCircle2 className="size-5 text-primary" />
              Requisition created
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
              <span className="text-muted-foreground">JD: </span>
              generated
            </p>
            <p>
              <span className="text-muted-foreground">Assigned to: </span>
              {assignedNames.length > 0 ? assignedNames.join(', ') : 'no recruiters yet'}
            </p>
          </div>
        )}

        <DialogFooter>
          {step === 'form' && (
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
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Back to requisitions
              </Button>
              <Button asChild>
                <Link href={`/ops/requisitions/${reqId}`} onClick={() => handleOpenChange(false)}>
                  View requisition
                </Link>
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
