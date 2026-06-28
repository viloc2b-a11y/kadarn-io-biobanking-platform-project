-- ============================================================================
-- KADARN PLATFORM — Sprint 3: Discovery Engine
-- ============================================================================
-- Target: PostgreSQL 15+ (Supabase compatible)
-- Dependencies: 008_organizations_capabilities.sql, 009_rls_foundation.sql
--
-- This migration creates the Discovery Engine foundation:
--   1. supply_item_type enum (7 types — Blueprint §7.2)
--   2. supply_items table with full-text search
--   3. RLS policies for discovery
--   4. Search indexes for faceted filtering
-- ============================================================================

-- ############################################################################
-- PART 1: ENUM
-- ############################################################################

DO $$ BEGIN
    CREATE TYPE supply_item_type AS ENUM (
        'existing_collection',      -- Archived biospecimen cohort
        'prospective_collection',   -- Planned collection program
        'laboratory_service',       -- IHC, NGS, extraction, etc.
        'clinical_service',         -- Pathology review, radiology read
        'data_resource',            -- Genomic dataset, imaging archive
        'storage_logistics',        -- Cryo-storage, cold-chain transport
        'equipment_capability'      -- Digital pathology scanner, etc.
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- PART 2: TABLE — supply_items
-- ############################################################################
--
-- The primary searchable object in the Discovery Engine.
-- Each item represents something a researcher can request.
-- (Blueprint §7.2 — Supply Items)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.supply_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Multi-tenant ownership (Blueprint §4)
    organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    program_id          UUID REFERENCES public.programs(id) ON DELETE SET NULL,
    created_by          UUID NOT NULL,

    -- Typing (Blueprint §7.2)
    type                supply_item_type NOT NULL,
    title               TEXT NOT NULL,
    description         TEXT,

    -- Optional link to existing collection (for type = existing_collection)
    collection_id       UUID,

    -- Disease targeting
    disease_icd10       TEXT,
    disease_label       TEXT,

    -- Categorization for faceted filtering
    sample_types        TEXT[] DEFAULT '{}',
    data_categories     TEXT[] DEFAULT '{}',
    service_categories  TEXT[] DEFAULT '{}',

    -- Geographic scope
    country             TEXT,
    region              TEXT,
    city                TEXT,

    -- Access & commercial
    commercial_use_allowed     BOOLEAN NOT NULL DEFAULT false,
    non_profit_use_allowed     BOOLEAN NOT NULL DEFAULT true,

    -- Prospective collection fields
    prospective_available              BOOLEAN NOT NULL DEFAULT false,
    estimated_recruitment_per_month    INTEGER,
    estimated_turnaround_days          INTEGER,

    -- Service flags
    processing_available               BOOLEAN NOT NULL DEFAULT false,
    shipping_available                 BOOLEAN NOT NULL DEFAULT false,
    international_shipping_available   BOOLEAN NOT NULL DEFAULT false,

    -- Quality
    quality_labels   TEXT[] DEFAULT '{}',
    certifications   TEXT[] DEFAULT '{}',

    -- Lifecycle
    status           TEXT NOT NULL DEFAULT 'active'
                     CHECK (status IN ('draft', 'active', 'inactive', 'archived')),

    -- Visibility (Blueprint §4.2)
    visibility_scope visibility_scope NOT NULL DEFAULT 'network',

    -- Flexible metadata
    metadata         JSONB NOT NULL DEFAULT '{}',

    -- Full-text search vector
    search_vector    tsvector
                     GENERATED ALWAYS AS (
                         to_tsvector('english',
                             coalesce(title, '') || ' ' ||
                             coalesce(description, '') || ' ' ||
                             coalesce(disease_label, '') || ' ' ||
                             coalesce(city, '') || ' ' ||
                             coalesce(region, '') || ' ' ||
                             coalesce(country, '')
                         )
                     ) STORED,

    -- Audit
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ############################################################################
-- PART 3: INDEXES
-- ############################################################################

-- Full-text search index (primary search index)
CREATE INDEX IF NOT EXISTS idx_supply_items_search
    ON public.supply_items USING GIN(search_vector);

-- Faceted filter indexes
CREATE INDEX IF NOT EXISTS idx_supply_items_org
    ON public.supply_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_supply_items_type
    ON public.supply_items(type);
CREATE INDEX IF NOT EXISTS idx_supply_items_disease
    ON public.supply_items(disease_icd10);
CREATE INDEX IF NOT EXISTS idx_supply_items_country
    ON public.supply_items(country);
CREATE INDEX IF NOT EXISTS idx_supply_items_status
    ON public.supply_items(status);
CREATE INDEX IF NOT EXISTS idx_supply_items_visibility
    ON public.supply_items(visibility_scope);
CREATE INDEX IF NOT EXISTS idx_supply_items_created
    ON public.supply_items(created_at DESC);

-- GIN indexes for array columns (faceted filtering)
CREATE INDEX IF NOT EXISTS idx_supply_items_sample_types
    ON public.supply_items USING GIN(sample_types);
CREATE INDEX IF NOT EXISTS idx_supply_items_data_categories
    ON public.supply_items USING GIN(data_categories);
CREATE INDEX IF NOT EXISTS idx_supply_items_service_categories
    ON public.supply_items USING GIN(service_categories);

-- Partial index for active items (most common query)
CREATE INDEX IF NOT EXISTS idx_supply_items_active
    ON public.supply_items(id)
    WHERE status = 'active';

-- ############################################################################
-- PART 4: TRIGGERS — updated_at
-- ############################################################################

CREATE TRIGGER trg_supply_items_updated_at
    BEFORE UPDATE ON public.supply_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ############################################################################
-- PART 5: ROW LEVEL SECURITY
-- ############################################################################

ALTER TABLE public.supply_items ENABLE ROW LEVEL SECURITY;

-- SELECT: network/public visibility or org member or admin
CREATE POLICY supply_items_select ON public.supply_items
    FOR SELECT
    USING (
        auth.role() = 'authenticated'
        AND (
            visibility_scope IN ('public', 'network')
            OR public.is_org_member(organization_id)
            OR public.is_org_admin()
        )
    );

-- INSERT: org_admin in the owning organization
CREATE POLICY supply_items_insert ON public.supply_items
    FOR INSERT
    WITH CHECK (
        created_by = auth.uid()
        AND public.is_org_admin(organization_id)
    );

-- UPDATE: org_admin in the owning organization
CREATE POLICY supply_items_update ON public.supply_items
    FOR UPDATE
    USING (public.is_org_admin(organization_id))
    WITH CHECK (public.is_org_admin(organization_id));

-- DELETE: org_admin in the owning organization
CREATE POLICY supply_items_delete ON public.supply_items
    FOR DELETE
    USING (public.is_org_admin(organization_id));

-- ############################################################################
-- PART 6: SEARCH FUNCTION
-- ############################################################################
--
-- Reusable search function for the Discovery Engine.
-- Supports full-text search + faceted filtering.
-- (Blueprint §7.3 — Search Capabilities)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.discovery_search(
    p_search_text      TEXT DEFAULT NULL,
    p_types            supply_item_type[] DEFAULT NULL,
    p_sample_types     TEXT[] DEFAULT NULL,
    p_disease_icd10    TEXT DEFAULT NULL,
    p_country          TEXT DEFAULT NULL,
    p_commercial_only  BOOLEAN DEFAULT NULL,
    p_limit            INTEGER DEFAULT 20,
    p_offset           INTEGER DEFAULT 0
)
RETURNS TABLE (
    id                  UUID,
    organization_id     UUID,
    type                supply_item_type,
    title               TEXT,
    description         TEXT,
    disease_icd10       TEXT,
    disease_label       TEXT,
    sample_types        TEXT[],
    country             TEXT,
    commercial_use_allowed BOOLEAN,
    status              TEXT,
    search_rank         REAL,
    total_count         BIGINT
)
LANGUAGE SQL
STABLE
AS $$
    WITH filtered AS (
        SELECT
            si.id,
            si.organization_id,
            si.type,
            si.title,
            si.description,
            si.disease_icd10,
            si.disease_label,
            si.sample_types,
            si.country,
            si.commercial_use_allowed,
            si.status,
            -- Calculate search rank (0 if no search text)
            CASE
                WHEN p_search_text IS NOT NULL AND p_search_text != ''
                THEN ts_rank(si.search_vector, plainto_tsquery('english', p_search_text))
                ELSE 1.0
            END AS rank
        FROM public.supply_items si
        WHERE si.status = 'active'
          AND (p_search_text IS NULL OR p_search_text = '' OR si.search_vector @@ plainto_tsquery('english', p_search_text))
          AND (p_types IS NULL OR si.type = ANY(p_types))
          AND (p_sample_types IS NULL OR si.sample_types && p_sample_types)
          AND (p_disease_icd10 IS NULL OR si.disease_icd10 = p_disease_icd10)
          AND (p_country IS NULL OR si.country = p_country)
          AND (p_commercial_only IS NULL OR (p_commercial_only = true AND si.commercial_use_allowed = true))
    )
    SELECT
        f.id, f.organization_id, f.type, f.title, f.description,
        f.disease_icd10, f.disease_label, f.sample_types, f.country,
        f.commercial_use_allowed, f.status,
        f.rank AS search_rank,
        COUNT(*) OVER() AS total_count
    FROM filtered f
    ORDER BY f.rank DESC, f.title ASC
    LIMIT p_limit
    OFFSET p_offset;
$$;

COMMENT ON FUNCTION public.discovery_search IS
    'Discovery Engine search. Supports full-text search, faceted filtering by type, sample type, disease, and country. Returns ranked results with total count.';

-- ############################################################################
-- PART 7: SEED DATA — demo supply items
-- ############################################################################

INSERT INTO public.supply_items (organization_id, created_by, type, title, description, disease_icd10, disease_label, sample_types, country, status, visibility_scope) VALUES
    ('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'existing_collection',
     'TNBC FFPE Tissue Cohort', '500 FFPE blocks from triple-negative breast cancer patients with matched clinical data. Ages 25-75, all stages.',
     'ICD-10:C50.9', 'Malignant neoplasm of breast', ARRAY['tissue_frozen', 'tissue_ffpe'], 'US', 'active', 'network'),

    ('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'existing_collection',
     'Healthy Donor Plasma Bank', '10,000 plasma samples from healthy donors aged 18-65. Volume: 1mL per aliquot. Collected under IRB-approved protocol.',
     NULL, NULL, ARRAY['plasma'], 'US', 'active', 'network'),

    ('a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'laboratory_service',
     'NGS Whole Exome Sequencing', 'Whole exome sequencing service with 150x coverage. Includes library preparation, sequencing, and standard bioinformatics pipeline.',
     NULL, NULL, ARRAY['dna'], 'DE', 'active', 'network'),

    ('a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'laboratory_service',
     'IHC Biomarker Panel', 'Immunohistochemistry service for biomarker analysis. CLIA-certified. Available markers: PD-L1, HER2, ER, PR, Ki-67, AR.',
     NULL, NULL, ARRAY['tissue_ffpe'], 'DE', 'active', 'network'),

    ('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'prospective_collection',
     'NSCLC Liquid Biopsy Collection', 'Prospective collection of 200 liquid biopsy samples from Stage IV NSCLC patients. 5 clinical sites in Brazil and Argentina.',
     'ICD-10:C34.9', 'Malignant neoplasm of bronchus or lung', ARRAY['liquid_biopsy', 'plasma'], 'BR', 'active', 'network'),

    ('a0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'storage_logistics',
     'International Cold Chain Shipping', 'UN 3373 compliant cold chain shipping. Temperature monitoring included. Service areas: US, EU, LATAM.',
     NULL, NULL, ARRAY['tissue_frozen', 'plasma', 'serum'], 'DE', 'active', 'network')
ON CONFLICT DO NOTHING;

-- ############################################################################
-- PART 8: POSTGREST PERMISSIONS
-- ############################################################################

GRANT ALL ON public.supply_items TO anon, authenticated, service_role;

-- ============================================================================
-- END OF MIGRATION 013 — Sprint 3: Discovery Engine
-- ============================================================================
