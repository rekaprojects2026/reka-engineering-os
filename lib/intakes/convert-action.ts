'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity/actions'
import { loadMutationProfile, ensureCreateProjectMutation } from '@/lib/auth/mutation-policy'
import { isDirektur } from '@/lib/auth/permissions'
import { deriveSourceTypeFromSource, parseContractFromForm } from '@/lib/projects/contract-from-form'
import { ensureDefaultTerminsForProject } from '@/lib/termins/ensure-default-termins'

/**
 * Convert a qualified intake into a project.
 * - Creates the project record with data carried over from the intake
 * - Updates intake status to 'converted' and sets converted_project_id
 * - Creates a project_team_assignments record for the lead
 */
export async function convertIntakeToProject(formData: FormData) {
  const supabase = await createServerClient()
  const profile = await loadMutationProfile()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const perm = ensureCreateProjectMutation(profile)
  if (perm) return { error: perm }

  const intakeId = (formData.get('intake_id') as string)?.trim()
  if (!intakeId) return { error: 'Intake ID is required.' }

  // Validate intake exists
  const { data: intake, error: intakeErr } = await supabase
    .from('intakes')
    .select('*')
    .eq('id', intakeId)
    .single()

  if (intakeErr || !intake) return { error: 'Intake not found.' }

  if (intake.status === 'converted') {
    return { error: 'This intake has already been converted to a project.' }
  }

  // Validate required fields
  const clientId = (formData.get('client_id') as string)?.trim()
  const name = (formData.get('name') as string)?.trim()
  const leadUserId = (formData.get('project_lead_user_id') as string)?.trim()
  const targetDueDate = (formData.get('target_due_date') as string)?.trim()

  if (!clientId) return { error: 'Client is required. Link or select a client before converting.' }
  if (!name) return { error: 'Project name is required.' }
  if (!leadUserId) return { error: 'Project lead is required.' }
  if (!targetDueDate) return { error: 'Target due date is required.' }

  const reviewerUserId = (formData.get('reviewer_user_id') as string)?.trim() || null

  const sourceForContract = ((formData.get('source') as string) || intake.source || 'direct').trim()
  const hasContractFields = Boolean((formData.get('contract_value') as string)?.trim())
  const contract = hasContractFields
    ? parseContractFromForm(formData)
    : {
        source_type: deriveSourceTypeFromSource(sourceForContract),
        contract_value: null as number | null,
        contract_currency: 'IDR',
        has_retention: false,
        retention_percentage: 5,
      }
  if (contract.source_type === 'DOMESTIC' && (contract.contract_value == null || contract.contract_value <= 0)) {
    return { error: 'Nilai kontrak wajib diisi untuk project Domestic.' }
  }

  const byDirektur = isDirektur(profile.system_role)
  const initialStatus = byDirektur ? 'new' : 'pending_approval'
  const approvalRequestedAt = byDirektur ? null : new Date().toISOString()

  // ─── 1. Create project ──────────────────────────────────────
  const primaryDiscipline = (formData.get('discipline') as string) || intake.discipline || 'mechanical'
  const projectPayload = {
    name,
    client_id:              clientId,
    intake_id:              intakeId,
    source:                 (formData.get('source') as string) || intake.source || 'direct',
    external_reference_url: (formData.get('external_reference_url') as string)?.trim() || intake.external_reference_url || null,
    discipline:             primaryDiscipline,
    disciplines:            [primaryDiscipline],
    drive_mode:             'none' as const,
    project_type:           (formData.get('project_type') as string) || intake.project_type || 'design',
    scope_summary:          (formData.get('scope_summary') as string)?.trim() || intake.short_brief || null,
    start_date:             (formData.get('start_date') as string) || new Date().toISOString().split('T')[0],
    target_due_date:        targetDueDate,
    project_lead_user_id:   leadUserId,
    reviewer_user_id:       reviewerUserId,
    priority:               (formData.get('priority') as string) || 'medium',
    status:                   initialStatus,
    approval_requested_at:    approvalRequestedAt,
    progress_percent:       0,
    waiting_on:             'none',
    notes_internal:         (formData.get('notes_internal') as string)?.trim() || null,
    created_by:             user.id,
    project_code:           '', // trigger will generate
    ...contract,
  }

  const { data: newProject, error: projectErr } = await supabase
    .from('projects')
    .insert(projectPayload)
    .select('id')
    .single()

  if (projectErr) return { error: `Failed to create project: ${projectErr.message}` }

  const terminSlice = {
    id: newProject.id,
    status: initialStatus,
    source_type: contract.source_type,
    contract_value: contract.contract_value,
    contract_currency: contract.contract_currency,
    has_retention: contract.has_retention,
    retention_percentage: contract.retention_percentage,
  }
  const terminErr = await ensureDefaultTerminsForProject(supabase, terminSlice)
  if (terminErr.error) {
    console.error('ensureDefaultTerminsForProject:', terminErr.error)
  }

  // ─── 2. Update intake status to converted ───────────────────
  const { error: updateErr } = await supabase
    .from('intakes')
    .update({
      status: 'converted',
      converted_project_id: newProject.id,
    })
    .eq('id', intakeId)

  if (updateErr) {
    // Project was created but intake update failed — log but don't block
    console.error('Failed to update intake status:', updateErr.message)
  }

  // ─── 3. Create team assignment for lead ─────────────────────
  await supabase
    .from('project_team_assignments')
    .insert({
      project_id: newProject.id,
      user_id: leadUserId,
      team_role: 'lead',
    })
    .then(({ error: teamErr }) => {
      if (teamErr) console.error('Failed to create lead team assignment:', teamErr.message)
    })

  // ─── 4. Log activity, revalidate, redirect ──────────────────
  await logActivity({
    entity_type: 'intake',
    entity_id:   intakeId,
    action_type: 'converted',
    user_id:     user.id,
    note:        `Intake converted to project '${name}'`,
  })

  revalidatePath('/projects')
  revalidatePath('/intakes')
  revalidatePath('/leads')
  revalidatePath(`/intakes/${intakeId}`)
  revalidatePath(`/leads/${intakeId}`)
  revalidatePath(`/clients/${clientId}`)
  redirect(`/projects/${newProject.id}`)
}
