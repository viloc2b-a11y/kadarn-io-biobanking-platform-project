-- ============================================================================
-- KADARN PLATFORM — Sprint 4: Domain Events Runtime
-- ============================================================================
-- Event Store + Outbox Pattern + Idempotency + Replay
-- Depends on: 010_audit_programs, 035_compliance_append_only
-- ============================================================================

-- ############################################################################
-- PART 1: EVENT STORE (APPEND-ONLY)
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.domain_event_store (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type          TEXT NOT NULL,
    event_version       INTEGER NOT NULL DEFAULT 1,
    occurred_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    recorded_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    actor_id            UUID NOT NULL,
    organization_id     UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    program_id          UUID REFERENCES public.programs(id) ON DELETE SET NULL,
    correlation_id      UUID,
    causation_id        UUID,
    idempotency_key     TEXT,
    payload             JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,

    CONSTRAINT domain_event_store_idempotency_unique
        UNIQUE NULLS NOT DISTINCT (idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_domain_event_store_type_time
    ON public.domain_event_store(event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_domain_event_store_correlation
    ON public.domain_event_store(correlation_id, occurred_at DESC)
    WHERE correlation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_domain_event_store_org
    ON public.domain_event_store(organization_id, occurred_at DESC)
    WHERE organization_id IS NOT NULL;

COMMENT ON TABLE public.domain_event_store IS
    'Append-only canonical domain event log. All cross-engine integration reads from here.';

-- ############################################################################
-- PART 2: OUTBOX (TRANSACTIONAL PUBLISH)
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.domain_event_outbox (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id            UUID NOT NULL REFERENCES public.domain_event_store(id) ON DELETE CASCADE,
    status              TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'published', 'failed')),
    attempts            INTEGER NOT NULL DEFAULT 0,
    next_attempt_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at        TIMESTAMPTZ,
    last_error          TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_domain_event_outbox_pending
    ON public.domain_event_outbox(status, next_attempt_at)
    WHERE status = 'pending';

COMMENT ON TABLE public.domain_event_outbox IS
    'Transactional outbox for async event dispatch to subscribers and external buses.';

-- ############################################################################
-- PART 3: PUBLISH — idempotent append + outbox enqueue
-- ############################################################################

CREATE OR REPLACE FUNCTION public.publish_domain_event(
    p_event_type        TEXT,
    p_payload           JSONB,
    p_actor_id          UUID,
    p_organization_id   UUID DEFAULT NULL,
    p_program_id        UUID DEFAULT NULL,
    p_correlation_id    UUID DEFAULT NULL,
    p_causation_id      UUID DEFAULT NULL,
    p_idempotency_key   TEXT DEFAULT NULL,
    p_event_version     INTEGER DEFAULT 1,
    p_metadata          JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_existing_id UUID;
    v_event_id UUID;
    v_outbox_id UUID;
BEGIN
    IF p_idempotency_key IS NOT NULL AND length(trim(p_idempotency_key)) > 0 THEN
        SELECT id INTO v_existing_id
        FROM public.domain_event_store
        WHERE idempotency_key = p_idempotency_key;

        IF v_existing_id IS NOT NULL THEN
            RETURN jsonb_build_object(
                'event_id', v_existing_id,
                'duplicate', true,
                'outbox_id', NULL
            );
        END IF;
    END IF;

    INSERT INTO public.domain_event_store (
        event_type, event_version, actor_id, organization_id, program_id,
        correlation_id, causation_id, idempotency_key, payload, metadata
    ) VALUES (
        p_event_type, COALESCE(p_event_version, 1), p_actor_id,
        p_organization_id, p_program_id, p_correlation_id, p_causation_id,
        NULLIF(trim(p_idempotency_key), ''), COALESCE(p_payload, '{}'::jsonb),
        COALESCE(p_metadata, '{}'::jsonb)
    )
    RETURNING id INTO v_event_id;

    INSERT INTO public.domain_event_outbox (event_id, status)
    VALUES (v_event_id, 'pending')
    RETURNING id INTO v_outbox_id;

    RETURN jsonb_build_object(
        'event_id', v_event_id,
        'duplicate', false,
        'outbox_id', v_outbox_id
    );
EXCEPTION
    WHEN unique_violation THEN
        SELECT id INTO v_existing_id
        FROM public.domain_event_store
        WHERE idempotency_key = p_idempotency_key;

        RETURN jsonb_build_object(
            'event_id', v_existing_id,
            'duplicate', true,
            'outbox_id', NULL
        );
END;
$$;

COMMENT ON FUNCTION public.publish_domain_event IS
    'Idempotent domain event publish: appends to event store and enqueues outbox row.';

-- ############################################################################
-- PART 4: OUTBOX PROCESSOR (mark published — handlers run in application layer)
-- ############################################################################

CREATE OR REPLACE FUNCTION public.process_domain_event_outbox(
    p_batch_size INTEGER DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_processed INTEGER := 0;
    v_row RECORD;
BEGIN
    FOR v_row IN
        SELECT o.id AS outbox_id, o.event_id, s.event_type, s.payload, s.actor_id,
               s.organization_id, s.program_id, s.correlation_id, s.event_version
        FROM public.domain_event_outbox o
        JOIN public.domain_event_store s ON s.id = o.event_id
        WHERE o.status = 'pending'
          AND o.next_attempt_at <= now()
        ORDER BY o.created_at ASC
        LIMIT GREATEST(p_batch_size, 1)
        FOR UPDATE OF o SKIP LOCKED
    LOOP
        UPDATE public.domain_event_outbox
        SET status = 'published',
            published_at = now(),
            attempts = attempts + 1
        WHERE id = v_row.outbox_id;

        v_processed := v_processed + 1;
    END LOOP;

    RETURN jsonb_build_object('processed', v_processed);
END;
$$;

-- ############################################################################
-- PART 5: REPLAY
-- ############################################################################

CREATE OR REPLACE FUNCTION public.replay_domain_events(
    p_from            TIMESTAMPTZ,
    p_to              TIMESTAMPTZ DEFAULT NULL,
    p_event_types     TEXT[] DEFAULT NULL,
    p_correlation_id  UUID DEFAULT NULL,
    p_limit           INTEGER DEFAULT 500
)
RETURNS SETOF public.domain_event_store
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT *
    FROM public.domain_event_store
    WHERE occurred_at >= p_from
      AND (p_to IS NULL OR occurred_at <= p_to)
      AND (p_event_types IS NULL OR event_type = ANY(p_event_types))
      AND (p_correlation_id IS NULL OR correlation_id = p_correlation_id)
    ORDER BY occurred_at ASC, recorded_at ASC
    LIMIT GREATEST(p_limit, 1);
$$;

-- ############################################################################
-- PART 6: APPEND-ONLY ENFORCEMENT
-- ############################################################################

SELECT public.apply_append_only_triggers('public.domain_event_store'::regclass);

REVOKE UPDATE, DELETE ON public.domain_event_store FROM anon, authenticated;

-- Outbox rows: allow status updates (not append-only — delivery state machine)
GRANT SELECT, INSERT, UPDATE ON public.domain_event_outbox TO service_role;
GRANT SELECT ON public.domain_event_store TO authenticated, service_role;
GRANT INSERT ON public.domain_event_store TO service_role;

-- ############################################################################
-- PART 7: RLS
-- ############################################################################

ALTER TABLE public.domain_event_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_event_outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY domain_event_store_select ON public.domain_event_store
    FOR SELECT
    USING (
        auth.role() = 'service_role'
        OR organization_id IS NULL
        OR organization_id IN (
            SELECT organization_id FROM public.user_organizations
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY domain_event_store_insert ON public.domain_event_store
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY domain_event_outbox_service ON public.domain_event_outbox
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

GRANT EXECUTE ON FUNCTION public.publish_domain_event TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.process_domain_event_outbox TO service_role;
GRANT EXECUTE ON FUNCTION public.replay_domain_events TO service_role;

-- ############################################################################
-- PART 8: VERIFY
-- ############################################################################

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'domain_event_store'
    ) THEN
        RAISE EXCEPTION 'domain_event_store table missing';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'publish_domain_event'
    ) THEN
        RAISE EXCEPTION 'publish_domain_event function missing';
    END IF;

    RAISE NOTICE 'Sprint 4 domain events runtime: store + outbox + publish RPC ready';
END;
$$;

-- ============================================================================
-- END OF MIGRATION 036
-- ============================================================================
