-- ============================================================================
-- KADARN v2 — Sprint 1 Block A: Evidence Sources
-- ============================================================================
-- Authority: Architecture Constitution v2.0, Ratified Minimal Schema
-- Represents a stable source from which KADARN can acquire information.
-- Distinction: EvidenceSource = logical source; SourceRecord = acquired record.
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE source_type AS ENUM (
        'registry', 'system', 'document', 'declaration', 'device',
        'api_endpoint', 'export', 'other'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE producer_type AS ENUM (
        'regulatory_agency', 'institution', 'system', 'person',
        'device', 'external_service'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE authority_level AS ENUM (
        'regulatory', 'authoritative_registry', 'transactional_system',
        'institutional_record', 'human_attestation', 'inferred_or_generated'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE acquisition_method AS ENUM (
        'api_query', 'web_scrape', 'file_upload', 'system_push',
        'manual_entry', 'batch_import', 'periodic_export'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE freshness_policy AS ENUM (
        'no_expiration', 'fixed_duration', 'source_defined',
        'event_driven', 'manual_review'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE acquisition_status AS ENUM (
        'pending', 'acquired', 'verified', 'invalidated', 'superseded'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- TABLE: evidence_sources
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.evidence_sources (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id              UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    source_type                 source_type NOT NULL,
    canonical_name              TEXT NOT NULL,
    producer_type               producer_type NOT NULL,
    producer_name               TEXT NOT NULL,
    authority_level             authority_level NOT NULL,
    acquisition_method          acquisition_method NOT NULL DEFAULT 'manual_entry',
    freshness_policy            JSONB DEFAULT '{"policy": "manual_review"}',
    verification_policy         TEXT,
    base_uri                    TEXT,
    external_system_identifier  TEXT,
    active                      BOOLEAN NOT NULL DEFAULT true,
    metadata                    JSONB DEFAULT '{}',
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_source_canonical_name UNIQUE (canonical_name)
);

-- ############################################################################
-- INDEXES
-- ############################################################################

CREATE INDEX IF NOT EXISTS idx_evidence_sources_institution ON public.evidence_sources(institution_id);
CREATE INDEX IF NOT EXISTS idx_evidence_sources_type ON public.evidence_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_evidence_sources_authority ON public.evidence_sources(authority_level);

-- ############################################################################
-- TRIGGER: updated_at
-- ############################################################################

DROP TRIGGER IF EXISTS trg_evidence_sources_updated_at ON public.evidence_sources;
CREATE TRIGGER trg_evidence_sources_updated_at
    BEFORE UPDATE ON public.evidence_sources
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ############################################################################
-- RLS
-- ############################################################################

ALTER TABLE public.evidence_sources ENABLE ROW LEVEL SECURITY;

-- Global sources (no institution_id) are visible to all authenticated users
CREATE POLICY es_select_all ON public.evidence_sources
    FOR SELECT
    USING (
        institution_id IS NULL
        OR institution_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY es_insert_institution ON public.evidence_sources
    FOR INSERT
    WITH CHECK (
        institution_id IS NULL
        OR institution_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY es_update_institution ON public.evidence_sources
    FOR UPDATE
    USING (
        institution_id IS NULL
        OR institution_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY es_all_service ON public.evidence_sources
    FOR ALL
    USING (auth.role() = 'service_role');

-- ############################################################################
-- GRANTS
-- ############################################################################

GRANT SELECT, INSERT, UPDATE ON public.evidence_sources TO authenticated, service_role;
GRANT DELETE ON public.evidence_sources TO service_role;

COMMENT ON TABLE public.evidence_sources IS 'KADARN v2 — Stable knowledge source. T1–T4 authority levels define trustworthiness.';
COMMENT ON COLUMN public.evidence_sources.institution_id IS 'NULL for global/public sources, set for institution-owned sources.';
COMMENT ON COLUMN public.evidence_sources.freshness_policy IS 'JSONB: {policy, max_age_days, review_interval_days, source_dependent}. See FreshnessPolicy enum.';
COMMENT ON COLUMN public.evidence_sources.authority_level IS 'T1 regulatory/registry → T2 system → T3 documentary → T4 human → inferred.';
