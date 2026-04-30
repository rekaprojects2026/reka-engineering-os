import type { ReactNode } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, Trash2, ToggleLeft, ToggleRight, DollarSign, CreditCard, Sliders, FileCode } from 'lucide-react'

import { getSessionProfile } from '@/lib/auth/session'
import { isDirektur, isFinance, isManagement, isTD } from '@/lib/auth/permissions'
import { PageHeader, SectionHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { getDomainSummary, getSettingOptionsFull, getFileNamingConfig, getDriveRootFolderName } from '@/lib/settings/queries'
import {
  upsertSettingOption,
  deleteSettingOption,
  toggleSettingOption,
  saveProjectPrefixSettings,
  saveDriveRootFolderName,
} from '@/lib/settings/actions'
import { SETTING_DOMAINS, DOMAIN_LABELS, type SettingDomain } from '@/lib/settings/domains'
import { SettingsFileNamingClient } from '@/components/modules/settings/SettingsFileNamingClient'
import { cn } from '@/lib/utils/cn'
export const metadata = { title: 'Settings — ReKa Engineering OS' }

const thClass =
  'border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3.5 py-2.5 text-left text-[0.6875rem] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] whitespace-nowrap'
const tdClass = 'px-3.5 py-2.5 text-[0.8125rem] text-[var(--color-text-secondary)] whitespace-nowrap'
const controlClass =
  'h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[0.8125rem] text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20'

type SettingsTab = 'system' | 'file_naming' | 'finance'

interface PageProps {
  searchParams: Promise<{
    tab?: string
    domain?: string
    view?: string
    prefix_err?: string
    saved?: string
    drive?: string
    drive_error?: string
    drive_root_saved?: string
  }>
}

export default async function SettingsPage({ searchParams }: PageProps) {
  const sp = await getSessionProfile()
  const params = await searchParams

  const canEditSystem = isTD(sp.system_role)
  const canEditFileNaming = isTD(sp.system_role)
  const canViewFinance = isDirektur(sp.system_role) || isTD(sp.system_role)

  if (!canEditSystem && !canViewFinance) {
    redirect('/access-denied')
  }

  if (params.view && !params.tab) {
    if (params.view === 'fx_rates' || params.view === 'payment_accounts') {
      redirect('/settings?tab=finance')
    }
    if (params.view === 'dropdowns') {
      const q = params.domain ? `&domain=${encodeURIComponent(params.domain)}` : ''
      redirect(`/settings?tab=system${q}`)
    }
  }

  let tab = (params.tab as SettingsTab | undefined) ?? undefined
  if (tab !== 'system' && tab !== 'file_naming' && tab !== 'finance') tab = undefined

  if (!tab) {
    if (canEditSystem) redirect('/settings?tab=system')
    redirect('/settings?tab=finance')
  }

  if (tab === 'finance' && canEditSystem && !canViewFinance) {
    redirect('/settings?tab=system')
  }

  if ((tab === 'system' || tab === 'file_naming') && !canEditSystem) {
    redirect('/settings?tab=finance')
  }

  const financeCanMutate = isFinance(sp.system_role)

  const activeDomain: SettingDomain = SETTING_DOMAINS.includes(params.domain as SettingDomain)
    ? (params.domain as SettingDomain)
    : 'functional_role'

  const [summary, options, fileNamingConfig, driveRootFolderName] = await Promise.all([
    tab === 'system' ? getDomainSummary() : Promise.resolve([]),
    tab === 'system' ? getSettingOptionsFull(activeDomain) : Promise.resolve([]),
    tab === 'system' || tab === 'file_naming' ? getFileNamingConfig() : Promise.resolve(null),
    tab === 'finance' ? getDriveRootFolderName() : Promise.resolve(null as string | null),
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
  const topTabs: { id: SettingsTab; label: string; icon: ReactNode; href: string }[] = []
  if (canEditSystem) {
    topTabs.push({ id: 'system', label: 'Sistem', icon: <Sliders size={13} />, href: '/settings?tab=system' })
    topTabs.push({
      id: 'file_naming',
      label: 'File naming',
      icon: <FileCode size={13} />,
      href: '/settings?tab=file_naming',
    })
  }
  if (canViewFinance) {
    topTabs.push({
      id: 'finance',
      label: 'Finance',
      icon: <DollarSign size={13} />,
      href: '/settings?tab=finance',
    })
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Master data, file naming, FX rates, and payment accounts." />

      {isDirektur(sp.system_role) && (
        <div
          className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-[var(--color-border)] px-4 py-3 text-[0.8125rem]"
          style={{ backgroundColor: 'var(--color-surface-subtle)' }}
        >
          <span className="font-medium text-[var(--color-text-secondary)]">Integrations</span>
          <Link href="/settings/api-keys" className="text-[var(--color-primary)] no-underline hover:underline">
            API keys
          </Link>
          <span className="text-[var(--color-text-muted)]">·</span>
          <Link href="/settings/webhooks" className="text-[var(--color-primary)] no-underline hover:underline">
            Webhooks
          </Link>
          <span className="text-[var(--color-text-muted)]">·</span>
          <Link href="/settings/api-docs" className="text-[var(--color-primary)] no-underline hover:underline">
            API documentation
          </Link>
        </div>
      )}

      <div className="mb-5 flex flex-wrap gap-2 border-b border-[var(--color-border)] pb-0">
        {topTabs.map((t) => {
          const active = tab === t.id
          return (
            <Link
              key={t.id}
              href={t.href}
              className={cn(
                'inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-[0.8125rem] font-medium no-underline transition-colors',
                active
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]',
              )}
            >
              {t.icon}
              {t.label}
            </Link>
          )
        })}
      </div>

      {tab === 'system' && fileNamingConfig && (
        <>
          {params.prefix_err && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-danger-subtle)] px-4 py-3 text-[0.8125rem] text-[var(--color-danger)]"
            >
              {params.prefix_err}
            </div>
          )}
          {params.saved === '1' && (
            <div className="mb-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-success-subtle)] px-4 py-3 text-[0.8125rem] text-[var(--color-success)]">
              Project prefix & separator saved.
            </div>
          )}
          <SectionCard className="mb-5">
            <SectionHeader title="Project prefix & separator" />
            <p className="mb-4 text-[0.8125rem] text-[var(--color-text-muted)]">
              Digunakan untuk kode proyek baru (trigger database) dan sebagai bagian dari pola kode file.
            </p>
            <form action={saveProjectPrefixSettings} className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[0.75rem] font-medium text-[var(--color-text-muted)]">Prefix kode project</label>
                <input
                  name="project_prefix"
                  required
                  defaultValue={fileNamingConfig.project_prefix}
                  placeholder="RKA"
                  className={cn(controlClass, 'w-32 font-mono')}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[0.75rem] font-medium text-[var(--color-text-muted)]">Separator</label>
                <input
                  name="separator"
                  defaultValue={fileNamingConfig.separator}
                  maxLength={3}
                  className={cn(controlClass, 'w-20 font-mono')}
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[var(--color-primary)] px-4 text-[0.8125rem] font-medium text-[var(--color-primary-fg)]"
              >
                Save prefix
              </button>
            </form>
          </SectionCard>

          <div className="mb-5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-3">
            <div className="flex flex-wrap gap-2" role="tablist">
              {summary.map((s) => {
                const active = s.domain === activeDomain
                return (
                  <Link
                    key={s.domain}
                    href={`/settings?tab=system&domain=${s.domain}`}
                    role="tab"
                    aria-selected={active}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[0.8125rem] font-medium no-underline transition-colors',
                      active
                        ? 'border-transparent bg-[var(--color-primary)] text-[var(--color-primary-fg)]'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]',
                    )}
                  >
                    {DOMAIN_LABELS[s.domain as SettingDomain] ?? s.domain}
                    <span className="min-w-[1.125rem] text-center text-[0.6875rem] opacity-70">{s.count}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          <SectionCard noPadding className="overflow-hidden">
            <div className="border-b border-[var(--color-border)] px-6 py-4">
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
                        No options yet.
                      </td>
                    </tr>
                  )}
                  {options.map((o) => (
                    <tr
                      key={o.id}
                      className={cn('transition-colors hover:bg-[var(--color-surface-muted)]', !o.is_active && 'opacity-50')}
                    >
                      <td className={cn(tdClass, 'w-12 font-mono text-[0.75rem]')}>{o.sort_order}</td>
                      <td className={cn(tdClass, 'font-mono text-[0.75rem]')}>{o.value}</td>
                      <td className={cn(tdClass, 'font-medium text-[var(--color-text-primary)]')}>{o.label}</td>
                      <td className={cn(tdClass, 'w-20')}>
                        <form action={handleToggle.bind(null, o.id, o.is_active)}>
                          <button
                            type="submit"
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
                            className="cursor-pointer border-none bg-transparent p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                          >
                            <Trash2 size={14} />
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
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
                <label className="text-[0.75rem] font-medium text-[var(--color-text-muted)]">Value (slug)</label>
                <input name="value" required placeholder="e.g. site_engineer" className={cn(controlClass, 'w-48')} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[0.75rem] font-medium text-[var(--color-text-muted)]">Label</label>
                <input name="label" required placeholder="e.g. Site Engineer" className={cn(controlClass, 'w-48')} />
              </div>
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[var(--color-primary)] px-4 text-[0.8125rem] font-medium text-[var(--color-primary-fg)]"
              >
                <Plus size={14} /> Add
              </button>
            </form>
          </SectionCard>
        </>
      )}

      {tab === 'file_naming' && fileNamingConfig && (
        <SectionCard>
          <SectionHeader title="File naming" className="mb-1" />
          <p className="mb-4 text-[0.8125rem] text-[var(--color-text-muted)]">
            Kode file mengikuti pola: project code + disiplin + tipe dokumen + nomor urut + revisi.
          </p>
          <SettingsFileNamingClient initial={fileNamingConfig} canEdit={canEditFileNaming} />
        </SectionCard>
      )}

      {tab === 'finance' && (
        <SectionCard>
          <SectionHeader title="Finance tools" className="mb-1" />
          {params.drive_root_saved && (
            <div className="mb-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-success-subtle)] px-4 py-3 text-[0.8125rem] text-[var(--color-success)]">
              Nama folder root Drive disimpan.
            </div>
          )}
          {params.drive === 'connected' && (
            <div className="mb-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-success-subtle)] px-4 py-3 text-[0.8125rem] text-[var(--color-success)]">
              Google Drive terhubung. Folder proyek baru akan dibuat otomatis bila token valid.
            </div>
          )}
          {params.drive_error && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-danger-subtle)] px-4 py-3 text-[0.8125rem] text-[var(--color-danger)]"
            >
              Google OAuth: {decodeURIComponent(params.drive_error)}
            </div>
          )}
          <p className="mb-5 text-[0.8125rem] text-[var(--color-text-muted)]">
            Kurs valuta dan rekening pembayaran dikelola di halaman khusus (tanpa hash URL).
            {!financeCanMutate && ' Pengeditan nilai kurs dan rekening hanya untuk user Finance.'}
          </p>

          {(isTD(sp.system_role) || isDirektur(sp.system_role)) && driveRootFolderName != null && (
            <div className="mb-6 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-5">
              <h3 className="m-0 text-[0.875rem] font-semibold text-[var(--color-text-primary)]">
                Google Drive — Root Folder
              </h3>
              <p className="mt-2 mb-4 text-[0.8125rem] leading-relaxed text-[var(--color-text-muted)]">
                Nama folder induk di My Drive tempat semua folder project disimpan. Dibuat otomatis jika belum ada.
              </p>
              <form action={saveDriveRootFolderName} className="flex flex-wrap items-end gap-3">
                <div className="flex min-w-[200px] flex-1 flex-col gap-1">
                  <label htmlFor="drive_root_folder_name" className="text-[0.75rem] font-medium text-[var(--color-text-muted)]">
                    Root folder name
                  </label>
                  <input
                    id="drive_root_folder_name"
                    name="drive_root_folder_name"
                    defaultValue={driveRootFolderName}
                    required
                    placeholder="Projects"
                    className={controlClass}
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[var(--color-primary)] px-4 text-[0.8125rem] font-medium text-[var(--color-primary-fg)]"
                >
                  Save
                </button>
              </form>
            </div>
          )}

          {isManagement(sp.system_role) && (
            <p className="mb-4 text-[0.8125rem]">
              <a
                href="/api/integrations/google/oauth/start"
                className="font-medium text-[var(--color-primary)] no-underline hover:underline"
              >
                Hubungkan Google Drive (akun organisasi)
              </a>
              <span className="text-[var(--color-text-muted)]"> — scope `drive.file` (folder yang dibuat aplikasi).</span>
            </p>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/finance/fx-rates"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-[0.8125rem] font-medium text-[var(--color-text-primary)] no-underline transition-colors hover:bg-[var(--color-surface-muted)]"
            >
              <DollarSign size={16} className="opacity-70" />
              Buka FX rates
            </Link>
            <Link
              href="/finance/payment-accounts"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-[0.8125rem] font-medium text-[var(--color-text-primary)] no-underline transition-colors hover:bg-[var(--color-surface-muted)]"
            >
              <CreditCard size={16} className="opacity-70" />
              Buka payment accounts
            </Link>
          </div>
        </SectionCard>
      )}
    </div>
  )
}
