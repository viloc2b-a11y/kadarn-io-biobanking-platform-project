-- ============================================================================
-- KADARN v2 — Sprint 2 Block B: Evidence Nodes Extension
-- ============================================================================
-- Adds source provenance and epistemic typing to existing evidence_nodes.
-- All new columns are nullable for backward compatibility.
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE epistemic_type AS ENUM (
        'observation',
        'direct_claim',
        'derived_claim',
        'inference'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add columns (all nullable — backward compatible)
ALTER TABLE IF EXISTS public.evidence_nodes
    ADD COLUMN IF NOT EXISTS source_record_id UUID REFERENCES public.source_records(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS epistemic_type public.epistemic_type DEFAULT 'observation',
    ADD COLUMN IF NOT EXISTS extraction_info JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS locator_json JSONB DEFAULT '{}';

-- Index for provenance queries
CREATE INDEX IF NOT EXISTS idx_evidence_nodes_source_record ON public.evidence_nodes(source_record_id);
CREATE INDEX IF NOT EXISTS idx_evidence_nodes_epistemic ON public.evidence_nodes(epistemic_type);

COMMENT ON COLUMN public.evidence_nodes.source_record_id IS 'FK to source_records — provenance chain from acquisition. NULL for legacy evidence.';
COMMENT ON COLUMN public.evidence_nodes.epistemic_type IS 'observation = extracted; direct_claim = human assertion; derived_claim = rule-based; inference = AI-generated.';
COMMENT ON COLUMN public.evidence_nodes.extraction_info IS 'JSONB: {parser_model, parser_version, extraction_confidence, extraction_run_id, extracted_at}.';
COMMENT ON COLUMN public.evidence_nodes.locator_json IS 'JSONB: {page, section, span, uri} — location within the source document.';
