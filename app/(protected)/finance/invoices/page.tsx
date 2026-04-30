import Link from 'next/link'
import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterBar } from '@/components/shared/FilterBar'
import { DataTable } from '@/components/shared/DataTable'
import type { Column } from '@/components/shared/DataTable'
import { getInvoices } from '@/lib/invoices/queries'
import type { InvoiceWithRelations } from '@/lib/invoices/queries'
import { MoneyDisplay } from '@/components/shared/MoneyDisplay'
import { getUsdToIdrRate } from '@/lib/fx/queries'
import { formatDate } from '@/lib/utils/formatters'
import { FileText, Plus } from 'lucide-react'

export const metadata = { title: 'Invoices — ReKa Engineering OS' }

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string }>
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  draft:   { bg: '#f1f5f9', color: '#475569', label: 'Draft' },
  sent:    { bg: '#eff6ff', color: '#2563eb', label: 'Sent' },
  partial: { bg: '#fefce8', color: '#ca8a04', label: 'Partial' },
  paid:    { bg: '#f0fdf4', color: '#16a34a', label: 'Paid' },
  overdue: { bg: '#fef2f2', color: '#dc2626', label: 'Overdue' },
  void:    { bg: '#f8fafc', color: '#94a3b8', label: 'Void' },
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.draft
  return (
    <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

function invoiceColumns(fxRate: number): Column<InvoiceWithRelations>[] {
  return [
    {
      key: 'invoice_code',
      header: 'Invoice',
      render: (inv) => (
        <Link href={`/finance/invoices/${inv.id}`} style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>{inv.invoice_code}</span>
        </Link>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      render: (inv) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
          {inv.clients?.client_name ?? '—'}
        </span>
      ),
    },
    {
      key: 'project',
      header: 'Project',
      render: (inv) => inv.projects ? (
        <Link href={`/projects/${inv.project_id}`} style={{ textDecoration: 'none', fontSize: '0.75rem', color: 'var(--color-primary)' }}>
          {inv.projects.project_code}
        </Link>
      ) : <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>—</span>,
    },
    {
      key: 'gross',
      header: 'Gross',
      render: (inv) => <MoneyDisplay amount={inv.gross_amount} currency={inv.currency} fxRateToIDR={fxRate} showConversion={inv.currency === 'USD'} />,
    },
    {
      key: 'platform_fee',
      header: 'Platform Fee',
      render: (inv) => inv.platform_fee_pct > 0 ? (
        <div>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{inv.platform_fee_pct}%</span>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            -{inv.platform_type ? `(${inv.platform_type})` : ''}
          </p>
        </div>
      ) : <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>—</span>,
    },
    {
      key: 'net',
      header: 'Net Received',
      render: (inv) => <MoneyDisplay amount={inv.net_amount} currency={inv.currency} fxRateToIDR={fxRate} showConversion={inv.currency === 'USD'} />,
    },
    {
      key: 'account',
      header: 'To Account',
      render: (inv) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
          {inv.payment_accounts?.name ?? '—'}
        </span>
      ),
    },
    {
      key: 'due_date',
      header: 'Due',
      render: (inv) => (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
          {formatDate(inv.due_date)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (inv) => <InvoiceStatusBadge status={inv.status} />,
    },
  ]
}

export default async function InvoicesPage({ searchParams }: PageProps) {
  const sp = await getSessionProfile()
  requireRole(sp.system_role, ['direktur', 'finance'])

  const params = await searchParams
  const [invoices, fxRate] = await Promise.all([
    getInvoices({ search: params.search, status: params.status }).catch(() => [] as InvoiceWithRelations[]),
    getUsdToIdrRate(),
  ])

  const hasActiveFilters = Boolean(params.search || params.status)

  // Summary stats
  const totalGross = invoices.filter(i => i.status !== 'void').reduce((s, i) => s + (i.gross_amount ?? 0), 0)
  const totalNet   = invoices.filter(i => i.status !== 'void').reduce((s, i) => s + (i.net_amount ?? 0), 0)
  const outstanding = invoices.filter(i => ['sent','partial','overdue'].includes(i.status)).reduce((s, i) => s + (i.net_amount ?? 0), 0)
  const totalPaid  = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.net_amount ?? 0), 0)

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Track client invoices, platform fees, and incoming payments."
        actions={
          <Link
            href="/finance/invoices/new"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-fg)', borderRadius: 'var(--radius-control)', fontSize: '0.8125rem', fontWeight: 500, textDecoration: 'none' }}
          >
            <Plus size={14} /> New Invoice
          </Link>
        }
      />

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total Gross', amount: totalGross, note: 'Before any fees' },
          { label: 'Net Revenue', amount: totalNet, note: 'After all fees' },
          { label: 'Outstanding', amount: outstanding, note: 'Sent / partial / overdue' },
          { label: 'Collected', amount: totalPaid, note: 'Paid invoices' },
        ].map(card => (
          <div key={card.label} style={{ padding: '14px 16px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</p>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '2px' }}>
              USD {card.amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </p>
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
              ~{(card.amount * fxRate).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{card.note}</p>
          </div>
        ))}
      </div>

      <form method="GET">
        <FilterBar>
          <input name="search" type="search" defaultValue={params.search ?? ''} placeholder="Search invoices…"
            className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm placeholder:text-[var(--color-text-muted)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] min-w-[200px]" />
          <select name="status" defaultValue={params.status ?? ''}
            className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer">
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="void">Void</option>
          </select>
          <button type="submit" className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium hover:bg-[var(--color-surface-muted)] cursor-pointer">Filter</button>
          {hasActiveFilters && <Link href="/finance/invoices" className="px-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] font-medium no-underline">Clear</Link>}
        </FilterBar>
      </form>

      <SectionCard noPadding>
        {invoices.length === 0 ? (
          <EmptyState
            compact={hasActiveFilters}
            icon={<FileText size={hasActiveFilters ? 16 : 22} />}
            title={hasActiveFilters ? 'No invoices match' : 'No invoices yet'}
            description={hasActiveFilters ? 'Try different filters.' : 'Create your first invoice to start tracking client payments.'}
            action={!hasActiveFilters ? (
              <Link href="/finance/invoices/new" style={{ padding: '9px 18px', backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-fg)', borderRadius: 'var(--radius-control)', fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none' }}>New Invoice</Link>
            ) : undefined}
          />
        ) : (
          <DataTable columns={invoiceColumns(fxRate)} data={invoices} />
        )}
      </SectionCard>
    </div>
  )
}
