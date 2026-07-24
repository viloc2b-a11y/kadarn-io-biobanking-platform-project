-- ============================================================================
-- KADARN PLATFORM — Passport Publication (Evidence Intelligence vertical slice)
-- ============================================================================
-- Enables selective claim publication with per-unit disclosure.
-- ============================================================================

-- ############################################################################
-- PART 1: ENUMS
-- ############################################################################

DO $$ BEGIN
    CREATE TYPE publication_status AS ENUM (
        'draft',
        'published',
        'restricted',
        'withdrawn'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- PART 2: PASSPORT ENTRIES
-- ############################################################################
-- Each entry represents a claim published to a specific audience.

CREATE TABLE IF NOT EXISTS passport_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    claim_id        UUID NOT NULL REFERENCES evidence_core.claims(id),
    publication_status publication_status NOT NULL DEFAULT 'draft',
    visibility_scope   visibility_scope NOT NULL DEFAULT 'site',
    authorized_sponsor_ids UUID[] DEFAULT '{}',
    published_at     TIMESTAMPTZ,
    published_by     UUID,
    withdrawn_at     TIMESTAMPTZ,
    withdrawn_by     UUID,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(claim_id, visibility_scope)
);

CREATE INDEX IF NOT EXISTS idx_passport_entries_org ON passport_entries(organization_id);
CREATE INDEX IF NOT EXISTS idx_passport_entries_status ON passport_entries(publication_status);

-- ############################################################################
-- PART 3: PASSPORT SHARES (explicit grant to a sponsor)
-- ############################################################################

CREATE TABLE IF NOT EXISTS passport_shares (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passport_entry_id UUID NOT NULL REFERENCES passport_entries(id) ON DELETE CASCADE,
    sponsor_organization_id UUID NOT NULL,
    granted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    granted_by      UUID NOT NULL,
    expires_at      TIMESTAMPTZ,
    revoked_at      TIMESTAMPTZ,
    UNIQUE(passport_entry_id, sponsor_organization_id)
);

-- ############################################################################
-- PART 4: RLS
-- ############################################################################

ALTER TABLE passport_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE passport_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY passport_entries_org ON passport_entries
    USING (organization_id = (auth.jwt() ->> 'organization_id'::text)::UUID);

CREATE POLICY passport_shares_org ON passport_shares
    USING (passport_entry_id IN (
        SELECT id FROM passport_entries
        WHERE organization_id = (auth.jwt() ->> 'organization_id'::text)::UUID
    ));
