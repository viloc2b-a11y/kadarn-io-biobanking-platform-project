-- ============================================================================
-- KADARN v2 — Capability Activation + Document Taxonomy (feat/kems-site-profile-production)
-- ============================================================================
-- Migration: 098
-- Authority: KEMS Site Profile Production, WO-KEMS-DOC-003 Classification Matrix
-- Forward-only, additive. No historical migrations modified.
--
-- Creates:
--   1. capability_instances      — Activated capabilities bound to a profile/entity
--   2. capability_claim_links    — M2M dependencies between capability instances and claims
--   3. capability_dependency_status — Resolved status of each claim dependency
--   4. capability_activation_events  — Immutable audit log of state transitions
--   5. document_taxonomy_rules   — Controlled vocabulary for document classification
--      with 48 seed rows (34 reusable + 14 other destination types)
--
-- Dependencies:
--   - public.site_profiles (migration 096)
--   - public.capabilities (migration 065)
--   - public.claims (migration 094)
--   - public.organizations (migration 008)
--   - public.trigger_set_updated_at() (migration 062)
-- ============================================================================

-- ############################################################################
-- PART 1: ENUM — capability_activation_state
-- ############################################################################
-- Lifecycle states for an activated capability instance:
--   DECLARED        — institution has asserted this capability
--   DOCUMENTING     — evidence collection / documentation in progress
--   DOCUMENTED      — evidence has been submitted and linked
--   UNDER_REVIEW    — capability under independent review
--   VERIFIED        — capability verified (all required dependencies satisfied)
--   ACTIVATED       — capability is live and available for use
--   DEGRADED        — capability was active but a dependency has lapsed
--   EXPIRED         — capability has passed its validity window
--   SUSPENDED       — capability temporarily withdrawn
--   REVOKED         — capability permanently revoked

DO $$ BEGIN
    CREATE TYPE capability_activation_state AS ENUM (
        'DECLARED',
        'DOCUMENTING',
        'DOCUMENTED',
        'UNDER_REVIEW',
        'VERIFIED',
        'ACTIVATED',
        'DEGRADED',
        'EXPIRED',
        'SUSPENDED',
        'REVOKED'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- ENUM — capability_dependency_type
-- ############################################################################
-- How a set of claims relates to the capability instance:
--   ALL_REQUIRED    — every linked claim must be verified
--   ANY_SUFFICIENT  — any one linked claim verified suffices
--   WEIGHTED        — weighted threshold (sum of weights must reach threshold)
--   CONDITIONAL     — dependency resolved via conditional rules (evaluated externally)

DO $$ BEGIN
    CREATE TYPE capability_dependency_type AS ENUM (
        'ALL_REQUIRED',
        'ANY_SUFFICIENT',
        'WEIGHTED',
        'CONDITIONAL'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- ENUM — dependency_status_type
-- ############################################################################
-- Resolved status of a single dependency claim within a capability instance:
--   PENDING         — not yet evaluated
--   SATISFIED       — claim meets requirement
--   UNSATISFIED     — claim does not meet requirement
--   WAIVED          — requirement waived by authorized reviewer
--   EXPIRED         — claim was satisfied but has since expired

DO $$ BEGIN
    CREATE TYPE dependency_status_type AS ENUM (
        'PENDING',
        'SATISFIED',
        'UNSATISFIED',
        'WAIVED',
        'EXPIRED'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- PART 2: TABLE — capability_instances
-- ############################################################################
-- Each row represents a specific capability that has been activated (or is
-- being activated) for a particular entity — a site profile, an organization,
-- or another domain entity. The capability_code is a stable reference to the
-- taxonomy entry; the capability_id FK links to the canonical capabilities
-- table when the capability has been formalized.
--
-- Readiness contribution (readiness_contribution) is a NUMERIC(3,2) score
-- representing how much this instance contributes to overall profile readiness.
-- Degradation support (degraded_at) records when an active instance first
-- entered the DEGRADED state.

CREATE TABLE IF NOT EXISTS public.capability_instances (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- FK to the owning site profile (KEMS site profile production)
    profile_id              UUID NOT NULL
                            REFERENCES public.site_profiles(id) ON DELETE CASCADE,

    -- FK to the canonical capability definition (optional — may be declared
    -- before a formal capability row exists)
    capability_id           UUID
                            REFERENCES public.capabilities(id) ON DELETE SET NULL,

    -- Stable capability code (taxonomy key — e.g. 'biospecimen_collection')
    capability_code         TEXT NOT NULL,

    -- Polymorphic entity binding: what type of entity and which specific row
    -- in that entity's table is this capability instance bound to.
    entity_type             TEXT,
    entity_id               UUID,

    -- Activation lifecycle state
    state                   capability_activation_state NOT NULL DEFAULT 'DECLARED',

    -- Contribution score to overall profile readiness (0.00 – 9.99)
    readiness_contribution  NUMERIC(3,2) NOT NULL DEFAULT 0.00
                            CHECK (readiness_contribution >= 0.00 AND readiness_contribution <= 9.99),

    -- When the instance reached ACTIVATED state
    activated_at            TIMESTAMPTZ,

    -- When the instance first entered DEGRADED state (NULL if never degraded)
    degraded_at             TIMESTAMPTZ,

    -- Audit
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Uniqueness enforced via unique index below (expressions not allowed
    -- in table-level UNIQUE constraints in PostgreSQL)
);

-- ############################################################################
-- PART 3: TABLE — capability_claim_links
-- ############################################################################
-- Links capability instances to the claims that serve as their evidence
-- dependencies. Each row declares a dependency relationship: the capability
-- instance depends on the linked claim being verified (or otherwise resolved).
--
-- dependency_type controls how the set of linked claims is evaluated:
--   ALL_REQUIRED = every linked claim must be satisfied
--   ANY_SUFFICIENT = any one linked claim being satisfied is enough
--   WEIGHTED = weighted sum must reach a threshold (stored on the instance)
--   CONDITIONAL = external rule engine resolves (conditions stored in metadata)
--
-- is_critical flags claims whose failure should immediately degrade the
-- capability (versus merely lowering the confidence score).

CREATE TABLE IF NOT EXISTS public.capability_claim_links (
    capability_id           UUID NOT NULL
                            REFERENCES public.capability_instances(id) ON DELETE CASCADE,

    claim_id                UUID NOT NULL
                            REFERENCES public.claims(id) ON DELETE CASCADE,

    -- How this claim-set contributes to dependency resolution
    dependency_type         capability_dependency_type NOT NULL DEFAULT 'ALL_REQUIRED',

    -- Whether failure of this dependency immediately degrades the capability
    is_critical             BOOLEAN NOT NULL DEFAULT false,

    -- Link-level weight (used when dependency_type = WEIGHTED)
    weight                  NUMERIC(3,2) NOT NULL DEFAULT 1.00
                            CHECK (weight >= 0.00 AND weight <= 9.99),

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- One link per capability+claim pair
    CONSTRAINT uq_capability_claim_link UNIQUE (capability_id, claim_id)
);

-- ############################################################################
-- PART 4: TABLE — capability_dependency_status
-- ############################################################################
-- Records the resolved status of each claim dependency for a capability
-- instance. Each row captures a point-in-time evaluation of whether a
-- dependency claim satisfies the capability's requirements.
--
-- This table is designed to be recomputed when claim state changes, providing
-- a denormalized fast path for capability activation state machine evaluation.
--
-- evaluated_at is the timestamp of the latest evaluation; stale evaluations
-- can be detected by comparing to claim.updated_at.

CREATE TABLE IF NOT EXISTS public.capability_dependency_status (
    capability_id           UUID NOT NULL
                            REFERENCES public.capability_instances(id) ON DELETE CASCADE,

    dependency_claim_id     UUID NOT NULL
                            REFERENCES public.claims(id) ON DELETE CASCADE,

    -- Resolved status of this specific dependency
    status                  dependency_status_type NOT NULL DEFAULT 'PENDING',

    -- When this dependency was last evaluated
    evaluated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- One status row per capability+claim pair
    CONSTRAINT uq_capability_dependency_status UNIQUE (capability_id, dependency_claim_id)
);

-- ############################################################################
-- PART 5: TABLE — capability_activation_events
-- ############################################################################
-- Immutable audit log of every state transition for capability instances.
-- Provides full traceability from DECLARED → ACTIVATED → DEGRADED → REVOKED.
--
-- Immutability contract:
--   - INSERT-only table (no UPDATE/DELETE policies)
--   - created_at is the event timestamp and never changes
--   - event_data JSONB captures structured context for the transition
--     (e.g., reviewer_id, reason, evidence snapshot, dependency summary)

CREATE TABLE IF NOT EXISTS public.capability_activation_events (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- FK to the capability instance being tracked
    capability_id           UUID NOT NULL
                            REFERENCES public.capability_instances(id) ON DELETE CASCADE,

    -- State transition: from → to
    from_state              capability_activation_state,
    to_state                capability_activation_state NOT NULL,

    -- What triggered this transition (e.g. 'dependency_resolved', 'manual_review',
    -- 'degradation_detected', 'expiration_cron')
    triggered_by            TEXT,

    -- Structured context for the transition
    event_data              JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- When the transition occurred (immutable event timestamp)
    occurred_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ############################################################################
-- PART 6: TABLE — document_taxonomy_rules
-- ############################################################################
-- Controlled vocabulary for document classification per WO-KEMS-DOC-003.
-- Every document ingested into the system must be classified into exactly one
-- taxonomy rule. The implementation_destination determines where the document
-- is stored and how it's governed:
--
--   reusable_document_vault  — reusable across multiple studies (34 rules)
--   study_record             — bound to a single study/protocol (5 rules)
--   structured_data_store    — structured data, not free-text docs (5 rules)
--   restricted_vault         — access-controlled, legal/commercial (2 rules)
--   quarantine               — held pending classification review (1 rule)
--   rejected                 — prohibited content, never stored (1 rule)

CREATE TABLE IF NOT EXISTS public.document_taxonomy_rules (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Stable taxonomy key (e.g. 'cv_principal_investigator')
    rule_key                TEXT NOT NULL,

    -- Human-readable label
    name                    TEXT NOT NULL,

    -- Extended description of what this rule covers
    description             TEXT,

    -- Classification category
    --   'reusable'     — reusable across multiple studies
    --   'study_specific' — bound to a single study/protocol
    --   'structured_data' — structured data, not free-text
    --   'restricted'   — access-controlled (legal/commercial)
    --   'quarantine'   — held pending classification review
    --   'prohibited'   — content that must never be stored
    category                TEXT NOT NULL DEFAULT 'reusable',

    -- Where documents matching this rule should be stored/implemented
    implementation_destination TEXT NOT NULL,

    -- Whether this rule is active and applicable
    is_active               BOOLEAN NOT NULL DEFAULT true,

    -- UI ordering
    display_order           INTEGER NOT NULL DEFAULT 0,

    -- Extension point for rule-specific configuration
    metadata                JSONB DEFAULT '{}'::jsonb,

    -- Audit
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_document_taxonomy_rule_key UNIQUE (rule_key)
);

-- ############################################################################
-- PART 7: INDEXES
-- ############################################################################

-- ── capability_instances ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_capability_instances_profile
    ON public.capability_instances(profile_id);

CREATE INDEX IF NOT EXISTS idx_capability_instances_capability
    ON public.capability_instances(capability_id);

CREATE INDEX IF NOT EXISTS idx_capability_instances_code
    ON public.capability_instances(capability_code);

CREATE INDEX IF NOT EXISTS idx_capability_instances_state
    ON public.capability_instances(state);

CREATE INDEX IF NOT EXISTS idx_capability_instances_entity
    ON public.capability_instances(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_capability_instances_activated
    ON public.capability_instances(activated_at)
    WHERE state = 'ACTIVATED';

-- Unique scope: one instance per profile + capability_code + entity combo
-- COALESCE handles NULL entity_type/entity_id (all-NULL → sentinel value)
CREATE UNIQUE INDEX IF NOT EXISTS uq_capability_instance_scope
    ON public.capability_instances (profile_id, capability_code,
        COALESCE(entity_type, ''), COALESCE(entity_id, '00000000-0000-0000-0000-000000000000'));

-- ── capability_claim_links ───────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_capability_claim_links_capability
    ON public.capability_claim_links(capability_id);

CREATE INDEX IF NOT EXISTS idx_capability_claim_links_claim
    ON public.capability_claim_links(claim_id);

CREATE INDEX IF NOT EXISTS idx_capability_claim_links_critical
    ON public.capability_claim_links(capability_id, is_critical)
    WHERE is_critical = true;

-- ── capability_dependency_status ─────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_capability_dependency_status_capability
    ON public.capability_dependency_status(capability_id);

CREATE INDEX IF NOT EXISTS idx_capability_dependency_status_claim
    ON public.capability_dependency_status(dependency_claim_id);

CREATE INDEX IF NOT EXISTS idx_capability_dependency_status_status
    ON public.capability_dependency_status(status);

CREATE INDEX IF NOT EXISTS idx_capability_dep_status_pending
    ON public.capability_dependency_status(capability_id, dependency_claim_id)
    WHERE status = 'PENDING';

-- ── capability_activation_events ─────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_capability_activation_events_instance
    ON public.capability_activation_events(capability_id);

CREATE INDEX IF NOT EXISTS idx_capability_activation_events_occurred
    ON public.capability_activation_events(occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_capability_activation_events_state
    ON public.capability_activation_events(from_state, to_state);

CREATE INDEX IF NOT EXISTS idx_capability_activation_events_trigger
    ON public.capability_activation_events(triggered_by);

-- ── document_taxonomy_rules ──────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_document_taxonomy_rules_key
    ON public.document_taxonomy_rules(rule_key);

CREATE INDEX IF NOT EXISTS idx_document_taxonomy_rules_category
    ON public.document_taxonomy_rules(category);

CREATE INDEX IF NOT EXISTS idx_document_taxonomy_rules_destination
    ON public.document_taxonomy_rules(implementation_destination);

CREATE INDEX IF NOT EXISTS idx_document_taxonomy_rules_active
    ON public.document_taxonomy_rules(is_active)
    WHERE is_active = true;

-- ############################################################################
-- PART 8: ROW LEVEL SECURITY
-- ############################################################################

-- ── capability_instances ──────────────────────────────────────────────────
-- Org-scoped via profile_id → site_profiles.institution_id chain.

ALTER TABLE public.capability_instances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ci_select_org ON public.capability_instances;
CREATE POLICY ci_select_org ON public.capability_instances
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.site_profiles sp
            WHERE sp.id = capability_instances.profile_id
              AND sp.institution_id IN (
                SELECT om.organization_id
                FROM public.organization_memberships om
                WHERE om.user_id = auth.uid()
                  AND om.status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS ci_insert_service ON public.capability_instances;
CREATE POLICY ci_insert_service ON public.capability_instances
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS ci_update_service ON public.capability_instances;
CREATE POLICY ci_update_service ON public.capability_instances
    FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS ci_delete_service ON public.capability_instances;
CREATE POLICY ci_delete_service ON public.capability_instances
    FOR DELETE
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS ci_all_service ON public.capability_instances;
CREATE POLICY ci_all_service ON public.capability_instances
    FOR ALL
    USING (auth.role() = 'service_role');

-- ── capability_claim_links ───────────────────────────────────────────────
-- Org-scoped via capability_id → capability_instances → site_profiles chain.

ALTER TABLE public.capability_claim_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ccl_select_org ON public.capability_claim_links;
CREATE POLICY ccl_select_org ON public.capability_claim_links
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.capability_instances ci
            JOIN public.site_profiles sp ON sp.id = ci.profile_id
            WHERE ci.id = capability_claim_links.capability_id
              AND sp.institution_id IN (
                SELECT om.organization_id
                FROM public.organization_memberships om
                WHERE om.user_id = auth.uid()
                  AND om.status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS ccl_insert_service ON public.capability_claim_links;
CREATE POLICY ccl_insert_service ON public.capability_claim_links
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS ccl_delete_service ON public.capability_claim_links;
CREATE POLICY ccl_delete_service ON public.capability_claim_links
    FOR DELETE
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS ccl_all_service ON public.capability_claim_links;
CREATE POLICY ccl_all_service ON public.capability_claim_links
    FOR ALL
    USING (auth.role() = 'service_role');

-- ── capability_dependency_status ─────────────────────────────────────────
-- Same org-scoped chain via capability_id.

ALTER TABLE public.capability_dependency_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cds_select_org ON public.capability_dependency_status;
CREATE POLICY cds_select_org ON public.capability_dependency_status
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.capability_instances ci
            JOIN public.site_profiles sp ON sp.id = ci.profile_id
            WHERE ci.id = capability_dependency_status.capability_id
              AND sp.institution_id IN (
                SELECT om.organization_id
                FROM public.organization_memberships om
                WHERE om.user_id = auth.uid()
                  AND om.status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS cds_insert_service ON public.capability_dependency_status;
CREATE POLICY cds_insert_service ON public.capability_dependency_status
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS cds_update_service ON public.capability_dependency_status;
CREATE POLICY cds_update_service ON public.capability_dependency_status
    FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS cds_delete_service ON public.capability_dependency_status;
CREATE POLICY cds_delete_service ON public.capability_dependency_status
    FOR DELETE
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS cds_all_service ON public.capability_dependency_status;
CREATE POLICY cds_all_service ON public.capability_dependency_status
    FOR ALL
    USING (auth.role() = 'service_role');

-- ── capability_activation_events ─────────────────────────────────────────
-- IMMUTABLE table: INSERT-only, SELECT org-scoped, no UPDATE, no DELETE
-- (except service_role for admin recovery).

ALTER TABLE public.capability_activation_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cae_select_org ON public.capability_activation_events;
CREATE POLICY cae_select_org ON public.capability_activation_events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.capability_instances ci
            JOIN public.site_profiles sp ON sp.id = ci.profile_id
            WHERE ci.id = capability_activation_events.capability_id
              AND sp.institution_id IN (
                SELECT om.organization_id
                FROM public.organization_memberships om
                WHERE om.user_id = auth.uid()
                  AND om.status = 'active'
              )
        )
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS cae_insert_service ON public.capability_activation_events;
CREATE POLICY cae_insert_service ON public.capability_activation_events
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- No UPDATE policy — events are immutable
-- No DELETE policy for authenticated — events are immutable
-- service_role can delete via full-access fallback

DROP POLICY IF EXISTS cae_delete_service ON public.capability_activation_events;
CREATE POLICY cae_delete_service ON public.capability_activation_events
    FOR DELETE
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS cae_all_service ON public.capability_activation_events;
CREATE POLICY cae_all_service ON public.capability_activation_events
    FOR ALL
    USING (auth.role() = 'service_role');

-- ── document_taxonomy_rules ──────────────────────────────────────────────
-- Reference table: authenticated users can SELECT, service_role manages.

ALTER TABLE public.document_taxonomy_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dtr_select_auth ON public.document_taxonomy_rules;
CREATE POLICY dtr_select_auth ON public.document_taxonomy_rules
    FOR SELECT
    TO authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS dtr_select_service ON public.document_taxonomy_rules;
CREATE POLICY dtr_select_service ON public.document_taxonomy_rules
    FOR SELECT
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS dtr_all_service ON public.document_taxonomy_rules;
CREATE POLICY dtr_all_service ON public.document_taxonomy_rules
    FOR ALL
    USING (auth.role() = 'service_role');

-- ############################################################################
-- PART 9: TRIGGERS — updated_at
-- ############################################################################

-- capability_instances
DROP TRIGGER IF EXISTS trg_capability_instances_updated_at
    ON public.capability_instances;
CREATE TRIGGER trg_capability_instances_updated_at
    BEFORE UPDATE ON public.capability_instances
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- document_taxonomy_rules
DROP TRIGGER IF EXISTS trg_document_taxonomy_rules_updated_at
    ON public.document_taxonomy_rules;
CREATE TRIGGER trg_document_taxonomy_rules_updated_at
    BEFORE UPDATE ON public.document_taxonomy_rules
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- capability_claim_links and capability_dependency_status intentionally
-- do not carry updated_at columns — they are link/status tables that are
-- recreated rather than mutated.

-- ############################################################################
-- PART 10: SEED DATA — WO-KEMS-DOC-003 Document Taxonomy Rules
-- ############################################################################
-- 34 REUSABLE_DOCUMENT_TAXONOMY rules (category: reusable)
--  5 study-specific rules (category: study_specific)
--  5 structured-data rules (category: structured_data)
--  2 restricted rules (category: restricted)
--  1 quarantine rule  (category: quarantine)
--  1 prohibited rule  (category: prohibited)
-- Total: 48 seed rows
--
-- All INSERTs are idempotent via ON CONFLICT (rule_key) DO NOTHING.

-- =========================================================================
-- SECTION A: 34 REUSABLE DOCUMENT TAXONOMY RULES
-- =========================================================================
-- Destination: reusable_document_vault
-- These documents can be reused across multiple studies/protocols.

INSERT INTO public.document_taxonomy_rules (rule_key, name, description, category, implementation_destination, display_order)
VALUES
    -- ── Staff CVs & Credentials (1-8) ──────────────────────────────────
    ('cv_principal_investigator',   'Principal Investigator CV',
     'Curriculum vitae for the site principal investigator. Reusable across studies; must be updated every 2 years or on significant change.',
     'reusable', 'reusable_document_vault', 1),
    ('cv_sub_investigator',         'Sub-Investigator CV',
     'Curriculum vitae for a sub-investigator at the site.',
     'reusable', 'reusable_document_vault', 2),
    ('cv_study_coordinator',        'Study Coordinator CV',
     'Curriculum vitae for the clinical study coordinator.',
     'reusable', 'reusable_document_vault', 3),
    ('cv_research_nurse',           'Research Nurse CV',
     'Curriculum vitae for a research nurse or clinical research associate.',
     'reusable', 'reusable_document_vault', 4),
    ('cv_lab_director',             'Laboratory Director CV',
     'Curriculum vitae for the laboratory director overseeing biospecimen processing.',
     'reusable', 'reusable_document_vault', 5),
    ('cv_pharmacist',               'Investigational Pharmacist CV',
     'Curriculum vitae for the pharmacist responsible for investigational product management.',
     'reusable', 'reusable_document_vault', 6),
    ('cv_regulatory_specialist',    'Regulatory Specialist CV',
     'Curriculum vitae for the regulatory affairs specialist.',
     'reusable', 'reusable_document_vault', 7),
    ('cv_data_manager',             'Data Manager CV',
     'Curriculum vitae for the clinical data manager.',
     'reusable', 'reusable_document_vault', 8),

    -- ── Professional Licenses (9-11) ───────────────────────────────────
    ('medical_license_pi',          'Principal Investigator Medical License',
     'Current and valid medical license for the principal investigator.',
     'reusable', 'reusable_document_vault', 9),
    ('medical_license_sub_i',       'Sub-Investigator Medical License',
     'Current and valid medical license for a sub-investigator.',
     'reusable', 'reusable_document_vault', 10),
    ('nursing_license',             'Nursing License / Registration',
     'Current nursing license or professional registration for research nursing staff.',
     'reusable', 'reusable_document_vault', 11),

    -- ── Training Certifications (12-16) ────────────────────────────────
    ('gcp_certificate',             'Good Clinical Practice (GCP) Certificate',
     'ICH E6(R2) GCP training certificate. Valid for 3 years from date of completion.',
     'reusable', 'reusable_document_vault', 12),
    ('ich_certificate',             'ICH Guideline Training Certificate',
     'Training certificate for ICH guidelines beyond GCP (e.g., E2A, E8, E9).',
     'reusable', 'reusable_document_vault', 13),
    ('human_subjects_protection',   'Human Subjects Protection Certificate',
     'CITI Program or equivalent human research subjects protection training.',
     'reusable', 'reusable_document_vault', 14),
    ('laboratory_safety_training',  'Laboratory Safety Training',
     'Biosafety, chemical safety, or BSL-2 laboratory safety training certificate.',
     'reusable', 'reusable_document_vault', 15),
    ('shipping_training',           'Dangerous Goods / Specimen Shipping Training',
     'IATA dangerous goods training for shipping biological specimens.',
     'reusable', 'reusable_document_vault', 16),

    -- ── Regulatory Forms (17-21) ───────────────────────────────────────
    ('form_fda_1572',               'Form FDA 1572 — Statement of Investigator',
     'Signed FDA Form 1572. Reusable with protocol-specific amendments.',
     'reusable', 'reusable_document_vault', 17),
    ('financial_disclosure_form',   'Financial Disclosure Form',
     'FDA financial disclosure / conflict of interest declaration for investigators.',
     'reusable', 'reusable_document_vault', 18),
    ('delegation_of_authority_log', 'Delegation of Authority Log',
     'Site delegation of authority log listing all study personnel and their delegated tasks.',
     'reusable', 'reusable_document_vault', 19),
    ('irb_registration',            'IRB / Ethics Committee Registration',
     'IRB or EC registration document including FWA number and roster.',
     'reusable', 'reusable_document_vault', 20),
    ('clinical_trial_registration', 'Clinical Trial Registration Confirmation',
     'ClinicalTrials.gov or equivalent registry registration confirmation.',
     'reusable', 'reusable_document_vault', 21),

    -- ── Site Standard Operating Procedures (22-30) ─────────────────────
    ('sop_informed_consent',        'SOP — Informed Consent Process',
     'Site SOP for obtaining and documenting informed consent.',
     'reusable', 'reusable_document_vault', 22),
    ('sop_adverse_event_reporting', 'SOP — Adverse Event / SAE Reporting',
     'Site SOP for identifying, documenting, and reporting adverse events and SAEs.',
     'reusable', 'reusable_document_vault', 23),
    ('sop_drug_accountability',     'SOP — Investigational Product Accountability',
     'Site SOP for receipt, storage, dispensing, and accountability of investigational product.',
     'reusable', 'reusable_document_vault', 24),
    ('sop_lab_processing',          'SOP — Laboratory Specimen Processing',
     'Site SOP for collection, processing, storage, and shipping of biospecimens.',
     'reusable', 'reusable_document_vault', 25),
    ('sop_source_documentation',    'SOP — Source Documentation',
     'Site SOP for maintaining and correcting source documents.',
     'reusable', 'reusable_document_vault', 26),
    ('sop_regulatory_binder',       'SOP — Regulatory Binder Maintenance',
     'Site SOP for assembling and maintaining the regulatory binder / eISF.',
     'reusable', 'reusable_document_vault', 27),
    ('sop_data_management',         'SOP — Data Management & CRF Completion',
     'Site SOP for completing, reviewing, and correcting case report forms.',
     'reusable', 'reusable_document_vault', 28),
    ('sop_monitoring_visit',        'SOP — Monitoring Visit Preparation',
     'Site SOP for preparing for and hosting monitoring visits.',
     'reusable', 'reusable_document_vault', 29),
    ('sop_emergency_procedures',    'SOP — Emergency Procedures',
     'Site SOP for medical emergencies during study visits.',
     'reusable', 'reusable_document_vault', 30),

    -- ── Facility & Equipment (31-34) ───────────────────────────────────
    ('equipment_calibration_log',   'Equipment Calibration & Maintenance Log',
     'Log of calibration and preventive maintenance for all study-relevant equipment.',
     'reusable', 'reusable_document_vault', 31),
    ('facility_floor_plan',         'Facility Floor Plan',
     'Annotated floor plan showing clinical, laboratory, pharmacy, and storage areas.',
     'reusable', 'reusable_document_vault', 32),
    ('pharmacy_license',            'Pharmacy License / Registration',
     'Current pharmacy license or registration for investigational product storage and dispensing.',
     'reusable', 'reusable_document_vault', 33),
    ('site_organizational_chart',   'Site Organizational Chart',
     'Current organizational chart showing reporting structure and key personnel.',
     'reusable', 'reusable_document_vault', 34)

ON CONFLICT (rule_key) DO NOTHING;

-- =========================================================================
-- SECTION B: 5 STUDY-SPECIFIC TAXONOMY RULES
-- =========================================================================
-- Destination: study_record
-- These documents are bound to a single study/protocol.

INSERT INTO public.document_taxonomy_rules (rule_key, name, description, category, implementation_destination, display_order)
VALUES
    ('clinical_protocol',           'Clinical Study Protocol',
     'The IRB/EC-approved clinical study protocol including all amendments. Specific to one study.',
     'study_specific', 'study_record', 50),
    ('investigators_brochure',      'Investigators Brochure (IB)',
     'The current Investigators Brochure for the study drug/device/biologic.',
     'study_specific', 'study_record', 51),
    ('informed_consent_form',       'Study-Specific Informed Consent Form',
     'The IRB/EC-approved informed consent form for this specific study.',
     'study_specific', 'study_record', 52),
    ('case_report_form',            'Case Report Form (CRF) Template',
     'Blank or template case report forms for this study.',
     'study_specific', 'study_record', 53),
    ('study_reference_manual',      'Study Reference Manual / MOP',
     'Study-specific manual of operations, lab manual, or pharmacy manual.',
     'study_specific', 'study_record', 54)

ON CONFLICT (rule_key) DO NOTHING;

-- =========================================================================
-- SECTION C: 5 STRUCTURED DATA TAXONOMY RULES
-- =========================================================================
-- Destination: structured_data_store
-- These are structured data records, not free-text documents.

INSERT INTO public.document_taxonomy_rules (rule_key, name, description, category, implementation_destination, display_order)
VALUES
    ('site_demographics',           'Site Demographics Record',
     'Structured record of site characteristics: institution type, bed count, outpatient volume, catchment area.',
     'structured_data', 'structured_data_store', 70),
    ('patient_demographics',        'Patient Population Demographics',
     'Structured summary of the patient population served: age ranges, disease prevalence, diversity metrics.',
     'structured_data', 'structured_data_store', 71),
    ('lab_reference_ranges',        'Laboratory Reference Ranges',
     'Structured table of normal reference ranges for all on-site laboratory tests.',
     'structured_data', 'structured_data_store', 72),
    ('equipment_inventory',         'Equipment Inventory',
     'Structured catalog of study-relevant equipment: make, model, serial number, calibration status.',
     'structured_data', 'structured_data_store', 73),
    ('staff_roster',                'Staff Roster',
     'Structured list of current staff with roles and contact information.',
     'structured_data', 'structured_data_store', 74)

ON CONFLICT (rule_key) DO NOTHING;

-- =========================================================================
-- SECTION D: 2 RESTRICTED TAXONOMY RULES
-- =========================================================================
-- Destination: restricted_vault
-- These documents contain commercially sensitive or legally privileged info.

INSERT INTO public.document_taxonomy_rules (rule_key, name, description, category, implementation_destination, display_order)
VALUES
    ('clinical_trial_agreement',    'Clinical Trial Agreement / Budget',
     'Executed CTA, budget, and payment schedule. Contains confidential commercial terms.',
     'restricted', 'restricted_vault', 90),
    ('confidentiality_agreement',   'Confidentiality Disclosure Agreement',
     'CDA, NDA, or other confidentiality agreement between site and sponsor/CRO.',
     'restricted', 'restricted_vault', 91)

ON CONFLICT (rule_key) DO NOTHING;

-- =========================================================================
-- SECTION E: 1 QUARANTINE TAXONOMY RULE
-- =========================================================================
-- Destination: quarantine
-- Documents that cannot be automatically classified are held here pending
-- manual review by a document controller.

INSERT INTO public.document_taxonomy_rules (rule_key, name, description, category, implementation_destination, display_order)
VALUES
    ('unclassified_document',       'Unclassified / Pending Review',
     'Document that could not be automatically matched to any active taxonomy rule. Held in quarantine pending manual classification review by a document controller. Documents remain in quarantine until reclassified or rejected.',
     'quarantine', 'quarantine', 98)

ON CONFLICT (rule_key) DO NOTHING;

-- =========================================================================
-- SECTION F: 1 PROHIBITED TAXONOMY RULE
-- =========================================================================
-- Destination: rejected
-- Content that must never be stored in the system.

INSERT INTO public.document_taxonomy_rules (rule_key, name, description, category, implementation_destination, display_order)
VALUES
    ('phi_unredacted',              'PHI / PII — Unredacted',
     'Document containing unredacted protected health information (PHI) or personally identifiable information (PII) that was not submitted through an approved de-identification workflow. These documents must be rejected and never stored. The submitter should be notified to resubmit with appropriate redaction.',
     'prohibited', 'rejected', 99)

ON CONFLICT (rule_key) DO NOTHING;

-- ############################################################################
-- PART 11: GRANTS
-- ############################################################################

-- capability_instances
GRANT SELECT ON public.capability_instances TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.capability_instances TO service_role;

-- capability_claim_links
GRANT SELECT ON public.capability_claim_links TO authenticated, service_role;
GRANT INSERT, DELETE ON public.capability_claim_links TO service_role;

-- capability_dependency_status
GRANT SELECT ON public.capability_dependency_status TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.capability_dependency_status TO service_role;

-- capability_activation_events (immutable — no UPDATE grant)
GRANT SELECT ON public.capability_activation_events TO authenticated, service_role;
GRANT INSERT ON public.capability_activation_events TO service_role;

-- document_taxonomy_rules (reference table)
GRANT SELECT ON public.document_taxonomy_rules TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.document_taxonomy_rules TO service_role;

-- ############################################################################
-- PART 12: COMMENTS
-- ############################################################################

COMMENT ON TABLE public.capability_instances IS
    'KADARN v2: Activated capability instance bound to a site profile. Tracks lifecycle state from DECLARED through ACTIVATED to REVOKED, with readiness contribution scoring.';

COMMENT ON COLUMN public.capability_instances.capability_code IS
    'Stable taxonomy key for the capability (e.g., biospecimen_collection, pbmc_processing). Matches a capability type in the organization_capability_types or program_type_taxonomy catalog.';

COMMENT ON COLUMN public.capability_instances.readiness_contribution IS
    'Score (0.00-9.99) representing how much this capability instance contributes to overall site profile readiness. Used in weighted readiness aggregation.';

COMMENT ON COLUMN public.capability_instances.degraded_at IS
    'Timestamp when the instance first entered DEGRADED state. NULL if never degraded. Used to calculate degradation duration.';

COMMENT ON TABLE public.capability_claim_links IS
    'M2M join linking capability instances to the claims that serve as their evidence dependencies. dependency_type controls how the claim set is aggregated: ALL_REQUIRED, ANY_SUFFICIENT, WEIGHTED, or CONDITIONAL.';

COMMENT ON COLUMN public.capability_claim_links.is_critical IS
    'If true, failure of this dependency immediately degrades the capability instance to DEGRADED state, regardless of other dependencies.';

COMMENT ON TABLE public.capability_dependency_status IS
    'Resolved status of each individual claim dependency for a capability instance. Recomputed when claim state changes. Provides a fast-path lookup for dependency satisfaction evaluation.';

COMMENT ON TABLE public.capability_activation_events IS
    'Immutable audit log of all state transitions for capability instances. Provides full traceability from DECLARED through ACTIVATED, DEGRADED, and REVOKED. INSERT-only by design.';

COMMENT ON TABLE public.document_taxonomy_rules IS
    'WO-KEMS-DOC-003 controlled vocabulary for document classification. 48 rules: 34 reusable (reusable_document_vault), 5 study-specific (study_record), 5 structured-data (structured_data_store), 2 restricted (restricted_vault), 1 quarantine, 1 prohibited (rejected).';

COMMENT ON COLUMN public.document_taxonomy_rules.implementation_destination IS
    'Where documents matching this rule are stored: reusable_document_vault, study_record, structured_data_store, restricted_vault, quarantine, or rejected.';

-- ============================================================================
-- END OF MIGRATION 098
-- ============================================================================
