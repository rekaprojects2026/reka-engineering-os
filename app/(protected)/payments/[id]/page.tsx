import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Pencil, Trash2, ExternalLink } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'

import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { PageHeader }  from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { EntityStatusStrip } from '@/components/shared/EntityStatusStrip'
import { PaymentStatusBadge } from '@/components/modules/payments/PaymentStatusBadge'
import { safePaymentProofHref } from '@/lib/payments/proof-link'
import { getPaymentById } from '@/lib/payments/queries'
import { deletePayment as _deletePayment } from '@/lib/payments/actions'
import { formatDate, formatIDR } from '@/lib/utils/formatters'
import { getSettingOptions } from '@/lib/settings/queries'

interface PageProps { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const record = await getPaymentById(id)
  return {
    title: record
      ? `Payment — ${record.member?.full_name ?? 'Record'} — ReKa Engineering OS`
      : `Not found — ReKa Engineering OS`,
  }
}

async function handleDelete(id: string) {
  'use server'
  await _deletePayment(id)
}

// METHOD_LABEL built dynamically inside the component

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '3px', fontWeight: 500 }}>{label}</p>
      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>{children}</div>
    </div>
  )
}

const GRID2: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }

export default async function PaymentDetailPage({ params }: PageProps) {
  const _sp = await getSessionProfile()
  requireRole(_sp.system_role, ['admin'])

  const { id } = await params
  const [r, pmOpts] = await Promise.all([
    getPaymentById(id),
    getSettingOptions('payment_method'),
  ])
  if (!r) notFound()
  const METHOD_LABEL = Object.fromEntries(pmOpts.map((o) => [o.value, o.label]))
  const proofHref = r.proof_link ? safePaymentProofHref(r.proof_link) : null

  return (
    <div>
      <PageHeader
        title={`Payment — ${r.member?.full_name ?? 'Unknown'}`}
        subtitle={r.period_label ?? ''}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link
              href={`/payments/${r.id}/edit`}
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
        statusBadge={<PaymentStatusBadge status={r.payment_status} />}
        priorityBadge={
          r.period_label ? (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              {r.period_label}
            </span>
          ) : undefined
        }
        extraBadge={
          <span style={{
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: Number(r.balance) > 0 ? 'var(--color-warning)' : 'var(--color-success)',
          }}>
            Balance {formatIDR(r.balance)}
          </span>
        }
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <SectionCard title="Member &amp; Period">
          <div style={GRID2}>
            <DetailRow label="Member">{r.member?.full_name ?? '—'}</DetailRow>
            <DetailRow label="Period">{r.period_label ?? '—'}</DetailRow>
          </div>
        </SectionCard>

        <SectionCard title="Amounts (IDR)">
          <div style={GRID2}>
            <DetailRow label="Total Due">
              <span style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{formatIDR(r.total_due)}</span>
            </DetailRow>
            <DetailRow label="Total Paid">
              <span style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{formatIDR(r.total_paid)}</span>
            </DetailRow>
            <DetailRow label="Balance">
              <span style={{
                fontFamily: 'monospace',
                fontSize: '0.9375rem',
                fontWeight: 700,
                color: Number(r.balance) > 0 ? 'var(--color-warning)' : 'var(--color-success)',
              }}>
                {formatIDR(r.balance)}
              </span>
            </DetailRow>
          </div>
        </SectionCard>

        <SectionCard title="Payment Details">
          <div style={GRID2}>
            <DetailRow label="Payment Date">{formatDate(r.payment_date)}</DetailRow>
            <DetailRow label="Payment Method">
              {r.payment_method ? METHOD_LABEL[r.payment_method] ?? r.payment_method : '—'}
            </DetailRow>
            <DetailRow label="Payment Reference">{r.payment_reference ?? '—'}</DetailRow>
            <DetailRow label="Proof Link">
              {r.proof_link && proofHref ? (
                <a
                  href={proofHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--color-primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  View proof <ExternalLink size={11} />
                </a>
              ) : r.proof_link ? (
                <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all', color: 'var(--color-text-muted)' }}>
                  {r.proof_link} (not a safe http(s) link)
                </span>
              ) : (
                '—'
              )}
            </DetailRow>
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
