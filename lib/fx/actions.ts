'use server'

import { createServerClient } from '@/lib/supabase/server'
import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'

export async function createFxRate(formData: FormData) {
  const sp = await getSessionProfile()
  requireRole(sp.system_role, ['finance'])

  const supabase = await createServerClient()

  const from_currency = formData.get('from_currency') as string
  const to_currency = formData.get('to_currency') as string
  const rate = parseFloat(formData.get('rate') as string)
  const effective_date = formData.get('effective_date') as string
  const notes = formData.get('notes') as string || null

  const { error } = await supabase.from('fx_rates').insert({
    from_currency,
    to_currency,
    rate,
    effective_date,
    notes,
    set_by: sp.id,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/settings')
  revalidatePath('/finance/fx-rates')
}

export async function deleteFxRate(id: string) {
  const sp = await getSessionProfile()
  requireRole(sp.system_role, ['finance'])

  const supabase = await createServerClient()
  const { error } = await supabase.from('fx_rates').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/settings')
  revalidatePath('/finance/fx-rates')
}
