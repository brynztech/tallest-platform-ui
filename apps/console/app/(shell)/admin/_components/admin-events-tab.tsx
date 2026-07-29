'use client'

import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Button } from '@brynzit/ui/components/ui/button'
import { Input } from '@brynzit/ui/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@brynzit/ui/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@brynzit/ui/components/ui/table'

type AgentEventOut = components['schemas']['AgentEventOut']

const LIMIT = 25

const DOMAIN_OPTIONS = [
  'bd',
  'ops',
  'supply',
  'admin',
  'monitoring',
]

// Stable reference reused as the useQuery fallback below. A bare empty-array
// literal used directly as that fallback would look identical but is NOT the
// same fix: such a literal in a default parameter is re-created on every
// render, and TanStack Table's own FAQ documents exactly this — an unstable
// `data` reference makes it detect a "changed" table on every render, request
// another update to recompute the row model, and re-render forever. Because
// that render loop reschedules itself via microtasks, it starves the
// macrotask queue, so nothing that queues as a macrotask (the in-flight
// fetch's own response handler, CDP input dispatch, even trivial JS
// evaluation) ever gets a turn — which is why clicking the Events tab froze
// the whole page rather than just re-rendering slowly. Reusing one array
// skips the update the moment the query resolves, since `events` then stops
// changing identity every render.
const EMPTY_EVENTS: AgentEventOut[] = []

const columnHelper = createColumnHelper<AgentEventOut>()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const columns: any[] = [
  columnHelper.accessor('created_at', {
    header: 'Timestamp',
    cell: (info) => (
      <span className="text-xs text-muted-foreground">
        {new Date(info.getValue() as string).toLocaleString()}
      </span>
    ),
    size: 140,
  }),
  columnHelper.accessor('domain', {
    header: 'Domain',
    cell: (info) => (
      <span className="text-sm">{info.getValue()}</span>
    ),
    size: 100,
  }),
  columnHelper.accessor('agent_type', {
    header: 'Agent Type',
    cell: (info) => (
      <span className="text-sm text-muted-foreground">{info.getValue()}</span>
    ),
    size: 120,
  }),
  columnHelper.accessor('task_type', {
    header: 'Task Type',
    cell: (info) => (
      <span className="text-sm">{info.getValue()}</span>
    ),
    size: 140,
  }),
  columnHelper.accessor('model_used', {
    header: 'Model',
    cell: (info) => (
      <span className="text-xs text-muted-foreground">{info.getValue()}</span>
    ),
    size: 120,
  }),
  columnHelper.display({
    id: 'tokens',
    header: 'Tokens',
    cell: (info) => (
      <span className="text-xs text-muted-foreground text-right block">
        {info.row.original.input_tokens} / {info.row.original.output_tokens}
      </span>
    ),
    size: 100,
  }),
  columnHelper.accessor('cost_usd', {
    header: 'Cost',
    cell: (info) => (
      <span className="text-sm text-right block">
        ${(info.getValue() as number).toFixed(4)}
      </span>
    ),
    size: 80,
  }),
  columnHelper.accessor('duration_ms', {
    header: 'Duration',
    cell: (info) => (
      <span className="text-xs text-muted-foreground text-right block">
        {info.getValue()}ms
      </span>
    ),
    size: 80,
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    size: 120,
    cell: (info) => {
      const status = info.getValue() as string
      if (status === 'success')
        return <span className="text-xs text-[oklch(0.45_0.15_145)]">success</span>
      if (status === 'error')
        return <Badge variant="destructive" className="text-xs">error</Badge>
      if (status === 'quota_exhausted')
        return (
          <Badge
            variant="outline"
            className="text-xs border-[oklch(0.769_0.188_85.87)] text-[oklch(0.769_0.188_85.87)]"
          >
            quota_exhausted
          </Badge>
        )
      return <span className="text-xs text-muted-foreground">{status}</span>
    },
  }),
]

export function AdminEventsTab() {
  const [offset, setOffset] = useState(0)
  const [liveFilters, setLiveFilters] = useState({
    domain: '',
    status: '',
    taskType: '',
  })
  const [appliedServerFilters, setAppliedServerFilters] = useState({
    domain: '',
    status: '',
  })
  const [taskTypeFilter, setTaskTypeFilter] = useState('')

  const { data: events = EMPTY_EVENTS } = useQuery({
    queryKey: ['monitoring-events', appliedServerFilters, offset],
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        '/api/v1/monitoring/agent-events',
        {
          params: {
            query: {
              domain: appliedServerFilters.domain || undefined,
              status: appliedServerFilters.status || undefined,
              limit: LIMIT,
              offset,
            },
          },
        },
      )
      if (error) throw error
      return data as AgentEventOut[]
    },
    staleTime: 60000,
  })

  // task_type is client-side ONLY — /monitoring/agent-events has no task_type param.
  // Memoized for the same reason `events` needs a stable empty-array fallback
  // above: `.filter()` allocates a new array every render, and feeding
  // useReactTable an unstable `data` reference is what caused the freeze this
  // component is now guarded against. Recomputes only when its actual inputs
  // change, not on every render.
  const displayedEvents = useMemo(
    () =>
      taskTypeFilter
        ? events.filter((e) =>
            e.task_type?.toLowerCase().includes(taskTypeFilter.toLowerCase()),
          )
        : events,
    [events, taskTypeFilter],
  )

  function handleApplyFilters() {
    setAppliedServerFilters({
      domain: liveFilters.domain,
      status: liveFilters.status,
    })
    setTaskTypeFilter(liveFilters.taskType)
    setOffset(0)
  }

  const table = useReactTable({
    data: displayedEvents,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="flex flex-col gap-4">
      {/* Filter row */}
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <Select
          value={liveFilters.domain}
          onValueChange={(v) =>
            setLiveFilters((prev) => ({ ...prev, domain: v === '_all' ? '' : v }))
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All domains" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All domains</SelectItem>
            {DOMAIN_OPTIONS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          className="w-[200px]"
          placeholder="Filter by task type"
          value={liveFilters.taskType}
          onChange={(e) =>
            setLiveFilters((prev) => ({ ...prev, taskType: e.target.value }))
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleApplyFilters()
          }}
        />

        <Select
          value={liveFilters.status}
          onValueChange={(v) =>
            setLiveFilters((prev) => ({ ...prev, status: v === '_all' ? '' : v }))
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All statuses</SelectItem>
            <SelectItem value="success">success</SelectItem>
            <SelectItem value="error">error</SelectItem>
            <SelectItem value="quota_exhausted">quota_exhausted</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={handleApplyFilters}>
          Apply
        </Button>
      </div>

      {/* Events table */}
      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.column.getSize() || undefined }}
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
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No agent events found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="h-10">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination row */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Showing {offset + 1}–{offset + displayedEvents.length}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0}
            onClick={() => setOffset((o) => Math.max(0, o - LIMIT))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={events.length < LIMIT}
            onClick={() => setOffset((o) => o + LIMIT)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
