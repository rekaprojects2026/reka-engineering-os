'use client'

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'

import type { OpenTaskStatusCounts, TaskPipelineStatus } from '@/lib/dashboard/queries'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

const ORDER: TaskPipelineStatus[] = ['to_do', 'in_progress', 'review', 'revision', 'blocked']

const LABELS: Record<TaskPipelineStatus, string> = {
  to_do:       'To do',
  in_progress: 'In progress',
  review:      'Review',
  revision:    'Revision',
  blocked:     'Blocked',
}

const FILL: Record<TaskPipelineStatus, string> = {
  to_do:       'var(--color-chart-4)',
  in_progress: 'var(--color-chart-1)',
  review:      'var(--color-chart-3)',
  revision:    'var(--color-chart-5)',
  blocked:     'var(--color-chart-5)',
}

const CHART_CONFIG: ChartConfig = {
  count:       { label: 'Tasks' },
  to_do:       { label: LABELS.to_do,       color: 'var(--color-chart-4)' },
  in_progress: { label: LABELS.in_progress, color: 'var(--color-chart-1)' },
  review:      { label: LABELS.review,      color: 'var(--color-chart-3)' },
  revision:    { label: LABELS.revision,    color: 'var(--color-chart-5)' },
  blocked:     { label: LABELS.blocked,     color: 'var(--color-chart-5)' },
}

export function TaskStatusBarChart({ counts }: { counts: OpenTaskStatusCounts }) {
  const total = ORDER.reduce((s, k) => s + (counts[k] ?? 0), 0)

  if (total === 0) {
    // Preserve the five-row pipeline rhythm at zero counts so the panel
    // still reads as an operational health snapshot, not a blank box.
    return (
      <div>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {ORDER.map((key) => (
            <li key={key} className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: FILL[key], opacity: 0.35 }}
              />
              <span className="w-24 shrink-0 text-[0.75rem] font-medium text-[var(--color-text-secondary)]">
                {LABELS[key]}
              </span>
              <span className="h-1.5 flex-1 rounded-full bg-[var(--color-surface-muted)]" />
              <span className="w-6 text-right text-[0.75rem] font-semibold tabular-nums text-[var(--color-text-muted)]/60">
                0
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border)] pt-3">
          <span className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
            Total open tasks
          </span>
          <span className="text-[0.9375rem] font-semibold tabular-nums text-[var(--color-text-muted)]">
            0
          </span>
        </div>
      </div>
    )
  }

  const data = ORDER.map((key) => ({
    key,
    status: LABELS[key],
    count:  counts[key] ?? 0,
    fill:   FILL[key],
  }))

  return (
    <div>
      <ChartContainer config={CHART_CONFIG} className="h-[220px] w-full">
        <BarChart data={data} layout="vertical" barSize={16} margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
          <CartesianGrid strokeDasharray="2 4" horizontal={false} stroke="var(--color-border)" />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="status"
            tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
            tickLine={false}
            axisLine={false}
            width={90}
          />
          <ChartTooltip cursor={{ fill: 'var(--color-surface-muted)', opacity: 0.5 }} content={<ChartTooltipContent hideLabel />} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((entry) => (
              <Cell key={entry.key} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>

      <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border)] pt-3">
        <span className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
          Total open tasks
        </span>
        <span className="text-[0.9375rem] font-semibold tabular-nums text-[var(--color-text-primary)]">
          {total}
        </span>
      </div>
    </div>
  )
}
