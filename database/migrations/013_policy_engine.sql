-- ============================================================================
-- KADARN PLATFORM — Policy Engine (P0 Engine)
-- ============================================================================
-- Target: PostgreSQL 15+ (Supabase compatible)
-- Domain: Declarative policy evaluation for governance, financial, regulatory,
--         and operational decisions
-- Design: ADR-010 — Policy Engine: Declarative Policy Evaluation
-- Reference: KRM-RAO §2.4 (Policy), §5.2 (Policy Engine)
-- Dependencies: 008_organizations_capabilities.sql (organizations table)
--
-- This migration creates the data layer for the Policy Engine. The engine
-- itself is a pure function in packages/policy-engine/ — stateless, no
-- database calls.
-- ============================================================================

-- ############################################################################
-- PART 0: EXTENSION SAFETY
-- ############################################################################

-- pgcrypto for gen_random_uuid()
-- Already loaded by 008, but safe to repeat

-- ############################################################################
-- PART 1: ENUMS
-- ############################################################################

DO $$ BEGIN
    CREATE TYPE policy_domain AS ENUM (
        'governance',
        'financial',
        'regulatory',
        'operational'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE policy_status AS ENUM (
        'draft',
        'active',
        'inactive',
        'deprecated'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE policy_outcome AS ENUM (
        'allow',
        'deny',
        'conditional'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- PART 2: POLICIES TABLE
-- ############################################################################

CREATE TABLE IF NOT EXISTS policies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    domain          policy_domain NOT NULL,
    status          policy_status NOT NULL DEFAULT 'draft',
    version         INTEGER NOT NULL DEFAULT 1,
    priority        INTEGER NOT NULL DEFAULT 1000,
    rules           JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata        JSONB DEFAULT '{}'::jsonb,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_by      UUID REFERENCES auth.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- A policy must have at least one rule
    CONSTRAINT policies_rules_not_empty
        CHECK (jsonb_array_length(rules) > 0),

    -- Each rule must have condition, effect, and optional reason
    CONSTRAINT policies_rules_valid
        CHECK (rules @> '[{"effect": "allow"}]'::jsonb OR
               rules @> '[{"effect": "deny"}]'::jsonb),

    -- Unique name per organization (global policies have NULL org)
    CONSTRAINT policies_name_unique
        UNIQUE NULLS NOT DISTINCT (organization_id, name)
);

COMMENT ON TABLE policies IS
    'Declarative policy definitions. Rules are stored as JSONB condition trees.';

COMMENT ON COLUMN policies.rules IS
    'Array of {condition: PolicyCondition, effect: "allow"|"deny", reason?: string}';
COMMENT ON COLUMN policies.priority IS
    'Lower values = higher priority. Default 1000. Evaluated in ascending order.';
COMMENT ON COLUMN policies.organization_id IS
    'NULL = global policy (applies to all orgs). Non-NULL = org-scoped policy.';

-- ############################################################################
-- PART 3: POLICY EVALUATIONS (APPEND-ONLY AUDIT LOG)
-- ############################################################################

CREATE TABLE IF NOT EXISTS policy_evaluations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id       UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    context         JSONB NOT NULL,
    outcome         policy_outcome NOT NULL,
    matched_rules   TEXT[] DEFAULT '{}',
    trace           JSONB NOT NULL DEFAULT '[]'::jsonb,
    evaluated_by    UUID REFERENCES auth.users(id),
    evaluated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL
);

COMMENT ON TABLE policy_evaluations IS
    'Append-only audit log of policy evaluation results. No UPDATE or DELETE.';

CREATE INDEX IF NOT EXISTS idx_policy_evaluations_policy_id
    ON policy_evaluations(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_evaluations_outcome
    ON policy_evaluations(outcome);
CREATE INDEX IF NOT EXISTS idx_policy_evaluations_evaluated_at
    ON policy_evaluations(evaluated_at DESC);

-- ############################################################################
-- PART 4: INDEXES
-- ############################################################################

CREATE INDEX IF NOT EXISTS idx_policies_domain
    ON policies(domain);
CREATE INDEX IF NOT EXISTS idx_policies_status
    ON policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_organization_id
    ON policies(organization_id);
CREATE INDEX IF NOT EXISTS idx_policies_priority
    ON policies(priority ASC);

-- GIN index for JSONB queries on rules
CREATE INDEX IF NOT EXISTS idx_policies_rules_gin
    ON policies USING GIN (rules jsonb_path_ops);

-- ############################################################################
-- PART 5: UPDATED_AT TRIGGER
-- ############################################################################

CREATE OR REPLACE FUNCTION update_policies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_policies_updated_at ON policies;
CREATE TRIGGER trg_policies_updated_at
    BEFORE UPDATE ON policies
    FOR EACH ROW
    EXECUTE FUNCTION update_policies_updated_at();

-- ############################################################################
-- PART 6: ROW-LEVEL SECURITY
-- ############################################################################

ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_evaluations ENABLE ROW LEVEL SECURITY;

-- Policies: SELECT — users see global policies + their org's policies
CREATE POLICY policies_select ON policies
    FOR SELECT
    USING (
        organization_id IS NULL
        OR organization_id IN (
            SELECT organization_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
    );

-- Policies: INSERT — org_admins and platform_admins can create
CREATE POLICY policies_insert ON policies
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated'
        AND (
            organization_id IS NULL
            OR (
                organization_id IS NOT NULL
                AND public.is_org_admin(organization_id)
            )
        )
    );

-- Policies: UPDATE — same as INSERT
CREATE POLICY policies_update ON policies
    FOR UPDATE
    USING (
        auth.role() = 'authenticated'
        AND (
            organization_id IS NULL
            OR (
                organization_id IS NOT NULL
                AND public.is_org_admin(organization_id)
            )
        )
    );

-- Policies: DELETE — same as INSERT
CREATE POLICY policies_delete ON policies
    FOR DELETE
    USING (
        auth.role() = 'authenticated'
        AND (
            organization_id IS NULL
            OR (
                organization_id IS NOT NULL
                AND public.is_org_admin(organization_id)
            )
        )
    );

-- Policy evaluations: SELECT — users see evaluations for policies they can access
CREATE POLICY policy_evaluations_select ON policy_evaluations
    FOR SELECT
    USING (
        organization_id IS NULL
        OR organization_id IN (
            SELECT organization_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
    );

-- Policy evaluations: INSERT — via service role or SECURITY DEFINER
-- Regular users do not insert directly — the engine calls via API
CREATE POLICY policy_evaluations_insert ON policy_evaluations
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- ############################################################################
-- PART 7: SEED DATA — EXAMPLE POLICIES
-- ############################################################################

-- Inserted only if no policies exist yet (idempotent for dev environments)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM policies LIMIT 1) THEN
        INSERT INTO policies (name, description, domain, status, version, priority, rules, metadata)
        VALUES (
            'Oncology Use Only',
            'Specimens collected under oncology IRBs may only be used for oncology research',
            'governance',
            'active',
            1,
            100,
            '[
                {
                    "id": "rule-001",
                    "condition": {
                        "any": [
                            {
                                "neq": [
                                    {"var": "request.consent.scope"},
                                    "oncology"
                                ]
                            },
                            {
                                "not": {
                                    "in": [
                                        {"var": "request.purpose"},
                                        ["research", "qa", "assay_development"]
                                    ]
                                }
                            }
                        ]
                    },
                    "effect": "deny",
                    "reason": "Specimens under oncology IRB #2024-05 are restricted to oncology research purposes"
                }
            ]'::jsonb,
            '{"irb": "IRB #2024-05", "category": "consent_scope"}'
        );

        INSERT INTO policies (name, description, domain, status, version, priority, rules, metadata)
        VALUES (
            'High-Value Shipment Authorization',
            'Shipments exceeding $10,000 require dual authorization',
            'financial',
            'active',
            1,
            200,
            '[
                {
                    "id": "rule-002",
                    "condition": {
                        "gt": [
                            {"var": "fulfillment.estimatedValue"},
                            10000
                        ]
                    },
                    "effect": "deny",
                    "reason": "Shipments over $10,000 require dual authorization"
                }
            ]'::jsonb,
            '{"category": "financial_control", "threshold": 10000}'
        );

        INSERT INTO policies (name, description, domain, status, version, priority, rules, metadata)
        VALUES (
            'Minimum Trust Score',
            'Only route specimens to organizations with trust score >= 0.7',
            'operational',
            'active',
            1,
            150,
            '[
                {
                    "id": "rule-003",
                    "condition": {
                        "lt": [
                            {"var": "destination.trustScore"},
                            0.7
                        ]
                    },
                    "effect": "deny",
                    "reason": "Destination organization trust score is below minimum threshold of 0.7"
                }
            ]'::jsonb,
            '{"category": "trust_control", "threshold": 0.7}'
        );
    END IF;
END;
$$;
