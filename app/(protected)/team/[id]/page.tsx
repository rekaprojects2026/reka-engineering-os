import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Pencil, ExternalLink } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'

import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { isFinance, isTD } from '@/lib/auth/permissions'
import { PageHeader }        from '@/components/layout/PageHeader'
import { SectionCard }       from '@/components/shared/SectionCard'
import { EntityStatusStrip } from '@/components/shared/EntityStatusStrip'
import { AvailabilityBadge } from '@/components/modules/team/AvailabilityBadge'
import { WorkerTypeBadge }   from '@/components/modules/team/WorkerTypeBadge'
import { RoleBadge }         from '@/components/modules/team/RoleBadge'
import { CompensationStatusBadge } from '@/components/modules/compensation/CompensationStatusBadge'
import { PaymentStatusBadge }      from '@/components/modules/payments/PaymentStatusBadge'
import { getMemberById }     from '@/lib/team/queries'
import { getCompensationByMember } from '@/lib/compensation/queries'
import { getPaymentsByMember }     from '@/lib/payments/queries'
import { formatDate, formatIDR }   from '@/lib/utils/formatters'
import { RATE_TYPE_OPTIONS, WORK_BASIS_OPTIONS } from '@/lib/constants/options'
import { getSettingOptions } from '@/lib/settings/queries'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const member = await getMemberById(id)
  return { title: member ? `${member.full_name} — ReKa Engineering OS` : 'Member not found — ReKa Engineering OS' }
}

// ── Lookup maps ───────────────────────────────────────────────

const RATE_LABEL  = Object.fromEntries(RATE_TYPE_OPTIONS.map((r) => [r.value, r.label]))
const WORK_LABEL  = Object.fromEntries(WORK_BASIS_OPTIONS.map((o) => [o.value, o.label]))

// ── Shared detail row ─────────────────────────────────────────

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '3px', fontWeight: 500 }}>
        {label}
      </p>
      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>{children}</div>
    </div>
  )
}

const GRID2: CSSProperties = {
  display:             'grid',
  gridTemplateColumns: '1fr 1fr',
  gap:                 '16px',
}

// ── Page ──────────────────────────────────────────────────────

const TH_SMALL: CSSProperties = {
  padding: '7px 12px',
  textAlign: 'left',
  fontSize: '0.6875rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  backgroundColor: 'var(--color-surface-subtle)',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  borderBottom: '1px solid var(--color-border)',
}

const TD_SMALL: CSSProperties = {
  padding: '8px 12px',
  fontSize: '0.8125rem',
  color: 'var(--color-text-secondary)',
  whiteSpace: 'nowrap',
}

export default async function TeamMemberDetailPage({ params }: PageProps) {
  const _sp = await getSessionProfile()
  requireRole(_sp.system_role, ['direktur', 'technical_director', 'finance'])

  const { id } = await params
  const member = await getMemberById(id)
  if (!member) notFound()

  const [compRecords, payRecords, funcOpts] = await Promise.all([
    getCompensationByMember(id),
    getPaymentsByMember(id),
    getSettingOptions('functional_role'),
  ])
  const FUNC_LABEL = Object.fromEntries(funcOpts.map((r) => [r.value, r.label]))

  const canEditTeamMember = isTD(_sp.system_role) || isFinance(_sp.system_role)

  const activeColor =
    member.active_status === 'active'   ? 'var(--color-success)' :
    member.active_status === 'inactive' ? 'var(--color-text-muted)' :
    'var(--color-neutral)'

  const rateFormatted = (n: number | null) =>
    n ? Number(n).toLocaleString('id-ID') : null

  return (
    <div>
      <PageHeader
        title={member.full_name}
        subtitle={[
          member.worker_type ? member.worker_type.charAt(0).toUpperCase() + member.worker_type.slice(1) : null,
          member.discipline ? member.discipline.charAt(0).toUpperCase() + member.discipline.slice(1) : null,
          member.city ?? null,
        ].filter(Boolean).join(' · ') || 'Team member'}
        actions={
          canEditTeamMember ? (
            <Link
              href={`/team/${member.id}/edit`}
              style={{
                display:         'inline-flex',
                alignItems:      'center',
                gap:             '6px',
                padding:         '8px 14px',
                backgroundColor: 'var(--color-surface)',
                border:          '1px solid var(--color-border)',
                borderRadius:    'var(--radius-control)',
                fontSize:        '0.8125rem',
                fontWeight:      500,
                color:           'var(--color-text-primary)',
                textDecoration:  'none',
              }}
            >
              <Pencil size={13} aria-hidden="true" />
              Edit
            </Link>
          ) : null
        }
      />

      <EntityStatusStrip
        statusBadge={<AvailabilityBadge status={member.availability_status} />}
        priorityBadge={
          member.worker_type ? <WorkerTypeBadge type={member.worker_type} /> : undefined
        }
        extraBadge={
          <span style={{ color: activeColor, fontWeight: 600, textTransform: 'capitalize', fontSize: '0.75rem' }}>
            {member.active_status}
          </span>
        }
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* ── Identity ─────────────────────────────────────────── */}
        <SectionCard title="Identity">
          <div style={GRID2}>
            <DetailRow label="Full Name">{member.full_name}</DetailRow>
            <DetailRow label="Email">
              <a href={`mailto:${member.email}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                {member.email}
              </a>
            </DetailRow>
            <DetailRow label="Phone / WhatsApp">
              {member.phone
                ? <a href={`tel:${member.phone}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>{member.phone}</a>
                : '—'}
            </DetailRow>
            <DetailRow label="City">{member.city ?? '—'}</DetailRow>
            <DetailRow label="Joined">{formatDate(member.joined_date)}</DetailRow>
            <DetailRow label="Portfolio / LinkedIn">
              {member.portfolio_link ? (
                <a
                  href={member.portfolio_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--color-primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  View link <ExternalLink size={11} />
                </a>
              ) : '—'}
            </DetailRow>
          </div>
        </SectionCard>

        {/* ── Role & Work ──────────────────────────────────────── */}
        <SectionCard title="Role &amp; Work">
          <div style={GRID2}>
            <DetailRow label="System Role">
              <RoleBadge role={member.system_role} />
            </DetailRow>
            <DetailRow label="Worker Type">
              {member.worker_type
                ? <WorkerTypeBadge type={member.worker_type} />
                : '—'}
            </DetailRow>
            <DetailRow label="Discipline">
              {member.discipline
                ? <span style={{ textTransform: 'capitalize' }}>{member.discipline}</span>
                : '—'}
            </DetailRow>
            <DetailRow label="Functional Role">
              {member.functional_role
                ? FUNC_LABEL[member.functional_role] ?? member.functional_role
                : '—'}
            </DetailRow>
          </div>
        </SectionCard>

        {/* ── Status & Rate ─────────────────────────────────────── */}
        <SectionCard title="Status &amp; Rate">
          <div style={GRID2}>
            <DetailRow label="Rate Type">
              {member.rate_type ? RATE_LABEL[member.rate_type] ?? member.rate_type : '—'}
            </DetailRow>
            <DetailRow label="Currency">{member.currency_code}</DetailRow>
            <DetailRow label="Expected Rate">
              {rateFormatted(member.expected_rate)
                ? <span style={{ fontFamily: 'monospace' }}>{rateFormatted(member.expected_rate)} {member.currency_code}</span>
                : '—'}
            </DetailRow>
            <DetailRow label="Approved Rate">
              {rateFormatted(member.approved_rate)
                ? <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {rateFormatted(member.approved_rate)} {member.currency_code}
                  </span>
                : '—'}
            </DetailRow>
          </div>
        </SectionCard>

        {/* ── Internal Notes ────────────────────────────────────── */}
        {member.notes_internal && (
          <SectionCard title="Internal Notes">
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {member.notes_internal}
            </p>
          </SectionCard>
        )}

        {/* ── Compensation Records ────────────────────────────── */}
        <SectionCard
          title="Compensation Records"
          noPadding
          actions={
            <Link
              href={`/compensation/new`}
              style={{ fontSize: '0.75rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}
            >
              + Add
            </Link>
          }
        >
          {compRecords.length === 0 ? (
            <p style={{ padding: '20px 16px', fontSize: '0.8125rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
              No compensation records for this member yet.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Project', 'Type', 'Qty', 'Subtotal', 'Period', 'Status', ''].map((h) => (
                      <th key={h} style={TH_SMALL}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {compRecords.slice(0, 10).map((c, idx) => (
                    <tr key={c.id} style={{ borderBottom: idx === Math.min(compRecords.length, 10) - 1 ? undefined : '1px solid var(--color-border)' }}>
                      <td style={{ ...TD_SMALL, fontWeight: 500, color: 'var(--color-text-primary)' }}>{c.project?.name ?? '—'}</td>
                      <td style={TD_SMALL}>{WORK_LABEL[c.rate_type] ?? c.rate_type}</td>
                      <td style={{ ...TD_SMALL, fontFamily: 'monospace', fontSize: '0.75rem' }}>{Number(c.qty)}</td>
                      <td style={{ ...TD_SMALL, fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 600 }}>{formatIDR(c.subtotal_amount)}</td>
                      <td style={TD_SMALL}>{c.period_label ?? (c.work_date ? formatDate(c.work_date) : '—')}</td>
                      <td style={TD_SMALL}><CompensationStatusBadge status={c.status} /></td>
                      <td style={{ ...TD_SMALL, textAlign: 'right' }}>
                        <Link href={`/compensation/${c.id}`} style={{ fontSize: '0.6875rem', color: 'var(--color-primary)', textDecoration: 'none' }}>View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {compRecords.length > 10 && (
                <div style={{ padding: '8px 12px', textAlign: 'center' }}>
                  <Link href={`/compensation`} style={{ fontSize: '0.75rem', color: 'var(--color-primary)', textDecoration: 'none' }}>
                    View all {compRecords.length} records →
                  </Link>
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* ── Payment Records ─────────────────────────────────── */}
        <SectionCard
          title="Payment Records"
          noPadding
          actions={
            <Link
              href={`/payments/new`}
              style={{ fontSize: '0.75rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}
            >
              + Add
            </Link>
          }
        >
          {payRecords.length === 0 ? (
            <p style={{ padding: '20px 16px', fontSize: '0.8125rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
              No payment records for this member yet.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Period', 'Due', 'Paid', 'Balance', 'Status', ''].map((h) => (
                      <th key={h} style={TH_SMALL}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payRecords.slice(0, 10).map((p, idx) => (
                    <tr key={p.id} style={{ borderBottom: idx === Math.min(payRecords.length, 10) - 1 ? undefined : '1px solid var(--color-border)' }}>
                      <td style={{ ...TD_SMALL, fontWeight: 500, color: 'var(--color-text-primary)' }}>{p.period_label ?? '—'}</td>
                      <td style={{ ...TD_SMALL, fontFamily: 'monospace', fontSize: '0.75rem' }}>{formatIDR(p.total_due)}</td>
                      <td style={{ ...TD_SMALL, fontFamily: 'monospace', fontSize: '0.75rem' }}>{formatIDR(p.total_paid)}</td>
                      <td style={{ ...TD_SMALL, fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 600, color: Number(p.balance) > 0 ? 'var(--color-warning)' : 'var(--color-text-primary)' }}>
                        {formatIDR(p.balance)}
                      </td>
                      <td style={TD_SMALL}><PaymentStatusBadge status={p.payment_status} /></td>
                      <td style={{ ...TD_SMALL, textAlign: 'right' }}>
                        <Link href={`/payments/${p.id}`} style={{ fontSize: '0.6875rem', color: 'var(--color-primary)', textDecoration: 'none' }}>View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {payRecords.length > 10 && (
                <div style={{ padding: '8px 12px', textAlign: 'center' }}>
                  <Link href={`/payments`} style={{ fontSize: '0.75rem', color: 'var(--color-primary)', textDecoration: 'none' }}>
                    View all {payRecords.length} records →
                  </Link>
                </div>
              )}
            </div>
          )}
        </SectionCard>

      </div>
    </div>
  )
}
