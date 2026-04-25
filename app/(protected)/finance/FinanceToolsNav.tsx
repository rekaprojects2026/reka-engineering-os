'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS: { href: string; label: string }[] = [
  { href: '/finance/invoices', label: 'Invoices' },
  { href: '/finance/payslips', label: 'Payslips' },
  { href: '/finance/fx-rates', label: 'FX Rates' },
  { href: '/finance/payment-accounts', label: 'Payment Accounts' },
  { href: '/finance/reports', label: 'Reports' },
]

export function FinanceToolsNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Finance tools"
      className="flex flex-wrap gap-2 border-b border-[var(--color-border)] pb-3"
    >
      {LINKS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-[var(--radius-control)] border px-3 py-1.5 text-[0.8125rem] font-medium no-underline transition-colors"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: active ? 'var(--color-primary)' : 'var(--color-surface)',
              color: active ? 'var(--color-primary-fg)' : 'var(--color-text-secondary)',
              fontWeight: active ? 600 : 500,
            }}
            aria-current={active ? 'page' : undefined}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
