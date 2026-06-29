-- ============================================================================
-- KADARN PLATFORM — Workflow Engine 2.0 (Dynamic, Policy-Driven)
-- ============================================================================
-- Design: ADR-017 — Workflow Engine: Dynamic, Policy-Driven Orchestration
-- Reference: KRM-RAO §5.3 (Workflow Engine)
-- Dependencies: 013_policy_engine.sql (policies — for policy_check steps)
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE workflow_status AS ENUM (
        'draft', 'active', 'deprecated'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE instance_status AS ENUM (
        'running', 'suspended', 'completed', 'blocked', 'cancelled'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM (
        'pending', 'assigned', 'in_progress', 'completed', 'skipped', 'failed'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- WORKFLOW DEFINITIONS
-- ############################################################################

CREATE TABLE IF NOT EXISTS workflow_definitions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    version         INTEGER NOT NULL DEFAULT 1,
    status          workflow_status NOT NULL DEFAULT 'draft',
    steps           JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_by      UUID REFERENCES auth.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT workflow_definitions_unique_name_version
        UNIQUE (name, version)
);

COMMENT ON TABLE workflow_definitions IS
    'Versioned workflow templates. Steps are stored as JSONB array.';
COMMENT ON COLUMN workflow_definitions.steps IS
    'Array of {id, type, config, assignee_role?, timeout_minutes?}';

-- ############################################################################
-- WORKFLOW INSTANCES
-- ############################################################################

CREATE TABLE IF NOT EXISTS workflow_instances (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    definition_id   UUID NOT NULL REFERENCES workflow_definitions(id),
    status          instance_status NOT NULL DEFAULT 'running',
    context         JSONB NOT NULL DEFAULT '{}'::jsonb,
    current_step_id VARCHAR(255),
    current_step_index INTEGER NOT NULL DEFAULT 0,
    organization_id UUID REFERENCES organizations(id),
    started_by      UUID REFERENCES auth.users(id),
    started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_instances_status
    ON workflow_instances(status);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_definition
    ON workflow_instances(definition_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_org
    ON workflow_instances(organization_id);

-- ############################################################################
-- WORKFLOW TASKS
-- ############################################################################

CREATE TABLE IF NOT EXISTS workflow_tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id     UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
    step_id         VARCHAR(255) NOT NULL,
    step_type       VARCHAR(50) NOT NULL,
    status          task_status NOT NULL DEFAULT 'pending',
    assigned_to     UUID REFERENCES auth.users(id),
    config          JSONB DEFAULT '{}'::jsonb,
    result          JSONB,
    notes           TEXT,
    assigned_at     TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_tasks_instance
    ON workflow_tasks(instance_id);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_assignee
    ON workflow_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_status
    ON workflow_tasks(status);

-- ############################################################################
-- RLS
-- ############################################################################

ALTER TABLE workflow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY workflow_definitions_select ON workflow_definitions
    FOR SELECT USING (true);
CREATE POLICY workflow_definitions_insert ON workflow_definitions
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY workflow_instances_select ON workflow_instances
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
        OR auth.role() = 'service_role'
    );
CREATE POLICY workflow_instances_insert ON workflow_instances
    FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY workflow_instances_update ON workflow_instances
    FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY workflow_tasks_select ON workflow_tasks
    FOR SELECT USING (
        auth.role() = 'service_role'
        OR assigned_to = auth.uid()
    );
CREATE POLICY workflow_tasks_insert ON workflow_tasks
    FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY workflow_tasks_update ON workflow_tasks
    FOR UPDATE USING (auth.role() = 'service_role' OR assigned_to = auth.uid());
