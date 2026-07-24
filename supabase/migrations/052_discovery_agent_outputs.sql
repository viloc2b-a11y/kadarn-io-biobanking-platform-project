-- ============================================================================
-- KTP-1.2 — Migration 052: Program Type Taxonomy
-- ============================================================================
-- Purpose:
--   Create a controlled vocabulary for program_type[] values used in the
--   programs table. Ensures that all program type classifications are
--   validated against a known taxonomy rather than free-text arrays.
--
--   Also relaxes the programs.created_by_organization_id constraint (AMB-1)
--   to allow system-seeded Program Type templates with NULL creator orgs.
--
-- Boundaries:
--   - Does NOT change programs.program_type[] column type.
--   - Does NOT add DB-level FK to programs (PostgreSQL cannot FK arrays).
--   - Application-layer validation is the near-term enforcement.
--   - DB trigger validation is deferred to a hardening mission.
--
-- Decision References:
--   - AMB-1: Drop programs_created_by_org_required, app-layer validation
--   - AMB-2: Hybrid — app validation now, trigger later
--   - AMB-4: readiness_threshold as data column on taxonomy
--
-- Dependencies:
--   - public.programs (migration 010)
-- ============================================================================

-- ###########################################################################
-- PART 1: program_type_taxonomy TABLE
-- ###########################################################################

CREATE TABLE IF NOT EXISTS public.program_type_taxonomy (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Stable identifier used in programs.program_type[]
    type_key            TEXT NOT NULL,
    -- Human-readable label
    name                TEXT NOT NULL,
    -- Extended description of what this program type represents
    description         TEXT,

    -- Classification category
    --   'readiness'   — Program Readiness template types
    --   'execution'   — Concrete program instance types (studies, trials, etc.)
    --   'regulatory'  — Regulatory/compliance program types
    category            TEXT NOT NULL DEFAULT 'execution',

    -- Readiness threshold (0.00 - 1.00). Only meaningful for readiness types.
    -- This is DATA, not code — different program types can have different thresholds.
    -- AMB-4 resolution: data-driven thresholds via this column.
    readiness_threshold NUMERIC(3,2) NOT NULL DEFAULT 0.75
        CHECK (readiness_threshold >= 0.00 AND readiness_threshold <= 1.00),

    -- Soft delete
    is_active           BOOLEAN NOT NULL DEFAULT true,

    -- UI ordering
    display_order       INTEGER NOT NULL DEFAULT 0,

    -- Extension point
    metadata            JSONB DEFAULT '{}',

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Enforce uniqueness on the type key
    CONSTRAINT uq_program_type_taxonomy_key UNIQUE (type_key)
);

COMMENT ON TABLE public.program_type_taxonomy IS
    'Controlled vocabulary for programs.program_type[] values. '
    'Categories: readiness (Program Readiness templates), execution (concrete programs), regulatory (compliance). '
    'readiness_threshold is data-driven — each readiness type can define its own threshold.';

COMMENT ON COLUMN public.program_type_taxonomy.type_key IS
    'Stable identifier matching values in programs.program_type[]. Example: readiness_biospecimen_collection.';

COMMENT ON COLUMN public.program_type_taxonomy.readiness_threshold IS
    'Minimum overall confidence (0.00-1.00) required for a Program Type to reach Ready status. '
    'Defaults to 0.75. This is DATA, not a hardcoded constant. AMB-4.';

-- ###########################################################################
-- PART 2: INDEXES
-- ###########################################################################

CREATE INDEX IF NOT EXISTS idx_program_type_taxonomy_category
    ON public.program_type_taxonomy(category);

CREATE INDEX IF NOT EXISTS idx_program_type_taxonomy_active
    ON public.program_type_taxonomy(is_active)
    WHERE is_active = true;

-- ###########################################################################
-- PART 3: updated_at TRIGGER
-- ###########################################################################

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_program_type_taxonomy_updated_at ON public.program_type_taxonomy;
CREATE TRIGGER trg_program_type_taxonomy_updated_at
    BEFORE UPDATE ON public.program_type_taxonomy
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ###########################################################################
-- PART 4: ROW-LEVEL SECURITY
-- ###########################################################################
-- Program Type taxonomy is network-visible reference data.
-- SELECT for all authenticated users.
-- INSERT/UPDATE/DELETE gated for authenticated (temporary — platform_admin
-- role will be created in Mission 3).

ALTER TABLE public.program_type_taxonomy ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read the taxonomy (reference data)
DROP POLICY IF EXISTS program_type_taxonomy_select ON public.program_type_taxonomy;
CREATE POLICY program_type_taxonomy_select
    ON public.program_type_taxonomy FOR SELECT
    TO authenticated
    USING (true);

-- Temporary: any authenticated user can manage taxonomy.
-- TODO: Restrict to platform_admin role when created in Mission 3.
DROP POLICY IF EXISTS program_type_taxonomy_insert ON public.program_type_taxonomy;
CREATE POLICY program_type_taxonomy_insert
    ON public.program_type_taxonomy FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS program_type_taxonomy_update ON public.program_type_taxonomy;
CREATE POLICY program_type_taxonomy_update
    ON public.program_type_taxonomy FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS program_type_taxonomy_delete ON public.program_type_taxonomy;
CREATE POLICY program_type_taxonomy_delete
    ON public.program_type_taxonomy FOR DELETE
    TO authenticated
    USING (true);

-- ###########################################################################
-- PART 5: SEED DATA — Readiness Program Types
-- ###########################################################################

INSERT INTO public.program_type_taxonomy (type_key, name, category, readiness_threshold, description, display_order)
VALUES
    (
        'readiness_biospecimen_collection',
        'Prospective Biospecimen Collection Readiness',
        'readiness',
        0.70,
        'Validates institutional readiness to prospectively collect, process, store, and ship biospecimens under IRB-approved protocols with documented SOPs.',
        10
    ),
    (
        'readiness_pbmc_processing',
        'PBMC / Specialty Sample Processing Readiness',
        'readiness',
        0.75,
        'Validates institutional readiness to perform density gradient PBMC isolation, cell counting, viability assessment, and cryopreservation under BSL-2 conditions.',
        20
    ),
    (
        'readiness_ivd_validation',
        'IVD / Diagnostic Validation Readiness',
        'readiness',
        0.85,
        'Validates institutional readiness to support IVD clinical validation studies including characterized sample sourcing, clinical data annotation, and regulatory compliance (ISO 13485, CLIA, 21 CFR Part 11).',
        30
    )
ON CONFLICT (type_key) DO NOTHING;

-- ###########################################################################
-- PART 6: BACKFILL — Existing program_type values
-- ###########################################################################
-- Extract all distinct program_type[] values currently in use and insert them
-- into the taxonomy with category 'execution' so the existing data is not
-- orphaned from the vocabulary.

INSERT INTO public.program_type_taxonomy (type_key, name, category, description)
SELECT
    unnest_type,
    unnest_type,
    'execution',
    'Auto-imported from existing program data. Review and update as needed.'
FROM (
    SELECT DISTINCT unnest(program_type) AS unnest_type
    FROM public.programs
    WHERE program_type IS NOT NULL
      AND array_length(program_type, 1) > 0
) existing_types
WHERE unnest_type IS NOT NULL
  AND unnest_type != ''
  AND unnest_type NOT IN (
      'readiness_biospecimen_collection',
      'readiness_pbmc_processing',
      'readiness_ivd_validation'
  )
ON CONFLICT (type_key) DO NOTHING;

-- ###########################################################################
-- PART 7: AMB-1 — Relax programs.created_by_organization_id constraint
-- ###########################################################################
-- System-seeded Program Type templates have no natural creator organization.
-- The CHECK constraint at migration 010:223 was already NOT VALID.
-- Drop it here and rely on application-layer validation:
--   IF program_type[] does NOT contain any 'readiness_*' value
--   THEN created_by_organization_id IS REQUIRED.
-- A DB trigger for this will be added in a future hardening mission.

ALTER TABLE public.programs DROP CONSTRAINT IF EXISTS programs_created_by_org_required;

COMMENT ON COLUMN public.programs.created_by_organization_id IS
    'Organization that created this program. NULL for system-seeded Program Type templates '
    '(program_type[] contains readiness_* values). Application-layer validation enforces '
    'non-NULL for non-template programs.';
