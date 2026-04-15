import type { CSSProperties } from 'react'
import Link from 'next/link'
import { UserSquare2, Plus, Mail, Clock } from 'lucide-react'

import { PageHeader }     from '@/components/layout/PageHeader'
import { SectionCard }    from '@/components/shared/SectionCard'
import { EmptyState }     from '@/components/shared/EmptyState'
import { AvailabilityBadge } from '@/components/modules/team/AvailabilityBadge'
import { WorkerTypeBadge }   from '@/components/modules/team/WorkerTypeBadge'
import { CopyLinkButton }    from '@/components/modules/onboarding/CopyLinkButton'
import { getTeamMembers }    from '@/lib/team/queries'
import { getPendingInvites } from '@/lib/invites/queries'
import { revokeInvite }      from '@/lib/invites/actions'
import { formatDate }        from '@/lib/utils/formatters'
import { FUNCTIONAL_ROLES, SYSTEM_ROLES, WORKER_TYPES } from '@/lib/constants/options'

export const metadata = { title: 'Team — Engineering Agency OS' }

const FUNCTIONAL_LABEL = Object.fromEntries(FUNCTIONAL_ROLES.map((r) => [r.value, r.label]))
const SYSTEM_ROLE_LABEL = Object.fromEntries(SYSTEM_ROLES.map((r) => [r.value, r.label]))
const WORKER_TYPE_LABEL = Object.fromEntries(WORKER_TYPES.map((r) => [r.value, r.label]))

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

const TH: CSSProperties = {
  padding:         '9px 14px',
  textAlign:       'left',
  fontSize:        '0.6875rem',
  fontWeight:      600,
  color:           'var(--color-text-muted)',
  backgroundColor: 'var(--color-surface-subtle)',
  letterSpacing:   '0.04em',
  textTransform:   'uppercase',
  whiteSpace:      'nowrap',
  borderBottom:    '1px solid var(--color-border)',
}

const TD: CSSProperties = {
  padding:   '10px 14px',
  fontSize:  '0.8125rem',
  color:     'var(--color-text-secondary)',
  whiteSpace: 'nowrap',
}

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ invited?: string }>
}) {
  const { invited } = await searchParams
  const [members, pendingInvites] = await Promise.all([
    getTeamMembers(),
    getPendingInvites(),
  ])

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
                display:         'inline-flex',
                alignItems:      'center',
                gap:             '6px',
                padding:         '8px 14px',
                backgroundColor: 'var(--color-surface)',
                border:          '1px solid var(--color-border)',
                borderRadius:    '6px',
                fontSize:        '0.8125rem',
                fontWeight:      500,
                color:           'var(--color-text-primary)',
                textDecoration:  'none',
              }}
            >
              <Mail size={14} aria-hidden="true" />
              Invite
            </Link>
            <Link
              href="/team/new"
              style={{
                display:         'inline-flex',
                alignItems:      'center',
                gap:             '6px',
                padding:         '8px 14px',
                backgroundColor: 'var(--color-primary)',
                color:           '#fff',
                borderRadius:    '6px',
                fontSize:        '0.8125rem',
                fontWeight:      500,
                textDecoration:  'none',
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
                  display:         'inline-flex',
                  alignItems:      'center',
                  gap:             '6px',
                  padding:         '8px 16px',
                  backgroundColor: 'var(--color-primary)',
                  color:           '#fff',
                  borderRadius:    '6px',
                  fontSize:        '0.8125rem',
                  fontWeight:      500,
                  textDecoration:  'none',
                }}
              >
                <Plus size={14} aria-hidden="true" />
                Add Member
              </Link>
            }
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Name', 'Type', 'Role', 'Discipline / Function', 'Availability', 'Rate', 'Status', ''].map((h) => (
                    <th key={h} style={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((m, idx) => {
                  const isLast = idx === members.length - 1
                  const rateLabel = m.approved_rate
                    ? `${Number(m.approved_rate).toLocaleString('id-ID')} ${m.currency_code}`
                    : m.expected_rate
                    ? `~${Number(m.expected_rate).toLocaleString('id-ID')} ${m.currency_code}`
                    : '—'

                  const rateType = m.rate_type
                    ? ' / ' + m.rate_type.replace(/_/g, ' ')
                    : ''

                  const funcLabel = m.functional_role
                    ? FUNCTIONAL_LABEL[m.functional_role] ?? m.functional_role
                    : null

                  const activeColor =
                    m.active_status === 'active'   ? 'var(--color-success)' :
                    m.active_status === 'inactive' ? 'var(--color-text-muted)' :
                    '#94A3B8'

                  return (
                    <tr
                      key={m.id}
                      style={{ borderBottom: isLast ? undefined : '1px solid var(--color-border)' }}
                      className="hover:bg-[#F8FAFC] transition-colors"
                    >
                      {/* Name */}
                      <td style={{ ...TD, maxWidth: '200px' }}>
                        <Link
                          href={`/team/${m.id}`}
                          style={{
                            fontWeight:     500,
                            color:          'var(--color-text-primary)',
                            textDecoration: 'none',
                          }}
                          className="hover:underline"
                        >
                          {m.full_name}
                        </Link>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '1px' }}>
                          {m.email}
                        </div>
                      </td>

                      {/* Worker type */}
                      <td style={TD}>
                        {m.worker_type
                          ? <WorkerTypeBadge type={m.worker_type} />
                          : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                      </td>

                      {/* System role */}
                      <td style={{ ...TD, textTransform: 'capitalize' }}>
                        {m.system_role ?? '—'}
                      </td>

                      {/* Discipline / function */}
                      <td style={TD}>
                        <span style={{ textTransform: 'capitalize' }}>{m.discipline ?? ''}</span>
                        {m.discipline && funcLabel && <span style={{ color: 'var(--color-text-muted)' }}> · </span>}
                        {funcLabel}
                        {!m.discipline && !funcLabel && <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                      </td>

                      {/* Availability */}
                      <td style={TD}>
                        <AvailabilityBadge status={m.availability_status} />
                      </td>

                      {/* Rate */}
                      <td style={{ ...TD, fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {rateLabel}
                        {m.approved_rate && (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.6875rem', display: 'block' }}>
                            {rateType.trim()}
                          </span>
                        )}
                      </td>

                      {/* Active status */}
                      <td style={{ ...TD, color: activeColor, textTransform: 'capitalize', fontWeight: 500 }}>
                        {m.active_status}
                      </td>

                      {/* Actions */}
                      <td style={{ ...TD, textAlign: 'right' }}>
                        <Link
                          href={`/team/${m.id}/edit`}
                          style={{
                            fontSize:       '0.75rem',
                            color:          'var(--color-primary)',
                            textDecoration: 'none',
                            fontWeight:     500,
                          }}
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ── Pending Invites ──────────────────────────────────── */}
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
          {/* New invite banner */}
          {invited && (
            <div style={{
              padding:      '10px 16px',
              borderBottom: '1px solid var(--color-border)',
              backgroundColor: '#EFF8FF',
              display:      'flex',
              alignItems:   'center',
              gap:          '10px',
            }}>
              <span style={{ fontSize: '0.8125rem', color: '#175CD3', fontWeight: 500 }}>
                Invite created. Copy the link below and share it with the invited person.
              </span>
            </div>
          )}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Email', 'Name', 'Role', 'Type', 'Expires', 'Invite Link', ''].map((h) => (
                    <th key={h} style={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingInvites.map((inv, idx) => {
                  const isLast = idx === pendingInvites.length - 1
                  const inviteUrl = `${APP_URL}/onboarding/${inv.token}`
                  const isHighlighted = invited === inv.token
                  return (
                    <tr
                      key={inv.id}
                      style={{
                        borderBottom:    isLast ? undefined : '1px solid var(--color-border)',
                        backgroundColor: isHighlighted ? '#F0F9FF' : undefined,
                      }}
                    >
                      <td style={TD}>{inv.email}</td>
                      <td style={{ ...TD, color: 'var(--color-text-muted)' }}>{inv.full_name ?? '—'}</td>
                      <td style={{ ...TD, textTransform: 'capitalize' }}>
                        {inv.system_role ? SYSTEM_ROLE_LABEL[inv.system_role] ?? inv.system_role : '—'}
                      </td>
                      <td style={TD}>
                        {inv.worker_type ? WORKER_TYPE_LABEL[inv.worker_type] ?? inv.worker_type : '—'}
                      </td>
                      <td style={{ ...TD, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={11} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                        {formatDate(inv.expires_at)}
                      </td>
                      <td style={{ ...TD, minWidth: '320px' }}>
                        <CopyLinkButton url={inviteUrl} />
                      </td>
                      <td style={{ ...TD, textAlign: 'right' }}>
                        <form action={revokeInvite.bind(null, inv.id)}>
                          <button
                            type="submit"
                            style={{
                              fontSize:        '0.75rem',
                              color:           'var(--color-danger)',
                              background:      'none',
                              border:          'none',
                              cursor:          'pointer',
                              padding:         '0',
                              fontWeight:      500,
                              fontFamily:      'inherit',
                            }}
                          >
                            Revoke
                          </button>
                        </form>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  )
}
