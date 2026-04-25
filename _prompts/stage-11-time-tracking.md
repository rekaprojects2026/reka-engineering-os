# Stage 11 — Time Tracking (Large)

## ⚠️ Baca Dulu

Ini adalah stage **Large**. Kerjakan dalam satu session tapi baca seluruh prompt sebelum mulai. Jika Cursor timeout atau context habis, simpan progress dan lanjut di session baru dengan menyebutkan step mana yang sudah selesai.

---

## Rules

- **JANGAN** ubah tabel yang sudah ada — hanya tambah tabel baru
- **JANGAN** modifikasi `compensation_records` atau `payment_records`
- Semua kode **TypeScript strict** — tidak ada `any`, tidak ada `as unknown`
- Semua query di-cache dengan `unstable_cache` (revalidate: 300)
- Ikuti pola visual yang sama dengan halaman `app/(protected)/finance/invoices/page.tsx`
- Role yang bisa akses: `technical_director`, `direktur`, `finance` (lihat semua), `member` (lihat log milik sendiri)
- Tidak ada real-time di stage ini — cukup server-rendered

---

## Context

### Tujuan Time Tracking:
1. **Member** log jam kerja per task (`work_logs`)
2. **TD / Direktur** lihat total jam per member per bulan → basis payroll freelancer
3. **Finance** lihat utilization report di `/finance/reports`

### Dependency dengan modul lain:
- Time tracking data → dipakai oleh Finance utilization (Stage 8 sudah ada placeholder)
- Time tracking data → bisa jadi basis `compensation_records` (dibuat manual oleh TD)
- **Tidak ada** auto-create compensation dari time log — itu keputusan manual

### Schema baru yang akan dibuat:
```
work_logs:
  id, task_id, project_id, member_id,
  log_date (date), hours_logged (numeric 4,2),
  description (text nullable),
  created_by, created_at, updated_at
```

---

## Step 1 — Buat Migration SQL

Buat file **baru**: `supabase/migrations/0039_work_logs.sql`

```sql
-- ============================================================
-- Migration: 0039_work_logs
-- Time tracking — log jam kerja per task per member per hari.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.work_logs (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id      uuid          NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  project_id   uuid          NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  member_id    uuid          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  log_date     date          NOT NULL DEFAULT current_date,
  hours_logged numeric(5,2)  NOT NULL CHECK (hours_logged > 0 AND hours_logged <= 24),
  description  text,

  created_by   uuid          REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   timestamptz   NOT NULL DEFAULT now(),
  updated_at   timestamptz   NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.work_logs IS
  'Daily work hour logs per member per task. Basis for utilization reports and freelancer payroll.';

CREATE INDEX IF NOT EXISTS work_logs_task_idx     ON public.work_logs (task_id);
CREATE INDEX IF NOT EXISTS work_logs_project_idx  ON public.work_logs (project_id);
CREATE INDEX IF NOT EXISTS work_logs_member_idx   ON public.work_logs (member_id);
CREATE INDEX IF NOT EXISTS work_logs_date_idx     ON public.work_logs (log_date DESC);

CREATE TRIGGER work_logs_updated_at
  BEFORE UPDATE ON public.work_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.work_logs ENABLE ROW LEVEL SECURITY;

-- Member dapat lihat dan kelola log milik sendiri
CREATE POLICY "work_logs: member read own"
  ON public.work_logs FOR SELECT
  USING (member_id = auth.uid());

CREATE POLICY "work_logs: member insert own"
  ON public.work_logs FOR INSERT
  WITH CHECK (member_id = auth.uid() AND created_by = auth.uid());

CREATE POLICY "work_logs: member update own"
  ON public.work_logs FOR UPDATE
  USING (member_id = auth.uid())
  WITH CHECK (member_id = auth.uid());

CREATE POLICY "work_logs: member delete own"
  ON public.work_logs FOR DELETE
  USING (member_id = auth.uid());

-- Management dapat lihat semua
CREATE POLICY "work_logs: management read all"
  ON public.work_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.system_role IN ('direktur', 'technical_director', 'finance')
    )
  );

-- TD dapat insert/edit log untuk member manapun (koreksi admin)
CREATE POLICY "work_logs: td manage all"
  ON public.work_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.system_role IN ('direktur', 'technical_director')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.system_role IN ('direktur', 'technical_director')
    )
  );
```

---

## Step 2 — Apply Migration (MANUAL)

1. Buka Supabase SQL Editor
2. Paste isi `0039_work_logs.sql`
3. Run

**Verifikasi:**
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'work_logs'
ORDER BY ordinal_position;
```

---

## Step 3 — Buat Query Layer

Buat file **baru**: `lib/work-logs/queries.ts`

```typescript
import { unstable_cache } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

export type WorkLogRow = {
  id: string
  taskId: string
  taskTitle: string
  projectId: string
  projectCode: string
  memberId: string
  memberName: string
  logDate: string
  hoursLogged: number
  description: string | null
}

export type MemberUtilizationRow = {
  memberId: string
  memberName: string
  totalHours: number
  logCount: number
}

// ── Logs milik user sendiri ──────────────────────────────────
async function _getMyWorkLogs(userId: string, monthIso: string): Promise<WorkLogRow[]> {
  const supabase = await createServerClient()
  const monthEnd = new Date(monthIso)
  monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1)

  const { data } = await supabase
    .from('work_logs')
    .select(`
      id, log_date, hours_logged, description,
      task_id, project_id, member_id,
      tasks ( title ),
      projects ( project_code ),
      profiles ( full_name )
    `)
    .eq('member_id', userId)
    .gte('log_date', monthIso)
    .lt('log_date', monthEnd.toISOString().slice(0, 10))
    .order('log_date', { ascending: false })

  type Raw = {
    id: string; log_date: string; hours_logged: number; description: string | null
    task_id: string; project_id: string; member_id: string
    tasks: { title: string } | null
    projects: { project_code: string } | null
    profiles: { full_name: string } | null
  }

  return ((data ?? []) as Raw[]).map((r) => ({
    id: r.id,
    taskId: r.task_id,
    taskTitle: r.tasks?.title ?? '—',
    projectId: r.project_id,
    projectCode: r.projects?.project_code ?? '—',
    memberId: r.member_id,
    memberName: r.profiles?.full_name ?? '—',
    logDate: r.log_date,
    hoursLogged: Number(r.hours_logged),
    description: r.description,
  }))
}

export function getMyWorkLogs(userId: string, monthIso: string) {
  return unstable_cache(
    () => _getMyWorkLogs(userId, monthIso),
    ['work-logs-own', userId, monthIso],
    { revalidate: 300, tags: ['work-logs'] },
  )()
}

// ── Utilization per member (management) ─────────────────────
async function _getMemberUtilization(monthIso: string): Promise<MemberUtilizationRow[]> {
  const supabase = await createServerClient()
  const monthEnd = new Date(monthIso)
  monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1)

  const { data } = await supabase
    .from('work_logs')
    .select('member_id, hours_logged, profiles(full_name)')
    .gte('log_date', monthIso)
    .lt('log_date', monthEnd.toISOString().slice(0, 10))

  type Raw = { member_id: string; hours_logged: number; profiles: { full_name: string } | null }

  const map = new Map<string, { name: string; hours: number; count: number }>()
  for (const r of (data ?? []) as Raw[]) {
    const existing = map.get(r.member_id)
    if (existing) {
      existing.hours += Number(r.hours_logged)
      existing.count += 1
    } else {
      map.set(r.member_id, {
        name: r.profiles?.full_name ?? 'Unknown',
        hours: Number(r.hours_logged),
        count: 1,
      })
    }
  }

  return Array.from(map.entries())
    .map(([memberId, v]) => ({
      memberId,
      memberName: v.name,
      totalHours: v.hours,
      logCount: v.count,
    }))
    .sort((a, b) => b.totalHours - a.totalHours)
}

export function getMemberUtilization(monthIso: string) {
  return unstable_cache(
    () => _getMemberUtilization(monthIso),
    ['work-logs-utilization', monthIso],
    { revalidate: 300, tags: ['work-logs'] },
  )()
}
```

---

## Step 4 — Buat Server Actions

Buat file **baru**: `lib/work-logs/actions.ts`

```typescript
'use server'

import { revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export async function createWorkLog(formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const taskId      = formData.get('task_id') as string
  const projectId   = formData.get('project_id') as string
  const logDate     = formData.get('log_date') as string
  const hoursRaw    = parseFloat(formData.get('hours_logged') as string)
  const description = (formData.get('description') as string)?.trim() || null

  if (!taskId || !projectId || !logDate) return { error: 'Task, project, dan tanggal wajib diisi.' }
  if (isNaN(hoursRaw) || hoursRaw <= 0 || hoursRaw > 24) return { error: 'Jam harus antara 0 dan 24.' }

  const { error } = await supabase
    .from('work_logs')
    .insert({
      task_id:      taskId,
      project_id:   projectId,
      member_id:    user.id,
      log_date:     logDate,
      hours_logged: hoursRaw,
      description,
      created_by:   user.id,
    })

  if (error) return { error: error.message }

  revalidateTag('work-logs')
  return { ok: true }
}

export async function deleteWorkLog(id: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { error } = await supabase
    .from('work_logs')
    .delete()
    .eq('id', id)
    .eq('member_id', user.id)  // RLS double-check: hanya bisa hapus milik sendiri

  if (error) return { error: error.message }

  revalidateTag('work-logs')
  return { ok: true }
}
```

---

## Step 5 — Buat Halaman /work-logs

Buat file **baru**: `app/(protected)/work-logs/page.tsx`

Halaman ini menampilkan:
- Member biasa: log milik sendiri + form tambah log
- TD/Direktur/Finance: tabel utilization per member

```typescript
import { getSessionProfile } from '@/lib/auth/session'
import { getMyWorkLogs, getMemberUtilization } from '@/lib/work-logs/queries'
import { createWorkLog, deleteWorkLog } from '@/lib/work-logs/actions'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { createServerClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils/formatters'

export const metadata = { title: 'Work Logs — ReKa Engineering OS' }

interface PageProps {
  searchParams: Promise<{ month?: string }>
}

export default async function WorkLogsPage({ searchParams }: PageProps) {
  const profile = await getSessionProfile()
  const params = await searchParams

  // Default ke bulan ini
  const now = new Date()
  const defaultMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`
  const monthIso = params.month ?? defaultMonth

  const isManagement = ['direktur', 'technical_director', 'finance'].includes(profile.system_role ?? '')

  const [myLogs, utilization] = await Promise.all([
    getMyWorkLogs(profile.id, monthIso),
    isManagement ? getMemberUtilization(monthIso) : Promise.resolve([]),
  ])

  // Get tasks assigned to this user for the dropdown
  const supabase = await createServerClient()
  const { data: myTasks } = await supabase
    .from('tasks')
    .select('id, title, project_id, projects(project_code)')
    .eq('assigned_to_user_id', profile.id)
    .not('status', 'eq', 'done')
    .order('created_at', { ascending: false })
    .limit(50)

  const monthLabel = new Date(monthIso).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

  async function handleCreateLog(formData: FormData) {
    'use server'
    await createWorkLog(formData)
  }

  async function handleDeleteLog(id: string) {
    'use server'
    await deleteWorkLog(id)
  }

  type TaskOption = { id: string; title: string; project_id: string; projects: { project_code: string } | null }

  return (
    <div>
      <PageHeader
        title="Work Logs"
        subtitle="Catat jam kerja per task. Digunakan sebagai basis utilization dan payroll."
        actions={
          <form method="GET" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="month"
              name="month"
              defaultValue={monthIso.slice(0, 7)}
              style={{
                padding: '7px 10px',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--color-border)',
                fontSize: '0.8125rem',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
              }}
            />
            <button type="submit" style={{ padding: '7px 14px', borderRadius: 'var(--radius-control)', border: '1px solid var(--color-border)', fontSize: '0.8125rem', backgroundColor: 'var(--color-surface)', cursor: 'pointer' }}>
              Lihat
            </button>
          </form>
        }
      />

      {/* Form Log Jam */}
      <SectionCard title="Tambah Log Jam">
        <form action={handleCreateLog} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto auto', gap: '10px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Task *</label>
            <select
              name="task_id"
              required
              style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-control)', border: '1px solid var(--color-border)', fontSize: '0.8125rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
              onChange={(e) => {
                // project_id di-populate otomatis — handled by hidden input via JS
              }}
            >
              <option value="">Pilih task…</option>
              {(myTasks ?? []).map((t: TaskOption) => (
                <option key={t.id} value={t.id} data-project={t.project_id}>
                  [{t.projects?.project_code ?? '—'}] {t.title}
                </option>
              ))}
            </select>
            {/* Hidden input untuk project_id — wajib diisi */}
            <input type="hidden" name="project_id" id="project_id_input" />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Tanggal *</label>
            <input
              type="date"
              name="log_date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-control)', border: '1px solid var(--color-border)', fontSize: '0.8125rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Jam *</label>
            <input
              type="number"
              name="hours_logged"
              required
              min="0.25"
              max="24"
              step="0.25"
              placeholder="e.g. 4"
              style={{ width: '80px', padding: '8px 10px', borderRadius: 'var(--radius-control)', border: '1px solid var(--color-border)', fontSize: '0.8125rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
            />
          </div>

          <div style={{ gridColumn: 'span 1' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Catatan</label>
            <input
              type="text"
              name="description"
              placeholder="Opsional…"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-control)', border: '1px solid var(--color-border)', fontSize: '0.8125rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
            />
          </div>

          <button
            type="submit"
            style={{ padding: '8px 16px', borderRadius: 'var(--radius-control)', backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-fg)', fontSize: '0.8125rem', fontWeight: 500, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Simpan Log
          </button>
        </form>

        {/* Client-side script untuk populate project_id dari task selection */}
        <script dangerouslySetInnerHTML={{ __html: `
          document.querySelector('[name="task_id"]').addEventListener('change', function() {
            const opt = this.options[this.selectedIndex];
            document.getElementById('project_id_input').value = opt.dataset.project || '';
          });
        `}} />
      </SectionCard>

      {/* Log milik sendiri */}
      <SectionCard title={\`Log Saya — \${monthLabel}\`} style={{ marginTop: '16px' }}>
        {myLogs.length === 0 ? (
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', padding: '16px' }}>
            Belum ada log untuk bulan ini.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Tanggal', 'Task', 'Project', 'Jam', 'Catatan', ''].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {myLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>{formatDate(log.logDate)}</td>
                  <td style={{ padding: '10px 12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.taskTitle}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{log.projectCode}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'monospace' }}>{log.hoursLogged}h</td>
                  <td style={{ padding: '10px 12px', color: 'var(--color-text-muted)', fontStyle: log.description ? 'normal' : 'italic' }}>{log.description ?? '—'}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <form action={handleDeleteLog.bind(null, log.id)} style={{ display: 'inline' }}>
                      <button type="submit" style={{ fontSize: '0.75rem', color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                        Hapus
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--color-border)' }}>
                <td colSpan={3} style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>Total</td>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'monospace' }}>
                  {myLogs.reduce((s, l) => s + l.hoursLogged, 0).toFixed(2)}h
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        )}
      </SectionCard>

      {/* Utilization per member (management only) */}
      {isManagement && (
        <SectionCard title={`Utilization Tim — ${monthLabel}`} style={{ marginTop: '16px' }}>
          {utilization.length === 0 ? (
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', padding: '16px' }}>
              Belum ada log tim untuk bulan ini.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Member', 'Total Jam', 'Jumlah Log', 'Rata-rata/Log'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: h === 'Member' ? 'left' : 'right', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {utilization.map((row) => (
                  <tr key={row.memberId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{row.memberName}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-text-primary)' }}>{row.totalHours.toFixed(2)}h</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--color-text-secondary)' }}>{row.logCount}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                      {(row.totalHours / row.logCount).toFixed(2)}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionCard>
      )}
    </div>
  )
}
```

---

## Step 6 — Tambah Link di Sidebar

Buka `components/layout/AppSidebar.tsx`. Temukan daftar nav items dan tambahkan entry:
```
{ href: '/work-logs', label: 'Work Logs', icon: Clock }
```

Import `Clock` dari `lucide-react` jika belum ada.

Posisikan di bawah "Tasks" atau di section "Team" — sesuaikan dengan struktur yang sudah ada.

---

## Step 7 — Verifikasi TypeScript

```bash
npx tsc --noEmit
```

---

## Verifikasi Manual

1. Login sebagai member biasa → buka `/work-logs`
2. Pilih task dari dropdown, isi tanggal + jam → Submit
3. Log harus muncul di tabel bawah
4. Total jam di footer tabel harus update
5. Klik Hapus → log hilang
6. Login sebagai TD/Direktur → buka `/work-logs`
7. Tabel utilization per member harus muncul di bawah
8. Ganti bulan via input month → data harus berubah
