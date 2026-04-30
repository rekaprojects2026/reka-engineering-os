'use server'

import { createServerClient } from '@/lib/supabase/server'
import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'

export async function createOutreachCompany(formData: FormData) {
  const sp = await getSessionProfile()
  requireRole(sp.system_role, ['bd'])

  const supabase = await createServerClient()
  const { error } = await supabase.from('outreach_companies').insert({
    company_name: formData.get('company_name') as string,
    contact_person: (formData.get('contact_person') as string) || null,
    contact_channel: (formData.get('contact_channel') as string) || null,
    contact_value: (formData.get('contact_value') as string) || null,
    status: (formData.get('status') as string) || 'to_contact',
    last_contact_date: (formData.get('last_contact_date') as string) || null,
    next_followup_date: (formData.get('next_followup_date') as string) || null,
    notes: (formData.get('notes') as string) || null,
    created_by: sp.id,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/outreach')
}

export async function updateOutreachStatus(id: string, status: string) {
  const sp = await getSessionProfile()
  requireRole(sp.system_role, ['bd'])

  const supabase = await createServerClient()
  const { error } = await supabase
    .from('outreach_companies')
    .update({ status, last_contact_date: status !== 'to_contact' ? new Date().toISOString().split('T')[0] : undefined })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/outreach')
}

export async function updateOutreachCompany(id: string, formData: FormData) {
  const sp = await getSessionProfile()
  requireRole(sp.system_role, ['bd'])

  const supabase = await createServerClient()
  const { error } = await supabase.from('outreach_companies').update({
    company_name: formData.get('company_name') as string,
    contact_person: (formData.get('contact_person') as string) || null,
    contact_channel: (formData.get('contact_channel') as string) || null,
    contact_value: (formData.get('contact_value') as string) || null,
    status: (formData.get('status') as string) || 'to_contact',
    last_contact_date: (formData.get('last_contact_date') as string) || null,
    next_followup_date: (formData.get('next_followup_date') as string) || null,
    notes: (formData.get('notes') as string) || null,
  }).eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/outreach')
}

export async function deleteOutreachCompany(id: string) {
  const sp = await getSessionProfile()
  requireRole(sp.system_role, ['bd'])

  const supabase = await createServerClient()
  const { error } = await supabase.from('outreach_companies').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/outreach')
}

export async function convertOutreachToLead(id: string) {
  const sp = await getSessionProfile()
  requireRole(sp.system_role, ['bd'])

  const supabase = await createServerClient()

  /** DB function SECURITY DEFINER — avoids intakes INSERT RLS blocking this flow. */
  const { data: intake, error } = await supabase.rpc('convert_outreach_to_intake', {
    p_outreach_id: id,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/outreach')
  revalidatePath('/leads')
  return intake
}
