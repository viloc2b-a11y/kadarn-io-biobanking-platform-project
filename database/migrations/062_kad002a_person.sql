-- ============================================================================
-- KAD-002A — Person Entity
-- ============================================================================
-- Authority: Foundation Library 016_CANONICAL_ENTITY_SPECIFICATIONS
-- Person represents a natural person who can act within the KADARN ecosystem.
-- A Person is NOT an auth user — auth.users handles authentication.
-- A Person is a domain entity that MAY be linked to an auth user.
-- ============================================================================

-- ############################################################################
-- ENUMS
-- ############################################################################

DO $$ BEGIN
    CREATE TYPE person_status AS ENUM (
        'active',
        'inactive',
        'suspended',
        'merged'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE person_role_type AS ENUM (
        'pi',
        'sub_investigator',
        'coordinator',
        'reviewer',
        'approver',
        'contact',
        'administrator',
        'owner'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- TABLE: people
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.people (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    email               TEXT NOT NULL,
    first_name          TEXT NOT NULL,
    last_name           TEXT NOT NULL,
    middle_name         TEXT,
    suffix              TEXT,

    -- Contact
    phone               TEXT,

    -- Professional identifiers
    orcid               TEXT,
    npi                 TEXT,

    -- Profile
    profile_photo_url   TEXT,

    -- Status
    status              person_status NOT NULL DEFAULT 'active',

    -- Link to auth user (optional — not all People are authenticated)
    auth_user_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Temporal
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT uq_people_email UNIQUE (email),
    CONSTRAINT uq_people_orcid UNIQUE (orcid),
    CONSTRAINT uq_people_npi UNIQUE (npi)
);

-- ############################################################################
-- INDEXES
-- ############################################################################

CREATE INDEX idx_people_email ON public.people(email);
CREATE INDEX idx_people_name ON public.people(last_name, first_name);
CREATE INDEX idx_people_status ON public.people(status);
CREATE INDEX idx_people_auth_user ON public.people(auth_user_id);

-- ############################################################################
-- TRIGGER: updated_at
-- ############################################################################

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_people_updated_at ON public.people;
CREATE TRIGGER trg_people_updated_at
    BEFORE UPDATE ON public.people
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ############################################################################
-- RLS
-- ############################################################################

ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;

-- People can read their own record
CREATE POLICY people_select_self ON public.people
    FOR SELECT
    USING (auth.uid() = auth_user_id);

-- Service role can read all people
CREATE POLICY people_select_service ON public.people
    FOR SELECT
    USING (auth.role() = 'service_role');

-- People can update their own record
CREATE POLICY people_update_self ON public.people
    FOR UPDATE
    USING (auth.uid() = auth_user_id)
    WITH CHECK (auth.uid() = auth_user_id);

-- Service role can manage all people
CREATE POLICY people_all_service ON public.people
    FOR ALL
    USING (auth.role() = 'service_role');

-- ############################################################################
-- GRANTS
-- ############################################################################

GRANT SELECT, INSERT, UPDATE ON public.people TO authenticated, service_role;
GRANT DELETE ON public.people TO service_role;
