'use client'

import { useEffect, useRef } from 'react'
import Gantt from 'frappe-gantt'

/** Row shape expected by frappe-gantt (see library defaults). */
export type GanttTask = {
  id: string
  name: string
  start: string
  end: string
  progress: number
  dependencies?: string
  custom_class?: string
}

interface GanttChartProps {
  tasks: GanttTask[]
  viewMode?: 'Day' | 'Week' | 'Month'
  onTaskClick?: (task: GanttTask) => void
  onDateChange?: (task: GanttTask, start: Date, end: Date) => void
}

export function GanttChart({
  tasks,
  viewMode = 'Week',
  onTaskClick,
  onDateChange,
}: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const ganttRef = useRef<Gantt | null>(null)
  const onTaskClickRef = useRef(onTaskClick)
  const onDateChangeRef = useRef(onDateChange)

  onTaskClickRef.current = onTaskClick
  onDateChangeRef.current = onDateChange

  useEffect(() => {
    if (!containerRef.current || tasks.length === 0) return

    ganttRef.current?.clear()
    containerRef.current.innerHTML = ''

    ganttRef.current = new Gantt(containerRef.current, tasks as ConstructorParameters<typeof Gantt>[1], {
      view_mode: viewMode,
      date_format: 'YYYY-MM-DD',
      readonly_dates: true,
      readonly_progress: true,
      on_click: (task) => {
        onTaskClickRef.current?.(task as GanttTask)
      },
      on_date_change: (task, start, end) => {
        onDateChangeRef.current?.(task as GanttTask, start, end)
      },
    })

    return () => {
      ganttRef.current?.clear()
      ganttRef.current = null
      if (containerRef.current) containerRef.current.innerHTML = ''
    }
  }, [tasks, viewMode])

  if (tasks.length === 0) {
    return (
      <div
        className="py-10 text-center text-[0.875rem] text-[var(--color-text-muted)]"
      >
        Belum ada task dengan tanggal mulai dan selesai. Tambahkan due date di task untuk melihat timeline.
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="gantt-os-root w-full overflow-x-auto"
    />
  )
}
