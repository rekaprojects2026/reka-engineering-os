import Link from 'next/link'
import { Users, Inbox, Radio, Percent } from 'lucide-react'

import type { SessionProfile } from '@/lib/auth/session'
import type { BDDashboardData } from '@/lib/dashboard/bd-queries'
import { PageHeader } from '@/components/layout/PageHeader'
import { KpiCard, KpiStrip } from '@/components/shared/KpiCard'
import { DashboardSection, TH_CLASS, TD_CLASS, ROW_LINK_CLASS } from '@/components/modules/dashboard/dashboard-shared'
import { formatDate, formatIDR } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'

export function DashboardBD({ data, profile }: { data: BDDashboardData; profile: SessionProfile }) {
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle={`${profile.full_name} — Pipeline, intakes, and outreach.`} />

      <KpiStrip className="lg:grid-cols-4 xl:grid-cols-4">
        <KpiCard title="New intakes (MTD)" value={data.newLeadsThisMonth} icon={Users} accent="primary" />
        <KpiCard title="Intakes in pipeline" value={data.intakesPipelineCount} icon={Inbox} />
        <KpiCard title="Active outreach" value={data.outreachActiveCount} icon={Radio} />
        <KpiCard title="Conversion rate (MTD)" value={`${data.conversionRatePct}%`} icon={Percent} subtitle="Converted / created intakes" />
      </KpiStrip>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <DashboardSection title="Intake pipeline" description="New, awaiting info, and qualified.">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={TH_CLASS}>Intake</th>
                  <th className={TH_CLASS}>Client</th>
                  <th className={TH_CLASS}>Status</th>
                  <th className={TH_CLASS}>Received</th>
                  <th className={TH_CLASS}>Est. value</th>
                </tr>
              </thead>
              <tbody>
                {data.intakePipeline.map((row, i) => (
                  <tr key={row.id} className={cn(i < data.intakePipeline.length - 1 && 'border-b border-[var(--color-border)]')}>
                    <td className={TD_CLASS}>
                      <Link href={`/leads/${row.id}`} className={ROW_LINK_CLASS}>
                        {row.intake_code}
                      </Link>
                      <div className="mt-0.5 max-w-[220px] truncate text-[0.75rem] text-[var(--color-text-muted)]">{row.title}</div>
                    </td>
                    <td className={TD_CLASS}>{row.clients?.client_name ?? row.temp_client_name ?? '—'}</td>
                    <td className={TD_CLASS}>{row.status}</td>
                    <td className={TD_CLASS}>{formatDate(row.received_date)}</td>
                    <td className={TD_CLASS}>
                      {row.budget_estimate != null ? formatIDR(row.budget_estimate) : '—'} {row.budget_currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3">
            <Link href="/leads" className="text-[0.8125rem] font-medium text-[var(--color-primary)] no-underline hover:underline">
              View all leads →
            </Link>
          </div>
        </DashboardSection>

        <DashboardSection title="Outreach board" description="Active conversations (excludes declined / converted).">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={TH_CLASS}>Company</th>
                  <th className={TH_CLASS}>Status</th>
                  <th className={TH_CLASS}>Channel</th>
                  <th className={TH_CLASS}>Updated</th>
                </tr>
              </thead>
              <tbody>
                {data.outreachBoard.map((row, i) => (
                  <tr key={row.id} className={cn(i < data.outreachBoard.length - 1 && 'border-b border-[var(--color-border)]')}>
                    <td className={TD_CLASS}>
                      <Link href="/outreach" className={ROW_LINK_CLASS}>
                        {row.company_name}
                      </Link>
                    </td>
                    <td className={TD_CLASS}>{row.status}</td>
                    <td className={TD_CLASS}>{row.contact_channel ?? '—'}</td>
                    <td className={TD_CLASS}>{formatDate(row.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3">
            <Link href="/outreach" className="text-[0.8125rem] font-medium text-[var(--color-primary)] no-underline hover:underline">
              Open outreach →
            </Link>
          </div>
        </DashboardSection>
      </div>
    </div>
  )
}
