'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { loadMutationProfile, MUTATION_FORBIDDEN } from '@/lib/auth/mutation-policy'
import { isDirektur, isFinance, isManajer, isTD } from '@/lib/auth/permissions'
import { userCanEditProjectMetadata } from '@/lib/auth/access-surface'
import { getProjectById } from '@/lib/projects/queries'
import { getTerminById } from '@/lib/termins/queries'
async function loadTerminWithProject(terminId: string) {
  const termin = await getTerminById(terminId)
  if (!termin) return { error: 'Termin not found.' as const }
  const project = await getProjectById(termin.project_id)
  if (!project) return { error: 'Project not found.' as const }
  return { termin, project }
}

/** Manajer (project lead): milestone ready → Siap Diklaim */
export async function claimTermin(terminId: string): Promise<{ error?: string }> {
  const profile = await loadMutationProfile()
  if (!isManajer(profile.system_role)) return { error: MUTATION_FORBIDDEN }

  const ctx = await loadTerminWithProject(terminId)
  if ('error' in ctx) return { error: ctx.error }
  const { termin, project } = ctx

  if (project.project_lead_user_id !== profile.id) return { error: MUTATION_FORBIDDEN }
  if (termin.status !== 'BELUM_DIMULAI') return { error: 'Termin cannot be claimed in its current state.' }

  const supabase = await createServerClient()
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('project_termins')
    .update({
      status: 'SIAP_DIKLAIM',
      claimed_by: profile.id,
      claimed_at: now,
    })
    .eq('id', terminId)
    .eq('status', 'BELUM_DIMULAI')

  if (error) return { error: error.message }
  revalidatePath(`/projects/${project.id}`)
  return {}
}

/** Manajer (lead): submit for TD / Direktur verification */
export async function submitTerminForVerification(terminId: string): Promise<{ error?: string }> {
  const profile = await loadMutationProfile()
  if (!isManajer(profile.system_role)) return { error: MUTATION_FORBIDDEN }

  const ctx = await loadTerminWithProject(terminId)
  if ('error' in ctx) return { error: ctx.error }
  const { termin, project } = ctx

  if (project.project_lead_user_id !== profile.id) return { error: MUTATION_FORBIDDEN }
  if (termin.status !== 'SIAP_DIKLAIM') return { error: 'Termin must be Siap Diklaim before verification is requested.' }

  const supabase = await createServerClient()
  const { error } = await supabase
    .from('project_termins')
    .update({ status: 'MENUNGGU_VERIFIKASI' })
    .eq('id', terminId)
    .eq('status', 'SIAP_DIKLAIM')

  if (error) return { error: error.message }
  revalidatePath(`/projects/${project.id}`)
  return {}
}

/** TD / Direktur: verified → ready for finance invoice */
export async function verifyTermin(terminId: string): Promise<{ error?: string }> {
  const profile = await loadMutationProfile()
  if (!isTD(profile.system_role) && !isDirektur(profile.system_role)) return { error: MUTATION_FORBIDDEN }

  const ctx = await loadTerminWithProject(terminId)
  if ('error' in ctx) return { error: ctx.error }
  const { termin, project } = ctx

  if (termin.status !== 'MENUNGGU_VERIFIKASI') return { error: 'Termin is not waiting for verification.' }

  const supabase = await createServerClient()
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('project_termins')
    .update({
      status: 'INVOICE_DITERBITKAN',
      verified_by: profile.id,
      verified_at: now,
    })
    .eq('id', terminId)
    .eq('status', 'MENUNGGU_VERIFIKASI')

  if (error) return { error: error.message }
  revalidatePath(`/projects/${project.id}`)
  return {}
}

/** Finance: attach client invoice record */
export async function markTerminInvoiced(terminId: string, invoiceId: string): Promise<{ error?: string }> {
  const profile = await loadMutationProfile()
  if (!isFinance(profile.system_role)) return { error: MUTATION_FORBIDDEN }

  const ctx = await loadTerminWithProject(terminId)
  if ('error' in ctx) return { error: ctx.error }
  const { termin, project } = ctx

  if (termin.status !== 'INVOICE_DITERBITKAN') return { error: 'Termin must be in invoice-issued state.' }

  const supabase = await createServerClient()
  const { error } = await supabase
    .from('project_termins')
    .update({ invoice_id: invoiceId.trim() })
    .eq('id', terminId)
    .eq('status', 'INVOICE_DITERBITKAN')

  if (error) return { error: error.message }
  revalidatePath(`/projects/${project.id}`)
  return {}
}

/** TD / Direktur: sign BAST → wait for client signature */
export async function markTerminBastSigned(terminId: string): Promise<{ error?: string }> {
  const profile = await loadMutationProfile()
  if (!isTD(profile.system_role) && !isDirektur(profile.system_role)) return { error: MUTATION_FORBIDDEN }

  const ctx = await loadTerminWithProject(terminId)
  if ('error' in ctx) return { error: ctx.error }
  const { termin, project } = ctx

  if (termin.status !== 'INVOICE_DITERBITKAN') return { error: 'Termin must be in invoice-issued state.' }

  const supabase = await createServerClient()
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('project_termins')
    .update({
      status: 'MENUNGGU_TTD_CLIENT',
      bast_signed_by: profile.id,
      bast_signed_at: now,
    })
    .eq('id', terminId)
    .eq('status', 'INVOICE_DITERBITKAN')

  if (error) return { error: error.message }
  revalidatePath(`/projects/${project.id}`)
  return {}
}

/** Finance: client signed BAST */
export async function markTerminClientSigned(terminId: string): Promise<{ error?: string }> {
  const profile = await loadMutationProfile()
  if (!isFinance(profile.system_role)) return { error: MUTATION_FORBIDDEN }

  const ctx = await loadTerminWithProject(terminId)
  if ('error' in ctx) return { error: ctx.error }
  const { termin, project } = ctx

  if (termin.status !== 'MENUNGGU_TTD_CLIENT') return { error: 'Termin is not waiting for client BAST signature.' }

  const supabase = await createServerClient()
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('project_termins')
    .update({
      status: 'MENUNGGU_PEMBAYARAN',
      client_signed_bast_at: now,
    })
    .eq('id', terminId)
    .eq('status', 'MENUNGGU_TTD_CLIENT')

  if (error) return { error: error.message }
  revalidatePath(`/projects/${project.id}`)
  return {}
}

/** Finance: record payment received */
export async function markTerminPaid(terminId: string, paidAt?: string): Promise<{ error?: string }> {
  const profile = await loadMutationProfile()
  if (!isFinance(profile.system_role)) return { error: MUTATION_FORBIDDEN }

  const ctx = await loadTerminWithProject(terminId)
  if ('error' in ctx) return { error: ctx.error }
  const { termin, project } = ctx

  if (termin.status !== 'MENUNGGU_PEMBAYARAN') return { error: 'Termin is not waiting for payment.' }

  const supabase = await createServerClient()
  const ts = paidAt?.trim() ? new Date(paidAt).toISOString() : new Date().toISOString()
  const { error } = await supabase
    .from('project_termins')
    .update({
      status: 'LUNAS',
      paid_at: ts,
    })
    .eq('id', terminId)
    .eq('status', 'MENUNGGU_PEMBAYARAN')

  if (error) return { error: error.message }
  revalidatePath(`/projects/${project.id}`)
  return {}
}

export async function updateTerminConfig(
  terminId: string,
  data: { label: string; percentage: number; amount: number | null; trigger_condition: string | null },
): Promise<{ error?: string }> {
  const profile = await loadMutationProfile()
  const ctx = await loadTerminWithProject(terminId)
  if ('error' in ctx) return { error: ctx.error }
  const { project } = ctx

  const canAll = isFinance(profile.system_role) || isDirektur(profile.system_role)
  const canOps =
    (await userCanEditProjectMetadata(profile, project)) &&
    (isTD(profile.system_role) || isManajer(profile.system_role))

  if (!canAll && !canOps) return { error: MUTATION_FORBIDDEN }

  if (data.percentage <= 0 || data.percentage > 100) return { error: 'Percentage must be between 0 and 100.' }
  if (!data.label.trim()) return { error: 'Label is required.' }

  const supabase = await createServerClient()
  const { error } = await supabase
    .from('project_termins')
    .update({
      label: data.label.trim(),
      percentage: data.percentage,
      amount: data.amount,
      trigger_condition: data.trigger_condition?.trim() || null,
    })
    .eq('id', terminId)

  if (error) return { error: error.message }
  revalidatePath(`/projects/${project.id}`)
  return {}
}
