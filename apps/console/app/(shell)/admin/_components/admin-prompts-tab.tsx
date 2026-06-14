'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { Button } from '@brynzit/ui/components/ui/button'
import { Textarea } from '@brynzit/ui/components/ui/textarea'
import { cn } from '@brynzit/ui/lib/utils'
import { toast } from 'sonner'
import { RotateCcw, Save } from 'lucide-react'

// NOTE: No GET /monitoring/prompts list endpoint exists. These names are hardcoded.
// Verify against live backend PROMPT_REGISTRY before going to production.
const KNOWN_PROMPTS = [
  'icp_scoring',
  'outreach_generation',
  'jd_parse',
  'engagement_generation',
]

interface AdminPromptsTabProps {
  onDirtyChange?: (dirty: boolean) => void
}

export function AdminPromptsTab({ onDirtyChange }: AdminPromptsTabProps = {}) {
  const [selectedPromptName, setSelectedPromptName] = useState<string | null>(null)
  const [editedContent, setEditedContent] = useState('')
  const queryClient = useQueryClient()

  const { data: promptData, isLoading } = useQuery({
    queryKey: ['prompt', selectedPromptName],
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        '/api/v1/monitoring/prompts/{name}',
        {
          params: { path: { name: selectedPromptName! } },
        },
      )
      if (error) throw error
      return data as components['schemas']['PromptContentResponse']
    },
    enabled: !!selectedPromptName,
    staleTime: 5 * 60 * 1000,
  })

  // Sync editedContent when prompt data loads or selected prompt changes
  useEffect(() => {
    if (promptData?.content !== undefined) {
      setEditedContent(promptData.content)
    }
  }, [promptData?.content, selectedPromptName])

  const isDirty = editedContent !== (promptData?.content ?? '')

  // Notify parent of dirty state changes (CR-03: lets AdminContent gate tab switches)
  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  // Guard browser-level navigation (refresh, back, tab close) when dirty (CR-03)
  useEffect(() => {
    if (!isDirty) return
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const saveMutation = useMutation({
    mutationFn: ({ name, content }: { name: string; content: string }) =>
      apiClient.PUT('/api/v1/monitoring/prompts/{name}', {
        params: { path: { name } },
        body: { content } satisfies components['schemas']['PromptSaveRequest'],
      }),
    onSuccess: () => {
      toast.success('Prompt saved.')
      queryClient.invalidateQueries({ queryKey: ['prompt', selectedPromptName] })
    },
    onError: () => toast.error('Failed to save prompt — try again.'),
  })

  function handleSelectPrompt(name: string) {
    if (isDirty) {
      toast('Unsaved changes — save or discard before switching.', {
        duration: 5000,
        action: {
          label: 'Discard',
          onClick: () => {
            setEditedContent(promptData?.content ?? '')
            setSelectedPromptName(name)
          },
        },
      })
      return
    }
    setSelectedPromptName(name)
    setEditedContent('') // will be set by useEffect when query loads
  }

  function handleReset() {
    if (!isDirty) return
    setEditedContent(promptData?.content ?? '')
  }

  return (
    <div className="flex h-[calc(100vh-14rem)] gap-0">
      {/* Left panel — Prompt list */}
      <div className="flex w-[280px] flex-shrink-0 flex-col overflow-y-auto border-r border-border">
        <div className="border-b border-border px-3 py-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Prompts
          </span>
        </div>
        <div className="flex flex-col">
          {KNOWN_PROMPTS.map((name) => {
            const isActive = selectedPromptName === name
            const showDot = isActive && isDirty
            return (
              <button
                key={name}
                type="button"
                onClick={() => handleSelectPrompt(name)}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md px-3 py-2.5 text-left',
                  isActive
                    ? 'border-l-2 border-primary bg-accent/50 pl-[10px] font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <span className="flex-1 truncate text-sm">{name}</span>
                {showDot && (
                  <span className="size-1.5 flex-shrink-0 rounded-full bg-[oklch(0.769_0.188_85.87)]" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Right panel — Editor */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto px-6 py-4">
        {!selectedPromptName ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Select a prompt from the list to view and edit.
          </p>
        ) : (
          <>
            {/* Editor header */}
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">{selectedPromptName}</h2>
                {promptData?.versions && promptData.versions.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Versions: {promptData.versions.join(', ')}
                  </p>
                )}
              </div>
              {isDirty && (
                <span className="text-xs text-[oklch(0.769_0.188_85.87)]">
                  • Unsaved changes
                </span>
              )}
            </div>

            {/* Textarea editor */}
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[400px] w-full resize-y bg-muted/30 font-mono text-sm"
              placeholder="Select a prompt from the list to edit"
              disabled={isLoading || !selectedPromptName}
            />

            {/* Action row */}
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!isDirty}
                onClick={handleReset}
              >
                <RotateCcw className="mr-1 size-4" />
                Reset
              </Button>
              <Button
                size="sm"
                disabled={!isDirty || saveMutation.isPending}
                onClick={() =>
                  selectedPromptName &&
                  saveMutation.mutate({
                    name: selectedPromptName,
                    content: editedContent,
                  })
                }
              >
                <Save className="mr-1 size-4" />
                {saveMutation.isPending ? 'Saving…' : 'Save Prompt'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
