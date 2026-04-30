// Pure tree helpers + shared list row type (no server imports — safe for Client Components)
import type { Task } from '@/types/database'

export type TaskWithRelations = Task & {
  projects: { id: string; name: string; project_code: string } | null
  assignee: { id: string; full_name: string } | null
  reviewer: { id: string; full_name: string } | null
}

export type TaskNode = TaskWithRelations & { children: TaskNode[] }

function compareSiblings(a: TaskWithRelations, b: TaskWithRelations): number {
  const oa = a.sort_order ?? 0
  const ob = b.sort_order ?? 0
  if (oa !== ob) return oa - ob
  return b.created_at.localeCompare(a.created_at)
}

/**
 * Build a nested task tree: roots have parent_task_id null (or missing parent in set),
 * each level ordered by sort_order then created_at.
 */
export function buildTaskTree(tasks: TaskWithRelations[]): TaskNode[] {
  const nodes = new Map<string, TaskNode>()

  for (const t of tasks) {
    nodes.set(t.id, { ...t, children: [] })
  }

  const roots: TaskNode[] = []

  for (const t of tasks) {
    const node = nodes.get(t.id)
    if (!node) continue

    const parentId = t.parent_task_id
    if (parentId && nodes.has(parentId)) {
      nodes.get(parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const sortRec = (list: TaskNode[]) => {
    list.sort(compareSiblings)
    for (const n of list) sortRec(n.children)
  }
  sortRec(roots)
  return roots
}
