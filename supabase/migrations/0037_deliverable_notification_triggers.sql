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
