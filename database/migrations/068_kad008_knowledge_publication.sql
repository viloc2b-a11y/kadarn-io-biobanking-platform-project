-- ============================================================================
-- KAD-008 — Knowledge Publication
-- ============================================================================
-- Publish verified institutional knowledge derived from the Claim→Evidence→Confidence pipeline.
-- Published knowledge is the primary output consumed by sponsors and external stakeholders.
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE publication_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.published_knowledge (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    knowledge_type      TEXT NOT NULL DEFAULT 'capability_profile',
    title               TEXT NOT NULL,
    summary             TEXT,
    content             JSONB NOT NULL DEFAULT '{}',
    source_claim_id     UUID REFERENCES public.claims(id) ON DELETE SET NULL,
    source_capability_id UUID REFERENCES public.capabilities(id) ON DELETE SET NULL,
    status              publication_status NOT NULL DEFAULT 'draft',
    published_at        TIMESTAMPTZ,
    archived_at         TIMESTAMPTZ,
    created_by          UUID,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pub_knowledge_org ON public.published_knowledge(organization_id);
CREATE INDEX idx_pub_knowledge_type ON public.published_knowledge(knowledge_type);
CREATE INDEX idx_pub_knowledge_status ON public.published_knowledge(status);

DROP TRIGGER IF EXISTS trg_published_knowledge_updated_at ON public.published_knowledge;
CREATE TRIGGER trg_published_knowledge_updated_at
    BEFORE UPDATE ON public.published_knowledge
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE public.published_knowledge ENABLE ROW LEVEL SECURITY;

-- Anyone can read published knowledge
CREATE POLICY pk_select_published ON public.published_knowledge
    FOR SELECT USING (status = 'published' OR auth.role() = 'service_role');

CREATE POLICY pk_insert_org ON public.published_knowledge
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        ) OR auth.role() = 'service_role'
    );

CREATE POLICY pk_update_org ON public.published_knowledge
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
        ) OR auth.role() = 'service_role'
    );

GRANT SELECT ON public.published_knowledge TO anon, authenticated, service_role;
GRANT INSERT, UPDATE ON public.published_knowledge TO authenticated, service_role;
GRANT DELETE ON public.published_knowledge TO service_role;
