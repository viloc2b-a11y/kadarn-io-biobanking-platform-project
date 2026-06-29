-- ============================================================================
-- KADARN PLATFORM — Sprint 11: External Integrations (Realtime publication)
-- ============================================================================
-- Enables Supabase Realtime on tables used for live KOC activity feeds.
-- ============================================================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_events;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.workflow_tasks;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

COMMENT ON TABLE public.audit_events IS
    'Audit trail. Realtime-enabled for KOC live activity (Sprint 11).';
