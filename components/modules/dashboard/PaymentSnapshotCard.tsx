import Link from 'next/link'

import type { PaymentSnapshot } from '@/lib/dashboard/queries'
import { formatIDR } from '@/lib/utils/formatters'

export function PaymentSnapshotCard({ snapshot }: { snapshot: PaymentSnapshot }) {
  const {
    unpaidCount,
    partialCount,
    paidCount,
    totalOutstanding,
  } = snapshot

  const outstanding = totalOutstanding
  const recordTotal = unpaidCount + partialCount + paidCount

  return (
    <div className="space-y-3">
      {/* Outstanding — hero number */}
      <div>
        <p
          className="text-[0.625rem] font-semibold uppercase tracking-[0.09em]"
          style={{ color: 'var(--text-muted-neutral)' }}
        >
          Outstanding on Unpaid / Partial
        </p>
        <p
          className="mt-0.5 text-2xl font-semibold tabular-nums"
          style={{ color: outstanding > 0 ? 'var(--color-danger)' : 'var(--text-primary-neutral)' }}
        >
          {formatIDR(outstanding)}
        </p>
        {recordTotal === 0 && (
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted-neutral)' }}>
            No payment periods on file yet.
          </p>
        )}
      </div>

      <hr className="section-divider" />

      {/* Status counts */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Unpaid',  count: unpaidCount,  color: 'var(--color-danger)'  },
          { label: 'Partial', count: partialCount, color: 'var(--color-warning)' },
          { label: 'Paid',    count: paidCount,    color: 'var(--color-success)' },
        ].map(({ label, count, color }) => (
          <div
            key={label}
            className="rounded-lg p-2"
            style={{ backgroundColor: 'var(--surface-neutral)' }}
          >
            <p className="text-lg font-semibold tabular-nums" style={{ color }}>{count}</p>
            <p
              className="text-[0.625rem] font-medium uppercase tracking-wide"
              style={{ color: 'var(--text-muted-neutral)' }}
            >
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Open payments link */}
      <Link
        href="/payments"
        className="flex items-center justify-between rounded-md border border-[var(--border-divider-soft)] bg-[var(--surface-neutral)] px-3 py-2 text-xs font-medium no-underline transition-colors hover:bg-[var(--table-row-hover)]"
        style={{
          color: 'var(--text-secondary-neutral)',
        }}
      >
        Open payments
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </Link>
    </div>
  )
}
