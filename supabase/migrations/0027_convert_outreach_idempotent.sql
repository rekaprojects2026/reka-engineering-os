-- =============================================================
-- Migration: 0027_convert_outreach_idempotent
-- Second click / stale UI: return existing intake instead of error.
-- =============================================================

CREATE OR REPLACE FUNCTION public.convert_outreach_to_intake(p_outreach_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text;
  c public.outreach_companies%ROWTYPE;
  new_id uuid;
  v_source text;
  v_contact_channel text;
  v_title text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT p.system_role INTO v_role
  FROM public.profiles AS p
  WHERE p.id = v_uid;

  IF v_role IS DISTINCT FROM 'bd' THEN
    RAISE EXCEPTION 'Only BD can convert outreach to a lead';
  END IF;

  SELECT * INTO c FROM public.outreach_companies WHERE id = p_outreach_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Company not found';
  END IF;

  -- Idempotent: prior success or double-submit → return linked intake, no error
  IF c.converted_intake_id IS NOT NULL THEN
    RETURN (SELECT to_jsonb(i.*) FROM public.intakes AS i WHERE i.id = c.converted_intake_id);
  END IF;

  IF c.status = 'converted' THEN
    RAISE EXCEPTION
      'Outreach status is converted but no intake is linked. Ask an admin to fix this row.';
  END IF;

  v_source := CASE c.contact_channel
    WHEN 'upwork' THEN 'upwork'
    WHEN 'direct' THEN 'direct'
    ELSE 'other'
  END;

  v_contact_channel := CASE
    WHEN c.contact_channel IS NULL THEN NULL
    WHEN c.contact_channel IN (
      'whatsapp', 'email', 'instagram', 'linkedin', 'telegram', 'phone', 'other'
    ) THEN c.contact_channel
    ELSE 'other'
  END;

  v_title := 'Lead from ' || c.company_name;

  INSERT INTO public.intakes (
    title,
    source,
    temp_client_name,
    discipline,
    project_type,
    status,
    contact_channel,
    contact_value,
    received_date,
    created_by,
    intake_code
  ) VALUES (
    v_title,
    v_source,
    c.company_name,
    'other',
    'other',
    'new',
    v_contact_channel,
    c.contact_value,
    (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date,
    v_uid,
    ''
  )
  RETURNING id INTO new_id;

  UPDATE public.outreach_companies
  SET
    status = 'converted',
    converted_intake_id = new_id,
    updated_at = now()
  WHERE id = p_outreach_id;

  RETURN (SELECT to_jsonb(i.*) FROM public.intakes AS i WHERE i.id = new_id);
END;
$$;
