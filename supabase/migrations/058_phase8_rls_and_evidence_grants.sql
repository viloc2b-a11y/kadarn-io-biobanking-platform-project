-- ============================================================================
-- Phase 8 Remediation S-2 — RLS + grants for Phase 8 and Evidence Core
-- Security only — no write pipeline / native cutover (P4 optional).
-- ============================================================================

-- Evidence Core 045 — table privileges (RLS policies exist in 045)
GRANT SELECT, INSERT, UPDATE ON public.claims TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.evidence_nodes TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.evidence_relationships TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.right_of_response TO authenticated, service_role;
GRANT SELECT ON public.confidence_state_snapshots TO authenticated, service_role;
GRANT SELECT ON public.evidence_class TO authenticated, service_role;

GRANT SELECT ON public.discovery_layer1 TO authenticated, service_role;
GRANT SELECT ON public.discovery_preparation_requests TO authenticated, service_role;

-- Phase 8 lineage (046)
GRANT SELECT ON public.evidence_sources TO authenticated, service_role;
GRANT SELECT ON public.evidence_source_versions TO authenticated, service_role;
GRANT SELECT ON public.evidence_artifacts TO authenticated, service_role;
GRANT SELECT ON public.evidence_extraction_runs TO authenticated, service_role;
GRANT SELECT ON public.evidence_extracted_facts TO authenticated, service_role;

ALTER TABLE public.evidence_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_source_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_extraction_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_extracted_facts ENABLE ROW LEVEL SECURITY;

CREATE POLICY evidence_sources_select_org ON public.evidence_sources
    FOR SELECT USING (
        org_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY evidence_facts_select_org ON public.evidence_extracted_facts
    FOR SELECT USING (
        extraction_run_id IN (
            SELECT er.run_id FROM public.evidence_extraction_runs er
            JOIN public.evidence_artifacts ea ON ea.artifact_id = er.artifact_id
            JOIN public.evidence_source_versions esv ON esv.source_version_id = ea.source_version_id
            JOIN public.evidence_sources es ON es.source_id = esv.source_id
            WHERE es.org_id IN (
                SELECT organization_id FROM public.organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
        OR auth.role() = 'service_role'
    );

-- Phase 8 claims/views (047)
GRANT SELECT ON public.phase8_claim_instances TO authenticated, service_role;
GRANT SELECT ON public.phase8_claim_versions TO authenticated, service_role;
GRANT SELECT ON public.phase8_claim_candidates TO authenticated, service_role;
GRANT SELECT ON public.phase8_published_views TO authenticated, service_role;

ALTER TABLE public.phase8_claim_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phase8_claim_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phase8_claim_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phase8_published_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY phase8_views_select_org ON public.phase8_published_views
    FOR SELECT USING (
        org_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY phase8_claims_select_org ON public.phase8_claim_instances
    FOR SELECT USING (
        org_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

-- Hybrid index (048)
GRANT SELECT ON public.phase8_materialized_edges TO authenticated, service_role;
ALTER TABLE public.phase8_materialized_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY phase8_edges_service ON public.phase8_materialized_edges
    FOR SELECT USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
