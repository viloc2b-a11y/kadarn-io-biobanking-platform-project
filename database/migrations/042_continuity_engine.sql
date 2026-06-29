-- ============================================================================
-- KADARN PLATFORM — Sprint 15: Continuity Engine
-- ============================================================================
-- Domain: Site Continuity Profile, Site Passport, Experience Ledger,
--         performance timeline, and evidence-backed site reputation.
-- Design: ADR-024 — Continuity Engine: Site Continuity Profile
-- Depends on: organizations, programs, audit_events, provenance_evidence,
--             domain_event_store, trust_events, policy foundation.
--
-- Continuity stores organization-scoped projections and claims. It does not
-- replace Trust, Provenance, Audit, Policy, or operational source tables.
-- ============================================================================

-- ############################################################################
-- PART 1: ENUMS
-- ############################################################################

DO $$ BEGIN
    CREATE TYPE public.continuity_profile_status AS ENUM (
        'draft',
        'active',
        'suspended',
        'archived'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.continuity_source_type AS ENUM (
        'self_reported',
        'document_backed',
        'event_derived',
        'sponsor_confirmed',
        'kadarn_verified'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.continuity_verification_status AS ENUM (
        'unverified',
        'pending',
        'evidence_backed',
        'verified',
        'rejected'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.continuity_visibility AS ENUM (
        'private',
        'shared_link',
        'public'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.continuity_experience_category AS ENUM (
        'therapeutic_area',
        'phase_experience',
        'biospecimen_type',
        'processing_type',
        'patient_population',
        'equipment_infrastructure',
        'regulatory_compliance',
        'logistics_shipping',
        'ivd_validation',
        'pharma_study',
        'biotech_program'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.continuity_relationship_type AS ENUM (
        'sponsor',
        'cro',
        'lab',
        'biobank',
        'site_network',
        'vendor',
        'academic_partner',
        'other'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.continuity_timeline_event_type AS ENUM (
        'site_onboarded',
        'study_completed',
        'capability_added',
        'certification_added',
        'audit_completed',
        'biospecimen_workflow_completed',
        'sponsor_relationship_added',
        'trust_score_changed',
        'quality_event_closed',
        'new_equipment_added',
        'new_therapeutic_experience_added'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.continuity_evidence_type AS ENUM (
        'document',
        'audit_event',
        'domain_event',
        'provenance_evidence',
        'workflow_record',
        'quality_record',
        'sponsor_confirmation',
        'trust_event',
        'external_reference'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- PART 2: UPDATED_AT HELPER
-- ############################################################################

CREATE OR REPLACE FUNCTION public.set_continuity_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- ############################################################################
-- PART 3: SITE CONTINUITY PROFILE
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.site_continuity_profiles (
    id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id            UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,

    status                     public.continuity_profile_status NOT NULL DEFAULT 'draft',
    site_type                  TEXT NOT NULL DEFAULT 'clinical_site',
    headline                   TEXT,
    summary                    TEXT,
    geography                  JSONB NOT NULL DEFAULT '{}'::jsonb,
    patient_population_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    availability_preferences   JSONB NOT NULL DEFAULT '{}'::jsonb,

    completeness_score         NUMERIC(5,2) NOT NULL DEFAULT 0.00
        CHECK (completeness_score BETWEEN 0.00 AND 100.00),
    maturity_level             TEXT NOT NULL DEFAULT 'foundational',
    verification_status        public.continuity_verification_status NOT NULL DEFAULT 'unverified',

    passport_visibility        public.continuity_visibility NOT NULL DEFAULT 'private',
    passport_published_at      TIMESTAMPTZ,
    public_slug                TEXT UNIQUE,

    source_type                public.continuity_source_type NOT NULL DEFAULT 'self_reported',
    created_by                 UUID REFERENCES auth.users(id),
    updated_by                 UUID REFERENCES auth.users(id),
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT site_continuity_profiles_public_slug_format
        CHECK (public_slug IS NULL OR public_slug ~ '^[a-z0-9][a-z0-9-]{2,120}$')
);

COMMENT ON TABLE public.site_continuity_profiles IS
    'Organization-scoped Continuity profile projection. No PHI or donor-level data is allowed.';

CREATE INDEX IF NOT EXISTS idx_site_continuity_profiles_org
    ON public.site_continuity_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_site_continuity_profiles_status
    ON public.site_continuity_profiles(status);
CREATE INDEX IF NOT EXISTS idx_site_continuity_profiles_visibility
    ON public.site_continuity_profiles(passport_visibility);

DROP TRIGGER IF EXISTS trg_site_continuity_profiles_updated_at ON public.site_continuity_profiles;
CREATE TRIGGER trg_site_continuity_profiles_updated_at
    BEFORE UPDATE ON public.site_continuity_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_continuity_updated_at();

-- ############################################################################
-- PART 4: EXPERIENCE LEDGER
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.continuity_experience_ledger (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    profile_id            UUID NOT NULL REFERENCES public.site_continuity_profiles(id) ON DELETE CASCADE,
    program_id            UUID REFERENCES public.programs(id) ON DELETE SET NULL,

    category              public.continuity_experience_category NOT NULL,
    experience_key        TEXT NOT NULL,
    experience_label      TEXT NOT NULL,
    experience_summary    TEXT,
    years_experience      NUMERIC(5,2),
    occurrence_count      INTEGER NOT NULL DEFAULT 1 CHECK (occurrence_count >= 0),
    started_at            DATE,
    ended_at              DATE,

    source_type           public.continuity_source_type NOT NULL,
    verification_status   public.continuity_verification_status NOT NULL DEFAULT 'unverified',
    visibility            public.continuity_visibility NOT NULL DEFAULT 'private',
    confidence_score      NUMERIC(5,2) NOT NULL DEFAULT 0.00
        CHECK (confidence_score BETWEEN 0.00 AND 100.00),

    sponsor_name_policy   TEXT NOT NULL DEFAULT 'private'
        CHECK (sponsor_name_policy IN ('private', 'masked', 'permissioned', 'public')),
    metadata              JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by            UUID REFERENCES auth.users(id),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT continuity_experience_ledger_dates
        CHECK (ended_at IS NULL OR started_at IS NULL OR ended_at >= started_at)
);

COMMENT ON TABLE public.continuity_experience_ledger IS
    'Append-only ledger of site-earned experience. Stores claims and references, not PHI.';

CREATE INDEX IF NOT EXISTS idx_continuity_experience_org
    ON public.continuity_experience_ledger(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_continuity_experience_profile
    ON public.continuity_experience_ledger(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_continuity_experience_category
    ON public.continuity_experience_ledger(category, experience_key);

-- ############################################################################
-- PART 5: RELATIONSHIPS
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.continuity_relationships (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    profile_id               UUID NOT NULL REFERENCES public.site_continuity_profiles(id) ON DELETE CASCADE,
    counterparty_org_id      UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    program_id               UUID REFERENCES public.programs(id) ON DELETE SET NULL,

    relationship_type        public.continuity_relationship_type NOT NULL,
    relationship_label       TEXT NOT NULL,
    counterparty_display_name TEXT,
    counterparty_masked_name TEXT,
    sponsor_name_policy      TEXT NOT NULL DEFAULT 'private'
        CHECK (sponsor_name_policy IN ('private', 'masked', 'permissioned', 'public')),
    started_at               DATE,
    ended_at                 DATE,
    is_active                BOOLEAN NOT NULL DEFAULT true,

    source_type              public.continuity_source_type NOT NULL,
    verification_status      public.continuity_verification_status NOT NULL DEFAULT 'unverified',
    visibility               public.continuity_visibility NOT NULL DEFAULT 'private',
    metadata                 JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by               UUID REFERENCES auth.users(id),
    updated_by               UUID REFERENCES auth.users(id),
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT continuity_relationships_dates
        CHECK (ended_at IS NULL OR started_at IS NULL OR ended_at >= started_at)
);

CREATE INDEX IF NOT EXISTS idx_continuity_relationships_org
    ON public.continuity_relationships(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_continuity_relationships_profile
    ON public.continuity_relationships(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_continuity_relationships_type
    ON public.continuity_relationships(relationship_type);

DROP TRIGGER IF EXISTS trg_continuity_relationships_updated_at ON public.continuity_relationships;
CREATE TRIGGER trg_continuity_relationships_updated_at
    BEFORE UPDATE ON public.continuity_relationships
    FOR EACH ROW
    EXECUTE FUNCTION public.set_continuity_updated_at();

-- ############################################################################
-- PART 6: CAPABILITIES
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.continuity_capabilities (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    profile_id            UUID NOT NULL REFERENCES public.site_continuity_profiles(id) ON DELETE CASCADE,
    organization_capability_id UUID REFERENCES public.organization_capabilities(id) ON DELETE SET NULL,

    capability_category   TEXT NOT NULL,
    capability_key        TEXT NOT NULL,
    capability_label      TEXT NOT NULL,
    capability_summary    TEXT,
    capacity              JSONB NOT NULL DEFAULT '{}'::jsonb,
    constraints           JSONB NOT NULL DEFAULT '{}'::jsonb,
    availability          JSONB NOT NULL DEFAULT '{}'::jsonb,

    source_type           public.continuity_source_type NOT NULL,
    verification_status   public.continuity_verification_status NOT NULL DEFAULT 'unverified',
    visibility            public.continuity_visibility NOT NULL DEFAULT 'private',
    metadata              JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by            UUID REFERENCES auth.users(id),
    updated_by            UUID REFERENCES auth.users(id),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT continuity_capabilities_unique_key
        UNIQUE (organization_id, capability_category, capability_key)
);

CREATE INDEX IF NOT EXISTS idx_continuity_capabilities_org
    ON public.continuity_capabilities(organization_id, capability_category);
CREATE INDEX IF NOT EXISTS idx_continuity_capabilities_profile
    ON public.continuity_capabilities(profile_id);
CREATE INDEX IF NOT EXISTS idx_continuity_capabilities_verification
    ON public.continuity_capabilities(verification_status);

DROP TRIGGER IF EXISTS trg_continuity_capabilities_updated_at ON public.continuity_capabilities;
CREATE TRIGGER trg_continuity_capabilities_updated_at
    BEFORE UPDATE ON public.continuity_capabilities
    FOR EACH ROW
    EXECUTE FUNCTION public.set_continuity_updated_at();

-- ############################################################################
-- PART 7: PERFORMANCE METRICS
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.continuity_performance_metrics (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    profile_id            UUID NOT NULL REFERENCES public.site_continuity_profiles(id) ON DELETE CASCADE,
    program_id            UUID REFERENCES public.programs(id) ON DELETE SET NULL,

    metric_category       TEXT NOT NULL,
    metric_key            TEXT NOT NULL,
    metric_label          TEXT NOT NULL,
    metric_value          NUMERIC(18,6),
    metric_unit           TEXT,
    metric_period_start   DATE,
    metric_period_end     DATE,
    sample_size           INTEGER CHECK (sample_size IS NULL OR sample_size >= 0),

    source_type           public.continuity_source_type NOT NULL,
    verification_status   public.continuity_verification_status NOT NULL DEFAULT 'unverified',
    evidence_weight       NUMERIC(5,2) NOT NULL DEFAULT 0.00
        CHECK (evidence_weight BETWEEN 0.00 AND 100.00),
    visibility            public.continuity_visibility NOT NULL DEFAULT 'private',
    metadata              JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by            UUID REFERENCES auth.users(id),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT continuity_performance_metric_period
        CHECK (metric_period_end IS NULL OR metric_period_start IS NULL OR metric_period_end >= metric_period_start)
);

COMMENT ON TABLE public.continuity_performance_metrics IS
    'Append-only performance metric records. Evidence-backed metrics rank above self-reported metrics.';

CREATE INDEX IF NOT EXISTS idx_continuity_metrics_org
    ON public.continuity_performance_metrics(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_continuity_metrics_profile
    ON public.continuity_performance_metrics(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_continuity_metrics_key
    ON public.continuity_performance_metrics(metric_category, metric_key);

-- ############################################################################
-- PART 8: TIMELINE EVENTS
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.continuity_timeline_events (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    profile_id            UUID NOT NULL REFERENCES public.site_continuity_profiles(id) ON DELETE CASCADE,
    program_id            UUID REFERENCES public.programs(id) ON DELETE SET NULL,

    event_type            public.continuity_timeline_event_type NOT NULL,
    title                 TEXT NOT NULL,
    summary               TEXT,
    occurred_at           TIMESTAMPTZ NOT NULL,

    source_type           public.continuity_source_type NOT NULL,
    verification_status   public.continuity_verification_status NOT NULL DEFAULT 'unverified',
    visibility            public.continuity_visibility NOT NULL DEFAULT 'private',
    metadata              JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by            UUID REFERENCES auth.users(id),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.continuity_timeline_events IS
    'Append-only living history of site continuity events.';

CREATE INDEX IF NOT EXISTS idx_continuity_timeline_org
    ON public.continuity_timeline_events(organization_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_continuity_timeline_profile
    ON public.continuity_timeline_events(profile_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_continuity_timeline_type
    ON public.continuity_timeline_events(event_type);

-- ############################################################################
-- PART 9: EVIDENCE LINKS
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.continuity_evidence_links (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id        UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    profile_id             UUID NOT NULL REFERENCES public.site_continuity_profiles(id) ON DELETE CASCADE,

    claim_table            TEXT NOT NULL CHECK (claim_table IN (
        'site_continuity_profiles',
        'continuity_experience_ledger',
        'continuity_relationships',
        'continuity_capabilities',
        'continuity_performance_metrics',
        'continuity_timeline_events'
    )),
    claim_id               UUID NOT NULL,

    evidence_type          public.continuity_evidence_type NOT NULL,
    provenance_evidence_id UUID REFERENCES public.provenance_evidence(id) ON DELETE SET NULL,
    audit_event_id         UUID REFERENCES public.audit_events(id) ON DELETE SET NULL,
    domain_event_id        UUID REFERENCES public.domain_event_store(id) ON DELETE SET NULL,
    trust_event_id         UUID REFERENCES public.trust_events(id) ON DELETE SET NULL,
    source_table           TEXT,
    source_id              UUID,
    external_ref           TEXT,
    evidence_hash          TEXT,
    evidence_summary       TEXT,

    verification_status    public.continuity_verification_status NOT NULL DEFAULT 'pending',
    visibility             public.continuity_visibility NOT NULL DEFAULT 'private',
    metadata               JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by             UUID REFERENCES auth.users(id),
    updated_by             UUID REFERENCES auth.users(id),
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT continuity_evidence_has_reference CHECK (
        provenance_evidence_id IS NOT NULL
        OR audit_event_id IS NOT NULL
        OR domain_event_id IS NOT NULL
        OR trust_event_id IS NOT NULL
        OR source_id IS NOT NULL
        OR external_ref IS NOT NULL
        OR evidence_hash IS NOT NULL
    )
);

COMMENT ON TABLE public.continuity_evidence_links IS
    'Evidence references for Continuity claims. Links to provenance, audit, domain events, trust events, or external evidence without storing PHI.';

CREATE INDEX IF NOT EXISTS idx_continuity_evidence_org
    ON public.continuity_evidence_links(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_continuity_evidence_profile
    ON public.continuity_evidence_links(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_continuity_evidence_claim
    ON public.continuity_evidence_links(claim_table, claim_id);
CREATE INDEX IF NOT EXISTS idx_continuity_evidence_domain_event
    ON public.continuity_evidence_links(domain_event_id)
    WHERE domain_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_continuity_evidence_provenance
    ON public.continuity_evidence_links(provenance_evidence_id)
    WHERE provenance_evidence_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_continuity_evidence_links_updated_at ON public.continuity_evidence_links;
CREATE TRIGGER trg_continuity_evidence_links_updated_at
    BEFORE UPDATE ON public.continuity_evidence_links
    FOR EACH ROW
    EXECUTE FUNCTION public.set_continuity_updated_at();

-- ############################################################################
-- PART 10: APPEND-ONLY CLAIM HISTORY
-- ############################################################################

SELECT public.apply_append_only_triggers('public.continuity_experience_ledger'::regclass);
SELECT public.apply_append_only_triggers('public.continuity_performance_metrics'::regclass);
SELECT public.apply_append_only_triggers('public.continuity_timeline_events'::regclass);

-- ############################################################################
-- PART 11: ROW-LEVEL SECURITY
-- ############################################################################

ALTER TABLE public.site_continuity_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.continuity_experience_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.continuity_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.continuity_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.continuity_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.continuity_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.continuity_evidence_links ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_manage_continuity(p_organization_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT auth.role() = 'service_role'
        OR EXISTS (
            SELECT 1
            FROM public.user_organizations uo
            WHERE uo.user_id = auth.uid()
              AND uo.organization_id = p_organization_id
              AND uo.role IN ('org_admin', 'platform_admin', 'data_steward')
        );
$$;

CREATE OR REPLACE FUNCTION public.can_view_continuity(p_organization_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT auth.role() = 'service_role'
        OR EXISTS (
            SELECT 1
            FROM public.user_organizations uo
            WHERE uo.user_id = auth.uid()
              AND uo.organization_id = p_organization_id
        );
$$;

CREATE POLICY site_continuity_profiles_select ON public.site_continuity_profiles
    FOR SELECT USING (public.can_view_continuity(organization_id));
CREATE POLICY site_continuity_profiles_insert ON public.site_continuity_profiles
    FOR INSERT WITH CHECK (public.can_manage_continuity(organization_id));
CREATE POLICY site_continuity_profiles_update ON public.site_continuity_profiles
    FOR UPDATE USING (public.can_manage_continuity(organization_id))
    WITH CHECK (public.can_manage_continuity(organization_id));

CREATE POLICY continuity_experience_select ON public.continuity_experience_ledger
    FOR SELECT USING (public.can_view_continuity(organization_id));
CREATE POLICY continuity_experience_insert ON public.continuity_experience_ledger
    FOR INSERT WITH CHECK (public.can_manage_continuity(organization_id));

CREATE POLICY continuity_relationships_select ON public.continuity_relationships
    FOR SELECT USING (public.can_view_continuity(organization_id));
CREATE POLICY continuity_relationships_insert ON public.continuity_relationships
    FOR INSERT WITH CHECK (public.can_manage_continuity(organization_id));
CREATE POLICY continuity_relationships_update ON public.continuity_relationships
    FOR UPDATE USING (public.can_manage_continuity(organization_id))
    WITH CHECK (public.can_manage_continuity(organization_id));

CREATE POLICY continuity_capabilities_select ON public.continuity_capabilities
    FOR SELECT USING (public.can_view_continuity(organization_id));
CREATE POLICY continuity_capabilities_insert ON public.continuity_capabilities
    FOR INSERT WITH CHECK (public.can_manage_continuity(organization_id));
CREATE POLICY continuity_capabilities_update ON public.continuity_capabilities
    FOR UPDATE USING (public.can_manage_continuity(organization_id))
    WITH CHECK (public.can_manage_continuity(organization_id));

CREATE POLICY continuity_metrics_select ON public.continuity_performance_metrics
    FOR SELECT USING (public.can_view_continuity(organization_id));
CREATE POLICY continuity_metrics_insert ON public.continuity_performance_metrics
    FOR INSERT WITH CHECK (public.can_manage_continuity(organization_id));

CREATE POLICY continuity_timeline_select ON public.continuity_timeline_events
    FOR SELECT USING (public.can_view_continuity(organization_id));
CREATE POLICY continuity_timeline_insert ON public.continuity_timeline_events
    FOR INSERT WITH CHECK (public.can_manage_continuity(organization_id));

CREATE POLICY continuity_evidence_select ON public.continuity_evidence_links
    FOR SELECT USING (public.can_view_continuity(organization_id));
CREATE POLICY continuity_evidence_insert ON public.continuity_evidence_links
    FOR INSERT WITH CHECK (public.can_manage_continuity(organization_id));
CREATE POLICY continuity_evidence_update ON public.continuity_evidence_links
    FOR UPDATE USING (public.can_manage_continuity(organization_id))
    WITH CHECK (public.can_manage_continuity(organization_id));

GRANT SELECT ON public.site_continuity_profiles TO authenticated, service_role;
GRANT SELECT ON public.continuity_experience_ledger TO authenticated, service_role;
GRANT SELECT ON public.continuity_relationships TO authenticated, service_role;
GRANT SELECT ON public.continuity_capabilities TO authenticated, service_role;
GRANT SELECT ON public.continuity_performance_metrics TO authenticated, service_role;
GRANT SELECT ON public.continuity_timeline_events TO authenticated, service_role;
GRANT SELECT ON public.continuity_evidence_links TO authenticated, service_role;
GRANT INSERT, UPDATE ON public.site_continuity_profiles TO authenticated, service_role;
GRANT INSERT ON public.continuity_experience_ledger TO authenticated, service_role;
GRANT INSERT, UPDATE ON public.continuity_relationships TO authenticated, service_role;
GRANT INSERT, UPDATE ON public.continuity_capabilities TO authenticated, service_role;
GRANT INSERT ON public.continuity_performance_metrics TO authenticated, service_role;
GRANT INSERT ON public.continuity_timeline_events TO authenticated, service_role;
GRANT INSERT, UPDATE ON public.continuity_evidence_links TO authenticated, service_role;

-- ############################################################################
-- PART 12: VERIFY
-- ############################################################################

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'site_continuity_profiles'
    ) THEN
        RAISE EXCEPTION 'Continuity Engine migration failed: site_continuity_profiles missing';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'continuity_evidence_links'
    ) THEN
        RAISE EXCEPTION 'Continuity Engine migration failed: continuity_evidence_links missing';
    END IF;
END $$;
