-- ============================================================================
-- KADARN v2 — Claims Extended (Loop 4)
-- ============================================================================
-- Migration: 095
-- Authority: KAD-LOOP-004, Architecture Constitution v2.0
-- Forward-only, additive. No historical migrations modified.
--
-- Creates the claims_ext extension table and governance tables:
--   - claims_ext          — 1:1 extension of claims with network-governance columns
--   - claim_attestations  — third-party attestations about claims
--   - claim_dependencies  — semantic dependency graph between claims
--   - claim_conflicts     — detected conflicts between claims
--   - claim_reconfirmations — periodic reconfirmation audit trail
--
-- claim_versions (085) is extended with statement-versioning columns:
--   - statement, limitations, valid_from, correction_reason
-- ============================================================================

-- ############################################################################
-- PART 1: ENUMS
-- ############################################################################

DO $$ BEGIN
    CREATE TYPE claim_visibility AS ENUM (
        'NETWORK_VISIBLE',
        'INSTITUTION_ONLY',
        'RESTRICTED'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE extended_claim_type AS ENUM (
        'SELF_DECLARED',
        'THIRD_PARTY_ATTESTED',
        'REGULATORY',
        'NETWORK_VERIFIED',
        'DERIVED'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE dependency_type_enum AS ENUM (
        'requires',
        'implies',
        'contradicts',
        'supersedes',
        'qualifies',
        'derives_from'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE conflict_resolution_status AS ENUM (
        'open',
        'under_review',
        'resolved_a',
        'resolved_b',
        'merged',
        'dismissed'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE reconfirmation_response AS ENUM (
        'confirmed',
        'amended',
        'retracted',
        'expired_no_response'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- PART 2: TABLE — claims_ext (1:1 extension of claims)
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.claims_ext (
    claim_id                UUID PRIMARY KEY REFERENCES public.claims(id) ON DELETE CASCADE,
    claiming_actor          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    authority_basis         TEXT,
    entity_type             TEXT NOT NULL DEFAULT 'institution'
                                CHECK (entity_type IN ('institution', 'location', 'person', 'program', 'asset')),
    entity_id               UUID,
    location_id             UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    statement               TEXT,
    limitations             JSONB,
    valid_from              TIMESTAMPTZ,
    review_due_at           TIMESTAMPTZ,
    visibility              claim_visibility NOT NULL DEFAULT 'NETWORK_VISIBLE',
    supersedes_claim_version UUID REFERENCES public.claim_versions(id) ON DELETE SET NULL,
    claim_type              extended_claim_type NOT NULL DEFAULT 'SELF_DECLARED',
    canonical_claim_code    TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ############################################################################
-- PART 2a: Extend existing claim_versions (085) with statement-versioning columns
-- ############################################################################
-- claim_versions was created in migration 085 as a full-snapshot immutable
-- audit table. These columns add lightweight statement-versioning metadata.

ALTER TABLE public.claim_versions
    ADD COLUMN IF NOT EXISTS statement         TEXT,
    ADD COLUMN IF NOT EXISTS limitations       JSONB,
    ADD COLUMN IF NOT EXISTS valid_from        TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS correction_reason TEXT;

-- ############################################################################
-- PART 3: TABLE — claim_attestations
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.claim_attestations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id        UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    attested_by     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role            TEXT,
    authority       TEXT,
    attested_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ############################################################################
-- PART 4: TABLE — claim_dependencies
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.claim_dependencies (
    parent_claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    child_claim_id  UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    dependency_type dependency_type_enum NOT NULL DEFAULT 'requires',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (parent_claim_id, child_claim_id),
    CONSTRAINT ck_no_self_dependency CHECK (parent_claim_id <> child_claim_id)
);

-- ############################################################################
-- PART 5: TABLE — claim_conflicts
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.claim_conflicts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_a             UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    claim_b             UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    conflict_type       TEXT NOT NULL
                            CHECK (conflict_type IN ('direct_contradiction', 'value_mismatch', 'scope_overlap', 'temporal_conflict', 'jurisdictional')),
    detected_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolution_status   conflict_resolution_status NOT NULL DEFAULT 'open',
    resolved_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_at         TIMESTAMPTZ,
    resolution_notes    TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_no_self_conflict CHECK (claim_a <> claim_b)
);

-- ############################################################################
-- PART 6: TABLE — claim_reconfirmations
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.claim_reconfirmations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id        UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    response        reconfirmation_response NOT NULL DEFAULT 'confirmed',
    responded_by    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    responded_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    next_review_due TIMESTAMPTZ NOT NULL,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ############################################################################
-- PART 7: INDEXES
-- ############################################################################

-- claims_ext
CREATE INDEX IF NOT EXISTS idx_claims_ext_claiming_actor
    ON public.claims_ext(claiming_actor);
CREATE INDEX IF NOT EXISTS idx_claims_ext_entity
    ON public.claims_ext(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_claims_ext_location
    ON public.claims_ext(location_id);
CREATE INDEX IF NOT EXISTS idx_claims_ext_visibility
    ON public.claims_ext(visibility);
CREATE INDEX IF NOT EXISTS idx_claims_ext_claim_type
    ON public.claims_ext(claim_type);
CREATE INDEX IF NOT EXISTS idx_claims_ext_canonical_code
    ON public.claims_ext(canonical_claim_code);
CREATE INDEX IF NOT EXISTS idx_claims_ext_review_due
    ON public.claims_ext(review_due_at)
    WHERE review_due_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_claims_ext_valid_from
    ON public.claims_ext(valid_from);

-- claim_attestations
CREATE INDEX IF NOT EXISTS idx_claim_attestations_claim
    ON public.claim_attestations(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_attestations_attested_by
    ON public.claim_attestations(attested_by);
CREATE INDEX IF NOT EXISTS idx_claim_attestations_role
    ON public.claim_attestations(role);

-- claim_dependencies (PK is the composite index)
CREATE INDEX IF NOT EXISTS idx_claim_dependencies_child
    ON public.claim_dependencies(child_claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_dependencies_type
    ON public.claim_dependencies(dependency_type);

-- claim_conflicts
CREATE INDEX IF NOT EXISTS idx_claim_conflicts_claim_a
    ON public.claim_conflicts(claim_a);
CREATE INDEX IF NOT EXISTS idx_claim_conflicts_claim_b
    ON public.claim_conflicts(claim_b);
CREATE INDEX IF NOT EXISTS idx_claim_conflicts_resolution
    ON public.claim_conflicts(resolution_status);
CREATE INDEX IF NOT EXISTS idx_claim_conflicts_type
    ON public.claim_conflicts(conflict_type);

-- claim_reconfirmations
CREATE INDEX IF NOT EXISTS idx_claim_reconfirmations_claim
    ON public.claim_reconfirmations(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_reconfirmations_responded_by
    ON public.claim_reconfirmations(responded_by);
CREATE INDEX IF NOT EXISTS idx_claim_reconfirmations_next_review
    ON public.claim_reconfirmations(next_review_due);
CREATE INDEX IF NOT EXISTS idx_claim_reconfirmations_response
    ON public.claim_reconfirmations(response);

-- ############################################################################
-- PART 8: ROW LEVEL SECURITY
-- ############################################################################

-- claims_ext — inherits visibility from parent claim's institution scope
ALTER TABLE public.claims_ext ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cext_select_org ON public.claims_ext;
CREATE POLICY cext_select_org ON public.claims_ext
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.claims c
            WHERE c.id = claims_ext.claim_id
              AND c.organization_id IN (
                SELECT om.organization_id
                FROM public.organization_memberships om
                WHERE om.user_id = auth.uid()
                  AND om.status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS cext_insert_service ON public.claims_ext;
CREATE POLICY cext_insert_service ON public.claims_ext
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS cext_update_service ON public.claims_ext;
CREATE POLICY cext_update_service ON public.claims_ext
    FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS cext_delete_service ON public.claims_ext;
CREATE POLICY cext_delete_service ON public.claims_ext
    FOR DELETE
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS cext_all_service ON public.claims_ext;
CREATE POLICY cext_all_service ON public.claims_ext
    FOR ALL
    USING (auth.role() = 'service_role');

-- claim_attestations — org-scoped via parent claim
ALTER TABLE public.claim_attestations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS catt_select_org ON public.claim_attestations;
CREATE POLICY catt_select_org ON public.claim_attestations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.claims c
            WHERE c.id = claim_attestations.claim_id
              AND c.organization_id IN (
                SELECT om.organization_id
                FROM public.organization_memberships om
                WHERE om.user_id = auth.uid()
                  AND om.status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS catt_insert_service ON public.claim_attestations;
CREATE POLICY catt_insert_service ON public.claim_attestations
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS catt_all_service ON public.claim_attestations;
CREATE POLICY catt_all_service ON public.claim_attestations
    FOR ALL
    USING (auth.role() = 'service_role');

-- claim_dependencies — org-scoped via parent claim
ALTER TABLE public.claim_dependencies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cdep_select_org ON public.claim_dependencies;
CREATE POLICY cdep_select_org ON public.claim_dependencies
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.claims c
            WHERE c.id = claim_dependencies.parent_claim_id
              AND c.organization_id IN (
                SELECT om.organization_id
                FROM public.organization_memberships om
                WHERE om.user_id = auth.uid()
                  AND om.status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS cdep_insert_service ON public.claim_dependencies;
CREATE POLICY cdep_insert_service ON public.claim_dependencies
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS cdep_delete_service ON public.claim_dependencies;
CREATE POLICY cdep_delete_service ON public.claim_dependencies
    FOR DELETE
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS cdep_all_service ON public.claim_dependencies;
CREATE POLICY cdep_all_service ON public.claim_dependencies
    FOR ALL
    USING (auth.role() = 'service_role');

-- claim_conflicts — org-scoped via claim_a
ALTER TABLE public.claim_conflicts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ccon_select_org ON public.claim_conflicts;
CREATE POLICY ccon_select_org ON public.claim_conflicts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.claims c
            WHERE c.id = claim_conflicts.claim_a
              AND c.organization_id IN (
                SELECT om.organization_id
                FROM public.organization_memberships om
                WHERE om.user_id = auth.uid()
                  AND om.status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS ccon_insert_service ON public.claim_conflicts;
CREATE POLICY ccon_insert_service ON public.claim_conflicts
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS ccon_update_service ON public.claim_conflicts;
CREATE POLICY ccon_update_service ON public.claim_conflicts
    FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS ccon_all_service ON public.claim_conflicts;
CREATE POLICY ccon_all_service ON public.claim_conflicts
    FOR ALL
    USING (auth.role() = 'service_role');

-- claim_reconfirmations — org-scoped via parent claim
ALTER TABLE public.claim_reconfirmations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crec_select_org ON public.claim_reconfirmations;
CREATE POLICY crec_select_org ON public.claim_reconfirmations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.claims c
            WHERE c.id = claim_reconfirmations.claim_id
              AND c.organization_id IN (
                SELECT om.organization_id
                FROM public.organization_memberships om
                WHERE om.user_id = auth.uid()
                  AND om.status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS crec_insert_service ON public.claim_reconfirmations;
CREATE POLICY crec_insert_service ON public.claim_reconfirmations
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS crec_all_service ON public.claim_reconfirmations;
CREATE POLICY crec_all_service ON public.claim_reconfirmations
    FOR ALL
    USING (auth.role() = 'service_role');

-- ############################################################################
-- PART 9: updated_at TRIGGERS
-- ############################################################################
-- trigger_set_updated_at() is defined in migration 062 and is idempotent.

DROP TRIGGER IF EXISTS trg_claims_ext_updated_at ON public.claims_ext;
CREATE TRIGGER trg_claims_ext_updated_at
    BEFORE UPDATE ON public.claims_ext
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS trg_claim_conflicts_updated_at ON public.claim_conflicts;
CREATE TRIGGER trg_claim_conflicts_updated_at
    BEFORE UPDATE ON public.claim_conflicts
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- ############################################################################
-- PART 10: GRANTS
-- ############################################################################

GRANT SELECT ON public.claims_ext TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.claims_ext TO service_role;

GRANT SELECT ON public.claim_attestations TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.claim_attestations TO service_role;

GRANT SELECT ON public.claim_dependencies TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.claim_dependencies TO service_role;

GRANT SELECT ON public.claim_conflicts TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.claim_conflicts TO service_role;

GRANT SELECT ON public.claim_reconfirmations TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.claim_reconfirmations TO service_role;

-- ############################################################################
-- PART 11: COMMENTS
-- ############################################################################

COMMENT ON TABLE public.claims_ext IS
    'KAD-LOOP-004: 1:1 extension of claims with network-governance metadata — visibility, attestation chain, review cadence, and canonical coding.';

COMMENT ON COLUMN public.claims_ext.claiming_actor IS
    'KAD-LOOP-004: The user or system actor making this claim. FK to auth.users. NULL for system-generated claims.';
COMMENT ON COLUMN public.claims_ext.authority_basis IS
    'KAD-LOOP-004: The legal, regulatory, or operational authority under which this claim is made (e.g. FDA 21 CFR Part 11, ISO 13485 §7.3).';
COMMENT ON COLUMN public.claims_ext.entity_type IS
    'KAD-LOOP-004: The type of entity this claim is about — institution/location/person/program/asset.';
COMMENT ON COLUMN public.claims_ext.entity_id IS
    'KAD-LOOP-004: The specific entity this claim concerns. Polymorphic FK resolved by entity_type.';
COMMENT ON COLUMN public.claims_ext.statement IS
    'KAD-LOOP-004: The full natural-language claim statement as declared by the claiming actor.';
COMMENT ON COLUMN public.claims_ext.limitations IS
    'KAD-LOOP-004: JSONB bag of limitations, caveats, and scope boundaries for this claim.';
COMMENT ON COLUMN public.claims_ext.valid_from IS
    'KAD-LOOP-004: The date from which this version of the claim is asserted.';
COMMENT ON COLUMN public.claims_ext.review_due_at IS
    'KAD-LOOP-004: Scheduled reconfirmation deadline. Triggers the reconfirmation workflow when reached.';
COMMENT ON COLUMN public.claims_ext.visibility IS
    'KAD-LOOP-004: Network visibility tier — NETWORK_VISIBLE/INSTITUTION_ONLY/RESTRICTED.';
COMMENT ON COLUMN public.claims_ext.claim_type IS
    'KAD-LOOP-004: Provenance tier — SELF_DECLARED/THIRD_PARTY_ATTESTED/REGULATORY/NETWORK_VERIFIED/DERIVED.';

COMMENT ON TABLE public.claim_attestations IS
    'KAD-LOOP-004: Third-party attestations that support or verify a claim.';

COMMENT ON TABLE public.claim_dependencies IS
    'KAD-LOOP-004: Directed dependency graph between claims — requires/implies/contradicts/supersedes/qualifies/derives_from.';

COMMENT ON TABLE public.claim_conflicts IS
    'KAD-LOOP-004: Detected conflicts between two claims with resolution tracking.';

COMMENT ON TABLE public.claim_reconfirmations IS
    'KAD-LOOP-004: Periodic reconfirmation audit trail — records each time a claim is confirmed, amended, or retracted.';

-- ############################################################################
-- END OF MIGRATION 095
-- ============================================================================
