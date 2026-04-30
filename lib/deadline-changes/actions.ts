'use server'

import { createServerClient } from '@/lib/supabase/server'
import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'

export async function extendDeadline(
  entityType: 'project' | 'task',
  entityId: string,
  newDueDate: string,
  reason: string
) {
  const sp = await getSessionProfile()
  requireRole(sp.system_role, ['direktur', 'technical_director', 'finance', 'manajer'])

  const supabase = await createServerClient()

  // Get old due date
  const table = entityType === 'project' ? 'projects' : 'tasks'
  const dateField = entityType === 'project' ? 'target_due_date' : 'due_date'

  const { data: entity } = await supabase
    .from(table)
    .select(dateField)
    .eq('id', entityId)
    .single()

  const oldDate = entity?.[dateField as keyof typeof entity] ?? null

  // Log the change
  await supabase.from('deadline_changes').insert({
    entity_type: entityType,
    entity_id: entityId,
    old_due_date: oldDate,
    new_due_date: newDueDate,
    reason: reason || null,
    changed_by: sp.id,
  })

  // Update the actual deadline
  await supabase.from(table).update({ [dateField]: newDueDate }).eq('id', entityId)

  revalidatePath(`/${entityType === 'project' ? 'projects' : 'tasks'}/${entityId}`)
}

export async function getDeadlineHistory(entityType: 'project' | 'task', entityId: string) {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('deadline_changes')
    .select('*, profiles(full_name)')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('changed_at', { ascending: false })
  return data ?? []
}
