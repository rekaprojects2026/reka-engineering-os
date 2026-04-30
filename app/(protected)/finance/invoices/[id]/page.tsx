import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { isFinance } from '@/lib/auth/permissions'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { MoneyDisplay } from '@/components/shared/MoneyDisplay'
import { getInvoiceById } from '@/lib/invoices/queries'
import { getUsdToIdrRate } from '@/lib/fx/queries'
import { getPaymentAccounts } from '@/lib/payment-accounts/queries'
import { updateInvoiceStatus, recordIncomingPayment } from '@/lib/invoices/actions'
import { formatDate } from '@/lib/utils/formatters'
import { ArrowLeft } from 'lucide-react'
import { DownloadInvoicePdfButton } from '@/components/modules/invoices/DownloadInvoicePdfButton'
import { RecordPaymentForm } from '@/components/modules/invoices/RecordPaymentForm'

export const metadata = { title: 'Invoice — ReKa Engineering OS' }

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  draft:   { bg: '#f1f5f9', color: '#475569', label: 'Draft' },
  sent:    { bg: '#eff6ff', color: '#2563eb', label: 'Sent' },
  partial: { bg: '#fefce8', color: '#ca8a04', label: 'Partial' },
  paid:    { bg: '#f0fdf4', color: '#16a34a', label: 'Paid' },
  overdue: { bg: '#fef2f2', color: '#dc2626', label: 'Overdue' },
  void:    { bg: '#f8fafc', color: '#94a3b8', label: 'Void' },
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  const sp = await getSessionProfile()
  requireRole(sp.system_role, ['direktur', 'finance'])

  const { id } = await params
  const [invoice, fxRate, accounts] = await Promise.all([
    getInvoiceById(id),
    getUsdToIdrRate(),
    getPaymentAccounts(true),
  ])

  if (!invoice) notFound()

  const statusStyle = STATUS_STYLES[invoice.status] ?? STATUS_STYLES.draft
  const canRecord = isFinance(sp.system_role) && invoice.status !== 'paid' && invoice.status !== 'void'
  const canUpdateStatus = isFinance(sp.system_role)

  async function handleStatusUpdate(formData: FormData) {
    'use server'
    const status = formData.get('status') as string
    await updateInvoiceStatus(id, status)
  }

  async function handleRecordPayment(formData: FormData) {
    'use server'
    formData.set('invoice_id', id)
    await recordIncomingPayment(formData)
  }

  const totalReceived = invoice.total_received ?? 0
  const remainingBalance = (invoice.net_amount ?? 0) - totalReceived

  return (
    <div>
      <div style={{ marginBottom: '4px' }}>
        <Link href="/finance/invoices" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.8125rem', color: 'var(--color-text-muted)', textDecoration: 'none' }}>
          <ArrowLeft size={13} /> Back to Invoices
        </Link>
      </div>

      <PageHeader
        title={invoice.invoice_code || 'Invoice'}
        subtitle={`${invoice.clients?.client_name ?? 'Unknown client'} · ${invoice.projects ? invoice.projects.project_code : 'No project'}`}
        actions={
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
            <DownloadInvoicePdfButton invoiceId={invoice.id} invoiceNumber={invoice.invoice_code || invoice.id} />
            <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '0.8125rem', fontWeight: 600, backgroundColor: statusStyle.bg, color: statusStyle.color }}>
              {statusStyle.label}
            </span>
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px', alignItems: 'start' }}>

        {/* Left: Invoice details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Header info */}
          <SectionCard>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Invoice</p>
                <p style={{ fontSize: '0.875rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-text-primary)' }}>{invoice.invoice_code}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Issue Date</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{formatDate(invoice.issue_date)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Due Date</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{formatDate(invoice.due_date)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Client</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>{invoice.clients?.client_name ?? '—'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Project</p>
                {invoice.projects ? (
                  <Link href={`/projects/${invoice.project_id}`} style={{ fontSize: '0.875rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>
                    {invoice.projects.project_code}
                  </Link>
                ) : <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>—</p>}
              </div>
              <div>
                <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>To Account</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{invoice.payment_accounts?.name ?? '—'}</p>
              </div>
            </div>

            {invoice.notes && (
              <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--color-border)' }}>
                <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Notes</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{invoice.notes}</p>
              </div>
            )}
          </SectionCard>

          {/* Line Items */}
          {(invoice.line_items && invoice.line_items.length > 0) && (
            <SectionCard title="Line Items" noPadding>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '8px 16px', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</th>
                    <th style={{ padding: '8px 16px', textAlign: 'right', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Qty</th>
                    <th style={{ padding: '8px 16px', textAlign: 'right', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unit Price</th>
                    <th style={{ padding: '8px 16px', textAlign: 'right', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.line_items.map((item, i) => (
                    <tr key={item.id} style={{ borderBottom: i < invoice.line_items!.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                      <td style={{ padding: '10px 16px', fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>{item.description}</td>
                      <td style={{ padding: '10px 16px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', textAlign: 'right' }}>{item.qty}</td>
                      <td style={{ padding: '10px 16px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', textAlign: 'right', fontFamily: 'monospace' }}>
                        {invoice.currency} {(item.unit_price ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: '0.8125rem', color: 'var(--color-text-primary)', textAlign: 'right', fontFamily: 'monospace', fontWeight: 500 }}>
                        {invoice.currency} {(item.subtotal ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
          )}

          {/* Payments history */}
          {(invoice.incoming_payments && invoice.incoming_payments.length > 0) && (
            <SectionCard title="Payment History" noPadding>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '8px 16px', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                    <th style={{ padding: '8px 16px', textAlign: 'right', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</th>
                    <th style={{ padding: '8px 16px', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ref</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.incoming_payments.map((pmt, i) => (
                    <tr key={pmt.id} style={{ borderBottom: i < invoice.incoming_payments!.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                      <td style={{ padding: '10px 16px', fontSize: '0.8125rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{formatDate(pmt.payment_date)}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        <MoneyDisplay amount={pmt.amount_received} currency={pmt.currency ?? invoice.currency} fxRateToIDR={pmt.fx_rate_snapshot ?? fxRate} showConversion={pmt.currency === 'USD'} />
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {pmt.payment_reference ?? '—'}
                        {pmt.proof_link && (
                          <a href={pmt.proof_link} target="_blank" rel="noreferrer" style={{ marginLeft: '8px', color: 'var(--color-primary)', textDecoration: 'none', fontSize: '0.6875rem' }}>proof ↗</a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
          )}
        </div>

        {/* Right: Summary + actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Amount summary card */}
          <SectionCard>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Summary</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Gross</span>
                <MoneyDisplay amount={invoice.gross_amount} currency={invoice.currency} fxRateToIDR={invoice.fx_rate_snapshot ?? fxRate} showConversion={invoice.currency === 'USD'} />
              </div>

              {invoice.platform_fee_pct > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                    Platform fee {invoice.platform_type ? `(${invoice.platform_type})` : ''} {invoice.platform_fee_pct}%
                  </span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-danger)', fontFamily: 'monospace' }}>
                    -{invoice.currency} {(invoice.platform_fee_amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {invoice.gateway_fee_pct > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Gateway fee {invoice.gateway_fee_pct}%</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-danger)', fontFamily: 'monospace' }}>
                    -{invoice.currency} {(invoice.gateway_fee_amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Net Received</span>
                <MoneyDisplay amount={invoice.net_amount} currency={invoice.currency} fxRateToIDR={invoice.fx_rate_snapshot ?? fxRate} showConversion={invoice.currency === 'USD'} size="lg" />
              </div>

              {totalReceived > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-success)' }}>Received</span>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-success)', fontFamily: 'monospace', fontWeight: 600 }}>
                      {invoice.currency} {totalReceived.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: remainingBalance > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                      {remainingBalance > 0 ? 'Balance Due' : 'Fully Paid'}
                    </span>
                    <span style={{ fontSize: '0.875rem', fontFamily: 'monospace', fontWeight: 700, color: remainingBalance > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                      {remainingBalance > 0 ? `${invoice.currency} ${remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '✓'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </SectionCard>

          {/* Status update (admin) */}
          {canUpdateStatus && (
            <SectionCard>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Update Status</p>
              <form action={handleStatusUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <select
                  name="status"
                  defaultValue={invoice.status}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', fontSize: '0.875rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="void">Void</option>
                </select>
                <button
                  type="submit"
                  style={{ padding: '7px 14px', backgroundColor: 'var(--color-surface-muted)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer', color: 'var(--color-text-primary)' }}
                >
                  Save Status
                </button>
              </form>
            </SectionCard>
          )}

          {/* Record payment */}
          {canRecord && (
            <SectionCard title="Record Payment">
              <RecordPaymentForm
                invoiceId={id}
                currency={invoice.currency}
                accounts={accounts}
                fxRate={fxRate}
                onSubmit={handleRecordPayment}
              />
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  )
}
