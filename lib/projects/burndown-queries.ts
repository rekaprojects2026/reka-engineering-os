import { createServerClient } from '@/lib/supabase/server'

export type BurndownPoint = {
  date: string
  remaining: number
  ideal: number
}

type TaskRow = {
  id: string
  status: string
  updated_at: string | null
}

/**
 * Burndown: remaining = tasks not yet "done" by each calendar day (by `updated_at` date when status became done).
 * Ideal line is linear from total to 0 across [startDate, endDate].
 */
export async function getProjectBurndown(
  projectId: string,
  startDate: string,
  endDate: string,
): Promise<{ points: BurndownPoint[]; totalTasks: number }> {
  const supabase = await createServerClient()

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('id, status, updated_at')
    .eq('project_id', projectId)

  if (error) throw error
  const list = (tasks ?? []) as TaskRow[]
  const active = list.filter((t) => t.status !== 'cancelled')
  const total = active.length
  if (total === 0) return { points: [], totalTasks: 0 }

  const start = new Date(`${startDate}T12:00:00`)
  const end = new Date(`${endDate}T12:00:00`)
  const msPerDay = 86_400_000
  const rawDays = Math.ceil((end.getTime() - start.getTime()) / msPerDay)
  const totalDays = Math.max(1, rawDays)

  const today = new Date()
  today.setHours(23, 59, 59, 999)
  const limit = today < end ? today : end

  const points: BurndownPoint[] = []

  for (let i = 0; i <= totalDays; i += 1) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    if (d > limit) break

    const dateStr = d.toISOString().split('T')[0] ?? ''

    const doneBefore = active.filter((t) => {
      if (t.status !== 'done' || !t.updated_at) return false
      const doneDay = t.updated_at.split('T')[0]
      return doneDay <= dateStr
    }).length

    const remaining = total - doneBefore
    const ideal = Math.round(total - (total * (i / totalDays)))
    points.push({ date: dateStr, remaining, ideal })
  }

  return { points, totalTasks: total }
}
