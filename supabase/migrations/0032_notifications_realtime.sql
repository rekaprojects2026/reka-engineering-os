-- In-app notifications + DB triggers + Realtime publication

CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        text NOT NULL,
  title       text NOT NULL,
  body        text,
  link        text,
  read_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications: own row select"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications: own row update"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Triggers run as definer to bypass RLS on insert
CREATE OR REPLACE FUNCTION public.notify_task_assignment_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.assigned_to_user_id,
      'task_assigned',
      'Task baru ditugaskan',
      'Anda mendapat task: ' || COALESCE(NEW.title, '(tanpa judul)'),
      '/tasks/' || NEW.id::text
    );
  ELSIF TG_OP = 'UPDATE'
        AND NEW.assigned_to_user_id IS DISTINCT FROM OLD.assigned_to_user_id
        AND NEW.assigned_to_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.assigned_to_user_id,
      'task_assigned',
      'Penugasan task berubah',
      'Anda ditugaskan ke: ' || COALESCE(NEW.title, '(tanpa judul)'),
      '/tasks/' || NEW.id::text
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_task_assignment_notifications ON public.tasks;
CREATE TRIGGER tr_task_assignment_notifications
  AFTER INSERT OR UPDATE OF assigned_to_user_id ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_task_assignment_change();

CREATE OR REPLACE FUNCTION public.notify_invoice_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.status = 'paid'
     AND OLD.status IS DISTINCT FROM NEW.status
     AND NEW.created_by IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.created_by,
      'invoice_paid',
      'Invoice lunas',
      'Invoice ' || COALESCE(NEW.invoice_code, NEW.id::text) || ' sudah lunas.',
      '/finance/invoices/' || NEW.id::text
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_invoice_paid_notifications ON public.client_invoices;
CREATE TRIGGER tr_invoice_paid_notifications
  AFTER UPDATE OF status ON public.client_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_invoice_paid();

CREATE OR REPLACE FUNCTION public.notify_project_status_changed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.status IS DISTINCT FROM OLD.status
     AND NEW.project_lead_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.project_lead_user_id,
      'project_status_changed',
      'Status proyek berubah',
      COALESCE(NEW.name, 'Proyek') || ': ' || COALESCE(OLD.status, '') || ' → ' || NEW.status,
      '/projects/' || NEW.id::text
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_project_status_notifications ON public.projects;
CREATE TRIGGER tr_project_status_notifications
  AFTER UPDATE OF status ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_project_status_changed();

-- Realtime (enable in Dashboard if publication step fails on older projects)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
