-- ============================================================================
-- KADARN PLATFORM — Sprint 8 Workflow Runtime
-- ============================================================================
-- ADR-022: timer support + seed exchange-request definition for Engine 2.0
-- ============================================================================

ALTER TABLE workflow_instances
    ADD COLUMN IF NOT EXISTS next_wake_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_workflow_instances_next_wake
    ON workflow_instances(next_wake_at)
    WHERE next_wake_at IS NOT NULL AND status IN ('running', 'suspended');

COMMENT ON COLUMN workflow_instances.next_wake_at IS
    'When a wait step timer fires; scanned by workflow timer worker.';

INSERT INTO workflow_definitions (id, name, description, version, status, steps, metadata)
VALUES (
    '00000000-0000-4000-8000-000000000001',
    'exchange-request',
    'Research access request lifecycle (ADR-022 reference definition)',
    1,
    'active',
    '[
      {"id":"receive_submission","type":"auto_action","label":"Receive submission"},
      {"id":"notify_reviewer","type":"auto_action","label":"Notify reviewer"},
      {"id":"wait_review","type":"human_task","label":"Await reviewer","timeoutMinutes":10080},
      {"id":"assess_review","type":"policy_check","label":"Assess review","policyRefs":["exchange.review"]},
      {"id":"notify_negotiation","type":"auto_action","label":"Notify negotiation"},
      {"id":"wait_mta","type":"human_task","label":"Await MTA","timeoutMinutes":20160},
      {"id":"assess_mta","type":"auto_action","label":"Assess MTA"},
      {"id":"finalize","type":"auto_action","label":"Finalize"}
    ]'::jsonb,
    '{"source":"038_workflow_runtime","runtime":"engine-2.0"}'::jsonb
)
ON CONFLICT (name, version) DO UPDATE SET
    status = EXCLUDED.status,
    steps = EXCLUDED.steps,
    metadata = EXCLUDED.metadata,
    updated_at = now();
