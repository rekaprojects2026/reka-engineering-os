import { getSessionProfile } from '@/lib/auth/session'
import {
  isBD,
  isDirektur,
  isFinance,
  isFreelancer,
  isManajer,
  isMember,
  isSenior,
  isTD,
} from '@/lib/auth/permissions'
import { getDirekturDashboardData } from '@/lib/dashboard/direktur-queries'
import { getTDDashboardData } from '@/lib/dashboard/td-queries'
import { getFinanceDashboardData } from '@/lib/dashboard/finance-queries'
import { getManajerDashboardFull } from '@/lib/dashboard/manajer-queries'
import { getBDDashboardData } from '@/lib/dashboard/bd-queries'
import { getPersonalDashboardData } from '@/lib/dashboard/personal-queries'
import { DashboardDirektur } from '@/components/modules/dashboard/DashboardDirektur'
import { DashboardTechnicalDirector } from '@/components/modules/dashboard/DashboardTechnicalDirector'
import { DashboardFinance } from '@/components/modules/dashboard/DashboardFinance'
import { DashboardManajer } from '@/components/modules/dashboard/DashboardManajer'
import { DashboardBD } from '@/components/modules/dashboard/DashboardBD'
import { DashboardPersonal } from '@/components/modules/dashboard/DashboardPersonal'
import { DashboardFreelancer } from '@/components/modules/dashboard/DashboardFreelancer'

export const metadata = {
  title: 'Dashboard — ReKa Engineering OS',
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ pnl_period?: string }>
}) {
  const profile = await getSessionProfile()
  const role = profile.system_role
  const sp = await searchParams

  if (isDirektur(role)) {
    const data = await getDirekturDashboardData(profile.id, sp.pnl_period)
    return <DashboardDirektur data={data} profile={profile} />
  }

  if (isTD(role)) {
    const data = await getTDDashboardData(profile.id)
    return <DashboardTechnicalDirector data={data} profile={profile} />
  }

  if (isFinance(role)) {
    const data = await getFinanceDashboardData(profile.id)
    return <DashboardFinance data={data} profile={profile} />
  }

  if (isManajer(role)) {
    const data = await getManajerDashboardFull(profile.id)
    return <DashboardManajer data={data} profile={profile} />
  }

  if (isBD(role)) {
    const data = await getBDDashboardData()
    return <DashboardBD data={data} profile={profile} />
  }

  if (isFreelancer(role)) {
    const data = await getPersonalDashboardData(profile.id, 'freelancer')
    return <DashboardFreelancer data={data} profile={profile} />
  }

  if (isSenior(role)) {
    const data = await getPersonalDashboardData(profile.id, 'senior')
    return <DashboardPersonal data={data} profile={profile} />
  }

  if (isMember(role)) {
    const data = await getPersonalDashboardData(profile.id, 'member')
    return <DashboardPersonal data={data} profile={profile} />
  }

  const data = await getPersonalDashboardData(profile.id, 'member')
  return <DashboardPersonal data={data} profile={profile} />
}
