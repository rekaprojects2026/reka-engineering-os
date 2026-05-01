import Link from 'next/link'
import { AlertCircle, FileWarning, Receipt, FolderClock } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export type AttentionLinkItem = {
  id: string
  label: string
  sub?: string
  href: string
  icon: 'project' | 'invoice' | 'comp' | 'generic'
}

const ICONS = {
  project: FolderClock,
  invoice: FileWarning,
  comp: Receipt,
  generic: AlertCircle,
} as const

export function NeedsAttentionWidget({ title, items }: { title: string; items: AttentionLinkItem[] }) {
  if (items.length === 0) return null
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-card)]">
      <p className="m-0 mb-3 text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted-neutral)]">
        {title}
      </p>
      <ul className="m-0 list-none space-y-2 p-0">
        {items.map((item) => {
          const Icon = ICONS[item.icon] ?? ICONS.generic
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-start gap-2.5 rounded-md border border-transparent px-2 py-1.5 no-underline transition-colors hover:border-[var(--table-border)] hover:bg-[var(--surface-neutral)]"
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-muted-neutral)]" aria-hidden />
                <span className="min-w-0">
                  <span className={cn('block text-[0.8125rem] font-medium text-[var(--text-primary-neutral)]')}>{item.label}</span>
                  {item.sub && <span className="mt-0.5 block text-[0.6875rem] text-[var(--text-muted-neutral)]">{item.sub}</span>}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
