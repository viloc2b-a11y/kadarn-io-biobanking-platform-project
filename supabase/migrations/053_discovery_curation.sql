-- ============================================================================
-- KTP-1.2 — Migration 053: Readiness Requirements
-- ============================================================================
-- Purpose:
--   Define what capabilities and evidence are required for each Program Type.
--
--   readiness_capability_requirements:
--     Maps Program Types to required capabilities, reusing the existing
--     organization_capability_types vocabulary (migration 008).
--
--   readiness_evidence_requirements:
--     Maps capability requirements to specific evidence classes that
--     must be present for the capability to be considered validated.
--
-- Boundaries:
--   - References but does NOT modify organization_capability_types (008).
--   - References but does NOT modify program_type_taxonomy (052).
--   - Evidence class enum (evidence_class) matches migration 045.
--   - These are REQUIREMENTS (what a program type needs), NOT assertions
--     (what an institution claims to have). Assertions live in
--     organization_capabilities + claims (008 + 045).
--
-- Dependencies:
--   - public.program_type_taxonomy (migration 052)
--   - public.organization_capability_types (migration 008)
--   - evidence_class enum (migration 045)
-- ============================================================================

-- ###########################################################################
-- PART 1: readiness_capability_requirements TABLE
-- ###########################################################################

CREATE TABLE IF NOT EXISTS public.readiness_capability_requirements (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- FK to program_type_taxonomy: which program type this requirement belongs to
    program_type_id     UUID NOT NULL
        REFERENCES public.program_type_taxonomy(id) ON DELETE CASCADE,

    -- FK to organization_capability_types: reuses the existing 12 seeded types
    capability_type_id  UUID NOT NULL
        REFERENCES public.organization_capability_types(id) ON DELETE RESTRICT,

    -- Is this capability mandatory for the program type?
    is_mandatory        BOOLEAN NOT NULL DEFAULT true,

    -- Optional per-capability confidence threshold override.
    -- If NULL, the program type's readiness_threshold is used.
    minimum_confidence  NUMERIC(3,2),

    -- Human-readable description of what this requirement entails
    description         TEXT,

    -- UI ordering
    display_order       INTEGER NOT NULL DEFAULT 0,

    -- Extension point
    metadata            JSONB DEFAULT '{}',

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- One requirement per capability per program type
    CONSTRAINT uq_readiness_cap_req UNIQUE (program_type_id, capability_type_id)
);

COMMENT ON TABLE public.readiness_capability_requirements IS
    'Required capabilities for each Program Type. '
    'References the existing organization_capability_types vocabulary (migration 008). '
    'These are REQUIREMENTS — what a program type needs from an institution. '
    'Capability ASSERTIONS (what an institution claims to have) live in organization_capabilities.';

COMMENT ON COLUMN public.readiness_capability_requirements.minimum_confidence IS
    'Per-capability override for the readiness threshold. If NULL, the program type''s '
    'default readiness_threshold from program_type_taxonomy is used.';

-- ###########################################################################
-- PART 2: readiness_evidence_requirements TABLE
-- ###########################################################################

CREATE TABLE IF NOT EXISTS public.readiness_evidence_requirements (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- FK to capability requirement: which capability this evidence supports
    capability_requirement_id   UUID NOT NULL
        REFERENCES public.readiness_capability_requirements(id) ON DELETE CASCADE,

    -- Evidence class (A-F) matching the classification from migration 045
    -- A = highest rigor (regulatory docs, certifications)
    -- F = lowest rigor (self-reported, informal)
    evidence_class              evidence_class NOT NULL,

    -- Is this evidence class mandatory for the capability?
    is_mandatory                BOOLEAN NOT NULL DEFAULT true,

    -- Minimum number of evidence items of this class required
    minimum_count               INTEGER NOT NULL DEFAULT 1,

    -- Human-readable description of what evidence is expected
    description                 TEXT,

    -- UI ordering
    display_order               INTEGER NOT NULL DEFAULT 0,

    -- Extension point
    metadata                    JSONB DEFAULT '{}',

    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- One requirement per evidence class per capability
    CONSTRAINT uq_readiness_evidence_req UNIQUE (capability_requirement_id, evidence_class)
);

COMMENT ON TABLE public.readiness_evidence_requirements IS
    'Evidence requirements per capability requirement. '
    'Each row defines what class of evidence is needed for a given capability '
    'within a given program type. Evidence classes match migration 045 (A-F).';

COMMENT ON COLUMN public.readiness_evidence_requirements.evidence_class IS
    'Evidence classification matching migration 045. A=highest rigor (certifications, regulatory), '
    'F=lowest rigor (self-reported). Used to compute readiness confidence scores.';

-- ###########################################################################
-- PART 3: INDEXES
-- ###########################################################################

CREATE INDEX IF NOT EXISTS idx_readiness_cap_req_program_type
    ON public.readiness_capability_requirements(program_type_id);

CREATE INDEX IF NOT EXISTS idx_readiness_cap_req_capability
    ON public.readiness_capability_requirements(capability_type_id);

CREATE INDEX IF NOT EXISTS idx_readiness_evidence_req_cap
    ON public.readiness_evidence_requirements(capability_requirement_id);

CREATE INDEX IF NOT EXISTS idx_readiness_evidence_req_class
    ON public.readiness_evidence_requirements(evidence_class);

-- ###########################################################################
-- PART 4: updated_at TRIGGER (capability requirements only)
-- ###########################################################################

DROP TRIGGER IF EXISTS trg_readiness_cap_req_updated_at ON public.readiness_capability_requirements;
CREATE TRIGGER trg_readiness_cap_req_updated_at
    BEFORE UPDATE ON public.readiness_capability_requirements
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ###########################################################################
-- PART 5: ROW-LEVEL SECURITY
-- ###########################################################################
-- Both tables contain reference data (what programs require).
-- Network-visible for SELECT. Management gated for authenticated users
-- (temporary — platform_admin role in Mission 3).

ALTER TABLE public.readiness_capability_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readiness_evidence_requirements ENABLE ROW LEVEL SECURITY;

-- SELECT: anyone authenticated can read requirements
DROP POLICY IF EXISTS readiness_cap_req_select ON public.readiness_capability_requirements;
CREATE POLICY readiness_cap_req_select
    ON public.readiness_capability_requirements FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS readiness_evidence_req_select ON public.readiness_evidence_requirements;
CREATE POLICY readiness_evidence_req_select
    ON public.readiness_evidence_requirements FOR SELECT
    TO authenticated
    USING (true);

-- INSERT/UPDATE/DELETE: temporary authenticated gate
-- TODO: Restrict to platform_admin in Mission 3
DROP POLICY IF EXISTS readiness_cap_req_insert ON public.readiness_capability_requirements;
CREATE POLICY readiness_cap_req_insert
    ON public.readiness_capability_requirements FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS readiness_cap_req_update ON public.readiness_capability_requirements;
CREATE POLICY readiness_cap_req_update
    ON public.readiness_capability_requirements FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS readiness_cap_req_delete ON public.readiness_capability_requirements;
CREATE POLICY readiness_cap_req_delete
    ON public.readiness_capability_requirements FOR DELETE
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS readiness_evidence_req_insert ON public.readiness_evidence_requirements;
CREATE POLICY readiness_evidence_req_insert
    ON public.readiness_evidence_requirements FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS readiness_evidence_req_update ON public.readiness_evidence_requirements;
CREATE POLICY readiness_evidence_req_update
    ON public.readiness_evidence_requirements FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS readiness_evidence_req_delete ON public.readiness_evidence_requirements;
CREATE POLICY readiness_evidence_req_delete
    ON public.readiness_evidence_requirements FOR DELETE
    TO authenticated
    USING (true);
