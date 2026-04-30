import Link from 'next/link'
import { FileWarning, Receipt, Landmark, TrendingUp, Wallet, Send } from 'lucide-react'

import type { SessionProfile } from '@/lib/auth/session'
import type { FinanceDashboardData } from '@/lib/dashboard/finance-queries'
import { PageHeader } from '@/components/layout/PageHeader'
import { KpiCard, KpiStrip } from '@/components/shared/KpiCard'
import { DashboardSection, TH_CLASS, TD_CLASS, ROW_LINK_CLASS } from '@/components/modules/dashboard/dashboard-shared'
import { PaymentSnapshotCard } from '@/components/modules/dashboard/PaymentSnapshotCard'
import { formatDate, formatIDR } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'

export function DashboardFinance({ data, profile }: { data: FinanceDashboardData; profile: SessionProfile }) {
  return (
    <div className="page-content animate-fade-in space-y-6">
      <PageHeader title="Dashboard" subtitle={`${profile.full_name} — Receivables, payables, and confirmations.`} />

      <KpiStrip className="lg:grid-cols-4 xl:grid-cols-4">
        <KpiCard
          title="Outstanding invoices"
          value={data.invoiceSummary.outstanding.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
          icon={FileWarning}
          variant="warning"
        />
        <KpiCard
          title="Overdue (count)"
          value={data.overdueCount}
          subtitle={formatIDR(data.overdueAmountNet)}
          icon={FileWarning}
          variant={data.overdueCount > 0 ? 'danger' : 'default'}
        />
        <KpiCard
          title="Collected (net)"
          value={data.invoiceSummary.paid.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
          icon={TrendingUp}
          accent="primary"
        />
        <KpiCard title="Pending compensation" value={data.pendingCompensationDrafts} icon={Receipt} variant={data.pendingCompensationDrafts > 0 ? 'warning' : 'default'} />
      </KpiStrip>

      <KpiStrip className="lg:grid-cols-4 xl:grid-cols-4">
        <KpiCard title="Payslips — draft" value={data.payslipStats.draftCount} icon={Wallet} />
        <KpiCard title="Payslips — sent" value={data.payslipStats.sentCount} icon={Send} />
        <KpiCard title="Payslips — paid" value={data.payslipStats.paidCount} icon={TrendingUp} />
        <KpiCard
          title="Team payments outstanding"
          value={formatIDR(data.paymentSnapshot.totalOutstanding)}
          icon={Landmark}
          variant={data.paymentSnapshot.unpaidCount + data.paymentSnapshot.partialCount > 0 ? 'warning' : 'default'}
          subtitle={`${data.paymentSnapshot.unpaidCount + data.paymentSnapshot.partialCount} open`}
        />
      </KpiStrip>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardSection title="Compensation to confirm" description="Draft rows awaiting your review.">
          {data.pendingCompensations.length === 0 ? (
            <p className="m-0 text-sm text-[var(--color-text-muted)]">No draft compensation records.</p>
          ) : (
            <ul className="m-0 list-none space-y-2 p-0">
              {data.pendingCompensations.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2" style={{ borderColor: 'var(--color-border)' }}>
                  <Link href={`/compensation/${c.id}`} className={ROW_LINK_CLASS}>
                    {c.member?.full_name ?? 'Member'}
                  </Link>
                  <span className="font-mono text-[0.75rem] text-[var(--color-text-secondary)]">
                    {formatIDR(c.subtotal_amount)} {c.currency_code}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3">
            <Link href="/compensation?view=pending" className="text-[0.8125rem] font-medium text-[var(--color-primary)] no-underline hover:underline">
              Open compensation →
            </Link>
          </div>
        </DashboardSection>

        <DashboardSection title="Overdue invoices" description="Follow up on collection.">
          {data.overdueInvoices.length === 0 ? (
            <p className="m-0 text-sm text-[var(--color-text-muted)]">No overdue invoices.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={TH_CLASS}>Invoice</th>
                    <th className={TH_CLASS}>Client</th>
                    <th className={TH_CLASS}>Due</th>
                    <th className={cn(TH_CLASS, 'text-right')}>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {data.overdueInvoices.map((inv, i) => (
                    <tr key={inv.id} className={cn(i < data.overdueInvoices.length - 1 && 'border-b border-[var(--color-border)]')}>
                      <td className={TD_CLASS}>
                        <Link href="/finance/invoices" className={ROW_LINK_CLASS}>
                          {inv.invoice_code}
                        </Link>
                      </td>
                      <td className={TD_CLASS}>{inv.clients?.client_name ?? '—'}</td>
                      <td className={TD_CLASS}>{inv.due_date ? formatDate(inv.due_date) : '—'}</td>
                      <td className={cn(TD_CLASS, 'text-right tabular-nums')}>
                        {inv.net_amount.toLocaleString('en-US', { style: 'currency', currency: inv.currency ?? 'USD' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DashboardSection>
      </div>

      <DashboardSection title="Payment snapshot">
        <PaymentSnapshotCard snapshot={data.paymentSnapshot} />
      </DashboardSection>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardSection title="Recent invoices">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[0.8125rem]">
              <thead>
                <tr>
                  <th className={TH_CLASS}>Code</th>
                  <th className={TH_CLASS}>Status</th>
                  <th className={TH_CLASS}>Updated</th>
                </tr>
              </thead>
              <tbody>
                {data.recentInvoices.map((r, i) => (
                  <tr key={r.id} className={cn(i < data.recentInvoices.length - 1 && 'border-b border-[var(--color-border)]')}>
                    <td className={TD_CLASS}>
                      <Link href="/finance/invoices" className={ROW_LINK_CLASS}>
                        {r.invoice_code}
                      </Link>
                    </td>
                    <td className={TD_CLASS}>{r.status}</td>
                    <td className={TD_CLASS}>{formatDate(r.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardSection>

        <DashboardSection title="Recent payslips">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[0.8125rem]">
              <thead>
                <tr>
                  <th className={TH_CLASS}>Code</th>
                  <th className={TH_CLASS}>Status</th>
                  <th className={TH_CLASS}>Updated</th>
                </tr>
              </thead>
              <tbody>
                {data.recentPayslips.map((r, i) => (
                  <tr key={r.id} className={cn(i < data.recentPayslips.length - 1 && 'border-b border-[var(--color-border)]')}>
                    <td className={TD_CLASS}>
                      <Link href="/finance/payslips" className={ROW_LINK_CLASS}>
                        {r.payslip_code}
                      </Link>
                    </td>
                    <td className={TD_CLASS}>{r.status}</td>
                    <td className={TD_CLASS}>{formatDate(r.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardSection>
      </div>
    </div>
  )
}
