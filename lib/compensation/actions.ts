'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { loadMutationProfile, ensureCompensationOrPaymentMutation } from '@/lib/auth/mutation-policy'
import { buildCompensationPayload } from '@/lib/compensation/helpers'

export async function createCompensation(formData: FormData) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const perm = ensureCompensationOrPaymentMutation(profile)
  if (perm) return { error: perm }

  const payload = buildCompensationPayload(formData)
  if (!payload.member_id) return { error: 'Member is required.' }
  if (!payload.project_id) return { error: 'Project is required.' }
  if (!payload.rate_type) return { error: 'Rate type is required.' }

  const { data, error } = await supabase
    .from('compensation_records')
    .insert({ ...payload, created_by: user.id })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/compensation')
  redirect(`/compensation/${data.id}`)
}

export async function updateCompensation(id: string, formData: FormData) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const perm = ensureCompensationOrPaymentMutation(profile)
  if (perm) return { error: perm }

  const payload = buildCompensationPayload(formData)
  if (!payload.member_id) return { error: 'Member is required.' }
  if (!payload.project_id) return { error: 'Project is required.' }
  if (!payload.rate_type) return { error: 'Rate type is required.' }

  const { error } = await supabase
    .from('compensation_records')
    .update(payload)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/compensation')
  revalidatePath(`/compensation/${id}`)
  redirect(`/compensation/${id}`)
}

export async function deleteCompensation(id: string) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const perm = ensureCompensationOrPaymentMutation(profile)
  if (perm) return { error: perm }

  const { error } = await supabase
    .from('compensation_records')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/compensation')
  redirect('/compensation')
}
