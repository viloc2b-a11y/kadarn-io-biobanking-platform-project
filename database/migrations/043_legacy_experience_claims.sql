-- RC-0.2: kadarn_verified and badge_level retired per ADR-010. 
-- This migration is preserved as historical record only.
-- ============================================================================
-- KADARN PLATFORM — Continuity Legacy Experience Claims
-- ============================================================================
-- Domain: Manual legacy experience onboarding, evidence submission, and
--         external reference validation for Site Continuity Profiles.
-- Design: ADR-024 — Continuity Engine, extended with legacy validation.
-- Depends on: 042_continuity_engine.sql
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE public.continuity_claim_verification_status AS ENUM (
        'self_reported',
        'evidence_submitted',
        'reference_pending',
        'reference_confirmed',
        'kadarn_verified',
        'rejected',
        'expired'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.continuity_evidence_review_status AS ENUM (
        'submitted',
        'under_review',
        'accepted',
        'rejected'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.continuity_reference_status AS ENUM (
        'pending',
        'requested',
        'confirmed',
        'declined',
        'expired'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.continuity_experience_claims (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id             UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    site_continuity_profile_id  UUID NOT NULL REFERENCES public.site_continuity_profiles(id) ON DELETE CASCADE,

    claim_type                  TEXT NOT NULL,
    category                    TEXT NOT NULL,
    title                       TEXT NOT NULL,
    description                 TEXT,
    experience_source           TEXT NOT NULL DEFAULT 'legacy'
        CHECK (experience_source IN ('legacy', 'native')),
    therapeutic_area            TEXT,
    study_phase                 TEXT,
    biospecimen_type            TEXT,
    start_date                  DATE,
    end_date                    DATE,
    quantity                    NUMERIC,

    verification_status         public.continuity_claim_verification_status NOT NULL DEFAULT 'self_reported',
    confidence_score            INTEGER NOT NULL DEFAULT 25
        CHECK (confidence_score BETWEEN 0 AND 100),
    is_public                   BOOLEAN NOT NULL DEFAULT false,
    sponsor_name_policy         TEXT NOT NULL DEFAULT 'masked'
        CHECK (sponsor_name_policy IN ('private', 'masked', 'permissioned', 'public')),
    masked_sponsor_label        TEXT
        CHECK (
            masked_sponsor_label IS NULL OR masked_sponsor_label IN (
                'Global pharma sponsor',
                'Top 10 CRO',
                'IVD company',
                'Academic medical center',
                'Specialty lab'
            )
        ),

    created_by                  UUID REFERENCES auth.users(id),
    updated_by                  UUID REFERENCES auth.users(id),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT continuity_claim_dates
        CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
    CONSTRAINT continuity_claim_public_requires_safe_sponsor_policy
        CHECK (is_public = false OR sponsor_name_policy IN ('masked', 'permissioned', 'public'))
);

COMMENT ON TABLE public.continuity_experience_claims IS
    'Editable legacy/native experience claims for Site Continuity onboarding. Do not store PHI, donor-level data, or protocol-sensitive confidential data.';

CREATE INDEX IF NOT EXISTS idx_continuity_claims_org
    ON public.continuity_experience_claims(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_continuity_claims_profile
    ON public.continuity_experience_claims(site_continuity_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_continuity_claims_public
    ON public.continuity_experience_claims(is_public, verification_status, confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_continuity_claims_category
    ON public.continuity_experience_claims(category, claim_type);

DROP TRIGGER IF EXISTS trg_continuity_experience_claims_updated_at ON public.continuity_experience_claims;
CREATE TRIGGER trg_continuity_experience_claims_updated_at
    BEFORE UPDATE ON public.continuity_experience_claims
    FOR EACH ROW
    EXECUTE FUNCTION public.set_continuity_updated_at();

CREATE TABLE IF NOT EXISTS public.continuity_evidence_items (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id             UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    claim_id                    UUID NOT NULL REFERENCES public.continuity_experience_claims(id) ON DELETE CASCADE,
    continuity_evidence_link_id UUID REFERENCES public.continuity_evidence_links(id) ON DELETE SET NULL,

    evidence_type               TEXT NOT NULL,
    title                       TEXT NOT NULL,
    description                 TEXT,
    file_url                    TEXT,
    external_url                TEXT,
    document_id                 UUID,
    verification_status         public.continuity_evidence_review_status NOT NULL DEFAULT 'submitted',
    reviewed_by                 UUID REFERENCES auth.users(id),
    reviewed_at                 TIMESTAMPTZ,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT continuity_evidence_item_has_location
        CHECK (file_url IS NOT NULL OR external_url IS NOT NULL OR document_id IS NOT NULL)
);

COMMENT ON TABLE public.continuity_evidence_items IS
    'Evidence submitted for continuity claims. Stores references/URLs/document IDs, not PHI.';

CREATE INDEX IF NOT EXISTS idx_continuity_evidence_items_org
    ON public.continuity_evidence_items(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_continuity_evidence_items_claim
    ON public.continuity_evidence_items(claim_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_continuity_evidence_items_status
    ON public.continuity_evidence_items(verification_status);

CREATE TABLE IF NOT EXISTS public.continuity_references (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    claim_id                 UUID NOT NULL REFERENCES public.continuity_experience_claims(id) ON DELETE CASCADE,

    reference_type           TEXT NOT NULL,
    reference_name           TEXT NOT NULL,
    reference_organization   TEXT,
    reference_email          TEXT,
    reference_role           TEXT,
    relationship_context     TEXT,
    status                   public.continuity_reference_status NOT NULL DEFAULT 'pending',
    requested_at             TIMESTAMPTZ,
    confirmed_at             TIMESTAMPTZ,
    declined_at              TIMESTAMPTZ,
    notes                    TEXT,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT continuity_reference_email_shape
        CHECK (reference_email IS NULL OR reference_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

COMMENT ON TABLE public.continuity_references IS
    'External references that can validate a continuity claim. Do not store patient or donor information.';

CREATE INDEX IF NOT EXISTS idx_continuity_references_org
    ON public.continuity_references(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_continuity_references_claim
    ON public.continuity_references(claim_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_continuity_references_status
    ON public.continuity_references(status);

ALTER TABLE public.continuity_experience_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.continuity_evidence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.continuity_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY continuity_claims_select_owner ON public.continuity_experience_claims
    FOR SELECT USING (
        public.can_view_continuity(organization_id)
        OR is_public = true
        OR auth.role() = 'service_role'
    );
CREATE POLICY continuity_claims_insert_owner ON public.continuity_experience_claims
    FOR INSERT WITH CHECK (public.can_manage_continuity(organization_id));
CREATE POLICY continuity_claims_update_owner ON public.continuity_experience_claims
    FOR UPDATE USING (public.can_manage_continuity(organization_id))
    WITH CHECK (public.can_manage_continuity(organization_id));

CREATE POLICY continuity_evidence_items_select_owner ON public.continuity_evidence_items
    FOR SELECT USING (
        public.can_view_continuity(organization_id)
        OR EXISTS (
            SELECT 1
            FROM public.continuity_experience_claims c
            WHERE c.id = continuity_evidence_items.claim_id
              AND c.is_public = true
        )
        OR auth.role() = 'service_role'
    );
CREATE POLICY continuity_evidence_items_insert_owner ON public.continuity_evidence_items
    FOR INSERT WITH CHECK (public.can_manage_continuity(organization_id));
CREATE POLICY continuity_evidence_items_update_reviewer ON public.continuity_evidence_items
    FOR UPDATE USING (public.can_manage_continuity(organization_id))
    WITH CHECK (public.can_manage_continuity(organization_id));

CREATE POLICY continuity_references_select_owner ON public.continuity_references
    FOR SELECT USING (
        public.can_view_continuity(organization_id)
        OR EXISTS (
            SELECT 1
            FROM public.continuity_experience_claims c
            WHERE c.id = continuity_references.claim_id
              AND c.is_public = true
        )
        OR auth.role() = 'service_role'
    );
CREATE POLICY continuity_references_insert_owner ON public.continuity_references
    FOR INSERT WITH CHECK (public.can_manage_continuity(organization_id));
CREATE POLICY continuity_references_update_reviewer ON public.continuity_references
    FOR UPDATE USING (public.can_manage_continuity(organization_id))
    WITH CHECK (public.can_manage_continuity(organization_id));

GRANT SELECT ON public.continuity_experience_claims TO anon, authenticated, service_role;
GRANT SELECT ON public.continuity_evidence_items TO anon, authenticated, service_role;
GRANT SELECT ON public.continuity_references TO anon, authenticated, service_role;
GRANT INSERT, UPDATE ON public.continuity_experience_claims TO authenticated, service_role;
GRANT INSERT, UPDATE ON public.continuity_evidence_items TO authenticated, service_role;
GRANT INSERT, UPDATE ON public.continuity_references TO authenticated, service_role;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'continuity_experience_claims'
    ) THEN
        RAISE EXCEPTION 'Legacy experience migration failed: continuity_experience_claims missing';
    END IF;
END $$;
