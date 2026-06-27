-- ============================================================================
-- KADARN PLATFORM — Knowledge Engine (Semantic Layer)
-- ============================================================================
-- Target: PostgreSQL 15+ (Supabase compatible)
-- Domain: Controlled vocabularies, term normalization, synonym resolution,
--         and external code mapping
-- Design: ADR-015 — Knowledge Engine: Semantic Understanding Layer
-- Reference: KRM-RAO §4.3 (Knowledge Graph)
-- ============================================================================

-- ############################################################################
-- PART 1: VOCABULARY SETS
-- ############################################################################

DO $$ BEGIN
    CREATE TYPE vocabulary_set AS ENUM (
        'specimen_type',
        'processing_method',
        'storage_condition',
        'container_type',
        'regulatory_doc_type',
        'diagnosis'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- PART 2: ONTOLOGY TERMS
-- ############################################################################

CREATE TABLE IF NOT EXISTS ontology_terms (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vocabulary      vocabulary_set NOT NULL,
    preferred_label VARCHAR(255) NOT NULL,  -- canonical name, snake_case
    display_name    VARCHAR(255) NOT NULL,  -- human-readable: "Whole Blood"
    description     TEXT,
    parent_id       UUID REFERENCES ontology_terms(id) ON DELETE SET NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Unique per vocabulary
    CONSTRAINT ontology_terms_unique_vocab_label
        UNIQUE (vocabulary, preferred_label)
);

COMMENT ON TABLE ontology_terms IS
    'Controlled vocabulary terms organized by vocabulary set.';

CREATE INDEX IF NOT EXISTS idx_ontology_terms_vocabulary
    ON ontology_terms(vocabulary);
CREATE INDEX IF NOT EXISTS idx_ontology_terms_parent
    ON ontology_terms(parent_id);
CREATE INDEX IF NOT EXISTS idx_ontology_terms_active
    ON ontology_terms(vocabulary, is_active);

-- ############################################################################
-- PART 3: SYNONYMS
-- ############################################################################

CREATE TABLE IF NOT EXISTS ontology_synonyms (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term_id         UUID NOT NULL REFERENCES ontology_terms(id) ON DELETE CASCADE,
    synonym         VARCHAR(255) NOT NULL,  -- alternative name
    source          VARCHAR(100),           -- where this synonym came from
    is_abbreviation BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT ontology_synonyms_unique
        UNIQUE (term_id, synonym)
);

CREATE INDEX IF NOT EXISTS idx_ontology_synonyms_term
    ON ontology_synonyms(term_id);
CREATE INDEX IF NOT EXISTS idx_ontology_synonyms_search
    ON ontology_synonyms(synonym);

-- ############################################################################
-- PART 4: EXTERNAL CODE MAPPINGS
-- ############################################################################

DO $$ BEGIN
    CREATE TYPE coding_system AS ENUM (
        'icd10', 'icd11', 'snomed_ct', 'loinc', 'ncit', 'mondo', 'fhir'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS ontology_mappings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term_id         UUID NOT NULL REFERENCES ontology_terms(id) ON DELETE CASCADE,
    coding_system   coding_system NOT NULL,
    external_code   VARCHAR(50) NOT NULL,
    external_label  VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT ontology_mappings_unique
        UNIQUE (term_id, coding_system, external_code)
);

CREATE INDEX IF NOT EXISTS idx_ontology_mappings_term
    ON ontology_mappings(term_id);
CREATE INDEX IF NOT EXISTS idx_ontology_mappings_code
    ON ontology_mappings(coding_system, external_code);

-- ############################################################################
-- PART 5: RLS
-- ############################################################################

ALTER TABLE ontology_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE ontology_synonyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE ontology_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY ontology_terms_select ON ontology_terms
    FOR SELECT USING (true);  -- read-only for all authenticated users

CREATE POLICY ontology_terms_insert ON ontology_terms
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY ontology_terms_update ON ontology_terms
    FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY ontology_synonyms_select ON ontology_synonyms
    FOR SELECT USING (true);

CREATE POLICY ontology_synonyms_insert ON ontology_synonyms
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY ontology_mappings_select ON ontology_mappings
    FOR SELECT USING (true);

CREATE POLICY ontology_mappings_insert ON ontology_mappings
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ############################################################################
-- PART 6: SEED VOCABULARIES
-- ############################################################################

-- Specimen types
INSERT INTO ontology_terms (vocabulary, preferred_label, display_name, description, sort_order) VALUES
    ('specimen_type', 'whole_blood', 'Whole Blood', 'Whole blood collected in anticoagulant', 1),
    ('specimen_type', 'plasma', 'Plasma', 'Plasma separated from whole blood', 2),
    ('specimen_type', 'serum', 'Serum', 'Serum separated from clotted blood', 3),
    ('specimen_type', 'ffpe', 'FFPE Tissue', 'Formalin-fixed, paraffin-embedded tissue', 4),
    ('specimen_type', 'fresh_frozen_tissue', 'Fresh Frozen Tissue', 'Snap-frozen tissue, OCT or cryoprotected', 5),
    ('specimen_type', 'dna', 'DNA', 'Extracted genomic DNA', 6),
    ('specimen_type', 'rna', 'RNA', 'Extracted RNA', 7),
    ('specimen_type', 'urine', 'Urine', 'Urine specimen', 8),
    ('specimen_type', 'csf', 'Cerebrospinal Fluid', 'CSF from lumbar puncture', 9),
    ('specimen_type', 'saliva', 'Saliva', 'Saliva/oral fluid', 10),
    ('specimen_type', 'stool', 'Stool', 'Stool/feces specimen', 11),
    ('specimen_type', 'bone_marrow', 'Bone Marrow', 'Bone marrow aspirate or biopsy', 12),
    ('specimen_type', 'buffy_coat', 'Buffy Coat', 'White blood cell concentrate from whole blood', 13),
    ('specimen_type', 'pbmc', 'PBMC', 'Peripheral blood mononuclear cells', 14),
    ('specimen_type', 'tissue', 'Tissue', 'Generic tissue specimen', 15)
ON CONFLICT (vocabulary, preferred_label) DO NOTHING;

-- Synonyms for specimen types
WITH spec AS (SELECT id FROM ontology_terms WHERE preferred_label = 'whole_blood' AND vocabulary = 'specimen_type')
INSERT INTO ontology_synonyms (term_id, synonym, source, is_abbreviation)
SELECT id, 'WB', 'common', true FROM spec
UNION ALL SELECT id, 'Blood (venous)', 'common', false FROM spec
UNION ALL SELECT id, 'EDTA whole blood', 'common', false FROM spec
UNION ALL SELECT id, 'Peripheral blood', 'common', false FROM spec;

WITH spec AS (SELECT id FROM ontology_terms WHERE preferred_label = 'ffpe' AND vocabulary = 'specimen_type')
INSERT INTO ontology_synonyms (term_id, synonym, source, is_abbreviation)
SELECT id, 'Formalin-fixed paraffin-embedded', 'common', false FROM spec
UNION ALL SELECT id, 'FFPET', 'common', true FROM spec
UNION ALL SELECT id, 'Paraffin block', 'common', false FROM spec;

WITH spec AS (SELECT id FROM ontology_terms WHERE preferred_label = 'pbmc' AND vocabulary = 'specimen_type')
INSERT INTO ontology_synonyms (term_id, synonym, source, is_abbreviation)
SELECT id, 'Peripheral blood mononuclear cell', 'common', false FROM spec
UNION ALL SELECT id, 'Mononuclear cells', 'common', false FROM spec;

-- Processing methods
INSERT INTO ontology_terms (vocabulary, preferred_label, display_name, sort_order) VALUES
    ('processing_method', 'centrifugation', 'Centrifugation', 1),
    ('processing_method', 'aliquoting', 'Aliquoting', 2),
    ('processing_method', 'fixation', 'Fixation', 3),
    ('processing_method', 'embedding', 'Embedding', 4),
    ('processing_method', 'sectioning', 'Sectioning', 5),
    ('processing_method', 'dna_extraction', 'DNA Extraction', 6),
    ('processing_method', 'rna_extraction', 'RNA Extraction', 7),
    ('processing_method', 'protein_extraction', 'Protein Extraction', 8),
    ('processing_method', 'filtration', 'Filtration', 9),
    ('processing_method', 'lyophilization', 'Lyophilization', 10)
ON CONFLICT (vocabulary, preferred_label) DO NOTHING;

-- Storage conditions
INSERT INTO ontology_terms (vocabulary, preferred_label, display_name, sort_order) VALUES
    ('storage_condition', 'ambient', 'Ambient / Room Temperature', 1),
    ('storage_condition', 'refrigerated_4c', 'Refrigerated (4°C)', 2),
    ('storage_condition', 'frozen_minus_20', 'Frozen (-20°C)', 3),
    ('storage_condition', 'frozen_minus_80', 'Frozen (-80°C)', 4),
    ('storage_condition', 'ln2_vapor', 'LN2 Vapor Phase', 5),
    ('storage_condition', 'ln2_liquid', 'LN2 Liquid Phase', 6),
    ('storage_condition', 'ffpe_ambient', 'FFPE Block (Ambient)', 7),
    ('storage_condition', 'rna_later', 'RNAlater (4°C or -20°C)', 8)
ON CONFLICT (vocabulary, preferred_label) DO NOTHING;

-- Container types
INSERT INTO ontology_terms (vocabulary, preferred_label, display_name, sort_order) VALUES
    ('container_type', 'sst_vial', 'SST Vial (Serum Separator)', 1),
    ('container_type', 'edta_tube', 'EDTA Tube (Lavender Top)', 2),
    ('container_type', 'heparin_tube', 'Heparin Tube (Green Top)', 3),
    ('container_type', 'citrate_tube', 'Citrate Tube (Blue Top)', 4),
    ('container_type', 'cryovial', 'Cryovial', 5),
    ('container_type', 'microtainer', 'Microtainer', 6),
    ('container_type', 'slide', 'Glass Slide', 7),
    ('container_type', 'block', 'Paraffin Block', 8),
    ('container_type', 'paxgene_tube', 'PAXgene Tube', 9),
    ('container_type', 'urine_cup', 'Urine Collection Cup', 10),
    ('container_type', 'sterile_container', 'Sterile Container', 11),
    ('container_type', 'tissue_cassette', 'Tissue Cassette', 12)
ON CONFLICT (vocabulary, preferred_label) DO NOTHING;

-- Regulatory document types
INSERT INTO ontology_terms (vocabulary, preferred_label, display_name, sort_order) VALUES
    ('regulatory_doc_type', 'mta', 'Material Transfer Agreement', 1),
    ('regulatory_doc_type', 'dua', 'Data Use Agreement', 2),
    ('regulatory_doc_type', 'irb_approval', 'IRB Approval', 3),
    ('regulatory_doc_type', 'informed_consent', 'Informed Consent', 4),
    ('regulatory_doc_type', 'hipaa_baa', 'HIPAA Business Associate Agreement', 5),
    ('regulatory_doc_type', 'dpa', 'Data Processing Agreement', 6),
    ('regulatory_doc_type', 'export_permit', 'Export Permit', 7),
    ('regulatory_doc_type', 'import_permit', 'Import Permit', 8)
ON CONFLICT (vocabulary, preferred_label) DO NOTHING;

-- Diagnosis (starter taxonomy — ICD-10 top-level)
INSERT INTO ontology_terms (vocabulary, preferred_label, display_name, parent_id, sort_order) VALUES
    ('diagnosis', 'C00-D49', 'Neoplasms', NULL, 1),
    ('diagnosis', 'C50', 'Breast Cancer', NULL, 2),
    ('diagnosis', 'C61', 'Prostate Cancer', NULL, 3),
    ('diagnosis', 'C18-C20', 'Colorectal Cancer', NULL, 4),
    ('diagnosis', 'C34', 'Lung Cancer', NULL, 5),
    ('diagnosis', 'D50-D89', 'Diseases of the Blood', NULL, 6),
    ('diagnosis', 'E00-E89', 'Endocrine/Metabolic', NULL, 7),
    ('diagnosis', 'I00-I99', 'Circulatory System', NULL, 8),
    ('diagnosis', 'M00-M99', 'Musculoskeletal', NULL, 9),
    ('diagnosis', 'G00-G99', 'Nervous System', NULL, 10)
ON CONFLICT (vocabulary, preferred_label) DO NOTHING;
