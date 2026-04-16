'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { loadMutationProfile, ensureClientMutation } from '@/lib/auth/mutation-policy'

// ─── Create ───────────────────────────────────────────────────
export async function createClient(formData: FormData) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const perm = ensureClientMutation(profile)
  if (perm) return { error: perm }

  const payload = {
    client_name:           (formData.get('client_name') as string).trim(),
    client_type:           formData.get('client_type') as string,
    source_default:        formData.get('source_default') as string,
    status:                formData.get('status') as string || 'lead',
    company_name:          (formData.get('company_name') as string)?.trim() || null,
    primary_contact_name:  (formData.get('primary_contact_name') as string)?.trim() || null,
    primary_contact_email: (formData.get('primary_contact_email') as string)?.trim() || null,
    primary_contact_phone: (formData.get('primary_contact_phone') as string)?.trim() || null,
    notes:                 (formData.get('notes') as string)?.trim() || null,
    created_by:            user.id,
    client_code:           '', // trigger will generate
  }

  if (!payload.client_name) return { error: 'Client name is required.' }

  const { data, error } = await supabase
    .from('clients')
    .insert(payload)
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/clients')
  redirect(`/clients/${data.id}`)
}

// ─── Update ───────────────────────────────────────────────────
export async function updateClient(id: string, formData: FormData) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const perm = ensureClientMutation(profile)
  if (perm) return { error: perm }

  const payload = {
    client_name:           (formData.get('client_name') as string).trim(),
    client_type:           formData.get('client_type') as string,
    source_default:        formData.get('source_default') as string,
    status:                formData.get('status') as string,
    company_name:          (formData.get('company_name') as string)?.trim() || null,
    primary_contact_name:  (formData.get('primary_contact_name') as string)?.trim() || null,
    primary_contact_email: (formData.get('primary_contact_email') as string)?.trim() || null,
    primary_contact_phone: (formData.get('primary_contact_phone') as string)?.trim() || null,
    notes:                 (formData.get('notes') as string)?.trim() || null,
  }

  if (!payload.client_name) return { error: 'Client name is required.' }

  const { error } = await supabase
    .from('clients')
    .update(payload)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/clients')
  revalidatePath(`/clients/${id}`)
  redirect(`/clients/${id}`)
}
