import type { DeadlineBuckets } from '@/lib/dashboard/queries'
import { cn } from '@/lib/utils/cn'

function WeekRow({
  label,
  sub,
  tasks,
  projects,
  max,
  isUrgent,
}: {
  label:    string
  sub:      string
  tasks:    number
  projects: number
  max:      number
  isUrgent?: boolean
}) {
  const sum           = tasks + projects
  const trackWidthPct = max > 0 ? (sum / max) * 100 : 0
  const taskSeg       = sum > 0 ? (tasks    / sum) * 100 : 0
  const projSeg       = sum > 0 ? (projects / sum) * 100 : 0

  const taskFill = isUrgent ? 'var(--color-chart-5)' : 'var(--color-chart-1)'
  const projFill = isUrgent ? 'var(--color-chart-3)' : 'var(--color-chart-3)'

  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span
          className={cn(
            'text-[0.8125rem] font-semibold',
            isUrgent && sum > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-primary)]'
          )}
        >
          {label}
        </span>
        <span className="text-[0.6875rem] text-[var(--color-text-muted)]">{sub}</span>
      </div>

      {/* Bar track */}
      <div
        className={cn(
          'relative h-7 overflow-hidden rounded-[5px] border',
          sum === 0
            ? 'border-[var(--color-border)] bg-[var(--color-surface-subtle)]'
            : isUrgent
              ? 'border-[var(--color-danger)]/20 bg-[var(--color-danger-subtle)]/50'
              : 'border-[var(--color-border)] bg-[var(--color-surface-subtle)]'
        )}
      >
        {sum > 0 && (
          <div className="absolute inset-y-0 left-0 flex" style={{ width: `${trackWidthPct}%` }}>
            {tasks > 0 && (
              <div
                title={`Tasks: ${tasks}`}
                className="flex min-w-[4px] items-center justify-center text-[0.6875rem] font-bold text-[var(--color-text-inverse)]"
                style={{ width: `${taskSeg}%`, backgroundColor: taskFill }}
              >
                {taskSeg >= 20 ? tasks : ''}
              </div>
            )}
            {projects > 0 && (
              <div
                title={`Projects: ${projects}`}
                className={cn(
                  'flex min-w-[4px] items-center justify-center text-[0.6875rem] font-bold text-[var(--color-text-inverse)]',
                  tasks > 0 && 'border-l border-white/25'
                )}
                style={{ width: `${projSeg}%`, backgroundColor: projFill }}
              >
                {projSeg >= 20 ? projects : ''}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="mt-1.5 flex gap-3.5 text-[0.6875rem] text-[var(--color-text-muted)]">
        <span>
          Tasks{' '}
          <strong
            className={cn(
              'tabular-nums',
              isUrgent && tasks > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-secondary)]'
            )}
          >
            {tasks}
          </strong>
        </span>
        <span>
          Projects{' '}
          <strong className="tabular-nums text-[var(--color-text-secondary)]">
            {projects}
          </strong>
        </span>
        {sum > 0 && (
          <span
            className={cn(
              'ml-auto font-semibold tabular-nums',
              isUrgent ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-secondary)]'
            )}
          >
            {sum} total
          </span>
        )}
      </div>
    </div>
  )
}

export function DeadlineBucketsChart({ buckets }: { buckets: DeadlineBuckets }) {
  const w1  = buckets.week1.tasks + buckets.week1.projects
  const w2  = buckets.week2.tasks + buckets.week2.projects
  const max = Math.max(w1, w2, 1)

  if (w1 + w2 === 0) {
    // Preserve the two-week rhythm at zero — reuse WeekRow with empty tracks
    // so the card reads as a designed schedule view, not a blank panel.
    return (
      <div>
        <WeekRow label="This week" sub="Next 0–7 days" tasks={0} projects={0} max={1} />
        <WeekRow label="Next week" sub="Days 8–14"     tasks={0} projects={0} max={1} />

        <div className="mt-1 flex items-center gap-2 border-t border-[var(--color-border)] pt-2.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
          <span className="text-[0.75rem] leading-snug text-[var(--color-text-secondary)]">
            Two-week window clear. New due dates will populate these rows as work is scheduled.
          </span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <WeekRow label="This week"  sub="Next 0–7 days" tasks={buckets.week1.tasks} projects={buckets.week1.projects} max={max} isUrgent={w1 > 0} />
      <WeekRow label="Next week"  sub="Days 8–14"     tasks={buckets.week2.tasks} projects={buckets.week2.projects} max={max} isUrgent={false} />

      {/* Legend */}
      <div className="mt-1 flex gap-3.5 border-t border-[var(--color-border)] pt-2 text-[0.6875rem] text-[var(--color-text-muted)]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[var(--color-chart-1)]" />
          Tasks
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[var(--color-chart-3)]" />
          Projects
        </span>
      </div>
    </div>
  )
}
