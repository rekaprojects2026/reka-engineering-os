# Stage 12 — Expense Tracking (Large)

## ⚠️ Baca Dulu

Ini adalah stage **Large**. Baca seluruh prompt sebelum mulai coding. Jika Cursor timeout atau context habis di tengah jalan, simpan progress dan lanjut di session baru dengan menyebutkan step mana yang sudah selesai.

---

## Rules

- **JANGAN** ubah tabel yang sudah ada — hanya tambah tabel baru
- **JANGAN** ubah `compensation_records`, `payment_records`, atau `client_invoices`
- Semua kode **TypeScript strict** — tidak ada `any`, tidak ada `as unknown`
- Semua query di-cache dengan `unstable_cache` (revalidate: 300)
- Ikuti pola visual yang sama dengan `app/(protected)/finance/invoices/page.tsx`
- Member bisa **submit** expense untuk project mereka sendiri
- Finance / TD / Direktur bisa **approve atau reject**
- Finance / Direktur bisa lihat **semua** expense
- Member hanya bisa lihat expense **milik sendiri**

---

## Context

### Tujuan Expense Tracking:
1. **Member / TD** log pengeluaran project (cetak dokumen, transport survey, software)
2. **Finance** approve → expense masuk ke project cost
3. **Direktur** lihat total pengeluaran per project → mempengaruhi margin di `/finance/reports`

### Integrasi dengan Stage 8 (per-project margin):
Setelah Stage 12 selesai, fungsi `getProjectMargins()` di `lib/finance/reports-queries.ts` harus diupdate untuk **ikutsertakan approved project_expenses** ke dalam kolom Expenses. Instruksi update ada di Step 6.

### Schema baru:
```
project_expenses:
  id, project_id, task_id (nullable), category, description,
  amount, currency_code, expense_date, receipt_url (nullable),
  submitted_by, status, approved_by (nullable),
  rejection_note (nullable), created_at, updated_at
```

---

## Step 1 — Buat Migration SQL

Buat file **baru**: `supabase/migrations/0040_project_expenses.sql`

```sql
-- ============================================================
-- Migration: 0040_project_expenses
-- Pengeluaran per project: cetak, survey, transport, dll.
-- Masuk ke project cost dan mempengaruhi margin.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.project_expenses (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),

  project_id       uuid          NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id          uuid          REFERENCES public.tasks(id) ON DELETE SET NULL,

  category         text          NOT NULL
    CHECK (category IN (
      'printing', 'survey', 'transport', 'accommodation',
      'materials', 'software', 'meals', 'other'
    )),

  description      text          NOT NULL,
  amount           numeric(15,2) NOT NULL CHECK (amount > 0),
  currency_code    text          NOT NULL DEFAULT 'IDR',

  expense_date     date          NOT NULL DEFAULT current_date,
  receipt_url      text,

  submitted_by     uuid          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status           text          NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),

  approved_by      uuid          REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejection_note   text,

  created_at       timestamptz   NOT NULL DEFAULT now(),
  updated_at       timestamptz   NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.project_expenses IS
  'Project-level operational expenses. Approved expenses feed into project cost and margin reports.';

CREATE INDEX IF NOT EXISTS expenses_project_idx      ON public.project_expenses (project_id);
CREATE INDEX IF NOT EXISTS expenses_submitted_by_idx ON public.project_expenses (submitted_by);
CREATE INDEX IF NOT EXISTS expenses_status_idx       ON public.project_expenses (status);
CREATE INDEX IF NOT EXISTS expenses_date_idx         ON public.project_expenses (expense_date DESC);

CREATE TRIGGER project_expenses_updated_at
  BEFORE UPDATE ON public.project_expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.project_expenses ENABLE ROW LEVEL SECURITY;

-- Submitter: lihat + edit milik sendiri (selama masih pending)
CREATE POLICY "expenses: submitter read own"
  ON public.project_expenses FOR SELECT
  USING (submitted_by = auth.uid());

CREATE POLICY "expenses: submitter insert"
  ON public.project_expenses FOR INSERT
  WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "expenses: submitter update pending"
  ON public.project_expenses FOR UPDATE
  USING (submitted_by = auth.uid() AND status = 'pending')
  WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "expenses: submitter delete pending"
  ON public.project_expenses FOR DELETE
  USING (submitted_by = auth.uid() AND status = 'pending');

-- Management: lihat + approve semua
CREATE POLICY "expenses: management read all"
  ON public.project_expenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.system_role IN ('direktur', 'technical_director', 'finance')
    )
  );

CREATE POLICY "expenses: management update all"
  ON public.project_expenses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.system_role IN ('direktur', 'technical_director', 'finance')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.system_role IN ('direktur', 'technical_director', 'finance')
    )
  );
```

---

## Step 2 — Apply Migration (MANUAL)

1. Buka https://supabase.com/dashboard/project/sjisdvcgqcqxbnszruco
2. Sidebar → **SQL Editor** → **New query**
3. Paste isi `0040_project_expenses.sql`
4. Klik **Run**

**Verifikasi:**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'project_expenses'
ORDER BY ordinal_position;
```

---

## Step 3 — Buat Query Layer

Buat file **baru**: `lib/expenses/queries.ts`

```typescript
import { unstable_cache } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

export type ExpenseRow = {
  id: string
  projectId: string
  projectCode: string
  taskId: string | null
  taskTitle: string | null
  category: string
  description: string
  amount: number
  currencyCode: string
  expenseDate: string
  receiptUrl: string | null
  submittedById: string
  submittedByName: string
  status: 'pending' | 'approved' | 'rejected'
  approvedByName: string | null
  rejectionNote: string | null
}

type RawExpense = {
  id: string
  project_id: string
  task_id: string | null
  category: string
  description: string
  amount: number
  currency_code: string
  expense_date: string
  receipt_url: string | null
  submitted_by: string
  status: string
  rejection_note: string | null
  projects: { project_code: string } | null
  tasks: { title: string } | null
  submitter: { full_name: string } | null
  approver: { full_name: string } | null
}

function mapExpense(r: RawExpense): ExpenseRow {
  return {
    id: r.id,
    projectId: r.project_id,
    projectCode: r.projects?.project_code ?? '—',
    taskId: r.task_id,
    taskTitle: r.tasks?.title ?? null,
    category: r.category,
    description: r.description,
    amount: Number(r.amount),
    currencyCode: r.currency_code,
    expenseDate: r.expense_date,
    receiptUrl: r.receipt_url,
    submittedById: r.submitted_by,
    submittedByName: r.submitter?.full_name ?? '—',
    status: r.status as ExpenseRow['status'],
    approvedByName: r.approver?.full_name ?? null,
    rejectionNote: r.rejection_note,
  }
}

const SELECT_FIELDS = `
  id, project_id, task_id, category, description, amount, currency_code,
  expense_date, receipt_url, submitted_by, status, rejection_note,
  projects ( project_code ),
  tasks ( title ),
  submitter:profiles!submitted_by ( full_name ),
  approver:profiles!approved_by ( full_name )
`

// ── Expenses milik sendiri ────────────────────────────────────
async function _getMyExpenses(userId: string): Promise<ExpenseRow[]> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('project_expenses')
    .select(SELECT_FIELDS)
    .eq('submitted_by', userId)
    .order('expense_date', { ascending: false })

  return ((data ?? []) as RawExpense[]).map(mapExpense)
}

export function getMyExpenses(userId: string) {
  return unstable_cache(
    () => _getMyExpenses(userId),
    ['expenses-own', userId],
    { revalidate: 300, tags: ['expenses'] },
  )()
}

// ── Semua expenses (management) ───────────────────────────────
async function _getAllExpenses(status?: string): Promise<ExpenseRow[]> {
  const supabase = await createServerClient()
  let query = supabase
    .from('project_expenses')
    .select(SELECT_FIELDS)
    .order('expense_date', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data } = await query
  return ((data ?? []) as RawExpense[]).map(mapExpense)
}

export function getAllExpenses(status?: string) {
  return unstable_cache(
    () => _getAllExpenses(status),
    ['expenses-all', status ?? 'all'],
    { revalidate: 300, tags: ['expenses'] },
  )()
}

// ── Expenses per project (untuk margin report) ────────────────
export async function getApprovedExpensesByProject(): Promise<Map<string, number>> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('project_expenses')
    .select('project_id, amount, currency_code')
    .eq('status', 'approved')

  const map = new Map<string, number>()
  for (const row of (data ?? []) as { project_id: string; amount: number; currency_code: string }[]) {
    // Simpan sebagai IDR asumsi default — caller yang konversi
    const current = map.get(row.project_id) ?? 0
    map.set(row.project_id, current + Number(row.amount))
  }
  return map
}
```

---

## Step 4 — Buat Server Actions

Buat file **baru**: `lib/expenses/actions.ts`

```typescript
'use server'

import { revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export async function submitExpense(formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const projectId   = formData.get('project_id') as string
  const taskId      = (formData.get('task_id') as string) || null
  const category    = formData.get('category') as string
  const description = (formData.get('description') as string)?.trim()
  const amountRaw   = parseFloat(formData.get('amount') as string)
  const currency    = (formData.get('currency_code') as string) || 'IDR'
  const expenseDate = formData.get('expense_date') as string
  const receiptUrl  = (formData.get('receipt_url') as string)?.trim() || null

  if (!projectId || !category || !description || !expenseDate) {
    return { error: 'Project, kategori, deskripsi, dan tanggal wajib diisi.' }
  }
  if (isNaN(amountRaw) || amountRaw <= 0) {
    return { error: 'Jumlah harus lebih dari 0.' }
  }

  const { error } = await supabase
    .from('project_expenses')
    .insert({
      project_id:    projectId,
      task_id:       taskId,
      category,
      description,
      amount:        amountRaw,
      currency_code: currency,
      expense_date:  expenseDate,
      receipt_url:   receiptUrl,
      submitted_by:  user.id,
    })

  if (error) return { error: error.message }

  revalidateTag('expenses')
  return { ok: true }
}

export async function approveExpense(id: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { error } = await supabase
    .from('project_expenses')
    .update({ status: 'approved', approved_by: user.id, rejection_note: null })
    .eq('id', id)
    .eq('status', 'pending')

  if (error) return { error: error.message }

  revalidateTag('expenses')
  return { ok: true }
}

export async function rejectExpense(id: string, rejectionNote: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  if (!rejectionNote?.trim()) return { error: 'Catatan penolakan wajib diisi.' }

  const { error } = await supabase
    .from('project_expenses')
    .update({ status: 'rejected', approved_by: user.id, rejection_note: rejectionNote.trim() })
    .eq('id', id)
    .eq('status', 'pending')

  if (error) return { error: error.message }

  revalidateTag('expenses')
  return { ok: true }
}

export async function deleteExpense(id: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { error } = await supabase
    .from('project_expenses')
    .delete()
    .eq('id', id)
    .eq('submitted_by', user.id)
    .eq('status', 'pending')

  if (error) return { error: error.message }

  revalidateTag('expenses')
  return { ok: true }
}
```

---

## Step 5 — Buat Halaman /expenses

Buat file **baru**: `app/(protected)/expenses/page.tsx`

```typescript
import { getSessionProfile } from '@/lib/auth/session'
import { getMyExpenses, getAllExpenses } from '@/lib/expenses/queries'
import { submitExpense, approveExpense, rejectExpense, deleteExpense } from '@/lib/expenses/actions'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { formatDate, formatIDR } from '@/lib/utils/formatters'
import { createServerClient } from '@/lib/supabase/server'

export const metadata = { title: 'Expenses — ReKa Engineering OS' }

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

const CATEGORY_LABELS: Record<string, string> = {
  printing: 'Cetak Dokumen', survey: 'Survey Lapangan', transport: 'Transport',
  accommodation: 'Akomodasi', materials: 'Material', software: 'Software/Lisensi',
  meals: 'Konsumsi', other: 'Lainnya',
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending:  { bg: '#fefce8', color: '#ca8a04', label: 'Pending' },
  approved: { bg: '#f0fdf4', color: '#16a34a', label: 'Approved' },
  rejected: { bg: '#fef2f2', color: '#dc2626', label: 'Rejected' },
}

export default async function ExpensesPage({ searchParams }: PageProps) {
  const profile = await getSessionProfile()
  const params = await searchParams

  const isManagement = ['direktur', 'technical_director', 'finance'].includes(profile.system_role ?? '')

  // Management lihat semua, member lihat milik sendiri
  const expenses = isManagement
    ? await getAllExpenses(params.status)
    : await getMyExpenses(profile.id)

  // Ambil daftar project untuk form submit
  const supabase = await createServerClient()
  const { data: projects } = await supabase
    .from('projects')
    .select('id, project_code, name')
    .not('status', 'in', '("completed","cancelled")')
    .order('project_code', { ascending: true })
    .limit(100)

  const pendingCount = expenses.filter(e => e.status === 'pending').length

  async function handleSubmit(fd: FormData) { 'use server'; await submitExpense(fd) }
  async function handleApprove(id: string) { 'use server'; await approveExpense(id) }
  async function handleDelete(id: string)  { 'use server'; await deleteExpense(id) }

  type ProjectOpt = { id: string; project_code: string; name: string }

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle="Log pengeluaran operasional project. Expense yang diapprove masuk ke project cost."
        actions={
          isManagement ? (
            <form method="GET" style={{ display: 'flex', gap: '8px' }}>
              {[
                { value: '', label: 'Semua' },
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
              ].map(opt => (
                <button key={opt.value} type="submit" name="status" value={opt.value}
                  style={{
                    padding: '7px 14px', borderRadius: 'var(--radius-control)',
                    border: '1px solid var(--color-border)', fontSize: '0.8125rem',
                    fontWeight: (params.status ?? '') === opt.value ? 600 : 400,
                    backgroundColor: (params.status ?? '') === opt.value ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: (params.status ?? '') === opt.value ? 'var(--color-primary-fg)' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                  }}
                >{opt.label}</button>
              ))}
            </form>
          ) : undefined
        }
      />

      {/* Form Submit Expense */}
      <SectionCard title="Submit Expense Baru">
        <form action={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div style={{ gridColumn: 'span 1' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Project *</label>
            <select name="project_id" required style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-control)', border: '1px solid var(--color-border)', fontSize: '0.8125rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}>
              <option value="">Pilih project…</option>
              {(projects ?? []).map((p: ProjectOpt) => (
                <option key={p.id} value={p.id}>[{p.project_code}] {p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Kategori *</label>
            <select name="category" required style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-control)', border: '1px solid var(--color-border)', fontSize: '0.8125rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}>
              <option value="">Pilih…</option>
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Tanggal *</label>
            <input type="date" name="expense_date" required defaultValue={new Date().toISOString().slice(0, 10)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-control)', border: '1px solid var(--color-border)', fontSize: '0.8125rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }} />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Deskripsi *</label>
            <input type="text" name="description" required placeholder="e.g. Print gambar A1 x3 lembar"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-control)', border: '1px solid var(--color-border)', fontSize: '0.8125rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Mata Uang</label>
              <select name="currency_code" defaultValue="IDR"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-control)', border: '1px solid var(--color-border)', fontSize: '0.8125rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}>
                <option value="IDR">IDR</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Jumlah *</label>
              <input type="number" name="amount" required min="1" step="1" placeholder="e.g. 75000"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-control)', border: '1px solid var(--color-border)', fontSize: '0.8125rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }} />
            </div>
          </div>

          <div style={{ gridColumn: 'span 3', display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button type="submit"
              style={{ padding: '8px 20px', borderRadius: 'var(--radius-control)', backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-fg)', fontSize: '0.8125rem', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
              Submit Expense
            </button>
          </div>
        </form>
      </SectionCard>

      {/* Tabel Expenses */}
      <SectionCard
        title={isManagement ? `Semua Expenses${pendingCount > 0 ? ` · ${pendingCount} pending` : ''}` : 'Expenses Saya'}
        style={{ marginTop: '16px' }}
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
                  {['Tanggal', 'Project', 'Kategori', 'Deskripsi', 'Jumlah', ...(isManagement ? ['Submitter'] : []), 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => {
                  const st = STATUS_STYLE[exp.status] ?? STATUS_STYLE.pending
                  return (
                    <tr key={exp.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>{formatDate(exp.expenseDate)}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{exp.projectCode}</td>
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{CATEGORY_LABELS[exp.category] ?? exp.category}</td>
                      <td style={{ padding: '10px 12px', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={exp.description}>{exp.description}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 600, whiteSpace: 'nowrap', color: 'var(--color-text-primary)' }}>
                        {exp.currencyCode === 'IDR' ? formatIDR(exp.amount) : `USD ${exp.amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
                      </td>
                      {isManagement && (
                        <td style={{ padding: '10px 12px', color: 'var(--color-text-secondary)' }}>{exp.submittedByName}</td>
                      )}
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: st.bg, color: st.color }}>
                          {st.label}
                        </span>
                        {exp.rejectionNote && (
                          <p style={{ fontSize: '0.6875rem', color: 'var(--color-danger)', marginTop: '2px' }}>{exp.rejectionNote}</p>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {/* Management: approve/reject */}
                        {isManagement && exp.status === 'pending' && (
                          <span style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <form action={handleApprove.bind(null, exp.id)} style={{ display: 'inline' }}>
                              <button type="submit" style={{ fontSize: '0.75rem', color: 'var(--color-success)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Approve</button>
                            </form>
                            <form action={async (fd: FormData) => {
                              'use server'
                              const note = fd.get('note') as string
                              await rejectExpense(exp.id, note)
                            }}>
                              <input type="hidden" name="note" value="Ditolak oleh management." />
                              <button type="submit" style={{ fontSize: '0.75rem', color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Reject</button>
                            </form>
                          </span>
                        )}
                        {/* Submitter: hapus kalau pending */}
                        {!isManagement && exp.status === 'pending' && (
                          <form action={handleDelete.bind(null, exp.id)} style={{ display: 'inline' }}>
                            <button type="submit" style={{ fontSize: '0.75rem', color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Hapus</button>
                          </form>
                        )}
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
  )
}
```

---

## Step 6 — Update Per-Project Margin untuk Ikutkan Expenses

Buka `lib/finance/reports-queries.ts` (dibuat di Stage 8). Modifikasi fungsi `_getProjectMargins`:

**Tambah import di atas:**
```typescript
import { getApprovedExpensesByProject } from '@/lib/expenses/queries'
```

**Tambah ke Promise.all dalam `_getProjectMargins`:**
```typescript
const [projRes, invRes, compRes, expenseMap] = await Promise.all([
  supabase.from('projects').select('id, project_code, name, status, clients(client_name)').order('created_at', { ascending: false }),
  supabase.from('client_invoices').select('project_id, net_amount, currency, fx_rate_snapshot, status').eq('status', 'paid'),
  supabase.from('compensation_records').select('project_id, subtotal_amount, currency_code, status').eq('status', 'paid'),
  getApprovedExpensesByProject(),
])
```

**Update kalkulasi expenses per project** — tambahkan expense amount ke existing expense map:
```typescript
// Setelah loop for compensation_records:
for (const [projectId, expAmount] of expenseMap.entries()) {
  // expense_amount default IDR, konversi ke USD
  const usdExp = expAmount / usdToIdr
  expenseMap_local.set(projectId, (expenseMap_local.get(projectId) ?? 0) + usdExp)
}
```

> **Catatan:** Rename variable `expenseMap` yang di-return dari `getApprovedExpensesByProject()` agar tidak konflik dengan Map yang dibangun dari `compensation_records`. Gunakan nama `approvedExpMap` untuk yang dari expenses query.

---

## Step 7 — Tambah Link di Sidebar

Buka `components/layout/AppSidebar.tsx`.

**Tambah permission predicate di `lib/auth/permissions.ts`:**
```typescript
// Semua internal member bisa submit expense
export const canAccessExpenses = (r?: SystemRole | null) =>
  !['freelancer'].includes(effectiveRole(r ?? 'member'))
```

**Tambah ke `NavPermissions` type dan `getNavPermissions` function:**
```typescript
// Di type NavPermissions:
showExpenses: boolean

// Di getNavPermissions return:
showExpenses: canAccessExpenses(r),
```

**Tambah ke `financeItems` atau `operationsItems` di AppSidebar.tsx:**
```typescript
import { Receipt2 } from 'lucide-react'  // atau pakai ReceiptText

// Dalam financeItems array:
...(perms.showExpenses
  ? [{ label: 'Expenses', href: '/expenses', icon: <Receipt size={16} /> }]
  : []),
```

> Import icon `Receipt` sudah ada di sidebar. Gunakan icon yang sama atau `ReceiptText` jika tersedia.

---

## Step 8 — Verifikasi TypeScript

```bash
npx tsc --noEmit
```

---

## Verifikasi Manual

1. **Submit flow:**
   - Login sebagai member → `/expenses` → Submit expense baru (project + kategori + jumlah)
   - Expense harus muncul di tabel dengan status "Pending"

2. **Approve flow:**
   - Login sebagai Finance/TD → `/expenses` → klik Approve pada expense pending
   - Status berubah ke "Approved"

3. **Reject flow:**
   - Klik Reject → status berubah ke "Rejected" dengan catatan penolakan

4. **Hapus:**
   - Login sebagai submitter → Hapus expense yang masih Pending → hilang dari tabel

5. **Integrasi margin:**
   - Setelah ada expense approved → buka `/finance/reports`
   - Kolom "Expenses" project tersebut harus ikut bertambah

6. **RLS:**
   - Member tidak bisa lihat expense orang lain (cek di Supabase SQL):
     ```sql
     SELECT * FROM project_expenses WHERE submitted_by != '[user_id]';
     -- Harus return 0 rows kalau login sebagai member biasa
     ```
