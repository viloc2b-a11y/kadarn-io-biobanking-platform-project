-- ============================================================================
-- KADARN v2 — Sprint 1: Source Record Supersession Extension
-- ============================================================================
-- Authority: KAD-LOOP-CANONICALIZATION-001 | Task KAD-LOOP-C-PKG-B
-- Extends source_records (migration 074) with supersession and invalidation
-- lifecycle support. Forward-only, additive — no DROP, no column mutation.
-- ============================================================================

-- ############################################################################
-- COLUMN: superseded_by — self-referential FK for record version chaining
-- ############################################################################

ALTER TABLE public.source_records
  ADD COLUMN IF NOT EXISTS superseded_by UUID
  REFERENCES public.source_records(id) ON DELETE SET NULL;

-- ############################################################################
-- COLUMN: supersession_reason — human/machine-readable reason
-- ############################################################################

ALTER TABLE public.source_records
  ADD COLUMN IF NOT EXISTS supersession_reason TEXT;

-- ############################################################################
-- COLUMN: invalidation_status — record-level lifecycle marker
-- ############################################################################

DO $$ BEGIN
  ALTER TABLE public.source_records
    ADD COLUMN IF NOT EXISTS invalidation_status TEXT DEFAULT 'active';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add CHECK constraint only if it doesn't already exist
DO $$ BEGIN
  ALTER TABLE public.source_records
    ADD CONSTRAINT chk_source_records_invalidation_status
    CHECK (invalidation_status IN ('active', 'superseded', 'invalidated'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- INDEXES
-- ############################################################################

CREATE INDEX IF NOT EXISTS idx_source_records_superseded_by
  ON public.source_records(superseded_by);

CREATE INDEX IF NOT EXISTS idx_source_records_invalidation
  ON public.source_records(invalidation_status);

-- ############################################################################
-- COMMENTS
-- ############################################################################

COMMENT ON COLUMN public.source_records.superseded_by
  IS 'References the source record that supersedes this one. NULL if active.';

COMMENT ON COLUMN public.source_records.supersession_reason
  IS 'Human or machine-readable reason for supersession.';

COMMENT ON COLUMN public.source_records.invalidation_status
  IS 'Lifecycle: active, superseded, invalidated.';
