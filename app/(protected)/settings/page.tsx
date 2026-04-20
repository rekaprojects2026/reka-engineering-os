import Link from 'next/link'
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'

import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { PageHeader, SectionHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { getDomainSummary, getSettingOptionsFull } from '@/lib/settings/queries'
import { upsertSettingOption, deleteSettingOption, toggleSettingOption } from '@/lib/settings/actions'
import { SETTING_DOMAINS, DOMAIN_LABELS, type SettingDomain } from '@/lib/settings/domains'
import { cn } from '@/lib/utils/cn'

export const metadata = { title: 'Settings — ReKa Engineering OS' }

const thClass =
  'border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3.5 py-2.5 text-left text-[0.6875rem] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] whitespace-nowrap'

const tdClass = 'px-3.5 py-2.5 text-[0.8125rem] text-[var(--color-text-secondary)] whitespace-nowrap'

const controlClass =
  'h-10 w-[200px] rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[0.8125rem] text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-subtle)]'

interface PageProps {
  searchParams: Promise<{ domain?: string }>
}

export default async function SettingsPage({ searchParams }: PageProps) {
  const sp = await getSessionProfile()
  requireRole(sp.system_role, ['admin'])

  const params = await searchParams
  const activeDomain: SettingDomain = SETTING_DOMAINS.includes(params.domain as SettingDomain)
    ? (params.domain as SettingDomain)
    : 'functional_role'

  const [summary, options] = await Promise.all([
    getDomainSummary(),
    getSettingOptionsFull(activeDomain),
  ])

  const nextOrder = options.length > 0 ? Math.max(...options.map((o) => o.sort_order)) + 1 : 1

  async function handleDelete(id: string) {
    'use server'
    await deleteSettingOption(id)
  }

  async function handleToggle(id: string, current: boolean) {
    'use server'
    await toggleSettingOption(id, !current)
  }

  async function handleAdd(formData: FormData) {
    'use server'
    await upsertSettingOption(formData)
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage master data options used across the application." />

      <div className="mb-5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-3">
        <div className="flex flex-wrap gap-2" role="tablist">
          {summary.map((s) => {
            const active = s.domain === activeDomain
            return (
              <Link
                key={s.domain}
                href={`/settings?domain=${s.domain}`}
                role="tab"
                aria-selected={active}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-[0.8125rem] font-medium no-underline transition-colors',
                  active
                    ? 'filter-tab-active border-transparent bg-[var(--color-primary)] font-semibold text-[var(--color-primary-fg)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface-subtle)] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]',
                )}
              >
                {s.label}
                <span
                  className={cn(
                    'min-w-[1.125rem] text-center text-[0.6875rem] font-medium opacity-80',
                    active && 'text-[var(--color-primary-fg)]',
                  )}
                >
                  {s.count}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      <SectionCard noPadding className="overflow-hidden">
        <div className="border-b border-[var(--color-border)] p-6 pb-4">
          <SectionHeader title={DOMAIN_LABELS[activeDomain]} className="mb-0" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['#', 'Value', 'Label', 'Active', ''].map((h) => (
                  <th key={h} className={thClass}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {options.length === 0 && (
                <tr>
                  <td colSpan={5} className={cn(tdClass, 'py-8 text-center text-[var(--color-text-muted)]')}>
                    No options stored for this domain yet.
                  </td>
                </tr>
              )}
              {options.map((o) => {
                return (
                  <tr
                    key={o.id}
                    className={cn(
                      'transition-colors hover:bg-[var(--color-surface-muted)]',
                      !o.is_active && 'opacity-50',
                    )}
                  >
                    <td className={cn(tdClass, 'w-12 font-mono text-[0.75rem]')}>{o.sort_order}</td>
                    <td className={cn(tdClass, 'font-mono text-[0.75rem]')}>{o.value}</td>
                    <td className={cn(tdClass, 'font-medium text-[var(--color-text-primary)]')}>{o.label}</td>
                    <td className={cn(tdClass, 'w-20')}>
                      <form action={handleToggle.bind(null, o.id, o.is_active)}>
                        <button
                          type="submit"
                          title={o.is_active ? 'Deactivate' : 'Activate'}
                          className={cn(
                            'cursor-pointer border-none bg-transparent p-0.5',
                            o.is_active ? 'text-[var(--color-success)]' : 'text-[var(--color-text-muted)]',
                          )}
                        >
                          {o.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        </button>
                      </form>
                    </td>
                    <td className={cn(tdClass, 'w-12 text-right')}>
                      <form action={handleDelete.bind(null, o.id)}>
                        <button
                          type="submit"
                          title="Delete"
                          className="cursor-pointer border-none bg-transparent p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                        >
                          <Trash2 size={14} />
                        </button>
                      </form>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard className="mt-5">
        <SectionHeader title="Add option" />
        <form action={handleAdd} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="domain" value={activeDomain} />
          <input type="hidden" name="sort_order" value={nextOrder} />

          <div className="flex flex-col gap-1">
            <label htmlFor="opt-value" className="text-[0.75rem] font-medium text-[var(--color-text-muted)]">
              Value (slug)
            </label>
            <input
              id="opt-value"
              name="value"
              required
              placeholder="e.g. site_engineer"
              className={controlClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="opt-label" className="text-[0.75rem] font-medium text-[var(--color-text-muted)]">
              Label
            </label>
            <input id="opt-label" name="label" required placeholder="e.g. Site Engineer" className={controlClass} />
          </div>

          <button
            type="submit"
            className="btn-primary inline-flex h-10 items-center gap-1.5 rounded-md px-3.5 text-[0.8125rem] font-medium"
          >
            <Plus size={14} aria-hidden="true" />
            Add
          </button>
        </form>
      </SectionCard>
    </div>
  )
}
