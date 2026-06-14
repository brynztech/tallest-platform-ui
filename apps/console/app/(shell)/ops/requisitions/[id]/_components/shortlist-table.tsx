'use client'

import { useState, useEffect } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { toast } from 'sonner'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Button } from '@brynzit/ui/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@brynzit/ui/components/ui/table'
import { CheckCircle, PauseCircle, XCircle } from 'lucide-react'
import { shortlistStatusBadgeClass } from './shortlist-utils'

// CRITICAL: GET /api/v1/ops/requisitions/{req_id}/shortlist returns { [key: string]: unknown }
// Define local type based on supply SubmissionResponse shape (verified api.d.ts line 3031)
// MSW ops.ts handler returns this shape; cast at fetch boundary
type ShortlistEntry = {
  submission_id: string
  candidate_id: string
  candidate_name?: string | null
  current_title?: string | null
  fit_score?: number | null
  rank?: number | null
  status: string
}

interface ShortlistTableProps {
  reqId: string
  onCandidateSelect: (candidateId: string, submissionId: string) => void
  onApprove: (candidateId: string) => void
}

export function ShortlistTable({
  reqId,
  onCandidateSelect,
  onApprove,
}: ShortlistTableProps) {
  const queryClient = useQueryClient()
  // Track pending undo timeouts for each submission
  const [pendingTimeouts] = useState(() => new Map<string, ReturnType<typeof setTimeout>>())

  // Clear all pending timeouts on unmount to prevent stale-closure mutations
  // from firing after the component is gone
  useEffect(() => {
    return () => {
      pendingTimeouts.forEach((id) => clearTimeout(id))
      pendingTimeouts.clear()
    }
  }, [pendingTimeouts])

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['ops-shortlist', reqId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        '/api/v1/ops/requisitions/{req_id}/shortlist',
        { params: { path: { req_id: reqId } } },
      )
      if (error) throw error
      // Safe cast at boundary — backend returns JSONB { [key: string]: unknown }
      const raw = data as Record<string, unknown>
      return (raw['submissions'] as ShortlistEntry[] | undefined) ?? []
    },
  })

  // CRITICAL: Shortlist actions use SUPPLY domain PATCH — NOT ops endpoint
  // Verified in api.d.ts: PATCH /api/v1/supply/shortlists/{submission_id} with PatchSubmissionRequest
  const actionMutation = useMutation({
    mutationFn: ({
      submissionId,
      status,
    }: {
      submissionId: string
      status: string
    }) =>
      apiClient.PATCH('/api/v1/supply/shortlists/{submission_id}', {
        params: { path: { submission_id: submissionId } },
        body: { status } satisfies components['schemas']['PatchSubmissionRequest'],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops-shortlist', reqId] })
    },
    onError: () => {
      toast.error('Failed to update — try again.')
    },
  })

  const handleAction = (
    entry: ShortlistEntry,
    newStatus: 'approved' | 'hold' | 'passed',
  ) => {
    const name = entry.candidate_name ?? 'Candidate'
    const toastMsg =
      newStatus === 'approved'
        ? `${name} approved.`
        : newStatus === 'hold'
          ? `Marked ${name} as hold.`
          : `Passed on ${name}.`

    // Cancel any pending timeout for this submission
    const existing = pendingTimeouts.get(entry.submission_id)
    if (existing) {
      clearTimeout(existing)
      pendingTimeouts.delete(entry.submission_id)
    }

    // Delay mutation to match the 5-second undo window shown in the toast.
    // Previously 300ms caused the undo button to silently do nothing.
    const timeoutId = setTimeout(() => {
      pendingTimeouts.delete(entry.submission_id)
      actionMutation.mutate({ submissionId: entry.submission_id, status: newStatus })
      if (newStatus === 'approved') onApprove(entry.candidate_id)
    }, 5000)

    pendingTimeouts.set(entry.submission_id, timeoutId)

    toast(toastMsg, {
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => {
          const t = pendingTimeouts.get(entry.submission_id)
          if (t) {
            clearTimeout(t)
            pendingTimeouts.delete(entry.submission_id)
          }
          queryClient.invalidateQueries({ queryKey: ['ops-shortlist', reqId] })
        },
      },
    })
  }

  const columnHelper = createColumnHelper<ShortlistEntry>()

  // useReactTable accepts ColumnDef<TData, any>[] — use inferred type to avoid
  // TypeScript contravariance issues when mixing accessor and display column defs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: any[] = [
    columnHelper.accessor('rank', {
      header: '#',
      cell: (info) => (
        <span className="text-xs text-muted-foreground">
          {info.getValue() ?? '—'}
        </span>
      ),
      size: 48,
    }),
    columnHelper.accessor('candidate_name', {
      header: 'Candidate',
      cell: (info) => (
        <button
          type="button"
          className="cursor-pointer text-left text-sm hover:text-primary"
          onClick={() => onCandidateSelect(info.row.original.candidate_id, info.row.original.submission_id)}
        >
          {info.getValue() ?? 'Unknown'}
        </button>
      ),
    }),
    columnHelper.accessor('current_title', {
      header: 'Current Title',
      cell: (info) => (
        <span className="block max-w-[200px] truncate text-sm text-muted-foreground">
          {info.getValue() ?? '—'}
        </span>
      ),
    }),
    columnHelper.accessor('fit_score', {
      header: 'Fit Score',
      cell: (info) => {
        const score = info.getValue()
        return (
          <span className="text-sm font-semibold">
            {score != null ? `${score}%` : '—'}
          </span>
        )
      },
      size: 80,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => {
        const status = info.getValue()
        const extraClass = shortlistStatusBadgeClass(status)
        if (!extraClass) {
          return (
            <Badge variant="secondary" className="text-xs">
              {status}
            </Badge>
          )
        }
        return (
          <Badge variant="outline" className={`text-xs ${extraClass}`}>
            {status}
          </Badge>
        )
      },
      size: 120,
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: (info) => {
        const entry = info.row.original
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 hover:text-green-600"
              aria-label="Approve candidate"
              disabled={entry.status === 'approved' || entry.status === 'passed'}
              onClick={() => handleAction(entry, 'approved')}
            >
              <CheckCircle className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 hover:text-amber-600"
              aria-label="Hold candidate"
              disabled={entry.status !== 'shortlisted'}
              onClick={() => handleAction(entry, 'hold')}
            >
              <PauseCircle className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 hover:text-destructive"
              aria-label="Pass on candidate"
              disabled={entry.status === 'passed'}
              onClick={() => handleAction(entry, 'passed')}
            >
              <XCircle className="size-4" />
            </Button>
          </div>
        )
      },
      size: 120,
    }),
  ]

  const table = useReactTable({
    data: entries,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (isLoading)
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Loading shortlist…
      </p>
    )

  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No candidates shortlisted yet. Trigger a match above to populate this
        list.
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead
                  key={header.id}
                  style={{
                    width: header.column.getSize() || undefined,
                  }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className="h-10 cursor-pointer hover:bg-muted/30"
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
