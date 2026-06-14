'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@brynzit/ui/components/ui/table'

export function AdminCostsTab() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('month')

  const { data } = useQuery({
    queryKey: ['monitoring-cost', period],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/monitoring/cost', {
        params: { query: { period } },
      })
      if (error) throw error
      return data
    },
    staleTime: 60000,
  })

  // Compute total from rows (CostResponse has no total_usd field)
  const totalUsd = data?.rows.reduce((sum, row) => sum + row.total_usd, 0) ?? 0
  const rows = data?.rows ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 mb-2">
        <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This week</SelectItem>
            <SelectItem value="month">This month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No cost data for this period.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Task Type</TableHead>
                <TableHead className="text-right w-[80px]">Calls</TableHead>
                <TableHead className="text-right w-[120px]">Total Cost (USD)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm">{row.domain}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{row.model_used}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{row.task_type}</TableCell>
                  <TableCell className="text-sm text-right">{row.call_count}</TableCell>
                  <TableCell className="text-sm font-semibold text-right">
                    ${row.total_usd.toFixed(4)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="border-t border-border">
                <TableCell colSpan={4} className="text-sm font-semibold">
                  Total
                </TableCell>
                <TableCell className="text-sm font-semibold text-right">
                  ${totalUsd.toFixed(4)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  )
}
