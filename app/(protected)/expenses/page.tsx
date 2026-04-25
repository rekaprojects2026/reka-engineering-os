import { redirect } from 'next/navigation'
import { getSessionProfile } from '@/lib/auth/session'
import { canAccessExpenses } from '@/lib/auth/permissions'
import { getMyExpenses, getAllExpenses } from '@/lib/expenses/queries'
import { approveExpense, rejectExpense, deleteExpense } from '@/lib/expenses/actions'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { ExpenseSubmitForm, type ExpenseProjectOption } from '@/components/modules/expenses/ExpenseSubmitForm'
import { createServerClient } from '@/lib/supabase/server'
import { formatDate, formatIDR } from '@/lib/utils/formatters'
import { getViewableProjectIdsForUser } from '@/lib/projects/queries'

export const metadata = { title: 'Expenses — ReKa Engineering OS' }

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

const CATEGORY_LABELS: Record<string, string> = {
  printing: 'Cetak Dokumen',
  survey: 'Survey Lapangan',
  transport: 'Transport',
  accommodation: 'Akomodasi',
  materials: 'Material',
  software: 'Software/Lisensi',
  meals: 'Konsumsi',
  other: 'Lainnya',
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: '#fefce8', color: '#ca8a04', label: 'Pending' },
  approved: { bg: '#f0fdf4', color: '#16a34a', label: 'Approved' },
  rejected: { bg: '#fef2f2', color: '#dc2626', label: 'Rejected' },
}

export default async function ExpensesPage({ searchParams }: PageProps) {
  const profile = await getSessionProfile()
  if (!canAccessExpenses(profile.system_role)) {
    redirect('/access-denied')
  }

  const params = await searchParams
  const statusFilter = params.status

  const isManagement = ['direktur', 'technical_director', 'finance'].includes(profile.system_role ?? '')

  const expenses = isManagement
    ? await getAllExpenses(statusFilter)
    : await getMyExpenses(profile.id)

  const supabase = await createServerClient()
  let projectRows: ExpenseProjectOption[] = []

  if (isManagement) {
    const { data } = await supabase
      .from('projects')
      .select('id, project_code, name')
      .neq('status', 'completed')
      .neq('status', 'cancelled')
      .order('project_code', { ascending: true })
      .limit(100)
    projectRows = (data ?? []) as ExpenseProjectOption[]
  } else {
    const viewIds = (await getViewableProjectIdsForUser(profile.id, profile.system_role)) ?? []
    if (viewIds.length === 0) {
      projectRows = []
    } else {
      const { data } = await supabase
        .from('projects')
        .select('id, project_code, name')
        .neq('status', 'completed')
        .neq('status', 'cancelled')
        .in('id', viewIds)
        .order('project_code', { ascending: true })
        .limit(100)
      projectRows = (data ?? []) as ExpenseProjectOption[]
    }
  }

  const pendingCount = expenses.filter((e) => e.status === 'pending').length
  const defaultExpenseDate = new Date().toISOString().slice(0, 10)

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle="Log pengeluaran operasional project. Expense yang diapprove masuk ke project cost."
        actions={
          isManagement ? (
            <form method="GET" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {[
                { value: '', label: 'Semua' },
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
              ].map((opt) => (
                <button
                  key={opt.value || 'all'}
                  type="submit"
                  name="status"
                  value={opt.value}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 'var(--radius-control)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.8125rem',
                    fontWeight: (statusFilter ?? '') === opt.value ? 600 : 400,
                    backgroundColor:
                      (statusFilter ?? '') === opt.value ? 'var(--color-primary)' : 'var(--color-surface)',
                    color:
                      (statusFilter ?? '') === opt.value
                        ? 'var(--color-primary-fg)'
                        : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </form>
          ) : undefined
        }
      />

      <SectionCard title="Submit Expense Baru">
        <ExpenseSubmitForm projects={projectRows} defaultExpenseDate={defaultExpenseDate} />
      </SectionCard>

      <div className="mt-4">
        <SectionCard
          title={
            isManagement
              ? `Semua Expenses${pendingCount > 0 ? ` · ${pendingCount} pending` : ''}`
              : 'Expenses Saya'
          }
          noPadding
        >
          {expenses.length === 0 ? (
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', padding: '20px 16px' }}>
              Belum ada expense.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {(
                      [
                        'Tanggal',
                        'Project',
                        'Kategori',
                        'Deskripsi',
                        'Jumlah',
                        ...(isManagement ? ['Submitter'] : []),
                        'Status',
                        '\u00a0',
                      ] as const
                    ).map((h) => (
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
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => {
                    const st = STATUS_STYLE[exp.status] ?? STATUS_STYLE.pending
                    return (
                      <tr key={exp.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td
                          style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}
                        >
                          {formatDate(exp.expenseDate)}
                        </td>
                        <td
                          style={{
                            padding: '10px 12px',
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            color: 'var(--color-text-muted)',
                          }}
                        >
                          {exp.projectCode}
                        </td>
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                          {CATEGORY_LABELS[exp.category] ?? exp.category}
                        </td>
                        <td
                          style={{
                            padding: '10px 12px',
                            maxWidth: '220px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={exp.description}
                        >
                          {exp.description}
                        </td>
                        <td
                          style={{
                            padding: '10px 12px',
                            fontFamily: 'monospace',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            color: 'var(--color-text-primary)',
                          }}
                        >
                          {exp.currencyCode === 'IDR'
                            ? formatIDR(exp.amount)
                            : `USD ${exp.amount.toLocaleString('en-US', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2,
                              })}`}
                        </td>
                        {isManagement && (
                          <td style={{ padding: '10px 12px', color: 'var(--color-text-secondary)' }}>
                            {exp.submittedByName}
                          </td>
                        )}
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              backgroundColor: st.bg,
                              color: st.color,
                            }}
                          >
                            {st.label}
                          </span>
                          {exp.rejectionNote ? (
                            <p style={{ fontSize: '0.6875rem', color: 'var(--color-danger)', marginTop: '2px' }}>
                              {exp.rejectionNote}
                            </p>
                          ) : null}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {isManagement && exp.status === 'pending' ? (
                            <span style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-end' }}>
                              <form action={approveExpense} style={{ display: 'inline' }}>
                                <input type="hidden" name="id" value={exp.id} />
                                <button
                                  type="submit"
                                  style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--color-success)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                  }}
                                >
                                  Approve
                                </button>
                              </form>
                              <form action={rejectExpense} style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                                <input type="hidden" name="id" value={exp.id} />
                                <textarea
                                  name="rejection_note"
                                  required
                                  rows={2}
                                  placeholder="Alasan penolakan"
                                  style={{
                                    width: '160px',
                                    padding: '6px 8px',
                                    borderRadius: 'var(--radius-control)',
                                    border: '1px solid var(--color-border)',
                                    fontSize: '0.75rem',
                                    resize: 'vertical',
                                  }}
                                />
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
                                  Reject
                                </button>
                              </form>
                            </span>
                          ) : null}
                          {!isManagement && exp.status === 'pending' ? (
                            <form action={deleteExpense} style={{ display: 'inline' }}>
                              <input type="hidden" name="id" value={exp.id} />
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
                          ) : null}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
