'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import type { WorkloadUser } from '@/lib/dashboard/queries'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

const CHART_CONFIG: ChartConfig = {
  openTasks:    { label: 'Open',    color: 'var(--color-chart-1)' },
  overdueTasks: { label: 'Overdue', color: 'var(--color-chart-5)' },
}

function firstName(full: string): string {
  const parts = full.trim().split(/\s+/)
  return parts[0] ?? full
}

export function WorkloadBars({ users }: { users: WorkloadUser[] }) {
  if (users.length === 0) {
    // Ghost-bars composition: keeps the bar-chart silhouette so the panel
    // reads as a workload view at rest, not a blank rectangle.
    const GHOST_HEIGHTS = [40, 62, 54, 78, 46, 70, 58]
    return (
      <div>
        <div
          aria-hidden="true"
          className="flex h-[140px] items-end gap-3 border-b border-dashed border-[var(--color-border)] px-1 pb-1"
        >
          {GHOST_HEIGHTS.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-[3px] bg-[var(--color-surface-muted)]"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>

        <div className="mt-4 flex items-start gap-2.5">
          <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]/60" />
          <div className="min-w-0">
            <p className="text-[0.8125rem] font-semibold text-[var(--color-text-primary)]">
              No open assignments
            </p>
            <p className="mt-0.5 text-[0.75rem] leading-snug text-[var(--color-text-muted)]">
              Task load per person will populate here as work is assigned. Overloaded names will surface to the top.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const data = users.slice(0, 10).map((u) => ({
    id:           u.id,
    name:         firstName(u.full_name),
    full_name:    u.full_name,
    openTasks:    u.openTasks,
    overdueTasks: u.overdueTasks,
    label:        u.label,
  }))

  const atRisk = users.filter((u) => u.label === 'Overloaded' || u.label === 'High')

  return (
    <div>
      <ChartContainer config={CHART_CONFIG} className="h-[220px] w-full">
        <BarChart data={data} barGap={4} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
          <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="var(--color-border)" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
            tickLine={false}
            axisLine={false}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={28}
          />
          <ChartTooltip
            cursor={{ fill: 'var(--color-surface-muted)', opacity: 0.5 }}
            content={<ChartTooltipContent indicator="dot" />}
          />
          <Bar dataKey="openTasks"    fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} barSize={16} />
          <Bar dataKey="overdueTasks" fill="var(--color-chart-5)" radius={[4, 4, 0, 0]} barSize={16} />
        </BarChart>
      </ChartContainer>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-[var(--color-border)] pt-3 text-[0.75rem] text-[var(--color-text-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-[2px] bg-[var(--color-chart-1)]" />
          Open tasks
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-[2px] bg-[var(--color-chart-5)]" />
          Overdue
        </span>
        {atRisk.length > 0 && (
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[var(--color-danger-subtle)] px-2.5 py-1 text-[0.6875rem] font-semibold text-[var(--color-danger)]">
            {atRisk.length} at risk
          </span>
        )}
      </div>
    </div>
  )
}
