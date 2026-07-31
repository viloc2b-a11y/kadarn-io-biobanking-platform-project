-- ==========================================================================
-- Migration 094 — Claims + Evidence Sources + Document Vault (RAG-ready)
-- Aligned to: KEMS-001 §1-§4, CANONICAL_MVP_SCOPE §A.4
-- Reference: realvibe-site-copilot/001_initial_schema.sql
-- ==========================================================================

-- Enable pgvector for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- ==========================================================================
-- 1. EVIDENCE SOURCES — Where evidence comes from
-- ==========================================================================
CREATE TABLE IF NOT EXISTS evidence_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL CHECK (source_type IN (
        'document_upload',    -- User-uploaded document
        'external_registry',  -- Public registry (FDA, EMA, ClinicalTrials.gov)
        'api_ingestion',      -- Programmatic ingestion
        'manual_entry'        -- Direct user input
    )),
    label TEXT NOT NULL,
    description TEXT,
    file_path TEXT,           -- Storage path in Supabase
    file_name TEXT,
    file_type TEXT,           -- MIME type
    file_size BIGINT,
    file_hash TEXT,           -- SHA-256 for dedup
    page_count INT DEFAULT 1,
    text_content TEXT,        -- Extracted full text (MarkItDown output)
    processing_status TEXT DEFAULT 'pending'
        CHECK (processing_status IN ('pending', 'extracting', 'chunking', 'embedding', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================================
-- 2. DOCUMENT CHUNKS — For RAG vector search
-- ==========================================================================
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES evidence_sources(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding VECTOR(1536),       -- OpenAI text-embedding-ada-002 = 1536 dims
    token_count INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
    ON document_chunks USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- ==========================================================================
-- 3. CLAIMS — The core of KEMS-001 §1
-- ==========================================================================
CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    claim_hash TEXT NOT NULL,          -- SHA-256 of normalized question + answer
    question_text TEXT NOT NULL,       -- The question that was asked
    answer_value TEXT NOT NULL,        -- The answer (declared value)
    answer_type TEXT DEFAULT 'text'
        CHECK (answer_type IN ('text', 'boolean', 'numeric', 'select', 'multi_select', 'date')),
    category TEXT NOT NULL             -- Which module/progress level
        CHECK (category IN ('identity', 'experience', 'infrastructure', 'quality', 'other')),
    confidence_level TEXT DEFAULT 'declared'
        CHECK (confidence_level IN ('declared', 'documented', 'verified', 'expired', 'contradicted', 'unknown')),
    confidence_score FLOAT DEFAULT 0.0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    evidence_count INT DEFAULT 0,
    has_unresolved_counter_evidence BOOLEAN DEFAULT FALSE,
    is_counter_evidence BOOLEAN DEFAULT FALSE,
    response_to_claim_id UUID REFERENCES claims(id),
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    superseded_by UUID REFERENCES claims(id),
    version INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institution_id, claim_hash, version)
);

-- ==========================================================================
-- 4. CLAIM EVIDENCE LINKS — KEMS-001 §2 Component C
-- ==========================================================================
CREATE TABLE IF NOT EXISTS claim_evidence_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    source_id UUID REFERENCES evidence_sources(id),
    chunk_id UUID REFERENCES document_chunks(id),
    relationship_type TEXT NOT NULL
        CHECK (relationship_type IN ('supports', 'contradicts', 'corroborates', 'qualifies', 'supersedes')),
    weight FLOAT DEFAULT 0.5 CHECK (weight >= -1 AND weight <= 1),
    evidence_class TEXT               -- KEMS-001 §3: A-F
        CHECK (evidence_class IN ('A', 'B', 'C', 'D', 'E', 'F')),
    evidence_page INT,
    evidence_span JSONB,              -- {start, end} text coordinates
    reviewer_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================================
-- 5. QUESTIONNAIRE TEMPLATES — Dynamic progressive modules
-- ==========================================================================
CREATE TABLE IF NOT EXISTS questionnaire_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name TEXT NOT NULL,
    level INT NOT NULL CHECK (level BETWEEN 1 AND 4),
    module_key TEXT NOT NULL,          -- e.g., 'lab_infrastructure', 'pharmacy'
    schema_definition JSONB NOT NULL,  -- Full question structure
    activation_condition JSONB,        -- When to show this module (e.g., {"claim_id": "xxx", "answer": "yes"})
    is_required BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================================
-- Indexes
-- ==========================================================================
CREATE INDEX IF NOT EXISTS idx_claims_institution ON claims(institution_id);
CREATE INDEX IF NOT EXISTS idx_claims_hash ON claims(claim_hash);
CREATE INDEX IF NOT EXISTS idx_claims_category ON claims(category);
CREATE INDEX IF NOT EXISTS idx_claims_confidence ON claims(confidence_level);
CREATE INDEX IF NOT EXISTS idx_evidence_sources_institution ON evidence_sources(institution_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_source ON document_chunks(source_id);
CREATE INDEX IF NOT EXISTS idx_claim_evidence_links_claim ON claim_evidence_links(claim_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_templates_level ON questionnaire_templates(level, module_key);

-- ==========================================================================
-- RLS Policies
-- ==========================================================================
ALTER TABLE evidence_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_evidence_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_templates ENABLE ROW LEVEL SECURITY;

-- Helper: institution-scoped access
CREATE POLICY "Users can access their institution's evidence sources"
    ON evidence_sources FOR ALL
    USING (institution_id IN (
        SELECT organization_id FROM organization_memberships
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can access their institution's document chunks"
    ON document_chunks FOR SELECT
    USING (source_id IN (
        SELECT id FROM evidence_sources WHERE institution_id IN (
            SELECT organization_id FROM organization_memberships
            WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can access their institution's claims"
    ON claims FOR ALL
    USING (institution_id IN (
        SELECT organization_id FROM organization_memberships
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can access their institution's claim evidence links"
    ON claim_evidence_links FOR SELECT
    USING (claim_id IN (
        SELECT id FROM claims WHERE institution_id IN (
            SELECT organization_id FROM organization_memberships
            WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can read questionnaire templates"
    ON questionnaire_templates FOR SELECT
    USING (TRUE);

-- ==========================================================================
-- Seed data: Questionnaire Templates for 4 progressive levels
-- ==========================================================================

-- Level 1: Site Identity
INSERT INTO questionnaire_templates (template_name, level, module_key, schema_definition, is_required, sort_order)
VALUES (
    'Site Identity',
    1,
    'site_identity',
    '{
        "sections": [
            {
                "id": "identity",
                "title": "Institution Identity",
                "description": "Basic information about your research site.",
                "fields": [
                    {"id": "identity_name", "type": "text", "label": "Official Institution Name", "required": true},
                    {"id": "identity_type", "type": "select", "label": "Institution Type", "required": true, "options": ["Hospital","Biobank","CRO","Laboratory","Academic Medical Center","Independent Research Site","SMO","Research Network","Physician Practice","University","Non-Profit","Other"]},
                    {"id": "identity_country", "type": "text", "label": "Country", "required": true},
                    {"id": "identity_city", "type": "text", "label": "City", "required": true},
                    {"id": "identity_description", "type": "textarea", "label": "Brief Description", "required": false}
                ]
            },
            {
                "id": "contacts",
                "title": "Key Contacts",
                "description": "Primary points of contact for sponsors and CROs.",
                "fields": [
                    {"id": "contact_pi_name", "type": "text", "label": "Principal Investigator Name", "required": true},
                    {"id": "contact_pi_email", "type": "text", "label": "PI Email", "required": true},
                    {"id": "contact_coordinator_name", "type": "text", "label": "Site Coordinator Name", "required": false},
                    {"id": "contact_coordinator_email", "type": "text", "label": "Coordinator Email", "required": false}
                ]
            }
        ]
    }'::jsonb,
    TRUE,
    1
);

-- Level 2: Clinical Experience
INSERT INTO questionnaire_templates (template_name, level, module_key, schema_definition, is_required, sort_order)
VALUES (
    'Clinical Experience',
    2,
    'clinical_experience',
    '{
        "sections": [
            {
                "id": "study_phases",
                "title": "Study Phase Experience",
                "fields": [
                    {"id": "exp_phase_i", "type": "boolean", "label": "Phase I experience?", "activates_evidence": true},
                    {"id": "exp_phase_ii", "type": "boolean", "label": "Phase II experience?", "activates_evidence": true},
                    {"id": "exp_phase_iii", "type": "boolean", "label": "Phase III experience?", "activates_evidence": true},
                    {"id": "exp_phase_iv", "type": "boolean", "label": "Phase IV experience?", "activates_evidence": true}
                ]
            },
            {
                "id": "therapeutic_areas",
                "title": "Therapeutic Areas",
                "fields": [
                    {"id": "exp_ta_oncology", "type": "boolean", "label": "Oncology"},
                    {"id": "exp_ta_cardiology", "type": "boolean", "label": "Cardiology"},
                    {"id": "exp_ta_neurology", "type": "boolean", "label": "Neurology"},
                    {"id": "exp_ta_immunology", "type": "boolean", "label": "Immunology"},
                    {"id": "exp_ta_infectious", "type": "boolean", "label": "Infectious Disease"},
                    {"id": "exp_ta_rare", "type": "boolean", "label": "Rare Disease"},
                    {"id": "exp_ta_endocrinology", "type": "boolean", "label": "Endocrinology"},
                    {"id": "exp_ta_respiratory", "type": "boolean", "label": "Respiratory"},
                    {"id": "exp_ta_other", "type": "boolean", "label": "Other (specify)"}
                ]
            },
            {
                "id": "recruitment",
                "title": "Patient Recruitment",
                "fields": [
                    {"id": "exp_patient_volume", "type": "select", "label": "Avg patients enrolled per year", "options": ["<10","10-50","51-100","101-500",">500"]},
                    {"id": "exp_retention_rate", "type": "select", "label": "Typical retention rate", "options": ["<50%","50-70%","71-85%","86-95%",">95%"]}
                ]
            }
        ]
    }'::jsonb,
    TRUE,
    2
);

-- Level 3: Lab Infrastructure (conditional — only if site has lab)
INSERT INTO questionnaire_templates (template_name, level, module_key, schema_definition, is_required, sort_order, activation_condition)
VALUES (
    'Laboratory & Biospecimen Infrastructure',
    3,
    'lab_infrastructure',
    '{
        "sections": [
            {
                "id": "lab_capabilities",
                "title": "Lab Capabilities",
                "fields": [
                    {"id": "lab_has_internal", "type": "boolean", "label": "Do you have internal lab infrastructure for biospecimen handling?", "activates_evidence": true},
                    {"id": "lab_pbmc_processing", "type": "boolean", "label": "PBMC processing capability?", "activates_evidence": true},
                    {"id": "lab_storage_minus80", "type": "boolean", "label": "-80°C storage available?", "activates_evidence": true},
                    {"id": "lab_storage_minus20", "type": "boolean", "label": "-20°C storage available?", "activates_evidence": true},
                    {"id": "lab_refrigerated_centrifuge", "type": "boolean", "label": "Refrigerated centrifuge available?", "activates_evidence": true}
                ]
            },
            {
                "id": "lab_certifications",
                "title": "Certifications",
                "fields": [
                    {"id": "lab_cert_clia", "type": "boolean", "label": "CLIA certified?"},
                    {"id": "lab_cert_cap", "type": "boolean", "label": "CAP accredited?"},
                    {"id": "lab_cert_iso", "type": "boolean", "label": "ISO 15189?"},
                    {"id": "lab_cert_gmp", "type": "boolean", "label": "GMP compliant?"},
                    {"id": "lab_cert_glp", "type": "boolean", "label": "GLP compliant?"}
                ]
            },
            {
                "id": "lab_equipment",
                "title": "Equipment",
                "fields": [
                    {"id": "lab_eq_centrifuge", "type": "boolean", "label": "Centrifuge"},
                    {"id": "lab_eq_pcr", "type": "boolean", "label": "PCR Machine"},
                    {"id": "lab_eq_flow_cytometer", "type": "boolean", "label": "Flow Cytometer"},
                    {"id": "lab_eq_sequencer", "type": "boolean", "label": "Sequencer"},
                    {"id": "lab_eq_mass_spec", "type": "boolean", "label": "Mass Spectrometer"},
                    {"id": "lab_eq_hplc", "type": "boolean", "label": "HPLC"},
                    {"id": "lab_eq_elisa", "type": "boolean", "label": "ELISA Reader"},
                    {"id": "lab_eq_microscope", "type": "boolean", "label": "Microscope"},
                    {"id": "lab_eq_biosafety", "type": "boolean", "label": "Biosafety Cabinet"}
                ]
            }
        ]
    }'::jsonb,
    FALSE,  -- Conditional
    3,
    '{"depends_on": "lab_has_internal", "expected_value": true}'::jsonb
);

-- Level 4: Quality & Regulatory
INSERT INTO questionnaire_templates (template_name, level, module_key, schema_definition, is_required, sort_order)
VALUES (
    'Quality System & Regulatory Startup',
    4,
    'quality_regulatory',
    '{
        "sections": [
            {
                "id": "irb_ec",
                "title": "Ethics Committee / IRB",
                "fields": [
                    {"id": "reg_irb_type", "type": "select", "label": "IRB/EC type", "options": ["Local/Institutional","Central","Both available"]},
                    {"id": "reg_irb_approval_time", "type": "select", "label": "Avg approval time", "options": ["<2 weeks","2-4 weeks","4-8 weeks","8-12 weeks",">12 weeks"]}
                ]
            },
            {
                "id": "contracting",
                "title": "Contract & Budget Timelines",
                "fields": [
                    {"id": "reg_contract_time", "type": "select", "label": "Avg time from receipt to fully executed contract", "options": ["<2 weeks","2-4 weeks","4-8 weeks","8-12 weeks",">12 weeks"]},
                    {"id": "reg_budget_time", "type": "select", "label": "Avg budget negotiation time", "options": ["<1 week","1-2 weeks","2-4 weeks",">4 weeks"]}
                ]
            },
            {
                "id": "certifications",
                "title": "Staff Certifications & Audits",
                "fields": [
                    {"id": "reg_gcp_certified", "type": "boolean", "label": "Staff with current GCP certification?", "activates_evidence": true},
                    {"id": "reg_fda_audited", "type": "boolean", "label": "FDA audited in last 5 years?"},
                    {"id": "reg_ema_audited", "type": "boolean", "label": "EMA audited in last 5 years?"},
                    {"id": "reg_other_audit", "type": "boolean", "label": "Other regulatory authority audit?"}
                ]
            }
        ]
    }'::jsonb,
    TRUE,
    4
);
