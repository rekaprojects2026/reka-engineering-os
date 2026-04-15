import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Pencil, ExternalLink } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'

import { PageHeader }        from '@/components/layout/PageHeader'
import { SectionCard }       from '@/components/shared/SectionCard'
import { AvailabilityBadge } from '@/components/modules/team/AvailabilityBadge'
import { WorkerTypeBadge }   from '@/components/modules/team/WorkerTypeBadge'
import { getMemberById }     from '@/lib/team/queries'
import { formatDate }        from '@/lib/utils/formatters'
import { FUNCTIONAL_ROLES, RATE_TYPE_OPTIONS, SYSTEM_ROLES } from '@/lib/constants/options'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const member = await getMemberById(id)
  return { title: member ? `${member.full_name} — Engineering Agency OS` : 'Member Not Found' }
}

// ── Lookup maps ───────────────────────────────────────────────

const FUNC_LABEL  = Object.fromEntries(FUNCTIONAL_ROLES.map((r) => [r.value, r.label]))
const RATE_LABEL  = Object.fromEntries(RATE_TYPE_OPTIONS.map((r) => [r.value, r.label]))
const ROLE_LABEL  = Object.fromEntries(SYSTEM_ROLES.map((r) => [r.value, r.label]))

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

export default async function TeamMemberDetailPage({ params }: PageProps) {
  const { id } = await params
  const member = await getMemberById(id)
  if (!member) notFound()

  const activeColor =
    member.active_status === 'active'   ? 'var(--color-success)' :
    member.active_status === 'inactive' ? 'var(--color-text-muted)' :
    '#94A3B8'

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
          <Link
            href={`/team/${member.id}/edit`}
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
            <Pencil size={13} aria-hidden="true" />
            Edit
          </Link>
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
              {member.system_role ? ROLE_LABEL[member.system_role] ?? member.system_role : '—'}
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
            <DetailRow label="Active Status">
              <span style={{ color: activeColor, fontWeight: 500, textTransform: 'capitalize' }}>
                {member.active_status}
              </span>
            </DetailRow>
            <DetailRow label="Availability">
              <AvailabilityBadge status={member.availability_status} />
            </DetailRow>
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

      </div>
    </div>
  )
}
