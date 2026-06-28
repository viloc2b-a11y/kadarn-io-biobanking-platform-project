-- ============================================================================
-- KADARN PLATFORM — Sprint 7: Processing Engine
-- ============================================================================
-- Target: PostgreSQL 15+ (Supabase compatible)
-- Dependencies: 008, 009, 010 (programs), 013 (supply_items)
--
-- This migration creates the Processing Engine:
--   1. processing_samples — sample lifecycle state machine
--   2. processing_aliquots — aliquot management (Sample → Aliquot)
--   3. processing_workflows — configurable workflow definitions
--   4. processing_workflow_steps — steps within workflows
--   5. quality_control_results — QC parameter tracking
--   6. storage_locations — physical location model
--   7. instrument_runs — minimal run recording
--   8. sample_movements — chain of custody
--   9. RLS policies
-- (Blueprint §12 — Kadarn Processing Engine)
-- ============================================================================

-- ############################################################################
-- PART 1: ENUMS
-- ############################################################################

DO $$ BEGIN
    CREATE TYPE sample_state AS ENUM (
        'collected', 'received', 'accepted', 'processing', 'processed',
        'qc_pending', 'qc_approved', 'qc_rejected',
        'stored', 'reserved', 'shipped', 'consumed', 'archived'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE qc_decision AS ENUM ('pass', 'fail', 'borderline');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- PART 2: TABLE — processing_samples
-- ############################################################################
--
-- A sample within a Kadarn program. Follows the lifecycle state machine.
-- (Blueprint §12.2 — Sample Lifecycle, §12.4 — Aliquot Management)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.processing_samples (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id          UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Identity
    sample_id           TEXT NOT NULL,                -- human-readable ID within program
    barcode             TEXT,                         -- physical barcode/QR
    sample_type         TEXT NOT NULL,                -- serum, plasma, pbmc, dna, rna, ffpe, tissue, etc.
    parent_sample_id    UUID REFERENCES public.processing_samples(id) ON DELETE SET NULL, -- for derived samples

    -- Lifecycle
    current_state       sample_state NOT NULL DEFAULT 'collected',
    state_changed_at    TIMESTAMPTZ,
    state_changed_by    UUID,

    -- Collection
    collection_date     DATE,
    collected_by        TEXT,
    collection_site     TEXT,
    container_type      TEXT,                         -- tube, vial, slide, block, etc.
    initial_quantity    NUMERIC(10,2),
    quantity_unit       TEXT,                         -- ml, mg, µg, etc.

    -- Program linkage
    program_requirement_id UUID,

    -- Audit
    metadata            JSONB DEFAULT '{}',
    created_by          UUID NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (program_id, sample_id)
);

CREATE INDEX IF NOT EXISTS idx_proc_samples_program ON public.processing_samples(program_id);
CREATE INDEX IF NOT EXISTS idx_proc_samples_org ON public.processing_samples(organization_id);
CREATE INDEX IF NOT EXISTS idx_proc_samples_state ON public.processing_samples(current_state);
CREATE INDEX IF NOT EXISTS idx_proc_samples_type ON public.processing_samples(sample_type);
CREATE INDEX IF NOT EXISTS idx_proc_samples_parent ON public.processing_samples(parent_sample_id);

COMMENT ON TABLE public.processing_samples IS
    'Samples within Kadarn programs. Each follows the lifecycle state machine from collected to archived.';

-- ############################################################################
-- PART 3: TABLE — processing_aliquots
-- ############################################################################
--
-- Child aliquots derived from a parent sample.
-- (Blueprint §12.4 — Aliquot Management)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.processing_aliquots (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id           UUID NOT NULL REFERENCES public.processing_samples(id) ON DELETE CASCADE,
    program_id          UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,

    -- Identity
    aliquot_id          TEXT NOT NULL,                -- human-readable ID
    barcode             TEXT,

    -- Quantity
    quantity            NUMERIC(10,2),
    quantity_unit       TEXT,
    concentration       NUMERIC(10,4),
    concentration_unit  TEXT,

    -- Lifecycle (inherits from sample initially, tracks independently)
    current_state       sample_state NOT NULL DEFAULT 'stored',
    state_changed_at    TIMESTAMPTZ,
    state_changed_by    UUID,

    -- Storage
    storage_location_id UUID,
    storage_condition   TEXT,                         -- room_temp, refrigerated, frozen_minus_20, frozen_minus_80, ln2

    -- QC status
    qc_status           TEXT DEFAULT 'pending' CHECK (qc_status IN ('pending', 'pass', 'fail', 'borderline')),

    -- Audit
    metadata            JSONB DEFAULT '{}',
    created_by          UUID NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (program_id, aliquot_id)
);

CREATE INDEX IF NOT EXISTS idx_proc_aliq_sample ON public.processing_aliquots(sample_id);
CREATE INDEX IF NOT EXISTS idx_proc_aliq_program ON public.processing_aliquots(program_id);
CREATE INDEX IF NOT EXISTS idx_proc_aliq_state ON public.processing_aliquots(current_state);
CREATE INDEX IF NOT EXISTS idx_proc_aliq_qc ON public.processing_aliquots(qc_status);

COMMENT ON TABLE public.processing_aliquots IS
    'Child aliquots derived from parent samples. Each aliquot can have an independent lifecycle.';

-- ############################################################################
-- PART 4: TABLE — processing_workflows
-- ############################################################################
--
-- Configurable workflow definitions by sample type.
-- (Blueprint §12.3 — Processing Workflows)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.processing_workflows (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                TEXT NOT NULL,
    sample_type         TEXT NOT NULL,                -- serum, plasma, pbmc, dna, rna, ffpe, etc.
    description         TEXT,
    version             INTEGER NOT NULL DEFAULT 1,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    metadata            JSONB DEFAULT '{}',
    created_by          UUID NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (sample_type, version)
);

CREATE INDEX IF NOT EXISTS idx_proc_workflows_type ON public.processing_workflows(sample_type);

COMMENT ON TABLE public.processing_workflows IS
    'Configurable processing workflow definitions by sample type.';

-- ############################################################################
-- PART 5: TABLE — processing_workflow_steps
-- ############################################################################
--
-- Individual steps within a workflow.
-- (Blueprint §12.3 — Processing Workflows)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.processing_workflow_steps (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id         UUID NOT NULL REFERENCES public.processing_workflows(id) ON DELETE CASCADE,

    step_order          INTEGER NOT NULL,
    step_name           TEXT NOT NULL,                -- centrifugation, aliquoting, extraction, etc.
    description         TEXT,
    expected_duration_minutes INTEGER,
    required_equipment  TEXT[] DEFAULT '{}',
    required_sop        TEXT,                         -- SOP reference
    qc_required         BOOLEAN NOT NULL DEFAULT false,
    metadata            JSONB DEFAULT '{}',

    UNIQUE (workflow_id, step_order)
);

CREATE INDEX IF NOT EXISTS idx_proc_wf_steps_workflow ON public.processing_workflow_steps(workflow_id);

COMMENT ON TABLE public.processing_workflow_steps IS
    'Individual steps within a processing workflow. Ordered by step_order.';

-- ############################################################################
-- PART 6: TABLE — quality_control_results
-- ############################################################################
--
-- QC parameter tracking for samples and aliquots.
-- (Blueprint §12.5 — Quality Control)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.quality_control_results (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id           UUID REFERENCES public.processing_samples(id) ON DELETE CASCADE,
    aliquot_id          UUID REFERENCES public.processing_aliquots(id) ON DELETE CASCADE,

    -- QC parameters (Blueprint §12.5)
    parameter           TEXT NOT NULL,                -- yield, concentration, purity_260_280, purity_260_230, rin, viability, hemolysis
    value               NUMERIC(15,4),
    unit                TEXT,
    decision            qc_decision,
    operator            TEXT,
    instrument_used     TEXT,
    sop_reference       TEXT,
    notes               TEXT,
    performed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          UUID NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CHECK (sample_id IS NOT NULL OR aliquot_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_qc_sample ON public.quality_control_results(sample_id);
CREATE INDEX IF NOT EXISTS idx_qc_aliquot ON public.quality_control_results(aliquot_id);
CREATE INDEX IF NOT EXISTS idx_qc_parameter ON public.quality_control_results(parameter);

COMMENT ON TABLE public.quality_control_results IS
    'QC parameter results for samples and aliquots. Supports yield, concentration, purity, RIN, viability, hemolysis.';

-- ############################################################################
-- PART 7: TABLE — storage_locations
-- ############################################################################
--
-- Simplified physical location model for tracking aliquot positions.
-- (Blueprint §12.6 — Storage Management)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.storage_locations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    location_type       TEXT NOT NULL CHECK (location_type IN ('facility', 'room', 'freezer', 'rack', 'shelf', 'box', 'position')),

    -- Parent location in hierarchy
    parent_location_id  UUID REFERENCES public.storage_locations(id) ON DELETE CASCADE,

    -- Details
    description         TEXT,
    barcode             TEXT,
    temperature_celsius NUMERIC(5,1),
    capacity            INTEGER,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    metadata            JSONB DEFAULT '{}',
    created_by          UUID NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (organization_id, name, location_type)
);

CREATE INDEX IF NOT EXISTS idx_storage_org ON public.storage_locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_storage_parent ON public.storage_locations(parent_location_id);
CREATE INDEX IF NOT EXISTS idx_storage_type ON public.storage_locations(location_type);

COMMENT ON TABLE public.storage_locations IS
    'Physical storage locations. Hierarchy: facility → room → freezer → rack → shelf → box → position.';

-- ############################################################################
-- PART 8: TABLE — instrument_runs
-- ############################################################################
--
-- Minimal instrument run recording.
-- (Blueprint §12.8 — Instrument Runs)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.instrument_runs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id          UUID REFERENCES public.programs(id) ON DELETE SET NULL,
    organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    instrument          TEXT NOT NULL,                -- instrument name or ID
    operator            TEXT NOT NULL,                -- person who ran it
    run_id              TEXT,                         -- instrument run identifier
    sop_reference       TEXT,                         -- SOP followed
    run_date            DATE NOT NULL DEFAULT CURRENT_DATE,
    notes               TEXT,
    metadata            JSONB DEFAULT '{}',
    created_by          UUID NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_instr_runs_program ON public.instrument_runs(program_id);
CREATE INDEX IF NOT EXISTS idx_instr_runs_org ON public.instrument_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_instr_runs_instrument ON public.instrument_runs(instrument);

COMMENT ON TABLE public.instrument_runs IS
    'Minimal instrument run recording. Does NOT control instruments or store raw data.';

-- ############################################################################
-- PART 9: TABLE — sample_movements
-- ############################################################################
--
-- Chain of custody for sample movements.
-- (Blueprint §12.7 — Chain of Custody)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sample_movements (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id           UUID REFERENCES public.processing_samples(id) ON DELETE CASCADE,
    aliquot_id          UUID REFERENCES public.processing_aliquots(id) ON DELETE CASCADE,

    program_id          UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Movement details
    action              TEXT NOT NULL,                -- received, processed, transferred, shipped, consumed, archived
    from_location_id    UUID REFERENCES public.storage_locations(id) ON DELETE SET NULL,
    to_location_id      UUID REFERENCES public.storage_locations(id) ON DELETE SET NULL,

    -- Who
    performed_by        UUID,
    performed_by_name   TEXT,

    -- Environmental
    temperature_celsius NUMERIC(5,1),
    notes               TEXT,

    -- Chain of custody
    custody_from        TEXT,                         -- organization/person transferring custody
    custody_to          TEXT,                         -- organization/person receiving custody

    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CHECK (sample_id IS NOT NULL OR aliquot_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_sample_mov_sample ON public.sample_movements(sample_id);
CREATE INDEX IF NOT EXISTS idx_sample_mov_aliquot ON public.sample_movements(aliquot_id);
CREATE INDEX IF NOT EXISTS idx_sample_mov_program ON public.sample_movements(program_id);
CREATE INDEX IF NOT EXISTS idx_sample_mov_created ON public.sample_movements(created_at DESC);

COMMENT ON TABLE public.sample_movements IS
    'Chain of custody records for sample and aliquot movements. Complements the audit trail.';

-- ############################################################################
-- PART 10: TRIGGERS
-- ############################################################################

CREATE TRIGGER trg_processing_samples_updated_at
    BEFORE UPDATE ON public.processing_samples
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_processing_aliquots_updated_at
    BEFORE UPDATE ON public.processing_aliquots
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_processing_workflows_updated_at
    BEFORE UPDATE ON public.processing_workflows
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ############################################################################
-- PART 11: SAMPLE STATE TRANSITION HELPER
-- ############################################################################

CREATE OR REPLACE FUNCTION public.transition_sample_state(
    p_sample_id UUID,
    p_new_state sample_state,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current sample_state;
    v_new_ord INTEGER;
    v_cur_ord INTEGER;
BEGIN
    SELECT current_state INTO v_current FROM public.processing_samples WHERE id = p_sample_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Sample not found'; END IF;

    SELECT ord INTO v_new_ord FROM (VALUES
        ('collected'::sample_state, 1), ('received'::sample_state, 2), ('accepted'::sample_state, 3),
        ('processing'::sample_state, 4), ('processed'::sample_state, 5), ('qc_pending'::sample_state, 6),
        ('qc_approved'::sample_state, 7), ('qc_rejected'::sample_state, 7),
        ('stored'::sample_state, 8), ('reserved'::sample_state, 9),
        ('shipped'::sample_state, 10), ('consumed'::sample_state, 11), ('archived'::sample_state, 12)
    ) AS t(s, ord) WHERE s = p_new_state;

    SELECT ord INTO v_cur_ord FROM (VALUES
        ('collected'::sample_state, 1), ('received'::sample_state, 2), ('accepted'::sample_state, 3),
        ('processing'::sample_state, 4), ('processed'::sample_state, 5), ('qc_pending'::sample_state, 6),
        ('qc_approved'::sample_state, 7), ('qc_rejected'::sample_state, 7),
        ('stored'::sample_state, 8), ('reserved'::sample_state, 9),
        ('shipped'::sample_state, 10), ('consumed'::sample_state, 11), ('archived'::sample_state, 12)
    ) AS t(s, ord) WHERE s = v_current;

    IF v_new_ord IS NULL OR v_cur_ord IS NULL THEN
        RAISE EXCEPTION 'Unknown sample state: new="%" current="%"', p_new_state, v_current;
    END IF;

    -- Must move forward in lifecycle, unless special case
    IF v_new_ord <= v_cur_ord THEN
        -- Allow QC rejected -> qc_pending (retest)
        IF NOT (v_current = 'qc_rejected' AND p_new_state = 'qc_pending') THEN
            RAISE EXCEPTION 'Invalid sample state transition: % -> %', v_current, p_new_state;
        END IF;
    END IF;

    UPDATE public.processing_samples
    SET current_state = p_new_state, state_changed_at = now(), state_changed_by = p_user_id
    WHERE id = p_sample_id;

    RETURN true;
END;
$$;

COMMENT ON FUNCTION public.transition_sample_state IS
    'Validates and executes sample state transitions per Blueprint §12.2.';

-- ############################################################################
-- PART 12: RLS
-- ############################################################################

ALTER TABLE public.processing_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_aliquots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_control_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instrument_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sample_movements ENABLE ROW LEVEL SECURITY;

-- Processing Samples: program participants can view; org_admin of owning org can manage
CREATE POLICY processing_samples_select ON public.processing_samples
    FOR SELECT
    USING (public.can_access_program(program_id) OR public.is_org_admin(organization_id));
CREATE POLICY processing_samples_insert ON public.processing_samples
    FOR INSERT
    WITH CHECK (public.is_org_admin(organization_id));
CREATE POLICY processing_samples_update ON public.processing_samples
    FOR UPDATE
    USING (public.is_org_admin(organization_id));
CREATE POLICY processing_samples_delete ON public.processing_samples
    FOR DELETE
    USING (public.is_org_admin(organization_id));

-- Same pattern for aliquots
CREATE POLICY processing_aliquots_select ON public.processing_aliquots
    FOR SELECT
    USING (public.can_access_program(program_id) OR public.is_org_admin());
CREATE POLICY processing_aliquots_insert ON public.processing_aliquots
    FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.processing_samples s WHERE s.id = processing_aliquots.sample_id AND public.is_org_admin(s.organization_id)));
CREATE POLICY processing_aliquots_update ON public.processing_aliquots
    FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.processing_samples s WHERE s.id = processing_aliquots.sample_id AND public.is_org_admin(s.organization_id)));

-- Workflows: read for all authenticated, manage for org_admin
CREATE POLICY processing_workflows_select ON public.processing_workflows
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY processing_workflows_insert ON public.processing_workflows
    FOR INSERT WITH CHECK (public.is_org_admin());

-- QC: program participants
CREATE POLICY qc_results_select ON public.quality_control_results
    FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.processing_samples s WHERE s.id = quality_control_results.sample_id AND public.can_access_program(s.program_id)));
CREATE POLICY qc_results_insert ON public.quality_control_results
    FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.processing_samples s WHERE s.id = quality_control_results.sample_id AND public.is_org_admin(s.organization_id)));

-- Storage: org_admin manages own org locations
CREATE POLICY storage_locations_select ON public.storage_locations
    FOR SELECT USING (public.is_org_member(organization_id) OR public.is_org_admin());
CREATE POLICY storage_locations_insert ON public.storage_locations
    FOR INSERT WITH CHECK (public.is_org_admin(organization_id));

-- Instrument runs: program visibility
CREATE POLICY instrument_runs_select ON public.instrument_runs
    FOR SELECT
    USING (public.can_access_program(program_id) OR public.is_org_admin(organization_id));
CREATE POLICY instrument_runs_insert ON public.instrument_runs
    FOR INSERT WITH CHECK (public.is_org_admin(organization_id));

-- Movements: program visibility
CREATE POLICY sample_movements_select ON public.sample_movements
    FOR SELECT
    USING (public.can_access_program(program_id) OR public.is_org_admin(organization_id));
CREATE POLICY sample_movements_insert ON public.sample_movements
    FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.processing_samples s WHERE s.id = sample_movements.sample_id AND public.is_org_admin(s.organization_id)));

-- ############################################################################
-- PART 13: POSTGREST PERMISSIONS
-- ############################################################################

GRANT ALL ON public.processing_samples TO anon, authenticated, service_role;
GRANT ALL ON public.processing_aliquots TO anon, authenticated, service_role;
GRANT ALL ON public.processing_workflows TO anon, authenticated, service_role;
GRANT ALL ON public.processing_workflow_steps TO anon, authenticated, service_role;
GRANT ALL ON public.quality_control_results TO anon, authenticated, service_role;
GRANT ALL ON public.storage_locations TO anon, authenticated, service_role;
GRANT ALL ON public.instrument_runs TO anon, authenticated, service_role;
GRANT ALL ON public.sample_movements TO anon, authenticated, service_role;

-- ============================================================================
-- END OF MIGRATION 017 — Sprint 7: Processing Engine
-- ============================================================================
