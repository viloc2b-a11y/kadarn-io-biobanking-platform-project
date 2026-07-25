-- ============================================================================
-- KAD-006 — Review Workflow
-- ============================================================================
-- Ensures review_tasks table has all canonical columns needed for review lifecycle.
-- Existing table preserved; new columns added where missing.
-- ============================================================================

ALTER TABLE IF EXISTS public.review_tasks
  ADD COLUMN IF NOT EXISTS evidence_id UUID REFERENCES public.evidence_nodes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS decision TEXT,
  ADD COLUMN IF NOT EXISTS reviewer_notes TEXT,
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_review_tasks_reviewer ON public.review_tasks(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_review_tasks_status ON public.review_tasks(status);
