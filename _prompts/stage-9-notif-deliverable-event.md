# Stage 9 — Notifikasi: Deliverable Status Event

## Rules

- **HANYA** buat 1 file migration SQL baru
- **JANGAN** ubah migration yang sudah ada (0032, 0034)
- **JANGAN** ubah `hooks/useRealtimeNotifications.ts`
- **JANGAN** ubah tabel `notifications` atau `deliverables`
- Ikuti **persis** pola yang sama dari migration `0032_notifications_realtime.sql`
- Nomor migration berikutnya adalah **0037** — cek dulu file terakhir di `supabase/migrations/`

---

## Context

### Trigger yang sudah ada (0032) sebagai referensi pola:
```sql
-- Trigger untuk task assignment
CREATE OR REPLACE FUNCTION public.notify_task_assignment_change()
...
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (NEW.assigned_to_user_id, 'task_assigned', 'Task baru ditugaskan', ...)
...
CREATE TRIGGER tr_task_assignment_notifications
  AFTER INSERT OR UPDATE OF assigned_to_user_id ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.notify_task_assignment_change();
```

### Schema `deliverables` yang relevan:
```sql
id                    uuid
project_id            uuid FK → projects
name                  text
status                text  CHECK IN (
                        'draft', 'internal_review', 'ready_to_submit',
                        'sent_to_client', 'revision_requested', 'approved', 'final_issued'
                      )
prepared_by_user_id   uuid FK → profiles   ← pembuat deliverable
reviewed_by_user_id   uuid FK → profiles   ← reviewer (nullable)
created_by            uuid FK → profiles
```

### Event yang perlu notifikasi:

| Event | Siapa yang dinotif | Kapan |
|---|---|---|
| Status → `internal_review` | `reviewed_by_user_id` | Deliverable siap direview |
| Status → `revision_requested` | `prepared_by_user_id` | Reviewer minta revisi |
| Status → `approved` | `prepared_by_user_id` | Deliverable diapprove |
| Status → `final_issued` | Project lead (via project) | Deliverable final dikirim |

Untuk `final_issued`: perlu JOIN ke `projects` untuk dapatkan `project_lead_user_id`.

---

## Step 1 — Buat Migration SQL

Buat file **baru**: `supabase/migrations/0037_deliverable_notification_triggers.sql`

```sql
-- ============================================================
-- Migration: 0037_deliverable_notification_triggers
-- Notifikasi otomatis untuk perubahan status deliverable.
-- Mengikuti pola dari 0032_notifications_realtime.sql
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_deliverable_status_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  proj_lead_id uuid;
  deliv_name   text;
BEGIN
  -- Hanya jalankan saat status berubah via UPDATE
  IF TG_OP <> 'UPDATE' OR NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  deliv_name := COALESCE(NEW.name, 'Deliverable');

  -- Status → internal_review: notif ke reviewer
  IF NEW.status = 'internal_review'
     AND NEW.reviewed_by_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.reviewed_by_user_id,
      'deliverable_review_requested',
      'Deliverable siap direview',
      deliv_name || ' telah siap untuk direview.',
      '/projects/' || NEW.project_id::text
    );

  -- Status → revision_requested: notif ke preparer
  ELSIF NEW.status = 'revision_requested'
        AND NEW.prepared_by_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.prepared_by_user_id,
      'deliverable_revision_requested',
      'Revisi diminta',
      deliv_name || ' memerlukan revisi.',
      '/projects/' || NEW.project_id::text
    );

  -- Status → approved: notif ke preparer
  ELSIF NEW.status = 'approved'
        AND NEW.prepared_by_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.prepared_by_user_id,
      'deliverable_approved',
      'Deliverable disetujui',
      deliv_name || ' telah disetujui.',
      '/projects/' || NEW.project_id::text
    );

  -- Status → final_issued: notif ke project lead
  ELSIF NEW.status = 'final_issued' THEN
    SELECT project_lead_user_id INTO proj_lead_id
    FROM public.projects
    WHERE id = NEW.project_id;

    IF proj_lead_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (
        proj_lead_id,
        'deliverable_final_issued',
        'Deliverable final diterbitkan',
        deliv_name || ' sudah dikirim sebagai final.',
        '/projects/' || NEW.project_id::text
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_deliverable_status_notifications ON public.deliverables;
CREATE TRIGGER tr_deliverable_status_notifications
  AFTER UPDATE OF status ON public.deliverables
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_deliverable_status_changed();
```

---

## Step 2 — Apply Migration di Supabase (MANUAL)

**Langkah manual — tidak bisa dilakukan lewat kode:**

1. Buka https://supabase.com/dashboard/project/sjisdvcgqcqxbnszruco
2. Sidebar → **SQL Editor** → **New query**
3. Paste seluruh isi file `supabase/migrations/0037_deliverable_notification_triggers.sql`
4. Klik **Run**
5. Verifikasi tidak ada error

**Verifikasi trigger terpasang:**
```sql
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table = 'deliverables'
ORDER BY trigger_name;
```

Harus muncul: `tr_deliverable_status_notifications`

---

## Step 3 — Tidak Ada Perubahan Kode TypeScript

Migration ini pure SQL. In-app notification bell (`useRealtimeNotifications.ts`) sudah subscribe ke semua INSERT di tabel `notifications` — tidak perlu perubahan apapun di TypeScript.

Jika Stage 6c (notification email webhook) sudah selesai, email untuk deliverable events akan otomatis terkirim juga — tidak perlu setup tambahan.

---

## Verifikasi End-to-End

1. Buka project yang punya deliverable
2. Ubah status deliverable ke `internal_review`
3. User yang jadi `reviewed_by_user_id` → bell harus muncul notifikasi "Deliverable siap direview"
4. Ubah status ke `revision_requested`
5. User `prepared_by_user_id` → bell harus muncul "Revisi diminta"
6. Ubah status ke `approved`
7. User `prepared_by_user_id` → bell harus muncul "Deliverable disetujui"
8. Ubah status ke `final_issued`
9. Project lead project tersebut → bell harus muncul "Deliverable final diterbitkan"

---

## Yang TIDAK dilakukan di stage ini

- ❌ Notif untuk deliverable yang baru dibuat (INSERT) — tidak ada penerima yang jelas
- ❌ Notif untuk comment / mention — entity `comments` belum ada di schema
- ❌ Perubahan UI komponen deliverable
