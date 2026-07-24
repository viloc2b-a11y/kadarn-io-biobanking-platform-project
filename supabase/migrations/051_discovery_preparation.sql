-- ============================================================================
-- RC-12.1B - Sponsor Portfolio Persistence
-- ============================================================================
-- Purpose:
--   Replace temporary Sponsor Passport portfolio allowlists with persistent,
--   sponsor-owned portfolio infrastructure.
--
-- Boundaries:
--   - Does NOT change RC-10.2 Sponsor Passport contract.
--   - Does NOT change Sponsor UI.
--   - Does NOT change Evidence Core claim/evidence ownership.
--   - Portfolio is access scope, not evidence truth.
--
-- Dependencies:
--   - public.organizations
--   - public.organization_memberships
-- ============================================================================

-- ############################################################################
-- PART 1: ENUMS
-- ############################################################################

DO $$ BEGIN
    CREATE TYPE sponsor_portfolio_status AS ENUM (
        'active',
        'archived'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE sponsor_portfolio_membership_status AS ENUM (
        'active',
        'paused',
        'removed'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- PART 2: TABLE - sponsor_portfolios
-- ############################################################################
--
-- Root aggregate for a sponsor-owned portfolio. A portfolio is an access and
-- working-set construct. It does not own institutional claims or evidence.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sponsor_portfolios (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_org_id  UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    name            TEXT NOT NULL DEFAULT 'Sponsor Portfolio',
    status          sponsor_portfolio_status NOT NULL DEFAULT 'active',
    version         INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),

    created_by      UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    archived_at     TIMESTAMPTZ,
    metadata        JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT uq_sponsor_portfolios_id_owner UNIQUE (id, sponsor_org_id),
    CONSTRAINT ck_sponsor_portfolios_archived_at
        CHECK (
            (status = 'archived' AND archived_at IS NOT NULL)
            OR (status = 'active' AND archived_at IS NULL)
        )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_sponsor_portfolios_active_owner
    ON public.sponsor_portfolios(sponsor_org_id)
    WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_sponsor_portfolios_sponsor_status
    ON public.sponsor_portfolios(sponsor_org_id, status);

CREATE INDEX IF NOT EXISTS idx_sponsor_portfolios_updated_at
    ON public.sponsor_portfolios(updated_at DESC);

COMMENT ON TABLE public.sponsor_portfolios IS
    'Sponsor-owned portfolio aggregate for Sponsor Passport access scope.';

COMMENT ON COLUMN public.sponsor_portfolios.sponsor_org_id IS
    'Organization that owns the sponsor portfolio.';

-- ############################################################################
-- PART 3: TABLE - sponsor_portfolio_memberships
-- ############################################################################
--
-- Institution/site membership inside a sponsor portfolio. institution_org_id is
-- the organization_id used by Evidence Core claim/evidence reads.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sponsor_portfolio_memberships (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id          UUID NOT NULL,
    sponsor_org_id        UUID NOT NULL,
    institution_org_id    UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    status                sponsor_portfolio_membership_status NOT NULL DEFAULT 'active',
    member_since          DATE NOT NULL DEFAULT CURRENT_DATE,
    display_name_override TEXT,
    location_override     TEXT,
    version               INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),

    created_by            UUID,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    removed_at            TIMESTAMPTZ,
    metadata              JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT fk_sponsor_portfolio_memberships_portfolio_owner
        FOREIGN KEY (portfolio_id, sponsor_org_id)
        REFERENCES public.sponsor_portfolios(id, sponsor_org_id)
        ON DELETE CASCADE,

    CONSTRAINT ck_sponsor_portfolio_memberships_distinct_orgs
        CHECK (sponsor_org_id <> institution_org_id),

    CONSTRAINT ck_sponsor_portfolio_memberships_removed_at
        CHECK (
            (status = 'removed' AND removed_at IS NOT NULL)
            OR (status <> 'removed' AND removed_at IS NULL)
        )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_sponsor_portfolio_memberships_active_portfolio_institution
    ON public.sponsor_portfolio_memberships(portfolio_id, institution_org_id)
    WHERE status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS uq_sponsor_portfolio_memberships_active_sponsor_institution
    ON public.sponsor_portfolio_memberships(sponsor_org_id, institution_org_id)
    WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_sponsor_portfolio_memberships_sponsor_status
    ON public.sponsor_portfolio_memberships(sponsor_org_id, status);

CREATE INDEX IF NOT EXISTS idx_sponsor_portfolio_memberships_portfolio_status
    ON public.sponsor_portfolio_memberships(portfolio_id, status);

CREATE INDEX IF NOT EXISTS idx_sponsor_portfolio_memberships_institution
    ON public.sponsor_portfolio_memberships(institution_org_id);

CREATE INDEX IF NOT EXISTS idx_sponsor_portfolio_memberships_updated_at
    ON public.sponsor_portfolio_memberships(updated_at DESC);

COMMENT ON TABLE public.sponsor_portfolio_memberships IS
    'Institutions/sites included in a sponsor-owned portfolio for Sponsor Passport access scope.';

COMMENT ON COLUMN public.sponsor_portfolio_memberships.institution_org_id IS
    'Institution/site organization ID used by Evidence Core reads.';

-- ############################################################################
-- PART 4: TRIGGERS - updated_at
-- ############################################################################

DROP TRIGGER IF EXISTS trg_sponsor_portfolios_updated_at ON public.sponsor_portfolios;
CREATE TRIGGER trg_sponsor_portfolios_updated_at
    BEFORE UPDATE ON public.sponsor_portfolios
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_sponsor_portfolio_memberships_updated_at ON public.sponsor_portfolio_memberships;
CREATE TRIGGER trg_sponsor_portfolio_memberships_updated_at
    BEFORE UPDATE ON public.sponsor_portfolio_memberships
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ############################################################################
-- PART 5: ROW-LEVEL SECURITY
-- ############################################################################

ALTER TABLE public.sponsor_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_portfolio_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sponsor_portfolios_select_org ON public.sponsor_portfolios;
CREATE POLICY sponsor_portfolios_select_org ON public.sponsor_portfolios
    FOR SELECT
    USING (
        sponsor_org_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS sponsor_portfolio_memberships_select_org ON public.sponsor_portfolio_memberships;
CREATE POLICY sponsor_portfolio_memberships_select_org ON public.sponsor_portfolio_memberships
    FOR SELECT
    USING (
        sponsor_org_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR auth.role() = 'service_role'
    );

-- ############################################################################
-- PART 6: GRANTS
-- ############################################################################

GRANT SELECT ON public.sponsor_portfolios TO authenticated, service_role;
GRANT SELECT ON public.sponsor_portfolio_memberships TO authenticated, service_role;
GRANT INSERT, UPDATE ON public.sponsor_portfolios TO service_role;
GRANT INSERT, UPDATE ON public.sponsor_portfolio_memberships TO service_role;
