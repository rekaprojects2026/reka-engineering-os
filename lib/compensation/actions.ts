'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import {
  loadMutationProfile,
  ensureCanConfirmCompensation,
  ensureCanProposeCompensation,
  ensureFinance,
  MUTATION_FORBIDDEN,
} from '@/lib/auth/mutation-policy'
import { isFinance } from '@/lib/auth/permissions'
import {
  buildCompensationPayload,
  buildProposerCompensationUpdatePayload,
  moneyInt,
  validateCompensationProposal,
} from '@/lib/compensation/helpers'
import { getCompensationById } from '@/lib/compensation/queries'

export async function createCompensation(formData: FormData) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  if (isFinance(profile.system_role)) {
    return {
      error:
        'Finance tidak membuat baris kompensasi dari sini. Untuk MONTHLY_FIXED, gunakan bagian di form edit anggota tim. Untuk tipe lain, minta Technical Director atau Manajer mengajukan proposal.',
    }
  }

  const perm = ensureCanProposeCompensation(profile)
  if (perm) return { error: perm }

  const built = buildCompensationPayload(formData, profile)
  if (!built.ok) return { error: built.error }
  const payload = built.payload

  if (payload.rate_type === 'monthly_fixed') {
    return {
      error:
        'MONTHLY_FIXED hanya dapat diatur langsung oleh Finance dari profil anggota tim. Silakan koordinasi dengan Finance.',
    }
  }

  const scopeErr = await validateCompensationProposal(profile, payload.project_id, payload.member_id)
  if (scopeErr) return { error: scopeErr }

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('compensation_records')
    .insert({
      ...payload,
      status: 'draft',
      created_by: user.id,
      proposed_by: user.id,
      proposed_at: now,
      return_note: null,
      finance_note: null,
      confirmed_by: null,
      confirmed_at: null,
      is_monthly_fixed_direct: false,
    })
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

  const existing = await getCompensationById(id)
  if (!existing) return { error: 'Record not found.' }

  const financeUser = isFinance(profile.system_role)
  const isOwnDraftProposer =
    existing.status === 'draft' &&
    existing.proposed_by === user.id &&
    (profile.system_role === 'technical_director' || profile.system_role === 'manajer')

  if (!financeUser && !isOwnDraftProposer) {
    return { error: MUTATION_FORBIDDEN }
  }

  if (isOwnDraftProposer) {
    const perm = ensureCanProposeCompensation(profile)
    if (perm) return { error: perm }
  }

  if (financeUser) {
    const perm = ensureCanConfirmCompensation(profile)
    if (perm) return { error: perm }
  }

  if (isOwnDraftProposer) {
    const partialBuilt = buildProposerCompensationUpdatePayload(formData, profile)
    if (!partialBuilt.ok) return { error: partialBuilt.error }
    const partial = partialBuilt.payload
    if (partial.rate_type === 'monthly_fixed') {
      return {
        error:
          'MONTHLY_FIXED hanya dapat diatur langsung oleh Finance dari profil anggota tim.',
      }
    }
    const scopeErr = await validateCompensationProposal(profile, partial.project_id, partial.member_id)
    if (scopeErr) return { error: scopeErr }

    const { error } = await supabase
      .from('compensation_records')
      .update({
        ...partial,
        status: 'draft',
        return_note: null,
      })
      .eq('id', id)

    if (error) return { error: error.message }
  } else {
    const financeBuilt = buildCompensationPayload(formData, profile)
    if (!financeBuilt.ok) return { error: financeBuilt.error }
    const payload = financeBuilt.payload
    if (payload.rate_type === 'monthly_fixed') {
      return {
        error:
          'MONTHLY_FIXED pada baris kompensasi tidak digunakan. Atur dari kartu MONTHLY_FIXED di halaman edit anggota tim.',
      }
    }

    const { error } = await supabase.from('compensation_records').update(payload).eq('id', id)
    if (error) return { error: error.message }
  }

  revalidatePath('/compensation')
  revalidatePath(`/compensation/${id}`)
  redirect(`/compensation/${id}`)
}

export async function deleteCompensation(id: string) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const existing = await getCompensationById(id)
  if (!existing) return { error: 'Record not found.' }

  if (isFinance(profile.system_role)) {
    const perm = ensureCanConfirmCompensation(profile)
    if (perm) return { error: perm }
  } else {
    const perm = ensureCanProposeCompensation(profile)
    if (perm) return { error: perm }
    if (existing.status !== 'draft' || existing.proposed_by !== user.id) {
      return { error: MUTATION_FORBIDDEN }
    }
  }

  const { error } = await supabase.from('compensation_records').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/compensation')
  redirect('/compensation')
}

export async function confirmCompensation(compensationId: string, formData: FormData) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const perm = ensureCanConfirmCompensation(profile)
  if (perm) return { error: perm }

  const existing = await getCompensationById(compensationId)
  if (!existing) return { error: 'Kompensasi tidak ditemukan.' }
  if (existing.status !== 'draft') return { error: 'Hanya bisa mengonfirmasi kompensasi yang masih DRAFT.' }

  const financeNote = ((formData.get('finance_note') as string) ?? '').trim() || null

  const { error } = await supabase
    .from('compensation_records')
    .update({
      status: 'confirmed',
      confirmed_by: user.id,
      confirmed_at: new Date().toISOString(),
      finance_note: financeNote,
      return_note: null,
    })
    .eq('id', compensationId)

  if (error) return { error: error.message }

  revalidatePath('/compensation')
  revalidatePath(`/compensation/${compensationId}`)
  redirect(`/compensation/${compensationId}`)
}

export async function returnCompensation(compensationId: string, formData: FormData) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const perm = ensureCanConfirmCompensation(profile)
  if (perm) return { error: perm }

  const returnNote = ((formData.get('return_note') as string) ?? '').trim()
  if (!returnNote) return { error: 'Catatan alasan dikembalikan wajib diisi.' }

  const existing = await getCompensationById(compensationId)
  if (!existing) return { error: 'Kompensasi tidak ditemukan.' }
  if (existing.status !== 'draft') return { error: 'Hanya bisa mengembalikan kompensasi yang masih DRAFT.' }

  const { error } = await supabase
    .from('compensation_records')
    .update({ return_note: returnNote })
    .eq('id', compensationId)
    .eq('status', 'draft')

  if (error) return { error: error.message }

  revalidatePath('/compensation')
  revalidatePath(`/compensation/${compensationId}`)
  redirect(`/compensation/${compensationId}`)
}

export async function setMonthlyFixedRate(memberId: string, formData: FormData): Promise<void> {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const perm = ensureFinance(profile)
  if (perm) redirect('/access-denied')

  const raw = formData.get('monthly_fixed_amount') as string
  const amount = moneyInt(parseFloat(raw) || 0)
  const currency = ((formData.get('monthly_fixed_currency') as string) ?? 'IDR').trim().toUpperCase() || 'IDR'

  if (amount <= 0) {
    redirect(`/team/${memberId}/edit?monthly_fixed_error=${encodeURIComponent('Nominal harus lebih dari 0.')}`)
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      rate_type: 'monthly_fixed',
      approved_rate: amount,
      currency_code: currency,
    })
    .eq('id', memberId)

  if (error) {
    redirect(`/team/${memberId}/edit?monthly_fixed_error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/team')
  revalidatePath(`/team/${memberId}`)
  revalidatePath(`/team/${memberId}/edit`)
  redirect(`/team/${memberId}/edit`)
}
