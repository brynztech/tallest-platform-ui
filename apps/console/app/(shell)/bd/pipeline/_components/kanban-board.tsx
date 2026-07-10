'use client'

import { useEffect, useRef, useState } from 'react'
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core'
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
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
import { toast } from 'sonner'

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

type PipelineMoveAction = 'approve' | 'move_to_review'

const PIPELINE_STATUS_LABELS: Record<string, string> = {
  discovered: 'Discovered',
  icp_scored: 'ICP Scored',
  review_queue: 'In Review',
  outreach_approved: 'Outreach Approved',
  outreach_generation: 'Generating Outreach',
  outreach_review: 'Outreach Review',
  outreach_sent: 'Outreach Sent',
  interested: 'Replied',
  converted: 'Converted',
  failed: 'Failed',
}

function icpBadgeClass(score: number | null): string {
  if (score === null) return 'bg-muted text-muted-foreground'
  if (score >= 80) return 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
  if (score >= 60) return 'bg-[oklch(0.76_0.16_82)] text-black'
  return 'bg-muted text-muted-foreground'
}

interface KanbanCardProps {
  lead: KanbanLeadItem
}

function KanbanCard({ lead }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn(
        'flex h-14 cursor-grab items-center gap-2 rounded-xl border border-border/70 bg-card/80 px-3 shadow-sm shadow-black/10 transition-[border-color,background-color,box-shadow,transform,opacity] hover:-translate-y-px hover:border-primary/25 hover:bg-card hover:shadow-lg hover:shadow-black/15 active:cursor-grabbing',
        isDragging && 'opacity-40',
      )}
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

function KanbanCardDragOverlay({ lead }: KanbanCardProps) {
  return (
    <div className="flex h-14 cursor-grabbing items-center gap-2 rounded-xl border border-primary/30 bg-card px-3 shadow-xl shadow-black/20 ring-1 ring-primary/20">
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
  const { setNodeRef, isOver } = useDroppable({ id: column.status })

  return (
    <div className="flex min-w-[260px] flex-col gap-2">
      <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-background/25 px-3 py-2">
        <span className="text-sm font-semibold">
          {PIPELINE_STATUS_LABELS[column.status] ?? column.status}
        </span>
        <Badge variant="secondary" className="border-border/60 bg-secondary/70 text-xs text-muted-foreground">
          {leads.length}
        </Badge>
      </div>
      <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            'flex min-h-[60px] flex-col gap-1.5 rounded-xl border border-transparent p-1 transition-colors',
            isOver && 'border-primary/40 bg-primary/5',
          )}
        >
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
  isMoving?: boolean
  onMoveLead?: (leadId: string, action: PipelineMoveAction) => void
}

const SUPPORTED_MOVES: Record<string, Partial<Record<string, PipelineMoveAction>>> = {
  review_queue: {
    outreach_approved: 'approve',
  },
  suppressed: {
    review_queue: 'move_to_review',
  },
}

export function KanbanBoard({ columns: initialColumns, isMoving = false, onMoveLead }: KanbanBoardProps) {
  // Local state for visual-only reordering — no API persistence (visual drag only)
  const [columns, setColumns] = useState<Record<string, KanbanLeadItem[]>>(
    Object.fromEntries(initialColumns.map((col) => [col.status, col.leads])),
  )

  // Track the active (dragged) lead so DragOverlay can render it
  const [activeLead, setActiveLead] = useState<KanbanLeadItem | null>(null)

  // Track whether a drag is in progress so we don't clobber an in-flight drag
  // with a background refetch from PipelinePage's 15-second polling interval.
  const isDraggingRef = useRef(false)

  // Sync local state when the parent delivers fresh polling data.
  // useState's initialiser only runs on mount, so without this effect the
  // board ignores all subsequent prop updates and polling is effectively useless.
  useEffect(() => {
    if (!isDraggingRef.current) {
      setColumns(Object.fromEntries(initialColumns.map((col) => [col.status, col.leads])))
    }
  }, [initialColumns])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require 8px of movement before a drag starts — prevents accidental
      // drags when the user just wants to click a card.
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function findLeadById(id: string): KanbanLeadItem | undefined {
    for (const leads of Object.values(columns)) {
      const found = leads.find((l) => l.id === id)
      if (found) return found
    }
    return undefined
  }

  function findTargetStatus(overId: string) {
    if (Object.prototype.hasOwnProperty.call(columns, overId)) {
      return overId
    }
    return Object.entries(columns).find(([, leads]) => leads.some((l) => l.id === overId))?.[0] ?? null
  }

  function handleDragStart(event: DragStartEvent) {
    isDraggingRef.current = true
    const lead = findLeadById(String(event.active.id))
    setActiveLead(lead ?? null)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const sourceStatus = findTargetStatus(String(active.id))
    const targetStatus = findTargetStatus(String(over.id))

    if (!sourceStatus || !targetStatus || sourceStatus === targetStatus) return

    // Move the card into the target column visually during drag
    setColumns((prev) => {
      const lead = (prev[sourceStatus] ?? []).find((l) => l.id === active.id)
      if (!lead) return prev

      const overIndex = (prev[targetStatus] ?? []).findIndex((l) => l.id === over.id)
      const insertAt = overIndex >= 0 ? overIndex : (prev[targetStatus] ?? []).length

      const newTarget = [...(prev[targetStatus] ?? [])]
      newTarget.splice(insertAt, 0, lead)

      return {
        ...prev,
        [sourceStatus]: (prev[sourceStatus] ?? []).filter((l) => l.id !== active.id),
        [targetStatus]: newTarget,
      }
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    isDraggingRef.current = false
    setActiveLead(null)

    if (!over || active.id === over.id) return

    const sourceStatus = findTargetStatus(String(active.id))
    const targetStatus = findTargetStatus(String(over.id))

    if (!sourceStatus || !targetStatus) return

    if (targetStatus !== sourceStatus) {
      // Cross-column move — check API support
      const action = SUPPORTED_MOVES[sourceStatus]?.[targetStatus]
      if (!action || !onMoveLead) {
        toast.info('That pipeline move is not supported from this board yet.')
        // Revert optimistic update from onDragOver
        setColumns(Object.fromEntries(initialColumns.map((col) => [col.status, col.leads])))
        return
      }
      onMoveLead(String(active.id), action)
      return
    }

    // Same-column reorder — visual only, no API call
    const colLeads = columns[sourceStatus] ?? []
    const oldIndex = colLeads.findIndex((l) => l.id === active.id)
    const newIndex = colLeads.findIndex((l) => l.id === over.id)

    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return

    setColumns((prev) => ({
      ...prev,
      [sourceStatus]: arrayMove(colLeads, oldIndex, newIndex),
    }))
  }

  function handleDragCancel() {
    isDraggingRef.current = false
    setActiveLead(null)
    // Revert any optimistic updates from onDragOver
    setColumns(Object.fromEntries(initialColumns.map((col) => [col.status, col.leads])))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={!isMoving ? handleDragOver : undefined}
      onDragEnd={!isMoving ? handleDragEnd : handleDragCancel}
      onDragCancel={handleDragCancel}
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
      <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
        {activeLead ? <KanbanCardDragOverlay lead={activeLead} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
