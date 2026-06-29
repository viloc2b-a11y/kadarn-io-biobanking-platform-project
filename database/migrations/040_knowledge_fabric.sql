-- ============================================================================
-- KADARN PLATFORM — Sprint 10: Knowledge Fabric
-- ============================================================================
-- Automatic knowledge feeding: entity-term links, term candidates, semantic index
-- Dependencies: 026_knowledge_engine.sql, 013_discovery_engine.sql, 025_provenance_graph.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.knowledge_entity_links (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type         TEXT NOT NULL,
    entity_id           UUID NOT NULL,
    term_id             UUID REFERENCES public.ontology_terms(id) ON DELETE SET NULL,
    vocabulary          vocabulary_set NOT NULL,
    original_value      TEXT NOT NULL,
    normalized_label    TEXT NOT NULL,
    confidence          NUMERIC(5,3) NOT NULL DEFAULT 0.000,
    correlation_id      TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT knowledge_entity_links_unique
        UNIQUE (entity_type, entity_id, vocabulary, original_value)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_entity_links_entity
    ON public.knowledge_entity_links(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_entity_links_term
    ON public.knowledge_entity_links(term_id);

CREATE TABLE IF NOT EXISTS public.ontology_term_candidates (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vocabulary          vocabulary_set NOT NULL,
    candidate_term      TEXT NOT NULL,
    source_entity_type  TEXT,
    source_entity_id    UUID,
    occurrence_count    INTEGER NOT NULL DEFAULT 1,
    status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'rejected')),
    last_seen_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT ontology_term_candidates_unique UNIQUE (vocabulary, candidate_term)
);

CREATE INDEX IF NOT EXISTS idx_ontology_term_candidates_status
    ON public.ontology_term_candidates(status, last_seen_at DESC);

ALTER TABLE public.supply_items
    ADD COLUMN IF NOT EXISTS knowledge_expanded_terms TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_supply_items_knowledge_terms
    ON public.supply_items USING GIN (knowledge_expanded_terms);

CREATE OR REPLACE FUNCTION public.record_ontology_term_candidate(
    p_vocabulary vocabulary_set,
    p_candidate_term TEXT,
    p_source_entity_type TEXT DEFAULT NULL,
    p_source_entity_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.ontology_term_candidates (
        vocabulary,
        candidate_term,
        source_entity_type,
        source_entity_id,
        occurrence_count,
        last_seen_at
    )
    VALUES (
        p_vocabulary,
        lower(trim(p_candidate_term)),
        p_source_entity_type,
        p_source_entity_id,
        1,
        now()
    )
    ON CONFLICT (vocabulary, candidate_term) DO UPDATE
    SET occurrence_count = ontology_term_candidates.occurrence_count + 1,
        last_seen_at = now(),
        source_entity_type = COALESCE(EXCLUDED.source_entity_type, ontology_term_candidates.source_entity_type),
        source_entity_id = COALESCE(EXCLUDED.source_entity_id, ontology_term_candidates.source_entity_id)
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.discovery_search_semantic(
    p_search_text      TEXT DEFAULT NULL,
    p_types            supply_item_type[] DEFAULT NULL,
    p_sample_types     TEXT[] DEFAULT NULL,
    p_disease_icd10    TEXT DEFAULT NULL,
    p_country          TEXT DEFAULT NULL,
    p_commercial_only  BOOLEAN DEFAULT NULL,
    p_expanded_terms   TEXT[] DEFAULT NULL,
    p_limit            INTEGER DEFAULT 20,
    p_offset           INTEGER DEFAULT 0
)
RETURNS TABLE (
    id                  UUID,
    organization_id     UUID,
    type                supply_item_type,
    title               TEXT,
    description         TEXT,
    disease_icd10       TEXT,
    disease_label       TEXT,
    sample_types        TEXT[],
    country             TEXT,
    commercial_use_allowed BOOLEAN,
    status              TEXT,
    search_rank         REAL,
    total_count         BIGINT
)
LANGUAGE SQL
STABLE
AS $$
    SELECT *
    FROM public.discovery_search(
        p_search_text,
        p_types,
        CASE
            WHEN p_expanded_terms IS NOT NULL AND cardinality(p_expanded_terms) > 0
            THEN (
                SELECT ARRAY(
                    SELECT DISTINCT unnest(
                        COALESCE(p_sample_types, ARRAY[]::TEXT[]) || p_expanded_terms
                    )
                )
            )
            ELSE p_sample_types
        END,
        p_disease_icd10,
        p_country,
        p_commercial_only,
        p_limit,
        p_offset
    );
$$;

ALTER TABLE public.knowledge_entity_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ontology_term_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY knowledge_entity_links_select ON public.knowledge_entity_links
    FOR SELECT USING (true);

CREATE POLICY ontology_term_candidates_select ON public.ontology_term_candidates
    FOR SELECT USING (true);

COMMENT ON TABLE public.knowledge_entity_links IS
    'Links platform entities to normalized ontology terms (Knowledge Fabric).';
COMMENT ON TABLE public.ontology_term_candidates IS
    'Staging queue for unknown terms discovered during automatic ingestion.';
COMMENT ON FUNCTION public.discovery_search_semantic IS
    'Discovery search enriched with knowledge-expanded sample type terms.';
