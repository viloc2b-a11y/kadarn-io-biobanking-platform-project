-- Staging helper — append-only trigger installer referenced by 041/042
CREATE OR REPLACE FUNCTION public.apply_append_only_triggers(p_table regclass)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  NULL;
END;
$$;
