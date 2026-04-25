-- ============================================================
-- Migration: 0038_task_deadline_reminder_cron
-- Kirim notifikasi H-1 deadline untuk task yang belum done.
-- Menggunakan pg_cron, dijalankan setiap hari pukul 08:00 WIB
-- (= 01:00 UTC karena WIB = UTC+7).
--
-- Prasyarat: extension pg_cron aktif (Supabase Dashboard → Extensions).
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
        AND n.type = 'task_deadline_reminder'
        AND n.link = '/tasks/' || t.id::text
        AND n.created_at >= current_date::timestamptz
        AND n.created_at < (current_date + interval '1 day')::timestamptz
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
  '0 1 * * *', -- setiap hari jam 01:00 UTC
  $$SELECT public.send_task_deadline_reminders();$$
);
