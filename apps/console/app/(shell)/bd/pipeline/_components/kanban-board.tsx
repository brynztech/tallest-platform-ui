'use client'

import { useEffect, useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
// IMPORTANT: Import from '@dnd-kit/sortable' — NOT '@dnd-kit/react/sortable'
// @dnd-kit/react is the 0.5.x pre-release rewrite; use stable v6 + v7 sortable API
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { cn } from '@brynzit/ui/lib/utils'

type KanbanLeadItem = {
  id: string
  company_name: string | null
  icp_score: number | null
  canonical_domain: string | null
}

type KanbanColumn = {
  status: string
  count: number
  leads: KanbanLeadItem[]
}

const PIPELINE_STATUS_LABELS: Record<string, string> = {
  discovered: 'Discovered',
  icp_scored: 'ICP Scored',
  review_queue: 'In Review',
  outreach_approved: 'Outreach Approved',
  outreach_sent: 'Outreach Sent',
  interested: 'Replied',
  converted: 'Converted',
}

function icpBadgeClass(score: number | null): string {
  if (score === null) return 'bg-muted text-muted-foreground'
  if (score >= 80) return 'bg-primary text-primary-foreground'
  if (score >= 60) return 'bg-[oklch(0.769_0.188_85.87)] text-black'
  return 'bg-muted text-muted-foreground'
}

interface KanbanCardProps {
  lead: KanbanLeadItem
}

function KanbanCard({ lead }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: lead.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className="flex h-14 cursor-grab items-center gap-2 rounded-lg border border-border bg-card px-3 active:cursor-grabbing"
    >
      <Badge className={cn('shrink-0 px-2 py-0.5 text-xs', icpBadgeClass(lead.icp_score))}>
        {lead.icp_score ?? '—'}
      </Badge>
      <span className="flex-1 truncate text-sm font-semibold">
        {lead.company_name ?? 'Unknown'}
      </span>
    </div>
  )
}

interface KanbanColumnProps {
  column: KanbanColumn
  leads: KanbanLeadItem[]
}

function KanbanColumnComponent({ column, leads }: KanbanColumnProps) {
  const leadIds = leads.map((l) => l.id)

  return (
    <div className="flex min-w-[260px] flex-col gap-2">
      <div className="flex items-center gap-2 py-1">
        <span className="text-sm font-semibold">
          {PIPELINE_STATUS_LABELS[column.status] ?? column.status}
        </span>
        <Badge variant="secondary" className="text-xs text-muted-foreground">
          {column.count}
        </Badge>
      </div>
      <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-[60px] flex-col gap-1.5">
          {leads.map((lead) => (
            <KanbanCard key={lead.id} lead={lead} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

export interface KanbanBoardProps {
  columns: KanbanColumn[]
}

export function KanbanBoard({ columns: initialColumns }: KanbanBoardProps) {
  // Local state for visual-only reordering — no API persistence (visual drag only)
  const [columns, setColumns] = useState<Record<string, KanbanLeadItem[]>>(
    Object.fromEntries(initialColumns.map((col) => [col.status, col.leads])),
  )

  // Track whether a drag is in progress so we don't clobber an in-flight drag
  // with a background refetch from PipelinePage's 15-second polling interval.
  const [isDragging, setIsDragging] = useState(false)

  // Sync local state when the parent delivers fresh polling data.
  // useState's initialiser only runs on mount, so without this effect the
  // board ignores all subsequent prop updates and polling is effectively useless.
  useEffect(() => {
    if (!isDragging) {
      setColumns(Object.fromEntries(initialColumns.map((col) => [col.status, col.leads])))
    }
  }, [initialColumns, isDragging])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    // Find which column contains the dragged item
    const sourceEntry = Object.entries(columns).find(([, leads]) =>
      leads.some((l) => l.id === active.id),
    )
    if (!sourceEntry) return

    const [colStatus, colLeads] = sourceEntry
    const oldIndex = colLeads.findIndex((l) => l.id === active.id)
    const newIndex = colLeads.findIndex((l) => l.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    // Visual-only reorder — no API call fired
    setColumns((prev) => ({
      ...prev,
      [colStatus]: arrayMove(colLeads, oldIndex, newIndex),
    }))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(event) => { setIsDragging(false); handleDragEnd(event) }}
      onDragCancel={() => setIsDragging(false)}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {initialColumns.map((col) => (
          <KanbanColumnComponent
            key={col.status}
            column={col}
            leads={columns[col.status] ?? col.leads}
          />
        ))}
      </div>
    </DndContext>
  )
}
