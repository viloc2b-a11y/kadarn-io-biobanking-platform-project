-- ============================================================================
-- KADARN PLATFORM — Sprint 5: Program Engine
-- ============================================================================
-- Target: PostgreSQL 15+ (Supabase compatible)
-- Dependencies: 010_audit_programs.sql (programs, program_participants)
--
-- This migration enhances the Program Engine with:
--   1. program_milestones — track key program milestones
--   2. program_requirements — structured program requirements
--   3. program_activity_log — rich activity feed per program
--   4. Status transition validation
--   5. RLS policies
-- (Blueprint §6 — Program Engine)
-- ============================================================================

-- ############################################################################
-- PART 1: ENUMS
-- ############################################################################

DO $$ BEGIN
    CREATE TYPE milestone_type AS ENUM (
        'program_definition',
        'site_selection',
        'irb_submission',
        'irb_approval',
        'mta_execution',
        'collection_start',
        'collection_complete',
        'processing_start',
        'processing_complete',
        'qc_review',
        'data_delivery',
        'program_close'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE milestone_status AS ENUM (
        'pending', 'in_progress', 'completed', 'blocked', 'cancelled'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- PART 2: TABLE — program_milestones
-- ############################################################################
--
-- Key milestones within a program lifecycle.
-- (Blueprint §6.2 — Program Lifecycle)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.program_milestones (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id          UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,

    -- Milestone identity
    milestone_type      milestone_type NOT NULL,
    title               TEXT NOT NULL,
    description         TEXT,

    -- Dates
    planned_start_date  DATE,
    planned_end_date    DATE,
    actual_start_date   DATE,
    actual_end_date     DATE,

    -- Status
    status              milestone_status NOT NULL DEFAULT 'pending',

    -- Assignment
    assigned_org_id     UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    assigned_to         UUID,  -- auth.users

    -- Metadata
    metadata            JSONB DEFAULT '{}',
    created_by          UUID NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prog_milestones_program
    ON public.program_milestones(program_id);
CREATE INDEX IF NOT EXISTS idx_prog_milestones_status
    ON public.program_milestones(status);
CREATE INDEX IF NOT EXISTS idx_prog_milestones_type
    ON public.program_milestones(milestone_type);

COMMENT ON TABLE public.program_milestones IS
    'Key milestones within a program lifecycle. Tracks planned vs actual dates.';

-- ############################################################################
-- PART 3: TABLE — program_requirements
-- ############################################################################
--
-- Structured requirements for a program.
-- Used by Discovery and Feasibility engines.
-- (Blueprint §6.3 — Program Structure)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.program_requirements (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id          UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,

    -- Sample requirements
    sample_types        TEXT[] DEFAULT '{}',
    total_sample_count  INTEGER,
    storage_conditions  TEXT[],  -- room_temperature, refrigerated, frozen, cryo

    -- Disease focus
    disease_icd10       TEXT,
    disease_label       TEXT,
    therapeutic_areas   TEXT[] DEFAULT '{}',

    -- Geographic scope
    target_countries    TEXT[] DEFAULT '{}',

    -- Clinical data requirements
    clinical_data_needed    TEXT[] DEFAULT '{}',  -- diagnosis, treatment, outcome, imaging, genomics
    min_follow_up_months    INTEGER,

    -- Metadata
    metadata            JSONB DEFAULT '{}',
    created_by          UUID NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (program_id)
);

COMMENT ON TABLE public.program_requirements IS
    'Structured program requirements. One per program.';

-- ############################################################################
-- PART 4: TABLE — program_activity_log
-- ############################################################################
--
-- Rich activity feed per program, complementing the global audit_events.
-- (Blueprint §6 — Program Engine)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.program_activity_log (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id          UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    organization_id     UUID REFERENCES public.organizations(id) ON DELETE SET NULL,

    -- Activity
    action              TEXT NOT NULL,  -- e.g. 'milestone_completed', 'participant_added', 'status_changed'
    description         TEXT,
    actor_id            UUID,
    actor_name          TEXT,

    -- Reference to related entity
    ref_type            TEXT,  -- 'milestone', 'participant', 'document'
    ref_id              UUID,

    -- Metadata
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prog_activity_program
    ON public.program_activity_log(program_id, created_at DESC);

COMMENT ON TABLE public.program_activity_log IS
    'Rich activity feed per program. Complements the global audit_events table.';

-- ############################################################################
-- PART 5: STATUS TRANSITION FUNCTION
-- ############################################################################
--
-- Validates and executes program status transitions.
-- (Blueprint §6.2 — Program Lifecycle)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.transition_program_status(
    p_program_id UUID,
    p_new_status program_status,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_status program_status;
    v_allowed BOOLEAN;
BEGIN
    -- Get current status
    SELECT status INTO v_current_status
    FROM public.programs
    WHERE id = p_program_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Program not found';
    END IF;

    -- Validate transition
    SELECT CASE
        WHEN v_current_status = 'draft' AND p_new_status IN ('active', 'cancelled') THEN true
        WHEN v_current_status = 'active' AND p_new_status IN ('paused', 'completed', 'cancelled') THEN true
        WHEN v_current_status = 'paused' AND p_new_status IN ('active', 'cancelled') THEN true
        WHEN v_current_status = 'completed' AND p_new_status IN ('archived') THEN true
        ELSE false
    END INTO v_allowed;

    IF NOT v_allowed THEN
        RAISE EXCEPTION 'Invalid status transition: % -> %', v_current_status, p_new_status;
    END IF;

    -- Update status
    UPDATE public.programs
    SET status = p_new_status
    WHERE id = p_program_id;

    -- Log activity
    INSERT INTO public.program_activity_log (program_id, action, description, actor_id)
    VALUES (p_program_id, 'status_changed',
            format('Status changed from %s to %s', v_current_status, p_new_status),
            p_user_id);

    RETURN true;
END;
$$;

COMMENT ON FUNCTION public.transition_program_status IS
    'Validates and executes program status transitions per Blueprint §6.2.';

-- ############################################################################
-- PART 6: TRIGGERS
-- ############################################################################

CREATE TRIGGER trg_program_milestones_updated_at
    BEFORE UPDATE ON public.program_milestones
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_program_requirements_updated_at
    BEFORE UPDATE ON public.program_requirements
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ############################################################################
-- PART 7: RLS
-- ############################################################################

ALTER TABLE public.program_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_activity_log ENABLE ROW LEVEL SECURITY;

-- Milestones: visible to program participants
CREATE POLICY program_milestones_select ON public.program_milestones
    FOR SELECT
    USING (
        public.can_access_program(program_id)
        OR public.is_org_admin()
    );

CREATE POLICY program_milestones_insert ON public.program_milestones
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.program_participants pp
            WHERE pp.program_id = program_id
              AND pp.role IN ('sponsor', 'lead')
              AND pp.status = 'active'
              AND public.is_org_admin(pp.organization_id)
        )
    );

CREATE POLICY program_milestones_update ON public.program_milestones
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.program_participants pp
            WHERE pp.program_id = program_id
              AND pp.role IN ('sponsor', 'lead')
              AND pp.status = 'active'
              AND public.is_org_admin(pp.organization_id)
        )
    );

CREATE POLICY program_milestones_delete ON public.program_milestones
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.program_participants pp
            WHERE pp.program_id = program_id
              AND pp.role IN ('sponsor', 'lead')
              AND pp.status = 'active'
              AND public.is_org_admin(pp.organization_id)
        )
    );

-- Requirements: visible to program participants
CREATE POLICY program_requirements_select ON public.program_requirements
    FOR SELECT
    USING (
        public.can_access_program(program_id)
        OR public.is_org_admin()
    );

CREATE POLICY program_requirements_insert ON public.program_requirements
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.program_participants pp
            WHERE pp.program_id = program_id
              AND pp.role IN ('sponsor', 'lead')
              AND pp.status = 'active'
              AND public.is_org_admin(pp.organization_id)
        )
    );

CREATE POLICY program_requirements_update ON public.program_requirements
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.program_participants pp
            WHERE pp.program_id = program_id
              AND pp.role IN ('sponsor', 'lead')
              AND pp.status = 'active'
              AND public.is_org_admin(pp.organization_id)
        )
    );

-- Activity log: visible to program participants
CREATE POLICY program_activity_log_select ON public.program_activity_log
    FOR SELECT
    USING (
        public.can_access_program(program_id)
        OR public.is_org_admin()
    );

CREATE POLICY program_activity_log_insert ON public.program_activity_log
    FOR INSERT
    WITH CHECK (
        public.can_access_program(program_id)
        OR public.is_org_admin()
    );

-- ############################################################################
-- PART 8: POSTGREST PERMISSIONS
-- ############################################################################

GRANT ALL ON public.program_milestones TO anon, authenticated, service_role;
GRANT ALL ON public.program_requirements TO anon, authenticated, service_role;
GRANT ALL ON public.program_activity_log TO anon, authenticated, service_role;

-- ============================================================================
-- END OF MIGRATION 015 — Sprint 5: Program Engine
-- ============================================================================
