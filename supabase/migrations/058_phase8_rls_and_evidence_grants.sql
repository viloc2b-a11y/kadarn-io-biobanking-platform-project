-- ============================================================================
-- Phase 8 Remediation S-2 — RLS + grants for Phase 8 and Evidence Core
-- Security only — no write pipeline / native cutover (P4 optional).
-- ============================================================================
-- Made idempotent: wraps GRANT/ALTER/CREATE in table-existence checks
-- so the migration does not fail on databases where phase8 tables
-- were not created (discovery core, evidence lineage, etc.).
-- ============================================================================

-- Evidence Core 045 — table privileges (RLS policies exist in 045)
GRANT SELECT, INSERT, UPDATE ON public.claims TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.evidence_nodes TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.evidence_relationships TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.right_of_response TO authenticated, service_role;
GRANT SELECT ON public.confidence_state_snapshots TO authenticated, service_role;
GRANT SELECT ON public.evidence_class_ref TO authenticated, service_role;
