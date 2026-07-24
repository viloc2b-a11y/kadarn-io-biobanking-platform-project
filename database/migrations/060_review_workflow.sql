-- ============================================================================
-- KADARN PLATFORM — Review Workflow (Evidence Intelligence vertical slice)
-- ============================================================================
-- Creates the review workflow layer on top of evidence-core.
-- Separates workflow state from entity status.
-- ============================================================================

-- ############################################################################
-- PART 1: ENUMS
-- ############################################################################

DO $$ BEGIN
    CREATE TYPE review_task_type AS ENUM (
        'classification',
        'extraction_review',
        'evidence_review',
        'confidence_review',
        'publication_review',
        'dispute_review'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE review_task_status AS ENUM (
        'pending',
        'in_progress',
        'completed',
        'skipped',
        'cancelled'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE workflow_state AS ENUM (
        'draft',
        'declared',
        'pending_evidence',
        'under_review',
        'published',
        'disputed',
        'archived'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- PART 2: WORKFLOW STATES (per claim — additive to claim.status)
-- ############################################################################

CREATE TABLE IF NOT EXISTS claim_workflow (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id        UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    workflow_state  workflow_state NOT NULL DEFAULT 'draft',
    entered_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    entered_by      UUID,
    reason          TEXT,
    UNIQUE(claim_id, workflow_state)
);

-- Current workflow state (materialized for fast lookup)
ALTER TABLE public.claims ADD COLUMN IF NOT EXISTS workflow_state workflow_state NOT NULL DEFAULT 'draft';

-- ############################################################################
-- PART 3: REVIEW TASKS
-- ############################################################################

CREATE TABLE IF NOT EXISTS review_tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    claim_id        UUID REFERENCES public.claims(id),
    evidence_node_id UUID REFERENCES public.evidence_nodes(id),
    task_type       review_task_type NOT NULL,
    status          review_task_status NOT NULL DEFAULT 'pending',
    assigned_to     UUID,
    assigned_at     TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    completed_by    UUID,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_review_tasks_org_status ON review_tasks(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_review_tasks_claim ON review_tasks(claim_id);

-- ############################################################################
-- PART 4: RLS
-- ############################################################################

ALTER TABLE review_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_workflow ENABLE ROW LEVEL SECURITY;

-- Organization-scoped access
CREATE POLICY review_tasks_org_access ON review_tasks
    USING (organization_id = (auth.jwt() ->> 'organization_id'::text)::UUID);

CREATE POLICY claim_workflow_org_access ON claim_workflow
    USING (claim_id IN (
        SELECT id FROM public.claims WHERE organization_id = (auth.jwt() ->> 'organization_id'::text)::UUID
    ));
