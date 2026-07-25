-- ============================================================================
-- KADARN v2 — Immutable Claim Versioning (Loop 3, Phase 2)
-- ============================================================================
-- Migration: 085
-- Authority: KAD-LOOP-003 Phase 2, Architecture Constitution v2.0
-- Forward-only, additive. No historical migrations modified.
--
-- Creates the claim_versions table: immutable append-only snapshots of a
-- claim at each version. The full lineage of a claim is reconstructable from
-- the sequence of claim_versions rows for a given claim_id.
--
-- Immutability contract:
--   - Rows are INSERT-only by convention. The service layer snapshots the
--     current Claim state into a new row on every edit.
--   - The ONLY column that may be updated after insert is superseded_by,
--     which is set once (by the service layer) when a newer version
--     supersedes this one. supersession_reason is frozen at insert time.
--   - created_at is the freeze timestamp and never changes.
--
-- RLS:
--   - SELECT is org-scoped: a user may read a version if they are an active
--     member of the organization that owns the parent claim (resolved via
--     the claim_id FK -> claims.organization_id).
--   - service_role has full access (FOR ALL).
--
-- Enums reused (no new enums created):
--   - workflow_state           (migration 060)
--   - claim_category_enum      (migration 083)
--   - claim_scope_enum         (migration 083)
--   - claim_priority           (migration 083)
--   - claim_lifecycle_status   (migration 083)
--   - claim_review_status      (migration 083)
--
-- trigger_set_updated_at() is defined in migration 062 and is idempotent.
-- An updated_at column + trigger is added for audit metadata completeness
-- even though version rows are immutable; it only advances if the
-- superseded_by column is set (the sole permitted update).
-- ============================================================================

-- ############################################################################
-- PART 1: TABLE — claim_versions
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.claim_versions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id                UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    version                 INTEGER NOT NULL,

    -- Snapshot of claim content at this version
    claim_type_id           TEXT NOT NULL,
    name                    TEXT NOT NULL,
    description             TEXT,

    -- Snapshot of scope targets
    organization_id         UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    location_id             UUID,
    person_id               UUID,

    -- Snapshot of LOOP-3 classification
    claim_category          claim_category_enum,
    claim_scope             claim_scope_enum,
    priority                claim_priority,

    -- Snapshot of ownership & provenance
    owner_id                UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    source_event_id         UUID,

    -- Snapshot of status dimensions at freeze time (immutable after insert)
    workflow_state          workflow_state NOT NULL DEFAULT 'draft',
    lifecycle_status        claim_lifecycle_status NOT NULL DEFAULT 'draft',
    review_status           claim_review_status NOT NULL DEFAULT 'pending',
    -- Legacy verification pipeline snapshot. Stored as TEXT (the
    -- ClaimVerificationStatus enum is a TS-only overlay with no DB enum).
    verification_status     TEXT,

    -- Snapshot of evidence roll-up at freeze time
    evidence_count          INTEGER NOT NULL DEFAULT 0,

    -- Snapshot of lifecycle expiry / supersession
    expires_at              TIMESTAMPTZ,
    -- Self-referential: the ClaimVersion that superseded this one.
    -- NULL = current version. Set once, by the service layer, when a newer
    -- version is created. This is the ONLY mutable column on the table.
    superseded_by           UUID REFERENCES public.claim_versions(id) ON DELETE SET NULL,
    supersession_reason     TEXT,

    -- Snapshot of misc fields
    tags                    TEXT,

    -- Audit
    created_by_actor_id     UUID,
    -- Freeze timestamp. Immutable.
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Audit metadata only; advanced solely by the superseded_by update path.
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- No two versions of the same claim may share a version number.
    CONSTRAINT uq_claim_version_claim_id_version UNIQUE (claim_id, version),

    -- Version numbers are monotonic per claim starting at 1.
    CONSTRAINT cv_version_positive CHECK (version >= 1),

    -- Evidence count cannot be negative.
    CONSTRAINT cv_evidence_count_nonneg CHECK (evidence_count >= 0)
);

-- ############################################################################
-- PART 2: INDEXES
-- ############################################################################

-- Fast lookup of all versions for a claim (lineage queries).
CREATE INDEX IF NOT EXISTS idx_claim_versions_claim_id
    ON public.claim_versions(claim_id);

-- Fast lookup of superseded versions (find historical / non-current rows).
CREATE INDEX IF NOT EXISTS idx_claim_versions_superseded_by
    ON public.claim_versions(superseded_by);

-- Composite index for "current version of a claim" (superseded_by IS NULL).
CREATE INDEX IF NOT EXISTS idx_claim_versions_claim_current
    ON public.claim_versions(claim_id)
    WHERE superseded_by IS NULL;

-- ############################################################################
-- PART 3: ROW LEVEL SECURITY
-- ############################################################################

ALTER TABLE public.claim_versions ENABLE ROW LEVEL SECURITY;

-- SELECT: org-scoped — inherit org from the parent claim via claim_id FK.
-- A user may read a version if they are an active member of the organization
-- that owns the parent claim.
DROP POLICY IF EXISTS cv_select_org ON public.claim_versions;
CREATE POLICY cv_select_org ON public.claim_versions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.claims c
            WHERE c.id = claim_versions.claim_id
              AND c.organization_id IN (
                SELECT om.organization_id
                FROM public.organization_memberships om
                WHERE om.user_id = auth.uid()
                  AND om.status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

-- INSERT: only the service layer creates version snapshots. Org membership
-- is verified at the API/service boundary before snapshotting. service_role
-- bypasses RLS.
DROP POLICY IF EXISTS cv_insert_service ON public.claim_versions;
CREATE POLICY cv_insert_service ON public.claim_versions
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- UPDATE: only the service layer may update, and only to set superseded_by
-- (the sole permitted mutation). All other columns are immutable by
-- convention and enforced at the service layer.
DROP POLICY IF EXISTS cv_update_service ON public.claim_versions;
CREATE POLICY cv_update_service ON public.claim_versions
    FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- DELETE: blocked for all roles via RLS. Version snapshots are permanent.
-- (service_role bypasses RLS by default in Supabase, so the service layer
--  can still prune if ever required, but no authenticated-role DELETE.)
DROP POLICY IF EXISTS cv_delete_service ON public.claim_versions;
CREATE POLICY cv_delete_service ON public.claim_versions
    FOR DELETE
    USING (auth.role() = 'service_role');

-- service_role full-access policy (coexists with the scoped policies above;
-- ensures service_role is never locked out).
DROP POLICY IF EXISTS cv_all_service ON public.claim_versions;
CREATE POLICY cv_all_service ON public.claim_versions
    FOR ALL
    USING (auth.role() = 'service_role');

-- ############################################################################
-- PART 4: updated_at TRIGGER (audit metadata)
-- ############################################################################
-- claim_versions is immutable by convention. The only permitted update is
-- setting superseded_by. The updated_at trigger advances the audit timestamp
-- when that happens, so supersession events carry a precise wall-clock.

-- trigger_set_updated_at() is defined in migration 062 and is idempotent.
DROP TRIGGER IF EXISTS trg_claim_versions_updated_at
    ON public.claim_versions;

CREATE TRIGGER trg_claim_versions_updated_at
    BEFORE UPDATE ON public.claim_versions
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

COMMENT ON COLUMN public.claim_versions.updated_at IS
    'KAD-LOOP-003: Audit timestamp. Advances only when superseded_by is set (the sole permitted update); rows are otherwise immutable.';

COMMENT ON COLUMN public.claim_versions.superseded_by IS
    'KAD-LOOP-003: FK to the claim_versions row that superseded this one. NULL = current version. Set once when a newer version is created.';

COMMENT ON COLUMN public.claim_versions.created_at IS
    'KAD-LOOP-003: Freeze timestamp — the moment this version snapshot was captured. Immutable.';

COMMENT ON TABLE public.claim_versions IS
    'KAD-LOOP-003: Immutable append-only snapshots of claims at each version. INSERT-only except superseded_by (set once on supersession).';

-- ############################################################################
-- PART 5: GRANTS
-- ############################################################################

GRANT SELECT ON public.claim_versions TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.claim_versions TO service_role;

-- ############################################################################
-- END OF MIGRATION 085
-- ============================================================================
