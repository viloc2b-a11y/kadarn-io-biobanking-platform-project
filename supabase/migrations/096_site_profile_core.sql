-- ============================================================================
-- KADARN v2 — Site Profile Core Tables (feat/kems-site-profile-production)
-- ============================================================================
-- Migration: 096
-- Authority: KEMS Site Profile Production spec
-- Forward-only, additive. No historical migrations modified.
--
-- Creates the core site_profile tables:
--   - site_profiles: the live/current profile for a site (institution-scoped)
--   - site_profile_versions: immutable append-only snapshots of a profile
--     at each version. Full lineage is reconstructable from the sequence.
--   - profile_attestations: cryptographic/role-based attestations of a
--     profile version's integrity and provenance.
--   - profile_publications: records of when and how a profile version was
--     published (visibility, passport hash, publisher).
--
-- RLS model:
--   - SELECT is org-scoped via institution_id FK → organization_memberships
--   - INSERT / UPDATE / DELETE are service_role only
--   - service_role has full access via dedicated FOR ALL policy
--
-- Dependencies:
--   - public.organizations (migration 008)
--   - auth.users (Supabase auth schema — logical reference only)
--   - public.trigger_set_updated_at() (migration 062)
--   - public.organization_memberships (assumed; verified in migration 064)
-- ============================================================================

-- ############################################################################
-- PART 1: TABLE — site_profiles
-- ############################################################################
-- The live/current profile for a site. Each row is scoped to one institution
-- (organization). The profile type, state, and version counter are stored here;
-- the actual content snapshots live in site_profile_versions.
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.site_profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Scoping: which institution (organization) owns this site profile
    institution_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Classification
    profile_type        TEXT NOT NULL,
    state               TEXT NOT NULL DEFAULT 'DRAFT',

    -- Version tracking: current_version points to the latest approved snapshot.
    -- Incremented atomically by the service layer when a new version is created.
    current_version     INTEGER NOT NULL DEFAULT 0,

    -- Structured completion data (progress tracker, field-level completions)
    completion_data     JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Audit
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- One profile per institution (at most one active/current profile row)
    CONSTRAINT uq_site_profiles_institution UNIQUE (institution_id),

    -- Version counter must be non-negative
    CONSTRAINT sp_current_version_nonneg CHECK (current_version >= 0)
);

COMMENT ON TABLE public.site_profiles IS
    'KEMS: Live/current site profile per institution. current_version tracks the latest snapshot in site_profile_versions.';

-- ############################################################################
-- PART 2: TABLE — site_profile_versions
-- ############################################################################
-- Immutable append-only snapshots of a site profile at each version.
-- Immutability contract:
--   - Rows are INSERT-only. The service layer snapshots the current
--     site_profiles + completion_data into a new row on every publish/edit.
--   - created_at is the freeze timestamp and never changes.
--   - published_at is set once when the version is published.
--   - No updated_at column — rows are truly immutable.
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.site_profile_versions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id          UUID NOT NULL REFERENCES public.site_profiles(id) ON DELETE CASCADE,
    version             INTEGER NOT NULL,

    -- Full profile snapshot at this version (may include completion_data, fields, etc.)
    snapshot            JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Optional link to an attestation that certified this version
    attestation_id      UUID,

    -- When this version was published (NULL = draft / not yet published)
    published_at        TIMESTAMPTZ,

    -- Freeze timestamp. Immutable.
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- No two versions of the same profile share a version number
    CONSTRAINT uq_spv_profile_id_version UNIQUE (profile_id, version),

    -- Version numbers are monotonic per profile starting at 1
    CONSTRAINT spv_version_positive CHECK (version >= 1)
);

COMMENT ON TABLE public.site_profile_versions IS
    'KEMS: Immutable append-only snapshots of site profiles at each version. INSERT-only.';

-- ############################################################################
-- PART 3: TABLE — profile_attestations
-- ############################################################################
-- Records of who attested to a profile version, in what role, with what scope,
-- and when. Attestations are version-specific (tied to a site_profile_versions
-- row) but also carry a profile-level FK for direct lookup.
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.profile_attestations (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id              UUID NOT NULL REFERENCES public.site_profiles(id) ON DELETE CASCADE,
    version_id              UUID NOT NULL REFERENCES public.site_profile_versions(id) ON DELETE CASCADE,

    -- Who attested (logical reference to auth.users; no physical FK to avoid
    -- Supabase auth schema coupling)
    attested_by             UUID NOT NULL,
    attested_by_role        TEXT NOT NULL,

    -- What scope of the profile was attested (e.g. {"sections": ["facilities", "staff"]})
    scope                   JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Version identifier of the attestation text/schema used
    attestation_text_version TEXT,

    -- When the attestation was made
    attested_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profile_attestations IS
    'KEMS: Role-based attestations of a site profile version. Ties attester identity, role, and scope to a specific version.';

-- ############################################################################
-- PART 4: TABLE — profile_publications
-- ############################################################################
-- Records of when and how a profile version was published. Tracks visibility
-- level, a content hash for integrity (passport_hash), and the publisher.
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.profile_publications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id          UUID NOT NULL REFERENCES public.site_profiles(id) ON DELETE CASCADE,
    version_id          UUID NOT NULL REFERENCES public.site_profile_versions(id) ON DELETE CASCADE,

    -- Who published (logical reference to auth.users; no physical FK)
    published_by        UUID NOT NULL,

    -- Visibility level: e.g. 'private', 'network', 'public'
    visibility_level    TEXT NOT NULL,

    -- Content hash for integrity verification (e.g. SHA-256 of the snapshot)
    passport_hash       TEXT,

    -- When publication occurred
    published_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profile_publications IS
    'KEMS: Publication records for site profile versions. Tracks visibility, hash, and publisher.';

-- ############################################################################
-- PART 5: INDEXES
-- ############################################################################

-- site_profiles indexes
CREATE INDEX IF NOT EXISTS idx_site_profiles_institution_id
    ON public.site_profiles(institution_id);
CREATE INDEX IF NOT EXISTS idx_site_profiles_state
    ON public.site_profiles(state);
CREATE INDEX IF NOT EXISTS idx_site_profiles_profile_type
    ON public.site_profiles(profile_type);

-- site_profile_versions indexes
CREATE INDEX IF NOT EXISTS idx_spv_profile_id
    ON public.site_profile_versions(profile_id);
CREATE INDEX IF NOT EXISTS idx_spv_profile_id_version
    ON public.site_profile_versions(profile_id, version);
-- Partial index for current (latest) version per profile
CREATE INDEX IF NOT EXISTS idx_spv_profile_current
    ON public.site_profile_versions(profile_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_spv_published_at
    ON public.site_profile_versions(published_at)
    WHERE published_at IS NOT NULL;

-- profile_attestations indexes
CREATE INDEX IF NOT EXISTS idx_pa_profile_id
    ON public.profile_attestations(profile_id);
CREATE INDEX IF NOT EXISTS idx_pa_version_id
    ON public.profile_attestations(version_id);
CREATE INDEX IF NOT EXISTS idx_pa_attested_by
    ON public.profile_attestations(attested_by);
CREATE INDEX IF NOT EXISTS idx_pa_attested_at
    ON public.profile_attestations(attested_at DESC);

-- profile_publications indexes
CREATE INDEX IF NOT EXISTS idx_pp_profile_id
    ON public.profile_publications(profile_id);
CREATE INDEX IF NOT EXISTS idx_pp_version_id
    ON public.profile_publications(version_id);
CREATE INDEX IF NOT EXISTS idx_pp_published_by
    ON public.profile_publications(published_by);
CREATE INDEX IF NOT EXISTS idx_pp_published_at
    ON public.profile_publications(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_pp_visibility_level
    ON public.profile_publications(visibility_level);

-- ############################################################################
-- PART 6: ROW LEVEL SECURITY
-- ############################################################################

-- ── site_profiles ────────────────────────────────────────────────────────

ALTER TABLE public.site_profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: org-scoped — a user may read profiles for institutions where they
-- are an active member.
DROP POLICY IF EXISTS sp_select_org ON public.site_profiles;
CREATE POLICY sp_select_org ON public.site_profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_memberships om
            WHERE om.organization_id = site_profiles.institution_id
              AND om.user_id = auth.uid()
              AND om.status = 'active'
        )
        OR auth.role() = 'service_role'
    );

-- INSERT: service_role only (service layer creates profiles)
DROP POLICY IF EXISTS sp_insert_service ON public.site_profiles;
CREATE POLICY sp_insert_service ON public.site_profiles
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- UPDATE: service_role only
DROP POLICY IF EXISTS sp_update_service ON public.site_profiles;
CREATE POLICY sp_update_service ON public.site_profiles
    FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- DELETE: service_role only
DROP POLICY IF EXISTS sp_delete_service ON public.site_profiles;
CREATE POLICY sp_delete_service ON public.site_profiles
    FOR DELETE
    USING (auth.role() = 'service_role');

-- service_role full-access fallback
DROP POLICY IF EXISTS sp_all_service ON public.site_profiles;
CREATE POLICY sp_all_service ON public.site_profiles
    FOR ALL
    USING (auth.role() = 'service_role');

-- ── site_profile_versions ───────────────────────────────────────────────

ALTER TABLE public.site_profile_versions ENABLE ROW LEVEL SECURITY;

-- SELECT: org-scoped via profile_id FK → site_profiles.institution_id
DROP POLICY IF EXISTS spv_select_org ON public.site_profile_versions;
CREATE POLICY spv_select_org ON public.site_profile_versions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.site_profiles sp
            WHERE sp.id = site_profile_versions.profile_id
              AND sp.institution_id IN (
                SELECT om.organization_id
                FROM public.organization_memberships om
                WHERE om.user_id = auth.uid()
                  AND om.status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

-- INSERT: service_role only
DROP POLICY IF EXISTS spv_insert_service ON public.site_profile_versions;
CREATE POLICY spv_insert_service ON public.site_profile_versions
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- UPDATE: blocked for all roles via RLS (versions are immutable).
-- No UPDATE policy is created intentionally. service_role bypasses RLS
-- by default in Supabase if ever needed, but versions should not be mutated.
DROP POLICY IF EXISTS spv_delete_service ON public.site_profile_versions;
CREATE POLICY spv_delete_service ON public.site_profile_versions
    FOR DELETE
    USING (auth.role() = 'service_role');

-- service_role full-access fallback
DROP POLICY IF EXISTS spv_all_service ON public.site_profile_versions;
CREATE POLICY spv_all_service ON public.site_profile_versions
    FOR ALL
    USING (auth.role() = 'service_role');

-- ── profile_attestations ─────────────────────────────────────────────────

ALTER TABLE public.profile_attestations ENABLE ROW LEVEL SECURITY;

-- SELECT: org-scoped via profile_id FK chain
DROP POLICY IF EXISTS pa_select_org ON public.profile_attestations;
CREATE POLICY pa_select_org ON public.profile_attestations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.site_profiles sp
            WHERE sp.id = profile_attestations.profile_id
              AND sp.institution_id IN (
                SELECT om.organization_id
                FROM public.organization_memberships om
                WHERE om.user_id = auth.uid()
                  AND om.status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

-- INSERT: service_role only
DROP POLICY IF EXISTS pa_insert_service ON public.profile_attestations;
CREATE POLICY pa_insert_service ON public.profile_attestations
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- DELETE: service_role only
DROP POLICY IF EXISTS pa_delete_service ON public.profile_attestations;
CREATE POLICY pa_delete_service ON public.profile_attestations
    FOR DELETE
    USING (auth.role() = 'service_role');

-- service_role full-access fallback
DROP POLICY IF EXISTS pa_all_service ON public.profile_attestations;
CREATE POLICY pa_all_service ON public.profile_attestations
    FOR ALL
    USING (auth.role() = 'service_role');

-- ── profile_publications ─────────────────────────────────────────────────

ALTER TABLE public.profile_publications ENABLE ROW LEVEL SECURITY;

-- SELECT: org-scoped via profile_id FK chain
DROP POLICY IF EXISTS pp_select_org ON public.profile_publications;
CREATE POLICY pp_select_org ON public.profile_publications
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.site_profiles sp
            WHERE sp.id = profile_publications.profile_id
              AND sp.institution_id IN (
                SELECT om.organization_id
                FROM public.organization_memberships om
                WHERE om.user_id = auth.uid()
                  AND om.status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

-- INSERT: service_role only
DROP POLICY IF EXISTS pp_insert_service ON public.profile_publications;
CREATE POLICY pp_insert_service ON public.profile_publications
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- DELETE: service_role only
DROP POLICY IF EXISTS pp_delete_service ON public.profile_publications;
CREATE POLICY pp_delete_service ON public.profile_publications
    FOR DELETE
    USING (auth.role() = 'service_role');

-- service_role full-access fallback
DROP POLICY IF EXISTS pp_all_service ON public.profile_publications;
CREATE POLICY pp_all_service ON public.profile_publications
    FOR ALL
    USING (auth.role() = 'service_role');

-- ############################################################################
-- PART 7: updated_at TRIGGER (site_profiles only)
-- ############################################################################
-- site_profile_versions are immutable and have no updated_at column.
-- profile_attestations and profile_publications are event records
-- (append-only by convention) and do not carry updated_at.

-- trigger_set_updated_at() is defined in migration 062 and is idempotent.
DROP TRIGGER IF EXISTS trg_site_profiles_updated_at
    ON public.site_profiles;

CREATE TRIGGER trg_site_profiles_updated_at
    BEFORE UPDATE ON public.site_profiles
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- ############################################################################
-- PART 8: GRANTS
-- ############################################################################

-- site_profiles
GRANT SELECT ON public.site_profiles TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.site_profiles TO service_role;

-- site_profile_versions
GRANT SELECT ON public.site_profile_versions TO authenticated, service_role;
GRANT INSERT, DELETE ON public.site_profile_versions TO service_role;

-- profile_attestations
GRANT SELECT ON public.profile_attestations TO authenticated, service_role;
GRANT INSERT, DELETE ON public.profile_attestations TO service_role;

-- profile_publications
GRANT SELECT ON public.profile_publications TO authenticated, service_role;
GRANT INSERT, DELETE ON public.profile_publications TO service_role;

-- ############################################################################
-- END OF MIGRATION 096
-- ============================================================================
