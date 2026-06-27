-- ============================================================================
-- KADARN PLATFORM — Transaction Twin + Shipment Twin
-- ============================================================================
-- Extends the Operational Twins foundation (migration 015) with Transaction
-- and Shipment twin types.
-- Reference: KRM-BNO §4.2 (Transaction Twin), §4.4 (Shipment Twin)
-- Dependencies: 015_operational_twins.sql (twin_events, apply_twin_event)
-- ============================================================================

-- ############################################################################
-- PART 1: EXTEND TWIN EVENT TYPE ENUM
-- ############################################################################

-- ALTER TYPE ... ADD VALUE cannot be in a transaction block in older PG
-- versions, but we wrap each in DO $$ for safety.

DO $$ BEGIN
    ALTER TYPE twin_event_type ADD VALUE IF NOT EXISTS 'TransactionInitiated';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE twin_event_type ADD VALUE IF NOT EXISTS 'GovernanceReviewStarted';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE twin_event_type ADD VALUE IF NOT EXISTS 'MTASigned';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE twin_event_type ADD VALUE IF NOT EXISTS 'PaymentEscrowed';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE twin_event_type ADD VALUE IF NOT EXISTS 'FulfillmentCompleted';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE twin_event_type ADD VALUE IF NOT EXISTS 'SettlementCompleted';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE twin_event_type ADD VALUE IF NOT EXISTS 'DisputeRaised';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE twin_event_type ADD VALUE IF NOT EXISTS 'DisputeResolved';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- PART 2: TRANSACTION TWINS
-- ############################################################################

CREATE TYPE transaction_status AS ENUM (
    'initiated',
    'governance_review',
    'mta_pending',
    'fulfilling',
    'completed',
    'disputed',
    'settled',
    'cancelled'
);

CREATE TABLE IF NOT EXISTS transaction_twins (
    id                  UUID PRIMARY KEY,
    organization_id     UUID NOT NULL REFERENCES organizations(id),

    status              transaction_status NOT NULL DEFAULT 'initiated',
    transaction_type    VARCHAR(50),        -- mta, dua, purchase, etc.
    provider_org_id     UUID REFERENCES organizations(id),
    recipient_org_id    UUID REFERENCES organizations(id),
    total_value         NUMERIC(12,2),
    currency            VARCHAR(3) DEFAULT 'USD',
    mta_id              UUID,
    payment_status      VARCHAR(50),        -- pending, escrowed, released, disputed

    twin_sequence       BIGINT NOT NULL DEFAULT 0,
    twin_updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    initiated_at        TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    initiated_by        UUID REFERENCES auth.users(id),
    notes               TEXT,

    CONSTRAINT transaction_twins_positive_sequence
        CHECK (twin_sequence >= 0)
);

CREATE INDEX IF NOT EXISTS idx_transaction_twins_org
    ON transaction_twins(organization_id);
CREATE INDEX IF NOT EXISTS idx_transaction_twins_status
    ON transaction_twins(status);

ALTER TABLE transaction_twins ENABLE ROW LEVEL SECURITY;

CREATE POLICY transaction_twins_select ON transaction_twins
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
        OR provider_org_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
        OR recipient_org_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
        OR auth.role() = 'service_role'
    );

CREATE POLICY transaction_twins_insert ON transaction_twins
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY transaction_twins_update ON transaction_twins
    FOR UPDATE USING (auth.role() = 'service_role');

-- ############################################################################
-- PART 3: SHIPMENT TWINS
-- ############################################################################

CREATE TYPE shipment_status AS ENUM (
    'scheduled',
    'preparing',
    'picked_up',
    'in_transit',
    'customs_hold',
    'delivered',
    'accepted',
    'disputed',
    'lost'
);

CREATE TABLE IF NOT EXISTS shipment_twins (
    id                  UUID PRIMARY KEY,
    organization_id     UUID NOT NULL REFERENCES organizations(id),

    status              shipment_status NOT NULL DEFAULT 'scheduled',
    courier             VARCHAR(100),
    tracking_number     VARCHAR(100),
    origin_org_id       UUID REFERENCES organizations(id),
    destination_org_id  UUID REFERENCES organizations(id),
    temperature_range   VARCHAR(50),        -- e.g. 'minus_80', 'ln2', 'ambient'
    current_temp        NUMERIC(5,1),       -- latest temperature reading
    breach_count        INTEGER NOT NULL DEFAULT 0,
    last_breach_at      TIMESTAMPTZ,
    chain_of_custody    JSONB DEFAULT '[]'::jsonb,

    twin_sequence       BIGINT NOT NULL DEFAULT 0,
    twin_updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    dispatched_at       TIMESTAMPTZ,
    delivered_at        TIMESTAMPTZ,
    dispatched_by       UUID REFERENCES auth.users(id),
    notes               TEXT,

    CONSTRAINT shipment_twins_positive_sequence
        CHECK (twin_sequence >= 0)
);

CREATE INDEX IF NOT EXISTS idx_shipment_twins_org
    ON shipment_twins(organization_id);
CREATE INDEX IF NOT EXISTS idx_shipment_twins_status
    ON shipment_twins(status);
CREATE INDEX IF NOT EXISTS idx_shipment_twins_courier
    ON shipment_twins(courier);

ALTER TABLE shipment_twins ENABLE ROW LEVEL SECURITY;

CREATE POLICY shipment_twins_select ON shipment_twins
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
        OR origin_org_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
        OR destination_org_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
        OR auth.role() = 'service_role'
    );

CREATE POLICY shipment_twins_insert ON shipment_twins
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY shipment_twins_update ON shipment_twins
    FOR UPDATE USING (auth.role() = 'service_role');
