-- ============================================================================
-- KADARN PLATFORM — Sprint 9: Regulatory Engine
-- ============================================================================
-- Target: PostgreSQL 15+ (Supabase compatible)
-- Dependencies: 008, 009, 010 (programs)
--
-- This migration creates the Regulatory Engine:
--   1. regulatory_protocols — master protocol library
--   2. regulatory_icf_templates — informed consent form templates
--   3. regulatory_sops — standard operating procedures
--   4. regulatory_submissions — IRB/ethics submission tracking
--   5. regulatory_documents — secure document exchange
--   6. regulatory_document_access — document access control
--   7. RLS policies
-- (Blueprint §11 — Regulatory Engine)
-- ============================================================================

-- ############################################################################
-- PART 1: ENUMS
-- ############################################################################

DO $$ BEGIN
    CREATE TYPE submission_status AS ENUM (
        'draft', 'preparing', 'submitted', 'under_review',
        'revisions_requested', 'approved', 'exempt', 'rejected', 'withdrawn'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE document_category AS ENUM (
        'protocol', 'icf', 'sop', 'regulatory_approval', 'contract',
        'insurance', 'investigator_cv', 'financial_disclosure',
        'device_documentation', 'lab_certification', 'other'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- PART 2: TABLE — regulatory_protocols
-- ############################################################################
--
-- Reusable master protocol library.
-- (Blueprint §11.2 — Protocol Library)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.regulatory_protocols (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Protocol identity
    protocol_id         TEXT NOT NULL,  -- e.g. 'KAD-PRO-001'
    title               TEXT NOT NULL,
    version             TEXT NOT NULL DEFAULT '1.0',
    description         TEXT,
    short_name          TEXT,

    -- Classification
    therapeutic_area    TEXT[] DEFAULT '{}',
    sample_types        TEXT[] DEFAULT '{}',
    phase               TEXT,  -- I, II, III, IV, OBS, etc.
    study_type          TEXT,  -- retrospective, prospective, longitudinal, etc.

    -- Content (stored as markdown or document reference)
    document_url        TEXT,
    content_markdown    TEXT,

    -- Status
    is_active           BOOLEAN NOT NULL DEFAULT true,
    is_template         BOOLEAN NOT NULL DEFAULT false,  -- reusable template
    approval_status     TEXT DEFAULT 'draft' CHECK (approval_status IN ('draft', 'under_review', 'approved', 'superseded')),

    -- Versioning
    superseded_by       UUID REFERENCES public.regulatory_protocols(id) ON DELETE SET NULL,

    -- Metadata
    metadata            JSONB DEFAULT '{}',
    created_by          UUID NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (organization_id, protocol_id)
);

CREATE INDEX IF NOT EXISTS idx_reg_protocols_org ON public.regulatory_protocols(organization_id);
CREATE INDEX IF NOT EXISTS idx_reg_protocols_area ON public.regulatory_protocols USING GIN(therapeutic_area);
CREATE INDEX IF NOT EXISTS idx_reg_protocols_active ON public.regulatory_protocols(is_active);

COMMENT ON TABLE public.regulatory_protocols IS
    'Master protocol library. Reusable templates for biospecimen programs. Key compounding asset (Blueprint §11.3).';

-- ############################################################################
-- PART 3: TABLE — regulatory_icf_templates
-- ############################################################################
--
-- Informed Consent Form templates by region and study type.
-- (Blueprint §11.2 — ICF Templates)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.regulatory_icf_templates (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    template_id         TEXT NOT NULL,  -- e.g. 'ICF-TPL-001'
    title               TEXT NOT NULL,
    version             TEXT NOT NULL DEFAULT '1.0',
    description         TEXT,
    region              TEXT,  -- US, EU, LATAM, APAC, etc.
    language            TEXT DEFAULT 'en',

    -- Content
    document_url        TEXT,
    content_markdown    TEXT,

    -- Applicability
    study_types         TEXT[] DEFAULT '{}',
    sample_types        TEXT[] DEFAULT '{}',
    requires_signature  BOOLEAN NOT NULL DEFAULT true,
    requires_witness    BOOLEAN NOT NULL DEFAULT false,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    is_template         BOOLEAN NOT NULL DEFAULT true,

    -- Metadata
    metadata            JSONB DEFAULT '{}',
    created_by          UUID NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (organization_id, template_id)
);

CREATE INDEX IF NOT EXISTS idx_reg_icf_org ON public.regulatory_icf_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_reg_icf_region ON public.regulatory_icf_templates(region);

COMMENT ON TABLE public.regulatory_icf_templates IS
    'Informed Consent Form templates. Reusable by region and study type.';

-- ############################################################################
-- PART 4: TABLE — regulatory_sops
-- ############################################################################
--
-- Standard Operating Procedures for collection, processing, and shipping.
-- (Blueprint §11.2 — SOP Library)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.regulatory_sops (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    sop_id              TEXT NOT NULL,  -- e.g. 'SOP-COL-001'
    title               TEXT NOT NULL,
    version             TEXT NOT NULL DEFAULT '1.0',
    description         TEXT,
    category            TEXT NOT NULL CHECK (category IN ('collection', 'processing', 'shipping', 'qc', 'data_management', 'general')),
    document_url        TEXT,
    content_markdown    TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    effective_date      DATE,
    review_date         DATE,  -- next required review

    -- Metadata
    metadata            JSONB DEFAULT '{}',
    created_by          UUID NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (organization_id, sop_id)
);

CREATE INDEX IF NOT EXISTS idx_reg_sops_org ON public.regulatory_sops(organization_id);
CREATE INDEX IF NOT EXISTS idx_reg_sops_category ON public.regulatory_sops(category);

COMMENT ON TABLE public.regulatory_sops IS
    'Standard Operating Procedures for biospecimen handling.';

-- ############################################################################
-- PART 5: TABLE — regulatory_submissions
-- ############################################################################
--
-- IRB/ethics submission tracking across sites and programs.
-- (Blueprint §11.2 — Submission Tracker)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.regulatory_submissions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id          UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    site_org_id         UUID REFERENCES public.organizations(id) ON DELETE SET NULL,

    -- Submission
    submission_type     TEXT NOT NULL CHECK (submission_type IN ('initial', 'amendment', 'continuing_review', 'protocol_deviation', 'adverse_event', 'closure')),
    status              submission_status NOT NULL DEFAULT 'draft',

    -- IRB details
    irb_name            TEXT,
    irb_number          TEXT,  -- assigned IRB number
    irb_contact         TEXT,

    -- Protocol reference
    protocol_id         UUID REFERENCES public.regulatory_protocols(id) ON DELETE SET NULL,

    -- Dates
    submitted_at        TIMESTAMPTZ,
    decision_at         TIMESTAMPTZ,
    expiration_at       DATE,
    last_review_at      TIMESTAMPTZ,

    -- Documents
    submission_doc_url  TEXT,
    approval_letter_url TEXT,

    -- Notes
    notes               TEXT,
    metadata            JSONB DEFAULT '{}',

    created_by          UUID NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reg_sub_program ON public.regulatory_submissions(program_id);
CREATE INDEX IF NOT EXISTS idx_reg_sub_org ON public.regulatory_submissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_reg_sub_status ON public.regulatory_submissions(status);
CREATE INDEX IF NOT EXISTS idx_reg_sub_irb ON public.regulatory_submissions(irb_name);

COMMENT ON TABLE public.regulatory_submissions IS
    'IRB/ethics submission tracking. Tracks status across sites and programs.';

-- ############################################################################
-- PART 6: TABLE — regulatory_documents
-- ############################################################################
--
-- Secure document exchange with access control.
-- (Blueprint §11.2 — Document Exchange)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.regulatory_documents (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id          UUID REFERENCES public.programs(id) ON DELETE CASCADE,
    organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    document_category   document_category NOT NULL,
    title               TEXT NOT NULL,
    description         TEXT,
    file_name           TEXT,
    file_url            TEXT,
    file_size           BIGINT,
    mime_type           TEXT,

    -- Version tracking
    version             TEXT DEFAULT '1.0',
    supersedes          UUID REFERENCES public.regulatory_documents(id) ON DELETE SET NULL,

    -- Status
    is_confidential     BOOLEAN NOT NULL DEFAULT true,
    requires_nda        BOOLEAN NOT NULL DEFAULT false,
    is_active           BOOLEAN NOT NULL DEFAULT true,

    -- Audit
    metadata            JSONB DEFAULT '{}',
    uploaded_by         UUID NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reg_docs_program ON public.regulatory_documents(program_id);
CREATE INDEX IF NOT EXISTS idx_reg_docs_org ON public.regulatory_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_reg_docs_category ON public.regulatory_documents(document_category);

COMMENT ON TABLE public.regulatory_documents IS
    'Secure document exchange. Supports versioning and confidentiality controls.';

-- ############################################################################
-- PART 7: TABLE — regulatory_document_access
-- ############################################################################
--
-- Document access control for confidential documents.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.regulatory_document_access (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id         UUID NOT NULL REFERENCES public.regulatory_documents(id) ON DELETE CASCADE,
    organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    granted_by          UUID NOT NULL,
    granted_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at          TIMESTAMPTZ,
    is_active           BOOLEAN NOT NULL DEFAULT true,

    UNIQUE (document_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_reg_doc_access_doc ON public.regulatory_document_access(document_id);
CREATE INDEX IF NOT EXISTS idx_reg_doc_access_org ON public.regulatory_document_access(organization_id);

COMMENT ON TABLE public.regulatory_document_access IS
    'Document access control. Tracks which organizations can access confidential documents.';

-- ############################################################################
-- PART 8: TRIGGERS
-- ############################################################################

CREATE TRIGGER trg_regulatory_protocols_updated_at
    BEFORE UPDATE ON public.regulatory_protocols
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_regulatory_icf_templates_updated_at
    BEFORE UPDATE ON public.regulatory_icf_templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_regulatory_sops_updated_at
    BEFORE UPDATE ON public.regulatory_sops
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_regulatory_submissions_updated_at
    BEFORE UPDATE ON public.regulatory_submissions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_regulatory_documents_updated_at
    BEFORE UPDATE ON public.regulatory_documents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ############################################################################
-- PART 9: RLS
-- ############################################################################

ALTER TABLE public.regulatory_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_icf_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_document_access ENABLE ROW LEVEL SECURITY;

-- Protocols: all authenticated can read templates, org_admin manages own
CREATE POLICY regulatory_protocols_select ON public.regulatory_protocols
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY regulatory_protocols_insert ON public.regulatory_protocols
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND public.is_org_admin(organization_id));
CREATE POLICY regulatory_protocols_update ON public.regulatory_protocols
    FOR UPDATE USING (public.is_org_admin(organization_id));
CREATE POLICY regulatory_protocols_delete ON public.regulatory_protocols
    FOR DELETE USING (public.is_org_admin(organization_id));

-- ICF templates: same pattern
CREATE POLICY regulatory_icf_select ON public.regulatory_icf_templates
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY regulatory_icf_insert ON public.regulatory_icf_templates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND public.is_org_admin(organization_id));

-- SOPs: same pattern
CREATE POLICY regulatory_sops_select ON public.regulatory_sops
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY regulatory_sops_insert ON public.regulatory_sops
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND public.is_org_admin(organization_id));

-- Submissions: program participants
CREATE POLICY regulatory_submissions_select ON public.regulatory_submissions
    FOR SELECT USING (public.can_access_program(program_id) OR public.is_org_admin(organization_id));
CREATE POLICY regulatory_submissions_insert ON public.regulatory_submissions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY regulatory_submissions_update ON public.regulatory_submissions
    FOR UPDATE USING (public.is_org_admin(organization_id));

-- Documents: program participants or org_admin
CREATE POLICY regulatory_documents_select ON public.regulatory_documents
    FOR SELECT
    USING (
        public.can_access_program(program_id)
        OR public.is_org_admin(organization_id)
        OR EXISTS (SELECT 1 FROM public.regulatory_document_access da WHERE da.document_id = id AND public.is_org_member(da.organization_id))
    );
CREATE POLICY regulatory_documents_insert ON public.regulatory_documents
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Document access: org_admin can grant access
CREATE POLICY regulatory_doc_access_select ON public.regulatory_document_access
    FOR SELECT
    USING (public.is_org_member(organization_id) OR public.is_org_admin());
CREATE POLICY regulatory_doc_access_insert ON public.regulatory_document_access
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ############################################################################
-- PART 10: POSTGREST PERMISSIONS
-- ############################################################################

GRANT ALL ON public.regulatory_protocols TO anon, authenticated, service_role;
GRANT ALL ON public.regulatory_icf_templates TO anon, authenticated, service_role;
GRANT ALL ON public.regulatory_sops TO anon, authenticated, service_role;
GRANT ALL ON public.regulatory_submissions TO anon, authenticated, service_role;
GRANT ALL ON public.regulatory_documents TO anon, authenticated, service_role;
GRANT ALL ON public.regulatory_document_access TO anon, authenticated, service_role;

-- ============================================================================
-- END OF MIGRATION 019 — Sprint 9: Regulatory Engine
-- ============================================================================
