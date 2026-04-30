'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GanttChart, type GanttTask } from '@/components/shared/GanttChart'
import type { TaskWithRelations } from '@/lib/tasks/task-tree'
import { Button } from '@/components/ui/button'

const STATUS_PROGRESS: Record<string, number> = {
  to_do: 0,
  in_progress: 25,
  review: 75,
  revision: 50,
  blocked: 10,
  done: 100,
  cancelled: 0,
}

interface ProjectGanttProps {
  tasks: TaskWithRelations[]
  projectId: string
}

export function ProjectGantt({ tasks, projectId }: ProjectGanttProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'Day' | 'Week' | 'Month'>('Week')

  const ganttTasks: GanttTask[] = useMemo(() => {
    return tasks
      .filter((t) => t.due_date && t.status !== 'cancelled')
      .map((t) => {
        const startRaw = t.start_date ?? t.created_at.split('T')[0] ?? ''
        const endRaw = t.due_date ?? ''
        const classes: string[] = []
        if (t.is_problematic) classes.push('task-problematic')
        if (t.status === 'done') classes.push('task-done')
        return {
          id: t.id,
          name: t.title,
          start: startRaw,
          end: endRaw,
          progress: STATUS_PROGRESS[t.status] ?? 0,
          custom_class: classes.join(' ') || undefined,
        }
      })
  }, [tasks])

  return (
    <div data-project-id={projectId}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(['Day', 'Week', 'Month'] as const).map((mode) => (
          <Button
            key={mode}
            type="button"
            variant={viewMode === mode ? 'default' : 'outline'}
            size="sm"
            className="h-8"
            onClick={() => setViewMode(mode)}
          >
            {mode}
          </Button>
        ))}
        <span className="ml-auto text-[0.75rem] text-[var(--color-text-muted)]">
          {ganttTasks.length} task dengan timeline
        </span>
      </div>

      <GanttChart
        tasks={ganttTasks}
        viewMode={viewMode}
        onTaskClick={(task) => {
          router.push(`/tasks/${task.id}`)
        }}
      />

      {tasks.filter((t) => t.status !== 'cancelled').length > ganttTasks.length && (
        <p className="mt-3 text-[0.75rem] text-[var(--color-text-muted)]">
          {tasks.filter((t) => t.status !== 'cancelled').length - ganttTasks.length} task tidak ditampilkan karena belum
          punya due date.
        </p>
      )}
    </div>
  )
}
