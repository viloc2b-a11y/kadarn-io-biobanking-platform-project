-- ============================================================================
-- KADARN v2 — Sprint 1 Block A: Source Records
-- ============================================================================
-- Authority: Architecture Constitution v2.0
-- Represents a concrete acquisition instance from an EvidenceSource.
-- A SourceRecord is immutable after acceptance; new versions create new rows.
-- ============================================================================

-- ############################################################################
-- TABLE: source_records
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.source_records (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_source_id  UUID NOT NULL REFERENCES public.evidence_sources(id) ON DELETE CASCADE,
    institution_id      UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    external_record_id  TEXT,
    record_type         TEXT,
    source_version      TEXT,
    acquired_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    observed_at         TIMESTAMPTZ,
    valid_from          TIMESTAMPTZ,
    valid_until         TIMESTAMPTZ,
    content_hash        TEXT,
    locator_uri         TEXT,
    acquisition_status  acquisition_status NOT NULL DEFAULT 'acquired',
    raw_metadata        JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ############################################################################
-- INDEXES
-- ############################################################################

CREATE INDEX IF NOT EXISTS idx_source_records_source ON public.source_records(evidence_source_id);
CREATE INDEX IF NOT EXISTS idx_source_records_external ON public.source_records(external_record_id);
CREATE INDEX IF NOT EXISTS idx_source_records_institution ON public.source_records(institution_id);
CREATE INDEX IF NOT EXISTS idx_source_records_status ON public.source_records(acquisition_status);
CREATE INDEX IF NOT EXISTS idx_source_records_acquired ON public.source_records(acquired_at DESC);

-- ############################################################################
-- TRIGGER: updated_at
-- ############################################################################

DROP TRIGGER IF EXISTS trg_source_records_updated_at ON public.source_records;
CREATE TRIGGER trg_source_records_updated_at
    BEFORE UPDATE ON public.source_records
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ############################################################################
-- RLS
-- ############################################################################

ALTER TABLE public.source_records ENABLE ROW LEVEL SECURITY;

-- SourceRecords are private to their institution (or global if NULL institution)
CREATE POLICY sr_select_institution ON public.source_records
    FOR SELECT
    USING (
        institution_id IS NULL
        OR institution_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY sr_insert_institution ON public.source_records
    FOR INSERT
    WITH CHECK (
        institution_id IS NULL
        OR institution_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY sr_update_institution ON public.source_records
    FOR UPDATE
    USING (
        institution_id IS NULL
        OR institution_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY sr_all_service ON public.source_records
    FOR ALL
    USING (auth.role() = 'service_role');

-- ############################################################################
-- GRANTS
-- ############################################################################

GRANT SELECT, INSERT, UPDATE ON public.source_records TO authenticated, service_role;
GRANT DELETE ON public.source_records TO service_role;

COMMENT ON TABLE public.source_records IS 'KADARN v2 — Concrete acquisition from a knowledge source. Immutable after acceptance.';
COMMENT ON COLUMN public.source_records.evidence_source_id IS 'FK to evidence_sources — the logical source this record came from.';
COMMENT ON COLUMN public.source_records.content_hash IS 'SHA-256 or similar for content-addressable verification.';
COMMENT ON COLUMN public.source_records.acquisition_status IS 'pending → acquired → verified → invalidated/superseded.';
COMMENT ON COLUMN public.source_records.valid_from IS 'When the data in this record became effective (may differ from acquired_at).';
COMMENT ON COLUMN public.source_records.valid_until IS 'When the data expired or was superseded. NULL = currently valid.';
