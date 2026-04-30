import { notFound, redirect } from 'next/navigation'

import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { CompensationForm } from '@/components/modules/compensation/CompensationForm'
import { getCompensationById } from '@/lib/compensation/queries'
import { updateCompensation } from '@/lib/compensation/actions'
import {
  getMemberOptions,
  getMemberOptionsForCompensation,
  getProjectOptions,
  getProjectOptionsForCompensation,
} from '@/lib/compensation/helpers'

interface PageProps { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const record = await getCompensationById(id)
  return {
    title: record
      ? `Edit Compensation — ${record.member?.full_name ?? 'Record'} — ReKa Engineering OS`
      : `Not found — ReKa Engineering OS`,
  }
}

export default async function EditCompensationPage({ params }: PageProps) {
  const _sp = await getSessionProfile()
  requireRole(_sp.system_role, ['technical_director', 'finance', 'manajer'])

  const { id } = await params
  const record = await getCompensationById(id)
  if (!record) notFound()

  const isFinance = _sp.system_role === 'finance'
  const isProposer =
    _sp.system_role === 'technical_director' || _sp.system_role === 'manajer'
  const ownDraft = record.status === 'draft' && record.proposed_by === _sp.id

  if (!isFinance && !(isProposer && ownDraft)) {
    redirect('/access-denied')
  }

  const [members, projects] = await Promise.all([
    isFinance ? getMemberOptions() : getMemberOptionsForCompensation(_sp),
    isFinance ? getProjectOptions() : getProjectOptionsForCompensation(_sp),
  ])

  const dv: Record<string, string | number | null> = {
    member_id: record.member_id,
    project_id: record.project_id,
    task_id: record.task_id,
    deliverable_id: record.deliverable_id,
    rate_type: record.rate_type,
    qty: record.qty,
    rate_amount: record.rate_amount,
    currency_code: record.currency_code,
    status: record.status,
    period_label: record.period_label,
    work_date: record.work_date,
    notes: record.notes,
  }

  return (
    <div>
      <PageHeader
        title="Edit Compensation Record"
        subtitle={record.member?.full_name ?? ''}
      />
      <SectionCard>
        <CompensationForm
          members={members}
          projects={projects}
          defaultValues={dv}
          action={updateCompensation.bind(null, id)}
          submitLabel="Save Changes"
          showStatusField={isFinance}
          showMonthlyFixedGuidance={!isFinance}
        />
      </SectionCard>
    </div>
  )
}
