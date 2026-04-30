import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'

import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { EntityStatusStrip } from '@/components/shared/EntityStatusStrip'
import { CompensationStatusBadge } from '@/components/modules/compensation/CompensationStatusBadge'
import { CompensationRecordActions } from '@/components/modules/compensation/CompensationRecordActions'
import { getCompensationById } from '@/lib/compensation/queries'
import { formatDate, formatIDR } from '@/lib/utils/formatters'
import { RATE_TYPE_OPTIONS, WORK_BASIS_OPTIONS } from '@/lib/constants/options'

interface PageProps { params: Promise<{ id: string }> }

const RATE_LABEL: Record<string, string> = {
  ...Object.fromEntries(WORK_BASIS_OPTIONS.map((o) => [o.value, o.label])),
  ...Object.fromEntries(RATE_TYPE_OPTIONS.map((o) => [o.value, o.label])),
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const record = await getCompensationById(id)
  return {
    title: record
      ? `Compensation — ${record.member?.full_name ?? 'Record'} — ReKa Engineering OS`
      : `Not found — ReKa Engineering OS`,
  }
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '3px', fontWeight: 500 }}>{label}</p>
      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>{children}</div>
    </div>
  )
}

const GRID2: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }

export default async function CompensationDetailPage({ params }: PageProps) {
  const _sp = await getSessionProfile()
  requireRole(_sp.system_role, ['direktur', 'technical_director', 'finance', 'manajer'])

  const { id } = await params
  const r = await getCompensationById(id)
  if (!r) notFound()

  const isDirektur = _sp.system_role === 'direktur'
  const isFinance = _sp.system_role === 'finance'
  const isProposerRole = _sp.system_role === 'technical_director' || _sp.system_role === 'manajer'
  const ownDraft = r.status === 'draft' && r.proposed_by === _sp.id

  const canEdit =
    !isDirektur &&
    (isFinance || (isProposerRole && ownDraft))

  const canDelete =
    !isDirektur &&
    ((isFinance && r.status === 'draft') || (isProposerRole && ownDraft && r.status === 'draft'))

  return (
    <div>
      <PageHeader
        title={`Compensation — ${r.member?.full_name ?? 'Unknown'}`}
        subtitle={r.project?.name ?? ''}
        actions={
          canEdit ? (
            <Link
              href={`/compensation/${r.id}/edit`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)',
                fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-primary)',
                textDecoration: 'none',
              }}
            >
              <Pencil size={13} aria-hidden="true" /> Edit
            </Link>
          ) : null
        }
      />

      <EntityStatusStrip
        statusBadge={<CompensationStatusBadge status={r.status} />}
        extraBadge={
          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {formatIDR(r.subtotal_amount)}
          </span>
        }
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <SectionCard title="Workflow">
          <div style={GRID2}>
            <DetailRow label="Proposed by">{r.proposer?.full_name ?? '—'}</DetailRow>
            <DetailRow label="Proposed at">{r.proposed_at ? formatDate(r.proposed_at) : '—'}</DetailRow>
            <DetailRow label="Confirmed by">{r.confirmer?.full_name ?? '—'}</DetailRow>
            <DetailRow label="Confirmed at">{r.confirmed_at ? formatDate(r.confirmed_at) : '—'}</DetailRow>
            <DetailRow label="Monthly fixed (direct)">{r.is_monthly_fixed_direct ? 'Yes' : 'No'}</DetailRow>
          </div>
          {r.return_note && (
            <div style={{ marginTop: '14px', padding: '12px', borderRadius: 'var(--radius-control)', backgroundColor: 'var(--color-warning-subtle)', border: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>Catatan pengembalian dari Finance</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{r.return_note}</p>
            </div>
          )}
          {r.finance_note && (
            <div style={{ marginTop: '12px' }}>
              <DetailRow label="Finance note">{r.finance_note}</DetailRow>
            </div>
          )}

          {!isDirektur && (
            <div style={{ marginTop: '18px' }}>
              <CompensationRecordActions
                compensationId={r.id}
                status={r.status}
                proposedBy={r.proposed_by}
                currentUserId={_sp.id}
                isFinance={isFinance}
                canDelete={Boolean(canDelete)}
              />
            </div>
          )}
        </SectionCard>

        <SectionCard title="Work Context">
          <div style={GRID2}>
            <DetailRow label="Member">{r.member?.full_name ?? '—'}</DetailRow>
            <DetailRow label="Project">{r.project?.name ?? '—'}</DetailRow>
            <DetailRow label="Task ID">{r.task_id ?? '—'}</DetailRow>
            <DetailRow label="Deliverable ID">{r.deliverable_id ?? '—'}</DetailRow>
          </div>
        </SectionCard>

        <SectionCard title="Rate & Amount">
          <div style={GRID2}>
            <DetailRow label="Rate Type">{RATE_LABEL[r.rate_type] ?? r.rate_type}</DetailRow>
            <DetailRow label="Quantity"><span style={{ fontFamily: 'monospace' }}>{Number(r.qty)}</span></DetailRow>
            <DetailRow label="Rate Amount">
              <span style={{ fontFamily: 'monospace' }}>{formatIDR(r.rate_amount)}</span>
            </DetailRow>
            <DetailRow label="Subtotal">
              <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.875rem' }}>{formatIDR(r.subtotal_amount)}</span>
            </DetailRow>
            <DetailRow label="Currency">{r.currency_code}</DetailRow>
          </div>
        </SectionCard>

        <SectionCard title="Period & Record">
          <div style={GRID2}>
            <DetailRow label="Period Label">{r.period_label ?? '—'}</DetailRow>
            <DetailRow label="Work Date">{formatDate(r.work_date)}</DetailRow>
            <DetailRow label="Created">{formatDate(r.created_at)}</DetailRow>
          </div>
        </SectionCard>

        {r.notes && (
          <SectionCard title="Notes">
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {r.notes}
            </p>
          </SectionCard>
        )}
      </div>
    </div>
  )
}
