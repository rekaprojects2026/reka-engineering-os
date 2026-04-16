import Link from 'next/link'
import type { CSSProperties } from 'react'
import { Settings, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'

import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { getDomainSummary, getSettingOptionsFull } from '@/lib/settings/queries'
import { upsertSettingOption, deleteSettingOption, toggleSettingOption } from '@/lib/settings/actions'
import { SETTING_DOMAINS, DOMAIN_LABELS, type SettingDomain } from '@/lib/settings/domains'

export const metadata = { title: 'Settings — Engineering Agency OS' }

const TH: CSSProperties = {
  padding: '9px 14px',
  textAlign: 'left',
  fontSize: '0.6875rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  backgroundColor: 'var(--color-surface-subtle)',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  borderBottom: '1px solid var(--color-border)',
}

const TD: CSSProperties = {
  padding: '10px 14px',
  fontSize: '0.8125rem',
  color: 'var(--color-text-secondary)',
  whiteSpace: 'nowrap',
}

interface PageProps {
  searchParams: Promise<{ domain?: string }>
}

export default async function SettingsPage({ searchParams }: PageProps) {
  const sp = await getSessionProfile()
  requireRole(sp.system_role, ['admin'])

  const params = await searchParams
  const activeDomain: SettingDomain =
    SETTING_DOMAINS.includes(params.domain as SettingDomain)
      ? (params.domain as SettingDomain)
      : 'functional_role'

  const [summary, options] = await Promise.all([
    getDomainSummary(),
    getSettingOptionsFull(activeDomain),
  ])

  const nextOrder = options.length > 0
    ? Math.max(...options.map((o) => o.sort_order)) + 1
    : 1

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
      <PageHeader
        title="Settings"
        subtitle="Manage master data options used across the application."
      />

      {/* Domain tabs */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: 'var(--color-surface-subtle)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          marginBottom: '20px',
        }}
      >
      <div
        className="flex flex-wrap gap-2"
        role="tablist"
      >
        {summary.map((s) => {
          const active = s.domain === activeDomain
          return (
            <Link
              key={s.domain}
              href={`/settings?domain=${s.domain}`}
              role="tab"
              aria-selected={active}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-control)',
                fontSize: '0.8125rem',
                fontWeight: active ? 600 : 500,
                textDecoration: 'none',
                backgroundColor: active
                  ? 'var(--color-primary)'
                  : 'var(--color-surface-subtle)',
                color: active ? 'var(--color-primary-fg)' : 'var(--color-text-secondary)',
                border: active ? 'none' : '1px solid var(--color-border)',
                transition: 'background-color 0.15s, color 0.15s',
              }}
            >
              {s.label}
              <span
                style={{
                  fontSize: '0.6875rem',
                  opacity: 0.8,
                  fontWeight: 500,
                  minWidth: '18px',
                  textAlign: 'center',
                }}
              >
                {s.count}
              </span>
            </Link>
          )
        })}
      </div>
      </div>

      {/* Options table */}
      <SectionCard
        title={DOMAIN_LABELS[activeDomain]}
        noPadding
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['#', 'Value', 'Label', 'Active', ''].map((h) => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {options.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ ...TD, textAlign: 'center', padding: '32px 14px', color: 'var(--color-text-muted)' }}>
                    No options stored for this domain yet.
                  </td>
                </tr>
              )}
              {options.map((o, idx) => {
                const isLast = idx === options.length - 1
                return (
                  <tr
                    key={o.id}
                    style={{
                      borderBottom: isLast ? undefined : '1px solid var(--color-border)',
                      opacity: o.is_active ? 1 : 0.5,
                    }}
                    className="hover:bg-[var(--color-surface-muted)] transition-colors"
                  >
                    <td style={{ ...TD, fontFamily: 'monospace', fontSize: '0.75rem', width: '48px' }}>
                      {o.sort_order}
                    </td>
                    <td style={{ ...TD, fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {o.value}
                    </td>
                    <td style={{ ...TD, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      {o.label}
                    </td>
                    <td style={{ ...TD, width: '80px' }}>
                      <form action={handleToggle.bind(null, o.id, o.is_active)}>
                        <button
                          type="submit"
                          title={o.is_active ? 'Deactivate' : 'Activate'}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: o.is_active ? 'var(--color-success)' : 'var(--color-text-muted)',
                            padding: '2px',
                          }}
                        >
                          {o.is_active
                            ? <ToggleRight size={18} />
                            : <ToggleLeft size={18} />
                          }
                        </button>
                      </form>
                    </td>
                    <td style={{ ...TD, textAlign: 'right', width: '48px' }}>
                      <form action={handleDelete.bind(null, o.id)}>
                        <button
                          type="submit"
                          title="Delete"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--color-text-muted)',
                            padding: '2px',
                          }}
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

      {/* Add option form */}
      <SectionCard title="Add Option" className="mt-5">
        <form action={handleAdd} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="domain" value={activeDomain} />
          <input type="hidden" name="sort_order" value={nextOrder} />

          <div className="flex flex-col gap-1">
            <label
              htmlFor="opt-value"
              style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-muted)' }}
            >
              Value (slug)
            </label>
            <input
              id="opt-value"
              name="value"
              required
              placeholder="e.g. site_engineer"
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--color-border)',
                fontSize: '0.8125rem',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                width: '200px',
              }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="opt-label"
              style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-muted)' }}
            >
              Label
            </label>
            <input
              id="opt-label"
              name="label"
              required
              placeholder="e.g. Site Engineer"
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--color-border)',
                fontSize: '0.8125rem',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                width: '200px',
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-primary-fg)',
              borderRadius: 'var(--radius-control)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Plus size={14} aria-hidden="true" />
            Add
          </button>
        </form>
      </SectionCard>
    </div>
  )
}
