'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { BurndownPoint } from '@/lib/projects/burndown-queries'
import { formatDate } from '@/lib/utils/formatters'

interface BurndownChartProps {
  data: BurndownPoint[]
  totalTasks: number
}

export function BurndownChart({ data, totalTasks }: BurndownChartProps) {
  if (data.length === 0) {
    return (
      <div className="py-10 text-center text-[0.875rem] text-[var(--color-text-muted)]">
        Belum ada data untuk burndown chart. Pastikan project punya tanggal mulai dan target selesai, serta ada task
        aktif.
      </div>
    )
  }

  return (
    <div>
      <p className="mb-2 text-[0.8125rem] text-[var(--color-text-muted)]">Total task (non-cancelled): {totalTasks}</p>
      <div className="h-[300px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="date"
              tickFormatter={(val) => formatDate(String(val))}
              tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
            />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} domain={[0, totalTasks]} allowDecimals={false} />
            <Tooltip
              labelFormatter={(val) => formatDate(String(val))}
              contentStyle={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                fontSize: '0.8125rem',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '0.8125rem' }} />
            <Line
              type="monotone"
              dataKey="remaining"
              stroke="var(--color-primary)"
              strokeWidth={2}
              dot={false}
              name="Task tersisa"
            />
            <Line
              type="monotone"
              dataKey="ideal"
              stroke="var(--color-text-muted)"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              name="Ideal"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
