import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'

import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { PageHeader }  from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { EntityStatusStrip } from '@/components/shared/EntityStatusStrip'
import { CompensationStatusBadge } from '@/components/modules/compensation/CompensationStatusBadge'
import { getCompensationById } from '@/lib/compensation/queries'
import { deleteCompensation as _deleteCompensation } from '@/lib/compensation/actions'
import { formatDate, formatIDR } from '@/lib/utils/formatters'
import { WORK_BASIS_OPTIONS } from '@/lib/constants/options'

interface PageProps { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const record = await getCompensationById(id)
  return {
    title: record
      ? `Compensation — ${record.member?.full_name ?? 'Record'} — ReKa Engineering OS`
      : `Not found — ReKa Engineering OS`,
  }
}

async function handleDelete(id: string) {
  'use server'
  await _deleteCompensation(id)
}

const RATE_LABEL = Object.fromEntries(WORK_BASIS_OPTIONS.map((o) => [o.value, o.label]))

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
  requireRole(_sp.system_role, ['admin'])

  const { id } = await params
  const r = await getCompensationById(id)
  if (!r) notFound()

  return (
    <div>
      <PageHeader
        title={`Compensation — ${r.member?.full_name ?? 'Unknown'}`}
        subtitle={r.project?.name ?? ''}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
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
            <form action={handleDelete.bind(null, r.id)}>
              <button
                type="submit"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', backgroundColor: 'var(--color-danger-subtle)',
                  border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-control)',
                  fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-danger)',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <Trash2 size={13} aria-hidden="true" /> Delete
              </button>
            </form>
          </div>
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
        <SectionCard title="Work Context">
          <div style={GRID2}>
            <DetailRow label="Member">{r.member?.full_name ?? '—'}</DetailRow>
            <DetailRow label="Project">{r.project?.name ?? '—'}</DetailRow>
            <DetailRow label="Task ID">{r.task_id ?? '—'}</DetailRow>
            <DetailRow label="Deliverable ID">{r.deliverable_id ?? '—'}</DetailRow>
          </div>
        </SectionCard>

        <SectionCard title="Rate &amp; Amount">
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

        <SectionCard title="Period &amp; Status">
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
