import { notFound } from 'next/navigation'
import type { CSSProperties } from 'react'

import { isDirektur, isFinance, isTD } from '@/lib/auth/permissions'
import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { TeamMemberForm } from '@/components/modules/team/TeamMemberForm'
import { getMemberById } from '@/lib/team/queries'
import { getSettingOptions } from '@/lib/settings/queries'
import { setMonthlyFixedRate } from '@/lib/compensation/actions'
import { CONTRACT_CURRENCY_OPTIONS } from '@/lib/constants/options'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ monthly_fixed_error?: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const member = await getMemberById(id)
  return { title: member ? `Edit ${member.full_name} — ReKa Engineering OS` : 'Member not found — ReKa Engineering OS' }
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
  marginBottom: '5px',
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '8px 11px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-control)',
  fontSize: '0.8125rem',
  color: 'var(--color-text-primary)',
  backgroundColor: 'var(--color-surface)',
  outline: 'none',
}

export default async function EditTeamMemberPage({ params, searchParams }: PageProps) {
  const _sp = await getSessionProfile()
  requireRole(_sp.system_role, ['technical_director', 'finance'])

  const { id } = await params
  const q = await searchParams
  const monthlyFixedErr = q.monthly_fixed_error ?? null
  const [member, functionalRoleOptions, disciplineOptions, workerTypeOptions] = await Promise.all([
    getMemberById(id),
    getSettingOptions('functional_role'),
    getSettingOptions('discipline'),
    getSettingOptions('worker_type'),
  ])
  if (!member) notFound()

  const callerRole = _sp.system_role
  const targetIsDirektur = isDirektur(member.system_role)
  const showPrivilegedTeamFields =
    (isTD(callerRole) || isFinance(callerRole)) &&
    !(targetIsDirektur && isTD(callerRole) && !isFinance(callerRole))

  return (
    <div>
      <PageHeader
        title={`Edit: ${member.full_name}`}
        subtitle="Update profile, role, availability, and rate information."
      />
      <SectionCard>
        {targetIsDirektur && isTD(callerRole) && !isFinance(callerRole) && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
            You can update contact and availability details here. System role and compensation fields for the Direktur are managed by Finance.
          </p>
        )}
        <TeamMemberForm
          mode="edit"
          member={member}
          functionalRoleOptions={functionalRoleOptions}
          disciplineOptions={disciplineOptions}
          workerTypeOptions={workerTypeOptions}
          isAdmin={showPrivilegedTeamFields}
        />
      </SectionCard>

      {isFinance(callerRole) && (
        <SectionCard title="Kompensasi MONTHLY_FIXED (langsung)">
          {monthlyFixedErr && (
            <div
              style={{
                marginBottom: '14px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-control)',
                backgroundColor: 'var(--color-danger-subtle)',
                color: 'var(--color-danger)',
                fontSize: '0.8125rem',
              }}
            >
              {monthlyFixedErr}
            </div>
          )}
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
            Mengatur langsung ke profil anggota (rate type, approved rate, currency), tanpa workflow proposal kompensasi.
          </p>
          <form action={setMonthlyFixedRate.bind(null, member.id)} style={{ maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Nominal bulanan</label>
              <input
                style={inputStyle}
                name="monthly_fixed_amount"
                type="number"
                min="1"
                step="1000"
                required
                defaultValue={member.rate_type === 'monthly_fixed' && member.approved_rate != null ? String(member.approved_rate) : ''}
                placeholder="e.g. 15000000"
              />
            </div>
            <div>
              <label style={labelStyle}>Currency</label>
              <select style={inputStyle} name="monthly_fixed_currency" defaultValue={member.currency_code ?? 'IDR'}>
                {CONTRACT_CURRENCY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              style={{
                alignSelf: 'flex-start',
                padding: '8px 18px',
                border: 'none',
                borderRadius: 'var(--radius-control)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--color-primary-fg)',
                backgroundColor: 'var(--color-primary)',
                cursor: 'pointer',
              }}
            >
              Set / Update Rate
            </button>
          </form>
        </SectionCard>
      )}
    </div>
  )
}
