-- ============================================================================
-- KADARN PLATFORM — Sprint 6: Exchange Engine
-- ============================================================================
-- Target: PostgreSQL 15+ (Supabase compatible)
-- Dependencies: 008, 009, 010, 013 (supply_items)
--
-- This migration creates the Exchange Engine:
--   1. exchange_requests — research access requests (Interest phase)
--   2. exchange_messages — multi-party negotiation messaging
--   3. exchange_deals — deal state machine (Agreement → Settlement)
--   4. exchange_escrow — escrow tracking
--   5. RLS policies
-- (Blueprint §9 — Exchange / Commercial Engine)
-- ============================================================================

-- ############################################################################
-- PART 1: ENUMS
-- ############################################################################

DO $$ BEGIN
    CREATE TYPE exchange_request_status AS ENUM (
        'draft', 'submitted', 'under_review', 'negotiation', 'accepted', 'declined', 'withdrawn'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE exchange_deal_status AS ENUM (
        'pending_acceptance', 'active', 'fulfillment', 'completed', 'cancelled', 'disputed'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE escrow_status AS ENUM (
        'pending', 'funded', 'partially_released', 'released', 'refunded', 'disputed'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- PART 2: TABLE — exchange_requests
-- ############################################################################
--
-- A researcher submits a request to access supply items or join a program.
-- (Blueprint §9.2 — Interest phase)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.exchange_requests (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Who is requesting
    requester_id        UUID NOT NULL,
    organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- What they want
    program_id          UUID REFERENCES public.programs(id) ON DELETE SET NULL,
    supply_item_id      UUID REFERENCES public.supply_items(id) ON DELETE SET NULL,

    -- Request details
    title               TEXT NOT NULL,
    description         TEXT,
    status              exchange_request_status NOT NULL DEFAULT 'draft',

    -- Target organizations (who can respond)
    target_org_ids      UUID[] DEFAULT '{}',

    -- Terms requested
    requested_sample_count  INTEGER,
    requested_data_categories TEXT[] DEFAULT '{}',
    requested_timeline_days  INTEGER,
    budget_range_min        NUMERIC(12,2),
    budget_range_max        NUMERIC(12,2),

    -- Commercial
    commercial_use      BOOLEAN NOT NULL DEFAULT false,
    nonprofit_use       BOOLEAN NOT NULL DEFAULT true,

    -- Metadata
    metadata            JSONB DEFAULT '{}',
    submitted_at        TIMESTAMPTZ,
    resolved_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exchange_req_requester
    ON public.exchange_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_exchange_req_org
    ON public.exchange_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_exchange_req_program
    ON public.exchange_requests(program_id);
CREATE INDEX IF NOT EXISTS idx_exchange_req_status
    ON public.exchange_requests(status);

COMMENT ON TABLE public.exchange_requests IS
    'Research access requests. Submitted by researchers to express interest in supply items or programs.';

-- ############################################################################
-- PART 3: TABLE — exchange_messages
-- ############################################################################
--
-- Multi-party negotiation messaging.
-- (Blueprint §9.2 — Negotiation phase)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.exchange_messages (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id          UUID NOT NULL REFERENCES public.exchange_requests(id) ON DELETE CASCADE,
    deal_id             UUID REFERENCES public.exchange_deals(id) ON DELETE SET NULL,

    -- Who sent it
    sender_id           UUID NOT NULL,
    sender_org_id       UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    sender_name         TEXT,

    -- Content
    message             TEXT NOT NULL,
    message_type        TEXT NOT NULL DEFAULT 'general'
                        CHECK (message_type IN ('general', 'offer', 'counter', 'acceptance', 'rejection', 'question', 'file')),

    -- Attachments (file IDs)
    attachments         UUID[] DEFAULT '{}',

    -- Metadata
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exchange_msg_request
    ON public.exchange_messages(request_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_exchange_msg_deal
    ON public.exchange_messages(deal_id);

COMMENT ON TABLE public.exchange_messages IS
    'Multi-party negotiation messages. Threaded by request_id.';

-- ############################################################################
-- PART 4: TABLE — exchange_deals
-- ############################################################################
--
-- A deal represents an agreed exchange between parties.
-- (Blueprint §9.2 — Agreement → Settlement)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.exchange_deals (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id          UUID NOT NULL REFERENCES public.exchange_requests(id) ON DELETE CASCADE,

    -- Parties
    sponsor_org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    provider_org_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    program_id          UUID REFERENCES public.programs(id) ON DELETE SET NULL,

    -- Deal terms
    title               TEXT NOT NULL,
    description         TEXT,
    status              exchange_deal_status NOT NULL DEFAULT 'pending_acceptance',

    -- Financial terms
    total_value         NUMERIC(12,2),
    milestone_amounts   JSONB DEFAULT '{}',  -- {milestone: amount, ...}
    currency            TEXT DEFAULT 'USD',

    -- MTA (Material Transfer Agreement)
    mta_signed_by_sponsor   BOOLEAN NOT NULL DEFAULT false,
    mta_signed_by_provider  BOOLEAN NOT NULL DEFAULT false,
    mta_signed_at           TIMESTAMPTZ,
    mta_document_id         TEXT,

    -- Timeline
    expected_start_date     DATE,
    expected_end_date       DATE,
    actual_start_date       DATE,
    actual_end_date         DATE,

    -- Delivery tracking
    sample_count_expected   INTEGER,
    sample_count_delivered  INTEGER DEFAULT 0,
    delivery_percentage     NUMERIC(5,2) GENERATED ALWAYS AS
        (CASE WHEN sample_count_expected > 0
              THEN ROUND((sample_count_delivered::NUMERIC / sample_count_expected) * 100, 2)
              ELSE 0 END) STORED,

    -- Metadata
    metadata            JSONB DEFAULT '{}',
    created_by          UUID NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exchange_deals_request
    ON public.exchange_deals(request_id);
CREATE INDEX IF NOT EXISTS idx_exchange_deals_sponsor
    ON public.exchange_deals(sponsor_org_id);
CREATE INDEX IF NOT EXISTS idx_exchange_deals_provider
    ON public.exchange_deals(provider_org_id);
CREATE INDEX IF NOT EXISTS idx_exchange_deals_status
    ON public.exchange_deals(status);

COMMENT ON TABLE public.exchange_deals IS
    'Exchange deals — the commercial agreement between sponsor and provider.';

-- ############################################################################
-- PART 5: TABLE — exchange_escrow
-- ############################################################################
--
-- Escrow tracking for deal payments.
-- (Blueprint §9.2 — Settlement phase)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.exchange_escrow (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id             UUID NOT NULL REFERENCES public.exchange_deals(id) ON DELETE CASCADE,

    -- Escrow details
    status              escrow_status NOT NULL DEFAULT 'pending',
    total_amount        NUMERIC(12,2) NOT NULL,
    released_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
    refunded_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,

    -- Milestone-based release
    milestones          JSONB DEFAULT '[]',  -- [{name, amount, due_date, released_at}, ...]

    -- Third-party escrow provider (future)
    escrow_provider     TEXT,
    escrow_reference    TEXT,

    -- Audit
    funded_at           TIMESTAMPTZ,
    released_at         TIMESTAMPTZ,
    created_by          UUID NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (deal_id)
);

COMMENT ON TABLE public.exchange_escrow IS
    'Escrow accounts for exchange deals. Tracks funding, milestone release, and refunds.';

-- ############################################################################
-- PART 6: TRIGGERS
-- ############################################################################

CREATE TRIGGER trg_exchange_requests_updated_at
    BEFORE UPDATE ON public.exchange_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_exchange_deals_updated_at
    BEFORE UPDATE ON public.exchange_deals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_exchange_escrow_updated_at
    BEFORE UPDATE ON public.exchange_escrow
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ############################################################################
-- PART 7: RLS
-- ############################################################################

ALTER TABLE public.exchange_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_escrow ENABLE ROW LEVEL SECURITY;

-- Exchange Requests: requester sees own; org_admin sees org's
CREATE POLICY exchange_requests_select_self ON public.exchange_requests
    FOR SELECT
    USING (requester_id = auth.uid());
CREATE POLICY exchange_requests_select_admin ON public.exchange_requests
    FOR SELECT
    USING (public.is_org_admin(organization_id));
CREATE POLICY exchange_requests_insert ON public.exchange_requests
    FOR INSERT
    WITH CHECK (requester_id = auth.uid());
CREATE POLICY exchange_requests_update ON public.exchange_requests
    FOR UPDATE
    USING (requester_id = auth.uid() OR public.is_org_admin(organization_id))
    WITH CHECK (requester_id = auth.uid() OR public.is_org_admin(organization_id));

-- Messages: participants in the request thread can read/write
CREATE POLICY exchange_messages_select ON public.exchange_messages
    FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.exchange_requests er
                WHERE er.id = request_id
                  AND (er.requester_id = auth.uid() OR public.is_org_admin(er.organization_id)))
    );
CREATE POLICY exchange_messages_insert ON public.exchange_messages
    FOR INSERT
    WITH CHECK (sender_id = auth.uid());

-- Deals: participating orgs can see
CREATE POLICY exchange_deals_select ON public.exchange_deals
    FOR SELECT
    USING (
        public.is_org_member(sponsor_org_id)
        OR public.is_org_member(provider_org_id)
        OR public.is_org_admin()
    );
CREATE POLICY exchange_deals_insert ON public.exchange_deals
    FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.exchange_requests er
                WHERE er.id = request_id
                  AND (er.requester_id = auth.uid() OR public.is_org_admin(er.organization_id)))
    );
CREATE POLICY exchange_deals_update ON public.exchange_deals
    FOR UPDATE
    USING (public.is_org_admin(sponsor_org_id) OR public.is_org_admin(provider_org_id));

-- Escrow: deal participants can see
CREATE POLICY exchange_escrow_select ON public.exchange_escrow
    FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.exchange_deals ed
                WHERE ed.id = deal_id
                  AND (public.is_org_member(ed.sponsor_org_id) OR public.is_org_member(ed.provider_org_id)))
    );
CREATE POLICY exchange_escrow_insert ON public.exchange_escrow
    FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.exchange_deals ed
                WHERE ed.id = deal_id AND public.is_org_admin(ed.sponsor_org_id))
    );
CREATE POLICY exchange_escrow_update ON public.exchange_escrow
    FOR UPDATE
    USING (
        EXISTS (SELECT 1 FROM public.exchange_deals ed
                WHERE ed.id = deal_id AND public.is_org_admin(ed.sponsor_org_id))
    );

-- ############################################################################
-- PART 8: POSTGREST PERMISSIONS
-- ############################################################################

GRANT ALL ON public.exchange_requests TO anon, authenticated, service_role;
GRANT ALL ON public.exchange_messages TO anon, authenticated, service_role;
GRANT ALL ON public.exchange_deals TO anon, authenticated, service_role;
GRANT ALL ON public.exchange_escrow TO anon, authenticated, service_role;

-- ============================================================================
-- END OF MIGRATION 016 — Sprint 6: Exchange Engine
-- ============================================================================
