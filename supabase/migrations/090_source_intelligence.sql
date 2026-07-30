-- ============================================================================
-- KADARN v2 — Block 01-S: Source Intelligence
-- ============================================================================
-- Authority: Architecture Alignment Audit v2 §2.2, CANONICAL_MVP_SCOPE.md
-- Purpose: Create evidence_producers, acquisition_runs, extraction_runs tables
--          and add producer_id FK to evidence_sources.
-- Migration: 090 (idempotent — all DDL guarded by IF NOT EXISTS)
-- ============================================================================

-- ############################################################################
-- ENUMS
-- ############################################################################

DO $$ BEGIN
    CREATE TYPE run_status AS ENUM (
        'pending', 'running', 'completed', 'failed', 'cancelled'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE extractor_type AS ENUM (
        'markitdown', 'ocr', 'api_extract', 'manual_extract', 'llm_extract', 'other'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- TABLE: evidence_producers
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.evidence_producers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                TEXT NOT NULL,
    producer_type       producer_type NOT NULL,
    contact             TEXT,
    institution_id      UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    active              BOOLEAN NOT NULL DEFAULT true,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_producer_name UNIQUE (name)
);

-- ############################################################################
-- INDEXES: evidence_producers
-- ############################################################################

CREATE INDEX IF NOT EXISTS idx_evidence_producers_type ON public.evidence_producers(producer_type);
CREATE INDEX IF NOT EXISTS idx_evidence_producers_institution ON public.evidence_producers(institution_id);

-- ############################################################################
-- TRIGGER: evidence_producers updated_at
-- ############################################################################

DROP TRIGGER IF EXISTS trg_evidence_producers_updated_at ON public.evidence_producers;
CREATE TRIGGER trg_evidence_producers_updated_at
    BEFORE UPDATE ON public.evidence_producers
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ############################################################################
-- RLS: evidence_producers
-- ############################################################################

ALTER TABLE public.evidence_producers ENABLE ROW LEVEL SECURITY;

-- Global producers (NULL institution_id) visible to all authenticated; 
-- institution-scoped producers visible to members
CREATE POLICY ep_select_all ON public.evidence_producers
    FOR SELECT
    USING (
        institution_id IS NULL
        OR institution_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY ep_insert_institution ON public.evidence_producers
    FOR INSERT
    WITH CHECK (
        institution_id IS NULL
        OR institution_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY ep_update_institution ON public.evidence_producers
    FOR UPDATE
    USING (
        institution_id IS NULL
        OR institution_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY ep_all_service ON public.evidence_producers
    FOR ALL
    USING (auth.role() = 'service_role');

-- ############################################################################
-- GRANTS: evidence_producers
-- ############################################################################

GRANT SELECT, INSERT, UPDATE ON public.evidence_producers TO authenticated, service_role;
GRANT DELETE ON public.evidence_producers TO service_role;

-- ############################################################################
-- COLUMN: evidence_sources.producer_id — FK to evidence_producers
-- ############################################################################

ALTER TABLE public.evidence_sources
    ADD COLUMN IF NOT EXISTS producer_id UUID
    REFERENCES public.evidence_producers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_evidence_sources_producer ON public.evidence_sources(producer_id);

COMMENT ON COLUMN public.evidence_sources.producer_id IS
    'FK to evidence_producers. When set, producer_type and producer_name on this row may be derived/denormalized.';

-- ############################################################################
-- TABLE: acquisition_runs
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.acquisition_runs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id           UUID NOT NULL REFERENCES public.evidence_sources(id) ON DELETE CASCADE,
    institution_id      UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    started_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    status              run_status NOT NULL DEFAULT 'pending',
    record_count        INTEGER DEFAULT 0,
    error_message       TEXT,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ############################################################################
-- INDEXES: acquisition_runs
-- ############################################################################

CREATE INDEX IF NOT EXISTS idx_acquisition_runs_source ON public.acquisition_runs(source_id);
CREATE INDEX IF NOT EXISTS idx_acquisition_runs_status ON public.acquisition_runs(status);
CREATE INDEX IF NOT EXISTS idx_acquisition_runs_institution ON public.acquisition_runs(institution_id);

-- ############################################################################
-- TRIGGER: acquisition_runs updated_at
-- ############################################################################

DROP TRIGGER IF EXISTS trg_acquisition_runs_updated_at ON public.acquisition_runs;
CREATE TRIGGER trg_acquisition_runs_updated_at
    BEFORE UPDATE ON public.acquisition_runs
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ############################################################################
-- RLS: acquisition_runs
-- ############################################################################

ALTER TABLE public.acquisition_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY ar_select_institution ON public.acquisition_runs
    FOR SELECT
    USING (
        institution_id IS NULL
        OR institution_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY ar_insert_institution ON public.acquisition_runs
    FOR INSERT
    WITH CHECK (
        institution_id IS NULL
        OR institution_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY ar_update_institution ON public.acquisition_runs
    FOR UPDATE
    USING (
        institution_id IS NULL
        OR institution_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY ar_all_service ON public.acquisition_runs
    FOR ALL
    USING (auth.role() = 'service_role');

-- ############################################################################
-- GRANTS: acquisition_runs
-- ############################################################################

GRANT SELECT, INSERT, UPDATE ON public.acquisition_runs TO authenticated, service_role;
GRANT DELETE ON public.acquisition_runs TO service_role;

-- ############################################################################
-- TABLE: extraction_runs
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.extraction_runs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_record_id    UUID NOT NULL REFERENCES public.source_records(id) ON DELETE CASCADE,
    institution_id      UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    started_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    extractor_type      extractor_type NOT NULL DEFAULT 'manual_extract',
    status              run_status NOT NULL DEFAULT 'pending',
    extraction_count    INTEGER DEFAULT 0,
    error_message       TEXT,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ############################################################################
-- INDEXES: extraction_runs
-- ############################################################################

CREATE INDEX IF NOT EXISTS idx_extraction_runs_record ON public.extraction_runs(source_record_id);
CREATE INDEX IF NOT EXISTS idx_extraction_runs_status ON public.extraction_runs(status);
CREATE INDEX IF NOT EXISTS idx_extraction_runs_extractor ON public.extraction_runs(extractor_type);
CREATE INDEX IF NOT EXISTS idx_extraction_runs_institution ON public.extraction_runs(institution_id);

-- ############################################################################
-- TRIGGER: extraction_runs updated_at
-- ############################################################################

DROP TRIGGER IF EXISTS trg_extraction_runs_updated_at ON public.extraction_runs;
CREATE TRIGGER trg_extraction_runs_updated_at
    BEFORE UPDATE ON public.extraction_runs
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ############################################################################
-- RLS: extraction_runs
-- ############################################################################

ALTER TABLE public.extraction_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY er_select_institution ON public.extraction_runs
    FOR SELECT
    USING (
        institution_id IS NULL
        OR institution_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY er_insert_institution ON public.extraction_runs
    FOR INSERT
    WITH CHECK (
        institution_id IS NULL
        OR institution_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY er_update_institution ON public.extraction_runs
    FOR UPDATE
    USING (
        institution_id IS NULL
        OR institution_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY er_all_service ON public.extraction_runs
    FOR ALL
    USING (auth.role() = 'service_role');

-- ############################################################################
-- GRANTS: extraction_runs
-- ############################################################################

GRANT SELECT, INSERT, UPDATE ON public.extraction_runs TO authenticated, service_role;
GRANT DELETE ON public.extraction_runs TO service_role;

-- ############################################################################
-- COMMENTS
-- ############################################################################

COMMENT ON TABLE public.evidence_producers IS 'KADARN v2 — Entity that produces or originates evidence (regulatory agency, institution, system, person, device, external service).';
COMMENT ON TABLE public.acquisition_runs IS 'KADARN v2 — Tracks an acquisition session: pulling records from an evidence_source. Records count, timing, and outcome.';
COMMENT ON TABLE public.extraction_runs IS 'KADARN v2 — Tracks an extraction session: processing a source_record to produce evidence nodes. Records extractor type and outcome.';

COMMENT ON COLUMN public.evidence_producers.contact IS 'Contact information for the producer (email, URL, or free-text).';
COMMENT ON COLUMN public.acquisition_runs.record_count IS 'Number of source_records created or updated during this run.';
COMMENT ON COLUMN public.acquisition_runs.error_message IS 'Error details if the run failed.';
COMMENT ON COLUMN public.extraction_runs.extraction_count IS 'Number of evidence nodes extracted during this run.';
COMMENT ON COLUMN public.extraction_runs.error_message IS 'Error details if the run failed.';
