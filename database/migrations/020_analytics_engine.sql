-- ============================================================================
-- KADARN PLATFORM — Sprint 10: Analytics Engine
-- ============================================================================
-- Target: PostgreSQL 15+ (Supabase compatible)
-- Dependencies: All prior migrations (008-019)
--
-- This migration creates the Analytics Engine:
--   1. analytics_network_snapshots — periodic network health
--   2. analytics_program_metrics — program performance
--   3. analytics_supplier_metrics — supplier quality tracking
--   4. analytics_search_queries — search/discovery analytics
--   5. Materialized views for dashboards
--   6. RLS policies
-- (Blueprint §16 — Analytics Engine)
-- ============================================================================

-- ############################################################################
-- PART 1: TABLE — analytics_network_snapshots
-- ############################################################################
--
-- Periodic snapshots of network health.
-- (Blueprint §16.2 — Network Health)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.analytics_network_snapshots (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Snapshot period
    period_start        DATE NOT NULL,
    period_end          DATE NOT NULL,
    snapshot_type       TEXT NOT NULL DEFAULT 'daily' CHECK (snapshot_type IN ('daily', 'weekly', 'monthly')),

    -- Organization metrics
    total_organizations     INTEGER NOT NULL DEFAULT 0,
    active_organizations    INTEGER NOT NULL DEFAULT 0,
    total_capabilities      INTEGER NOT NULL DEFAULT 0,
    orgs_by_country         JSONB DEFAULT '{}',

    -- Program metrics
    total_programs          INTEGER NOT NULL DEFAULT 0,
    active_programs         INTEGER NOT NULL DEFAULT 0,
    completed_programs      INTEGER NOT NULL DEFAULT 0,

    -- Supply metrics
    total_supply_items      INTEGER NOT NULL DEFAULT 0,
    supply_items_by_type    JSONB DEFAULT '{}',

    -- Network activity
    total_exchange_requests INTEGER NOT NULL DEFAULT 0,
    total_deals             INTEGER NOT NULL DEFAULT 0,
    active_deals            INTEGER NOT NULL DEFAULT 0,
    total_audit_events      INTEGER NOT NULL DEFAULT 0,

    Data
    metadata                JSONB DEFAULT '{}',
    computed_at             TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (period_start, snapshot_type)
);

CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_period
    ON public.analytics_network_snapshots(period_start DESC);

COMMENT ON TABLE public.analytics_network_snapshots IS
    'Periodic network health snapshots for trend analysis.';

-- ############################################################################
-- PART 2: TABLE — analytics_program_metrics
-- ############################################################################
--
-- Per-program performance metrics.
-- (Blueprint §16.2 — Program Performance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.analytics_program_metrics (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id          UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,

    -- Timeline metrics
    days_in_draft       INTEGER,
    days_active         INTEGER,
    days_to_completion  INTEGER,   -- draft → completed
    days_to_first_milestone INTEGER,

    -- Participant metrics
    participant_count   INTEGER NOT NULL DEFAULT 0,
    org_countries       TEXT[] DEFAULT '{}',

    -- Milestone metrics
    total_milestones    INTEGER NOT NULL DEFAULT 0,
    completed_milestones INTEGER NOT NULL DEFAULT 0,
    milestone_completion_rate NUMERIC(5,2),  -- percentage

    -- Sample metrics (from processing engine)
    total_samples       INTEGER NOT NULL DEFAULT 0,
    processed_samples   INTEGER NOT NULL DEFAULT 0,

    -- Exchange metrics
    total_requests      INTEGER NOT NULL DEFAULT 0,
    total_deals         INTEGER NOT NULL DEFAULT 0,
    deal_value_total    NUMERIC(14,2),

    -- Audit
    metadata            JSONB DEFAULT '{}',
    computed_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (program_id)
);

CREATE INDEX IF NOT EXISTS idx_analytics_program_metrics_prog
    ON public.analytics_program_metrics(program_id);

COMMENT ON TABLE public.analytics_program_metrics IS
    'Per-program performance metrics. Updated by periodic computation.';

-- ############################################################################
-- PART 3: TABLE — analytics_supplier_metrics
-- ############################################################################
--
-- Supplier quality and performance tracking.
-- (Blueprint §16.2 — Supplier Quality)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.analytics_supplier_metrics (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Time period
    period_start        DATE NOT NULL,
    period_end          DATE NOT NULL,

    -- Program involvement
    programs_participated   INTEGER NOT NULL DEFAULT 0,
    programs_completed      INTEGER NOT NULL DEFAULT 0,

    -- Delivery metrics
    total_deliveries        INTEGER NOT NULL DEFAULT 0,
    on_time_deliveries      INTEGER NOT NULL DEFAULT 0,
    on_time_rate            NUMERIC(5,2),  -- percentage
    avg_fulfillment_days    NUMERIC(8,2),

    -- Quality metrics
    total_qc_checks         INTEGER NOT NULL DEFAULT 0,
    qc_pass_count           INTEGER NOT NULL DEFAULT 0,
    qc_pass_rate            NUMERIC(5,2),

    -- Temperature compliance (for logistics providers)
    total_shipments         INTEGER NOT NULL DEFAULT 0,
    breach_free_shipments   INTEGER NOT NULL DEFAULT 0,
    temp_compliance_rate    NUMERIC(5,2),

    -- Exchange metrics
    deals_as_provider       INTEGER NOT NULL DEFAULT 0,
    deals_completed         INTEGER NOT NULL DEFAULT 0,
    deal_completion_rate    NUMERIC(5,2),

    -- Computed
    metadata            JSONB DEFAULT '{}',
    computed_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (organization_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_analytics_supplier_org
    ON public.analytics_supplier_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_analytics_supplier_period
    ON public.analytics_supplier_metrics(period_start DESC);

COMMENT ON TABLE public.analytics_supplier_metrics IS
    'Supplier quality and performance metrics. Key for feasibility engine.';

-- ############################################################################
-- PART 4: TABLE — analytics_search_queries
-- ############################################################################
--
-- Tracks search queries for discovery analytics.
-- (Blueprint §16.3 — Data Sources)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.analytics_search_queries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Query
    search_text         TEXT,
    filters_used        JSONB DEFAULT '{}',
    result_count        INTEGER,
    user_id             UUID,

    -- Timing
    query_date          DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_search_date
    ON public.analytics_search_queries(query_date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_search_text
    ON public.analytics_search_queries(search_text);

COMMENT ON TABLE public.analytics_search_queries IS
    'Search query tracking for discovery analytics.';

-- ############################################################################
-- PART 5: ANALYTICS FUNCTIONS
-- ############################################################################

-- Compute network snapshot
CREATE OR REPLACE FUNCTION public.compute_network_snapshot(
    p_period_start DATE,
    p_period_end DATE,
    p_snapshot_type TEXT DEFAULT 'daily'
)
RETURNS UUID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_snapshot_id UUID;
BEGIN
    INSERT INTO public.analytics_network_snapshots (
        period_start, period_end, snapshot_type,
        total_organizations, active_organizations, total_capabilities, orgs_by_country,
        total_programs, active_programs, completed_programs,
        total_supply_items, supply_items_by_type,
        total_exchange_requests, total_deals, active_deals,
        total_audit_events
    )
    SELECT
        p_period_start, p_period_end, p_snapshot_type,
        (SELECT COUNT(*) FROM public.organizations),
        (SELECT COUNT(*) FROM public.organizations WHERE is_active = true),
        (SELECT COUNT(*) FROM public.organization_capabilities),
        (SELECT COALESCE(jsonb_object_agg(country, cnt), '{}'::jsonb)
         FROM (SELECT country, COUNT(*) as cnt FROM public.organizations GROUP BY country) AS orgs),
        (SELECT COUNT(*) FROM public.programs),
        (SELECT COUNT(*) FROM public.programs WHERE status = 'active'),
        (SELECT COUNT(*) FROM public.programs WHERE status = 'completed'),
        (SELECT COUNT(*) FROM public.supply_items),
        (SELECT COALESCE(jsonb_object_agg(type, cnt), '{}'::jsonb)
         FROM (SELECT type::text, COUNT(*) as cnt FROM public.supply_items GROUP BY type) AS si),
        (SELECT COUNT(*) FROM public.exchange_requests),
        (SELECT COUNT(*) FROM public.exchange_deals),
        (SELECT COUNT(*) FROM public.exchange_deals WHERE status IN ('active', 'fulfillment')),
        (SELECT COUNT(*) FROM public.audit_events)
    RETURNING id INTO v_snapshot_id;

    RETURN v_snapshot_id;
END;
$$;

COMMENT ON FUNCTION public.compute_network_snapshot IS
    'Computes a periodic network health snapshot from all data sources.';

-- Compute program metrics
CREATE OR REPLACE FUNCTION public.compute_program_metrics(p_program_id UUID)
RETURNS UUID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_metrics_id UUID;
BEGIN
    INSERT INTO public.analytics_program_metrics (
        program_id,
        days_in_draft, days_active, days_to_completion,
        participant_count, org_countries,
        total_milestones, completed_milestones, milestone_completion_rate,
        total_samples, processed_samples,
        total_requests, total_deals, deal_value_total
    )
    SELECT
        p_program_id,
        -- days in draft
        (SELECT CASE WHEN status = 'draft' THEN EXTRACT(DAY FROM now() - created_at)::INTEGER ELSE NULL END
         FROM public.programs WHERE id = p_program_id),
        -- days active
        (SELECT CASE WHEN status = 'active' THEN EXTRACT(DAY FROM now() - created_at)::INTEGER ELSE NULL END
         FROM public.programs WHERE id = p_program_id),
        -- days to completion
        (SELECT EXTRACT(DAY FROM updated_at - created_at)::INTEGER
         FROM public.programs WHERE id = p_program_id AND status = 'completed'),
        -- participants
        (SELECT COUNT(*) FROM public.program_participants WHERE program_id = p_program_id),
        -- org countries
        (SELECT ARRAY_AGG(DISTINCT o.country) FROM public.program_participants pp
         JOIN public.organizations o ON o.id = pp.organization_id WHERE pp.program_id = p_program_id),
        -- milestones
        (SELECT COUNT(*) FROM public.program_milestones WHERE program_id = p_program_id),
        (SELECT COUNT(*) FROM public.program_milestones WHERE program_id = p_program_id AND status = 'completed'),
        -- milestone completion rate
        (SELECT CASE WHEN COUNT(*) > 0 THEN ROUND(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100, 2) ELSE 0 END
         FROM public.program_milestones WHERE program_id = p_program_id),
        -- samples
        (SELECT COUNT(*) FROM public.processing_samples WHERE program_id = p_program_id),
        (SELECT COUNT(*) FROM public.processing_samples WHERE program_id = p_program_id AND current_state IN ('stored', 'shipped', 'consumed', 'archived')),
        -- exchange
        (SELECT COUNT(*) FROM public.exchange_requests WHERE program_id = p_program_id),
        (SELECT COUNT(*) FROM public.exchange_deals WHERE program_id = p_program_id),
        (SELECT SUM(total_value) FROM public.exchange_deals WHERE program_id = p_program_id)
    RETURNING id INTO v_metrics_id;

    RETURN v_metrics_id;
END;
$$;

COMMENT ON FUNCTION public.compute_program_metrics IS
    'Computes performance metrics for a specific program.';

-- ############################################################################
-- PART 6: MATERIALIZED VIEWS
-- ############################################################################

-- Network overview dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS public.vw_network_overview AS
SELECT
    COUNT(DISTINCT o.id) AS total_organizations,
    COUNT(DISTINCT o.id) FILTER (WHERE o.is_active) AS active_organizations,
    COUNT(DISTINCT oct.key) AS capability_types,
    COUNT(DISTINCT oc.id) AS total_capabilities,
    COUNT(DISTINCT p.id) AS total_programs,
    COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'active') AS active_programs,
    COUNT(DISTINCT si.id) AS supply_items,
    COUNT(DISTINCT er.id) AS exchange_requests,
    COUNT(DISTINCT ed.id) AS exchange_deals,
    COUNT(DISTINCT ps.id) AS processing_samples
FROM public.organizations o
LEFT JOIN public.organization_capabilities oc ON oc.organization_id = o.id
LEFT JOIN public.organization_capability_types oct ON oct.id = oc.capability_type_id
LEFT JOIN public.programs p ON true
LEFT JOIN public.supply_items si ON true
LEFT JOIN public.exchange_requests er ON true
LEFT JOIN public.exchange_deals ed ON true
LEFT JOIN public.processing_samples ps ON true;

COMMENT ON MATERIALIZED VIEW public.vw_network_overview IS
    'Network overview dashboard — aggregate counts across all entities.';

-- Program performance view
CREATE MATERIALIZED VIEW IF NOT EXISTS public.vw_program_performance AS
SELECT
    p.id AS program_id,
    p.name AS program_name,
    p.status,
    p.created_at,
    p.updated_at,
    COUNT(DISTINCT pp.organization_id) AS participant_count,
    COUNT(DISTINCT pm.id) AS milestone_count,
    COUNT(DISTINCT pm.id) FILTER (WHERE pm.status = 'completed') AS milestones_completed,
    COUNT(DISTINCT ps.id) AS sample_count,
    COUNT(DISTINCT ed.id) AS deal_count
FROM public.programs p
LEFT JOIN public.program_participants pp ON pp.program_id = p.id
LEFT JOIN public.program_milestones pm ON pm.program_id = p.id
LEFT JOIN public.processing_samples ps ON ps.program_id = p.id
LEFT JOIN public.exchange_deals ed ON ed.program_id = p.id
GROUP BY p.id, p.name, p.status, p.created_at, p.updated_at;

COMMENT ON MATERIALIZED VIEW public.vw_program_performance IS
    'Program performance view — aggregate metrics per program.';

-- Supplier quality view
CREATE MATERIALIZED VIEW IF NOT EXISTS public.vw_supplier_quality AS
SELECT
    o.id AS organization_id,
    o.name AS organization_name,
    o.country,
    COUNT(DISTINCT pp.program_id) AS programs_participated,
    COUNT(DISTINCT ed.id) AS deals_as_provider,
    COUNT(DISTINCT ed.id) FILTER (WHERE ed.status = 'completed') AS deals_completed
FROM public.organizations o
LEFT JOIN public.program_participants pp ON pp.organization_id = o.id
LEFT JOIN public.exchange_deals ed ON ed.provider_org_id = o.id
GROUP BY o.id, o.name, o.country;

COMMENT ON MATERIALIZED VIEW public.vw_supplier_quality IS
    'Supplier quality view — aggregate metrics per organization.';

-- ############################################################################
-- PART 7: RLS
-- ############################################################################

ALTER TABLE public.analytics_network_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_program_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_supplier_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_search_queries ENABLE ROW LEVEL SECURITY;

-- Network snapshots: visible to all authenticated (no sensitive data)
CREATE POLICY analytics_snapshots_select ON public.analytics_network_snapshots
    FOR SELECT USING (auth.role() = 'authenticated');

-- Program metrics: program participants
CREATE POLICY analytics_program_metrics_select ON public.analytics_program_metrics
    FOR SELECT USING (public.can_access_program(program_id) OR public.is_org_admin());

-- Supplier metrics: visible to all authenticated (quality data)
CREATE POLICY analytics_supplier_metrics_select ON public.analytics_supplier_metrics
    FOR SELECT USING (auth.role() = 'authenticated');

-- Search queries: insertable by any authenticated user
CREATE POLICY analytics_search_queries_insert ON public.analytics_search_queries
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY analytics_search_queries_select ON public.analytics_search_queries
    FOR SELECT USING (auth.role() = 'authenticated');

-- Materialized views RLS
ALTER MATERIALIZED VIEW public.vw_network_overview OWNER TO postgres;
ALTER MATERIALIZED VIEW public.vw_program_performance OWNER TO postgres;
ALTER MATERIALIZED VIEW public.vw_supplier_quality OWNER TO postgres;

-- Grant select on views
GRANT SELECT ON public.vw_network_overview TO anon, authenticated, service_role;
GRANT SELECT ON public.vw_program_performance TO anon, authenticated, service_role;
GRANT SELECT ON public.vw_supplier_quality TO anon, authenticated, service_role;

-- ############################################################################
-- PART 8: POSTGREST PERMISSIONS
-- ############################################################################

GRANT ALL ON public.analytics_network_snapshots TO anon, authenticated, service_role;
GRANT ALL ON public.analytics_program_metrics TO anon, authenticated, service_role;
GRANT ALL ON public.analytics_supplier_metrics TO anon, authenticated, service_role;
GRANT ALL ON public.analytics_search_queries TO anon, authenticated, service_role;

-- ============================================================================
-- END OF MIGRATION 020 — Sprint 10: Analytics Engine
-- ============================================================================
