'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

// ─── Create ───────────────────────────────────────────────────
export async function createFile(formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const fileName = (formData.get('file_name') as string)?.trim()
  const projectId = (formData.get('project_id') as string)?.trim()

  if (!fileName) return { error: 'File name is required.' }
  if (!projectId) return { error: 'Project is required.' }

  const provider = (formData.get('provider') as string) || 'manual'

  const payload = {
    file_name:              fileName,
    project_id:             projectId,
    task_id:                (formData.get('task_id') as string)?.trim() || null,
    deliverable_id:         (formData.get('deliverable_id') as string)?.trim() || null,
    file_category:          (formData.get('file_category') as string) || 'working_file',
    provider,
    manual_link:            (formData.get('manual_link') as string)?.trim() || null,
    external_file_id:       provider === 'google_drive' ? (formData.get('external_file_id') as string)?.trim() || null : null,
    google_web_view_link:   provider === 'google_drive' ? (formData.get('google_web_view_link') as string)?.trim() || null : null,
    mime_type:              (formData.get('mime_type') as string)?.trim() || null,
    extension:              (formData.get('extension') as string)?.trim() || null,
    revision_number:        parseInt((formData.get('revision_number') as string) || '', 10) || null,
    version_label:          (formData.get('version_label') as string)?.trim() || null,
    notes:                  (formData.get('notes') as string)?.trim() || null,
    uploaded_by_user_id:    user.id,
  }

  const { data, error } = await supabase
    .from('project_files')
    .insert(payload)
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/projects/${projectId}`)
  redirect(`/files/${data.id}`)
}

// ─── Update ───────────────────────────────────────────────────
export async function updateFile(id: string, formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const fileName = (formData.get('file_name') as string)?.trim()
  const projectId = (formData.get('project_id') as string)?.trim()

  if (!fileName) return { error: 'File name is required.' }
  if (!projectId) return { error: 'Project is required.' }

  const provider = (formData.get('provider') as string) || 'manual'

  const payload = {
    file_name:              fileName,
    project_id:             projectId,
    task_id:                (formData.get('task_id') as string)?.trim() || null,
    deliverable_id:         (formData.get('deliverable_id') as string)?.trim() || null,
    file_category:          (formData.get('file_category') as string) || 'working_file',
    provider,
    manual_link:            (formData.get('manual_link') as string)?.trim() || null,
    external_file_id:       provider === 'google_drive' ? (formData.get('external_file_id') as string)?.trim() || null : null,
    google_web_view_link:   provider === 'google_drive' ? (formData.get('google_web_view_link') as string)?.trim() || null : null,
    mime_type:              (formData.get('mime_type') as string)?.trim() || null,
    extension:              (formData.get('extension') as string)?.trim() || null,
    revision_number:        parseInt((formData.get('revision_number') as string) || '', 10) || null,
    version_label:          (formData.get('version_label') as string)?.trim() || null,
    notes:                  (formData.get('notes') as string)?.trim() || null,
  }

  const { error } = await supabase
    .from('project_files')
    .update(payload)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/files/${id}`)
  revalidatePath(`/projects/${projectId}`)
  redirect(`/files/${id}`)
}
