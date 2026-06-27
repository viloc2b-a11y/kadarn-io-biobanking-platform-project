-- ============================================================================
-- KADARN PLATFORM — Trust Engine (P0 Engine)
-- ============================================================================
-- Target: PostgreSQL 15+ (Supabase compatible)
-- Domain: Evidence-based trust computation for organizations in the Kadarn
--         network. Scores decay over time without new evidence.
-- Design: ADR-011 — Trust Engine: Evidence-Based Trust Computation
-- Reference: KRM-RAO §2.7 (Trust), §4.4 (Trust Graph), §5.4 (Trust Engine)
-- Dependencies: 008_organizations_capabilities.sql (organizations table)
--
-- This migration creates the data layer for the Trust Engine. The scoring
-- functions live in packages/trust-engine/.
-- ============================================================================

-- ############################################################################
-- PART 1: ENUMS
-- ############################################################################

DO $$ BEGIN
    CREATE TYPE trust_dimension AS ENUM (
        'operational',
        'regulatory',
        'financial',
        'technical'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE trust_event_severity AS ENUM (
        'low',
        'normal',
        'high',
        'critical'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE challenge_status AS ENUM (
        'filed',
        'under_review',
        'accepted',
        'rejected',
        'escalated'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- PART 2: ORGANIZATION TRUST — CURRENT SCORES
-- ############################################################################

CREATE TABLE IF NOT EXISTS organization_trust (
    organization_id         UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,

    -- Per-dimension scores (0.0–1.0)
    operational_score       NUMERIC(5,3) NOT NULL DEFAULT 0.500,
    regulatory_score        NUMERIC(5,3) NOT NULL DEFAULT 0.500,
    financial_score         NUMERIC(5,3) NOT NULL DEFAULT 0.500,
    technical_score         NUMERIC(5,3) NOT NULL DEFAULT 0.500,

    -- Composite overall score (weighted average)
    overall_score           NUMERIC(5,3) NOT NULL DEFAULT 0.500,

    -- Tracking metadata
    last_event_at           TIMESTAMPTZ,
    last_decay_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    total_fulfillments      INTEGER NOT NULL DEFAULT 0,
    successful_fulfillments INTEGER NOT NULL DEFAULT 0,
    incident_count          INTEGER NOT NULL DEFAULT 0,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT trust_score_range CHECK (
        operational_score BETWEEN 0.000 AND 1.000
        AND regulatory_score BETWEEN 0.000 AND 1.000
        AND financial_score BETWEEN 0.000 AND 1.000
        AND technical_score BETWEEN 0.000 AND 1.000
        AND overall_score BETWEEN 0.000 AND 1.000
    )
);

COMMENT ON TABLE organization_trust IS
    'Current trust scores per organization. Scores decay over time without new evidence.';
COMMENT ON COLUMN organization_trust.overall_score IS
    'Weighted composite of the four dimension scores. Default weights: equal (0.25 each).';

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_organization_trust_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_organization_trust_updated_at ON organization_trust;
CREATE TRIGGER trg_organization_trust_updated_at
    BEFORE UPDATE ON organization_trust
    FOR EACH ROW
    EXECUTE FUNCTION update_organization_trust_updated_at();

-- ############################################################################
-- PART 3: TRUST EVENTS — APPEND-ONLY AUDIT LOG
-- ############################################################################

CREATE TABLE IF NOT EXISTS trust_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    dimension           trust_dimension NOT NULL,
    impact              NUMERIC(6,4) NOT NULL,
    impact_after_decay  NUMERIC(6,4),  -- calculated after decay is applied
    evidence_ref        TEXT NOT NULL,  -- reference to evidence (fulfillment ID, breach ID, cert ID)
    source              VARCHAR(100) NOT NULL,  -- e.g. 'fulfillment.completed', 'temperature.breach'
    severity            trust_event_severity NOT NULL DEFAULT 'normal',
    description         TEXT,
    score_before        NUMERIC(5,3),  -- dimension score before this event
    score_after         NUMERIC(5,3),  -- dimension score after this event
    created_by          UUID REFERENCES auth.users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE trust_events IS
    'Append-only log of trust-affecting events. Each event records its impact on the relevant dimension.';
COMMENT ON COLUMN trust_events.evidence_ref IS
    'Reference to the evidence supporting this event — e.g. fulfillment ID, accreditation cert ID, breach report ID.';
COMMENT ON COLUMN trust_events.source IS
    'Canonical event source name, e.g. fulfillment.completed, temperature.breach, accreditation.verified';

CREATE INDEX IF NOT EXISTS idx_trust_events_organization
    ON trust_events(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_events_dimension
    ON trust_events(dimension);
CREATE INDEX IF NOT EXISTS idx_trust_events_source
    ON trust_events(source);
CREATE INDEX IF NOT EXISTS idx_trust_events_created_at
    ON trust_events(created_at DESC);

-- ############################################################################
-- PART 4: TRUST CHALLENGES
-- ############################################################################

CREATE TABLE IF NOT EXISTS trust_challenges (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    dimension           trust_dimension NOT NULL,
    challenged_score    NUMERIC(5,3) NOT NULL,  -- the score being challenged
    proposed_score      NUMERIC(5,3),           -- what the org believes it should be
    evidence_ref        TEXT NOT NULL,           -- counter-evidence
    reason              TEXT NOT NULL,
    status              challenge_status NOT NULL DEFAULT 'filed',
    reviewed_by         UUID REFERENCES auth.users(id),
    reviewed_at         TIMESTAMPTZ,
    resolution_notes    TEXT,
    created_by          UUID REFERENCES auth.users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE trust_challenges IS
    'Trust score challenges. Organizations may challenge their scores with counter-evidence.';

CREATE INDEX IF NOT EXISTS idx_trust_challenges_organization
    ON trust_challenges(organization_id);
CREATE INDEX IF NOT EXISTS idx_trust_challenges_status
    ON trust_challenges(status);

CREATE OR REPLACE FUNCTION update_trust_challenges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_trust_challenges_updated_at ON trust_challenges;
CREATE TRIGGER trg_trust_challenges_updated_at
    BEFORE UPDATE ON trust_challenges
    FOR EACH ROW
    EXECUTE FUNCTION update_trust_challenges_updated_at();

-- ############################################################################
-- PART 5: ROW-LEVEL SECURITY
-- ############################################################################

ALTER TABLE organization_trust ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_challenges ENABLE ROW LEVEL SECURITY;

-- Organization trust: visible to members of the org + program partners
CREATE POLICY organization_trust_select ON organization_trust
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
        OR auth.role() = 'service_role'
    );

-- Trust events: visible to org members + service role
CREATE POLICY trust_events_select ON trust_events
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
        OR auth.role() = 'service_role'
    );

-- Trust events: insert via service role (engines call the API)
CREATE POLICY trust_events_insert ON trust_events
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- Trust challenges: org members can file challenges for their org
CREATE POLICY trust_challenges_select ON trust_challenges
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY trust_challenges_insert ON trust_challenges
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY trust_challenges_update ON trust_challenges
    FOR UPDATE
    USING (
        auth.role() = 'service_role'
        OR auth.uid() IN (
            SELECT om.user_id FROM public.organization_memberships om
            JOIN public.membership_roles mr ON mr.membership_id = om.id
            JOIN public.organization_roles r ON r.id = mr.role_id
            WHERE om.user_id = auth.uid()
            AND om.organization_id = trust_challenges.organization_id
            AND om.status = 'active'
            AND r.name IN ('org_admin', 'platform_admin')
        )
    );

-- ############################################################################
-- PART 6: DEFAULT SCORES — INITIALIZE ON ORGANIZATION CREATION
-- ############################################################################

-- When a new organization is created, auto-initialize their trust record
-- with neutral scores (0.5).
CREATE OR REPLACE FUNCTION initialize_organization_trust()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO organization_trust (organization_id)
    VALUES (NEW.id)
    ON CONFLICT (organization_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_initialize_organization_trust ON organizations;
CREATE TRIGGER trg_initialize_organization_trust
    AFTER INSERT ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION initialize_organization_trust();

-- Initialize trust for any existing organizations that don't have it
INSERT INTO organization_trust (organization_id)
SELECT id FROM organizations o
WHERE NOT EXISTS (SELECT 1 FROM organization_trust t WHERE t.organization_id = o.id)
ON CONFLICT (organization_id) DO NOTHING;
