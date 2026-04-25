# Stage 10 — Notifikasi: Task Deadline Reminder (Cron)

## Rules

- **JANGAN** ubah tabel `notifications`, `tasks`, atau migration yang sudah ada
- Cron logic harus **idempotent** — aman dijalankan berkali-kali, tidak boleh kirim notif duplikat di hari yang sama
- Edge Function harus menggunakan **Supabase Admin client** (service role) — bukan user client
- Tidak ada perubahan ke frontend / React components
- Semua SQL helper harus SECURITY DEFINER untuk bypass RLS

---

## Context

### Kenapa butuh cron, bukan DB trigger?
DB trigger hanya bisa trigger saat ada INSERT/UPDATE di row. Reminder deadline butuh trigger **berbasis waktu** (setiap hari jam tertentu, cek task mana yang due besok). Ini butuh scheduled job.

### Arsitektur yang dipilih:
```
pg_cron (Supabase built-in) → memanggil SQL function setiap hari
SQL function → insert ke notifications untuk task yang due besok (H-1)
```

Alternatif Edge Function + external cron dihindari karena pg_cron lebih sederhana dan tidak butuh infrastruktur tambahan.

### Schema `tasks` yang relevan:
```sql
id                  uuid
title               text
due_date            date        ← ini yang dicek
assigned_to_user_id uuid FK → profiles
status              text        CHECK IN ('to_do','in_progress','review','revision','blocked','done')
project_id          uuid FK → projects
```

### Anti-duplikat:
Cek apakah notifikasi `task_deadline_reminder` untuk task + hari ini sudah pernah dikirim. Gunakan kolom `body` atau cek `link` sudah ada dengan `type = 'task_deadline_reminder'` yang dikirim hari ini.

---

## Step 1 — Aktifkan pg_cron di Supabase (MANUAL)

**Cek dulu apakah pg_cron sudah aktif:**
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

Jika belum ada:
1. Buka Supabase Dashboard → **Database** → **Extensions**
2. Cari `pg_cron`
3. Toggle → **Enable**

---

## Step 2 — Buat Migration SQL

Buat file **baru**: `supabase/migrations/0038_task_deadline_reminder_cron.sql`

```sql
-- ============================================================
-- Migration: 0038_task_deadline_reminder_cron
-- Kirim notifikasi H-1 deadline untuk task yang belum done.
-- Menggunakan pg_cron, dijalankan setiap hari pukul 08:00 WIB
-- (= 01:00 UTC karena WIB = UTC+7).
-- ============================================================

-- ─── Function: kirim reminder untuk task yang due besok ──────
CREATE OR REPLACE FUNCTION public.send_task_deadline_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tomorrow date := current_date + interval '1 day';
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, link)
  SELECT
    t.assigned_to_user_id,
    'task_deadline_reminder',
    'Deadline task besok',
    'Task "' || t.title || '" jatuh tempo besok (' || to_char(t.due_date, 'DD Mon YYYY') || ').',
    '/tasks/' || t.id::text
  FROM public.tasks t
  WHERE
    t.due_date = tomorrow
    AND t.status NOT IN ('done')
    AND t.assigned_to_user_id IS NOT NULL
    -- Anti-duplikat: jangan kirim jika sudah ada notif hari ini untuk task ini
    AND NOT EXISTS (
      SELECT 1
      FROM public.notifications n
      WHERE
        n.user_id = t.assigned_to_user_id
        AND n.type  = 'task_deadline_reminder'
        AND n.link  = '/tasks/' || t.id::text
        AND n.created_at >= current_date::timestamptz
        AND n.created_at  < (current_date + interval '1 day')::timestamptz
    );
END;
$$;

-- ─── Daftarkan cron job: setiap hari 01:00 UTC (08:00 WIB) ───
-- Hapus dulu kalau sudah ada (idempotent)
SELECT cron.unschedule('task-deadline-reminders')
  FROM cron.job
  WHERE jobname = 'task-deadline-reminders';

SELECT cron.schedule(
  'task-deadline-reminders',
  '0 1 * * *',    -- setiap hari jam 01:00 UTC
  $$SELECT public.send_task_deadline_reminders();$$
);
```

---

## Step 3 — Apply Migration di Supabase (MANUAL)

1. Buka https://supabase.com/dashboard/project/sjisdvcgqcqxbnszruco
2. Sidebar → **SQL Editor** → **New query**
3. Paste seluruh isi `supabase/migrations/0038_task_deadline_reminder_cron.sql`
4. Klik **Run**

**Verifikasi function terbuat:**
```sql
SELECT proname FROM pg_proc WHERE proname = 'send_task_deadline_reminders';
```

**Verifikasi cron job terdaftar:**
```sql
SELECT jobname, schedule, command FROM cron.job WHERE jobname = 'task-deadline-reminders';
```

Harus muncul 1 row dengan schedule `0 1 * * *`.

---

## Step 4 — Test Manual (tanpa nunggu besok)

Jalankan function secara manual di SQL Editor untuk test:

```sql
-- Sementara ubah tanggal test: pastikan ada task dengan due_date = besok dulu
-- Atau run langsung:
SELECT public.send_task_deadline_reminders();

-- Cek hasil:
SELECT * FROM public.notifications
WHERE type = 'task_deadline_reminder'
ORDER BY created_at DESC
LIMIT 10;
```

---

## Verifikasi End-to-End

1. Buat task baru dengan `due_date = hari ini + 1 hari`, assign ke user tertentu
2. Jalankan `SELECT public.send_task_deadline_reminders();` di SQL Editor
3. Login sebagai user yang di-assign → bell harus muncul notif "Deadline task besok"
4. Jalankan function lagi → **tidak boleh** ada notif duplikat (anti-duplikat bekerja)
5. Ubah status task ke `done` → jalankan function lagi → tidak ada notif baru (done tasks di-skip)

---

## Yang TIDAK dilakukan di stage ini

- ❌ Reminder H-7 atau H-3 — cukup H-1 untuk sekarang
- ❌ Reminder untuk project deadline — bisa ditambah di migration terpisah dengan pola yang sama
- ❌ Konfigurasi jam kirim dari UI — hardcoded 08:00 WIB untuk sekarang
