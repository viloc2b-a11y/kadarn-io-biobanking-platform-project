-- ============================================================================
-- KAD-002B — Location Entity
-- ============================================================================
-- Authority: Foundation Library 016_CANONICAL_ENTITY_SPECIFICATIONS
-- Location represents a physical location belonging to an Institution.
-- A Location belongs to exactly one Institution (organizations table).
-- ============================================================================

-- ############################################################################
-- ENUMS
-- ############################################################################

DO $$ BEGIN
    CREATE TYPE location_type AS ENUM (
        'clinic',
        'laboratory',
        'warehouse',
        'phase1_unit',
        'office',
        'pharmacy',
        'storage',
        'other'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE location_status AS ENUM (
        'active',
        'inactive',
        'under_maintenance',
        'decommissioned'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- TABLE: locations
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.locations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    name                TEXT NOT NULL,
    location_type       location_type NOT NULL DEFAULT 'other',

    -- Ownership
    institution_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Address
    address_line1       TEXT NOT NULL,
    address_line2       TEXT,
    city                TEXT NOT NULL,
    state_province      TEXT NOT NULL,
    postal_code         TEXT NOT NULL,
    country             TEXT NOT NULL,

    -- Contact
    phone               TEXT,

    -- Time zone
    timezone            TEXT,

    -- Geo (optional)
    latitude            NUMERIC(10,7),
    longitude           NUMERIC(10,7),

    -- Status
    status              location_status NOT NULL DEFAULT 'active',

    -- Temporal
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT uq_location_institution_name UNIQUE (institution_id, name)
);

-- ############################################################################
-- INDEXES
-- ############################################################################

CREATE INDEX idx_locations_institution ON public.locations(institution_id);
CREATE INDEX idx_locations_type ON public.locations(location_type);
CREATE INDEX idx_locations_status ON public.locations(status);
CREATE INDEX idx_locations_country ON public.locations(country);

-- ############################################################################
-- TRIGGER: updated_at
-- ############################################################################

DROP TRIGGER IF EXISTS trg_locations_updated_at ON public.locations;
CREATE TRIGGER trg_locations_updated_at
    BEFORE UPDATE ON public.locations
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ############################################################################
-- RLS
-- ############################################################################

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Members of an institution can read its locations
CREATE POLICY locations_select_org ON public.locations
    FOR SELECT
    USING (
        institution_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

-- Members can create locations for their institution
CREATE POLICY locations_insert_org ON public.locations
    FOR INSERT
    WITH CHECK (
        institution_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

-- Members can update their institution's locations
CREATE POLICY locations_update_org ON public.locations
    FOR UPDATE
    USING (
        institution_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

-- Service role can manage all locations
CREATE POLICY locations_all_service ON public.locations
    FOR ALL
    USING (auth.role() = 'service_role');

-- ############################################################################
-- GRANTS
-- ############################################################################

GRANT SELECT, INSERT, UPDATE ON public.locations TO authenticated, service_role;
GRANT DELETE ON public.locations TO service_role;
