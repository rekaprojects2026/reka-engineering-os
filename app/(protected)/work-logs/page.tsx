import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { getMyWorkLogs, getMemberUtilization } from '@/lib/work-logs/queries'
import { deleteWorkLog } from '@/lib/work-logs/actions'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { WorkLogCreateForm, type WorkLogTaskOption } from '@/components/modules/work-logs/WorkLogCreateForm'
import { createServerClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils/formatters'
import type { SystemRole } from '@/types/database'

export const metadata = { title: 'Work Logs — ReKa Engineering OS' }

const WORK_LOG_ACCESS_ROLES: SystemRole[] = [
  'member',
  'freelancer',
  'technical_director',
  'direktur',
  'finance',
]

interface PageProps {
  searchParams: Promise<{ month?: string }>
}

function parseMonthParam(raw: string | undefined): string {
  if (raw && /^\d{4}-\d{2}$/.test(raw)) return `${raw}-01`
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`
}

function monthLabelUtc(monthIso: string): string {
  const y = Number(monthIso.slice(0, 4))
  const m = Number(monthIso.slice(5, 7))
  if (!Number.isFinite(y) || !Number.isFinite(m)) return monthIso.slice(0, 7)
  const d = new Date(Date.UTC(y, m - 1, 1))
  return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export default async function WorkLogsPage({ searchParams }: PageProps) {
  const profile = await getSessionProfile()
  requireRole(profile.system_role, WORK_LOG_ACCESS_ROLES)

  const params = await searchParams
  const monthIso = parseMonthParam(params.month)
  const monthQuery = monthIso.slice(0, 7)

  const isManagement = ['direktur', 'technical_director', 'finance'].includes(
    profile.system_role ?? '',
  )

  const [myLogs, utilization] = await Promise.all([
    getMyWorkLogs(profile.id, monthIso),
    isManagement ? getMemberUtilization(monthIso) : Promise.resolve([]),
  ])

  const supabase = await createServerClient()
  const { data: myTasks } = await supabase
    .from('tasks')
    .select('id, title, project_id, projects(project_code)')
    .eq('assigned_to_user_id', profile.id)
    .neq('status', 'done')
    .order('created_at', { ascending: false })
    .limit(50)

  type TaskRow = {
    id: string
    title: string
    project_id: string
    projects: { project_code: string } | { project_code: string }[] | null
  }

  const taskOptions: WorkLogTaskOption[] = ((myTasks ?? []) as TaskRow[]).map((row) => {
    const p = row.projects
    const projectCode = Array.isArray(p) ? (p[0]?.project_code ?? null) : (p?.project_code ?? null)
    return {
      id: row.id,
      title: row.title,
      project_id: row.project_id,
      project_code: projectCode,
    }
  })

  const defaultLogDate = new Date().toISOString().slice(0, 10)
  const monthLabel = monthLabelUtc(monthIso)

  return (
    <div>
      <PageHeader
        title="Work Logs"
        subtitle="Catat jam kerja per task. Digunakan sebagai basis utilization dan payroll."
        actions={
          <form method="GET" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="month"
              name="month"
              defaultValue={monthQuery}
              style={{
                padding: '7px 10px',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--color-border)',
                fontSize: '0.8125rem',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '7px 14px',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--color-border)',
                fontSize: '0.8125rem',
                backgroundColor: 'var(--color-surface)',
                cursor: 'pointer',
              }}
            >
              Lihat
            </button>
          </form>
        }
      />

      <SectionCard title="Tambah Log Jam">
        <WorkLogCreateForm tasks={taskOptions} defaultLogDate={defaultLogDate} />
      </SectionCard>

      <div className="mt-4">
        <SectionCard title={`Log Saya — ${monthLabel}`}>
          {myLogs.length === 0 ? (
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', padding: '16px' }}>
              Belum ada log untuk bulan ini.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {(['Tanggal', 'Task', 'Project', 'Jam', 'Catatan', '\u00a0'] as const).map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 12px',
                        textAlign: 'left',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        color: 'var(--color-text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {myLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>
                      {formatDate(log.logDate)}
                    </td>
                    <td
                      style={{
                        padding: '10px 12px',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {log.taskTitle}
                    </td>
                    <td
                      style={{
                        padding: '10px 12px',
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      {log.projectCode}
                    </td>
                    <td
                      style={{
                        padding: '10px 12px',
                        fontWeight: 600,
                        color: 'var(--color-text-primary)',
                        fontFamily: 'monospace',
                      }}
                    >
                      {log.hoursLogged}h
                    </td>
                    <td
                      style={{
                        padding: '10px 12px',
                        color: 'var(--color-text-muted)',
                        fontStyle: log.description ? 'normal' : 'italic',
                      }}
                    >
                      {log.description ?? '—'}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <form action={deleteWorkLog} style={{ display: 'inline' }}>
                        <input type="hidden" name="id" value={log.id} />
                        <button
                          type="submit"
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-danger)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 500,
                          }}
                        >
                          Hapus
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--color-border)' }}>
                  <td
                    colSpan={3}
                    style={{
                      padding: '10px 12px',
                      fontWeight: 600,
                      color: 'var(--color-text-secondary)',
                      fontSize: '0.75rem',
                    }}
                  >
                    Total
                  </td>
                  <td
                    style={{
                      padding: '10px 12px',
                      fontWeight: 700,
                      color: 'var(--color-text-primary)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {myLogs.reduce((s, l) => s + l.hoursLogged, 0).toFixed(2)}h
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          )}
        </SectionCard>
      </div>

      {isManagement && (
        <div className="mt-4">
          <SectionCard title={`Utilization Tim — ${monthLabel}`}>
            {utilization.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', padding: '16px' }}>
                Belum ada log tim untuk bulan ini.
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['Member', 'Total Jam', 'Jumlah Log', 'Rata-rata/Log'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '10px 12px',
                          textAlign: h === 'Member' ? 'left' : 'right',
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          color: 'var(--color-text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {utilization.map((row) => (
                    <tr key={row.memberId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                        {row.memberName}
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          textAlign: 'right',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        {row.totalHours.toFixed(2)}h
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--color-text-secondary)' }}>
                        {row.logCount}
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          textAlign: 'right',
                          color: 'var(--color-text-muted)',
                          fontFamily: 'monospace',
                        }}
                      >
                        {(row.totalHours / row.logCount).toFixed(2)}h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>
        </div>
      )}
    </div>
  )
}
