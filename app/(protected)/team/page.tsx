import Link from 'next/link'
import { redirect } from 'next/navigation'
import { UserSquare2, Plus, Mail, Clock } from 'lucide-react'

import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { canAccessTeam, canViewTeamAvailability } from '@/lib/auth/permissions'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { DataTable } from '@/components/shared/DataTable'
import type { Column } from '@/components/shared/DataTable'
import { AvailabilityBadge } from '@/components/modules/team/AvailabilityBadge'
import { WorkerTypeBadge } from '@/components/modules/team/WorkerTypeBadge'
import { CopyLinkButton } from '@/components/modules/onboarding/CopyLinkButton'
import {
  getTeamMembers,
  getTeamAvailabilityForManajer,
  getAllTalentMetrics,
  type TeamMember,
  type TalentMetrics,
} from '@/lib/team/queries'
import { TeamAvailabilityView } from '@/components/modules/team/TeamAvailabilityView'
import { getPendingInvites, type InviteWithInviter } from '@/lib/invites/queries'
import { revokeInvite as _revokeInvite } from '@/lib/invites/actions'
import { formatDate, formatIDR, getInitials } from '@/lib/utils/formatters'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SYSTEM_ROLES, RATE_TYPE_OPTIONS } from '@/lib/constants/options'
import { getSettingOptions } from '@/lib/settings/queries'

export const metadata = { title: 'Team — ReKa Engineering OS' }

const SYSTEM_ROLE_LABEL = Object.fromEntries(SYSTEM_ROLES.map((r) => [r.value, r.label]))
const RATE_LABEL = Object.fromEntries(RATE_TYPE_OPTIONS.map((r) => [r.value, r.label]))

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function handleRevokeInvite(id: string) {
  'use server'
  await _revokeInvite(id)
}

function formatRateAmount(n: number | null | undefined, currencyCode: string | null | undefined): string | null {
  if (n == null || n === undefined) return null
  const num = Number(n)
  if (Number.isNaN(num)) return null
  const code = (currencyCode || 'IDR').toUpperCase()
  if (code === 'IDR') return formatIDR(num)
  try {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num)
  } catch {
    return `${num.toLocaleString('id-ID')} ${code}`
  }
}

function memberColumns(
  FUNCTIONAL_LABEL: Record<string, string>,
  metricsMap: Record<string, TalentMetrics>,
): Column<TeamMember>[] {
  return [
    {
      key: 'name',
      header: 'Name',
      render: (m) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '220px' }}>
          <Avatar className="h-8 w-8 shrink-0">
            {m.photo_url ? <AvatarImage src={m.photo_url} alt={m.full_name} /> : null}
            <AvatarFallback className="text-[0.6875rem] font-semibold">{getInitials(m.full_name)}</AvatarFallback>
          </Avatar>
          <div>
            <Link
              href={`/team/${m.id}`}
              style={{ fontWeight: 500, color: 'var(--color-text-primary)', textDecoration: 'none' }}
              className="hover:underline"
            >
              {m.full_name}
            </Link>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '1px' }}>
              {m.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'worker_type',
      header: 'Type',
      render: (m) => (
        m.worker_type
          ? <WorkerTypeBadge type={m.worker_type} />
          : <span style={{ color: 'var(--color-text-muted)' }}>—</span>
      ),
    },
    {
      key: 'system_role',
      header: 'Role',
      render: (m) => (
        <span style={{ textTransform: 'capitalize' }}>{m.system_role ?? '—'}</span>
      ),
    },
    {
      key: 'function',
      header: 'Discipline / Function',
      render: (m) => {
        const funcLabel = m.functional_role
          ? FUNCTIONAL_LABEL[m.functional_role] ?? m.functional_role
          : null
        return (
          <span>
            <span style={{ textTransform: 'capitalize' }}>{m.discipline ?? ''}</span>
            {m.discipline && funcLabel && <span style={{ color: 'var(--color-text-muted)' }}> · </span>}
            {funcLabel}
            {!m.discipline && !funcLabel && <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
          </span>
        )
      },
    },
    {
      key: 'availability',
      header: 'Availability',
      render: (m) => <AvailabilityBadge status={m.availability_status} />,
    },
    {
      key: 'rate',
      header: 'Rate',
      render: (m) => {
        const approved = formatRateAmount(m.approved_rate, m.currency_code)
        const expected = formatRateAmount(m.expected_rate, m.currency_code)
        const rateLabel = approved ?? (expected ? `~${expected}` : '—')
        const rateType = m.rate_type
          ? RATE_LABEL[m.rate_type] ?? m.rate_type.replace(/_/g, ' ')
          : ''
        return (
          <div style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
            {rateLabel}
            {(approved || expected) && rateType && (
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.6875rem', display: 'block', marginTop: '2px' }}>
                {rateType}
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: 'metrics',
      header: 'Performance',
      render: (m) => {
        const met = metricsMap[m.id]
        if (!met || (met.completedTasks === 0 && met.totalPaid === 0)) {
          return <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>—</span>
        }
        return (
          <div style={{ fontSize: '0.75rem' }}>
            {met.completedTasks > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>{met.completedTasks} tasks</span>
                {met.onTimePct !== null && (
                  <span style={{ padding: '1px 5px', borderRadius: '999px', fontSize: '0.625rem', fontWeight: 600, backgroundColor: met.onTimePct >= 80 ? 'var(--color-success-subtle)' : met.onTimePct >= 60 ? 'var(--color-warning-subtle)' : 'var(--color-danger-subtle)', color: met.onTimePct >= 80 ? 'var(--color-success)' : met.onTimePct >= 60 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
                    {met.onTimePct}% on-time
                  </span>
                )}
              </div>
            )}
            {met.totalPaid > 0 && (
              <div style={{ color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                {formatIDR(met.totalPaid)}
              </div>
            )}
            {met.totalPending > 0 && (
              <div style={{ color: 'var(--color-warning)', fontFamily: 'monospace', fontSize: '0.6875rem' }}>
                +{formatIDR(met.totalPending)} pending
              </div>
            )}
          </div>
        )
      },
    },
    {
      key: 'active_status',
      header: 'Status',
      render: (m) => {
        const activeColor =
          m.active_status === 'active'   ? 'var(--color-success)' :
          m.active_status === 'inactive' ? 'var(--color-text-muted)' :
          'var(--color-neutral)'
        return (
          <span style={{ color: activeColor, textTransform: 'capitalize', fontWeight: 500 }}>
            {m.active_status}
          </span>
        )
      },
    },
    {
      key: 'actions',
      header: '',
      width: '72px',
      align: 'right',
      render: (m) => (
        <Link
          href={`/team/${m.id}/edit`}
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-primary)',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          Edit
        </Link>
      ),
    },
  ]
}

function inviteColumns(WORKER_TYPE_LABEL: Record<string, string>): Column<InviteWithInviter>[] {
  return [
    { key: 'email', header: 'Email', render: (inv) => inv.email },
    {
      key: 'name',
      header: 'Name',
      render: (inv) => <span style={{ color: 'var(--color-text-muted)' }}>{inv.full_name ?? '—'}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      render: (inv) => (
        <span style={{ textTransform: 'capitalize' }}>
          {inv.system_role ? SYSTEM_ROLE_LABEL[inv.system_role] ?? inv.system_role : '—'}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (inv) => (
        <span>{inv.worker_type ? WORKER_TYPE_LABEL[inv.worker_type] ?? inv.worker_type : '—'}</span>
      ),
    },
    {
      key: 'expires',
      header: 'Expires',
      render: (inv) => (
        <span style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={11} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} aria-hidden="true" />
          {formatDate(inv.expires_at)}
        </span>
      ),
    },
    {
      key: 'link',
      header: 'Invite Link',
      width: '320px',
      render: (inv) => <CopyLinkButton url={`${APP_URL}/onboarding/${inv.token}`} />,
    },
    {
      key: 'revoke',
      header: '',
      width: '72px',
      align: 'right',
      render: (inv) => (
        <form action={handleRevokeInvite.bind(null, inv.id)}>
          <button
            type="submit"
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-danger)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0',
              fontWeight: 500,
              fontFamily: 'inherit',
            }}
          >
            Revoke
          </button>
        </form>
      ),
    },
  ]
}

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ invited?: string }>
}) {
  const profile = await getSessionProfile()
  if (!canAccessTeam(profile.system_role) && !canViewTeamAvailability(profile.system_role)) {
    redirect('/access-denied')
  }

  if (canViewTeamAvailability(profile.system_role)) {
    const [members, funcOpts, discOpts] = await Promise.all([
      getTeamAvailabilityForManajer(),
      getSettingOptions('functional_role'),
      getSettingOptions('discipline'),
    ])
    const functionalRoleLabels = Object.fromEntries(funcOpts.map((r) => [r.value, r.label]))
    const disciplineLabels = Object.fromEntries(discOpts.map((r) => [r.value, r.label]))

    return (
      <div>
        <PageHeader
          title="Tim"
          subtitle="Ketersediaan anggota tim untuk perencanaan proyek."
        />
        <SectionCard noPadding>
          <div className="p-4">
            <TeamAvailabilityView
              members={members}
              functionalRoleLabels={functionalRoleLabels}
              disciplineLabels={disciplineLabels}
            />
          </div>
        </SectionCard>
      </div>
    )
  }

  requireRole(profile.system_role, ['direktur', 'technical_director', 'finance'])

  const { invited } = await searchParams
  const [members, pendingInvites, funcOpts, wtOpts, metricsMap] = await Promise.all([
    getTeamMembers(),
    getPendingInvites(),
    getSettingOptions('functional_role'),
    getSettingOptions('worker_type'),
    getAllTalentMetrics().catch(() => ({} as Record<string, TalentMetrics>)),
  ])
  const FUNCTIONAL_LABEL = Object.fromEntries(funcOpts.map((r) => [r.value, r.label]))
  const WORKER_TYPE_LABEL = Object.fromEntries(wtOpts.map((r) => [r.value, r.label]))

  return (
    <div>
      <PageHeader
        title="Team"
        subtitle="Internal team members, freelancers, and subcontractors."
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link
              href="/team/invite"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-control)',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: 'var(--color-text-primary)',
                textDecoration: 'none',
              }}
            >
              <Mail size={14} aria-hidden="true" />
              Invite
            </Link>
            <Link
              href="/team/new"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-primary-fg)',
                borderRadius: 'var(--radius-control)',
                fontSize: '0.8125rem',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              <Plus size={14} aria-hidden="true" />
              Add Member
            </Link>
          </div>
        }
      />

      <SectionCard noPadding>
        {members.length === 0 ? (
          <EmptyState
            icon={<UserSquare2 size={22} />}
            title="No team members yet"
            description="Add your first team member or freelancer to get started."
            action={
              <Link
                href="/team/new"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-primary-fg)',
                  borderRadius: 'var(--radius-control)',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                <Plus size={14} aria-hidden="true" />
                Add Member
              </Link>
            }
          />
        ) : (
          <DataTable columns={memberColumns(FUNCTIONAL_LABEL, metricsMap)} data={members} />
        )}
      </SectionCard>

      {pendingInvites.length > 0 && (
        <SectionCard
          title="Pending Invites"
          actions={
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
              {pendingInvites.length} pending
            </span>
          }
          noPadding
        >
          {invited && (
            <div style={{
              padding: '10px 16px',
              borderBottom: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-info-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-info)', fontWeight: 500 }}>
                Undangan terkirim ke email. Link di bawah tersedia sebagai backup jika email tidak masuk.
              </span>
            </div>
          )}
          <DataTable
            columns={inviteColumns(WORKER_TYPE_LABEL)}
            data={pendingInvites}
            getRowStyle={(inv) => (invited === inv.token ? { backgroundColor: 'var(--color-info-subtle)' } : undefined)}
          />
        </SectionCard>
      )}
    </div>
  )
}
