-- Direktur notifications when a project requires approval, and clearer
-- lead notifications on approval / rejection. Schema: approved workflow leaves
-- pending_approval to status "new" (not a literal "approved" value).

-- 1) Notify all Direktur when a project enters pending_approval (insert or update).
CREATE OR REPLACE FUNCTION public.notify_direktur_pending_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'pending_approval' THEN
    NULL; -- continue
  ELSIF TG_OP = 'UPDATE'
        AND NEW.status = 'pending_approval'
        AND NEW.status IS DISTINCT FROM OLD.status THEN
    NULL; -- continue
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, link)
  SELECT
    p.id,
    'project_pending_approval',
    'Proyek perlu persetujuan',
    COALESCE(NEW.name, 'Proyek') || ' memerlukan persetujuan Anda.',
    '/projects/' || NEW.id::text
  FROM public.profiles p
  WHERE p.system_role = 'direktur';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_direktur_pending_approval_notifications ON public.projects;
CREATE TRIGGER tr_direktur_pending_approval_notifications
  AFTER INSERT OR UPDATE OF status ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_direktur_pending_approval();

-- 2) Project lead: skip generic on pending_approval (Direktur path above);
--    specific copy when review finishes (→ new or rejected from pending_approval)
CREATE OR REPLACE FUNCTION public.notify_project_status_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  proj_name text;
BEGIN
  IF TG_OP <> 'UPDATE' OR NEW.status IS NOT DISTINCT FROM OLD.status
     OR NEW.project_lead_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  proj_name := COALESCE(NEW.name, 'Proyek');

  IF NEW.status = 'pending_approval' THEN
    -- Notifikasi ke Direktur lewat notify_direktur_pending_approval; lead tidak
    -- perlu baris generik "status → pending_approval" di sini.
    RETURN NEW;
  ELSIF OLD.status = 'pending_approval' AND NEW.status = 'new' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.project_lead_user_id,
      'project_status_changed',
      'Proyek disetujui',
      proj_name || ' sudah disetujui dan siap dikerjakan.',
      '/projects/' || NEW.id::text
    );
  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending_approval' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.project_lead_user_id,
      'project_status_changed',
      'Proyek ditolak',
      proj_name || ' ditolak. Cek detail proyek dan catatan penolakan.',
      '/projects/' || NEW.id::text
    );
  ELSE
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.project_lead_user_id,
      'project_status_changed',
      'Status proyek berubah',
      proj_name || ': ' || COALESCE(OLD.status, '') || ' → ' || NEW.status,
      '/projects/' || NEW.id::text
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger tr_project_status_notifications (0032) memanggil function di atas; tidak perlu di-drop.
