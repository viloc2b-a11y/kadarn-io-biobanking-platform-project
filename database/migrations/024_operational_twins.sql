-- ============================================================================
-- KADARN PLATFORM — Operational Twins (Event-Sourced Digital Representations)
-- ============================================================================
-- Target: PostgreSQL 15+ (Supabase compatible)
-- Domain: Event-sourced Operational Twins for biospecimen, transaction,
--         shipment, and collection lifecycle tracking
-- Design: ADR-012 — Operational Twins: Event-Sourced Digital Representations
-- Reference: KRM-RAO §2.2 (Operational Twin), §3.4 (Twins)
--            KRM-BNO §4 (Operational Twin Specialization)
-- Dependencies: 008_organizations_capabilities.sql (organizations table)
--               013_policy_engine.sql (policies — for consent/policy references)
--
-- This migration creates the shared event store and the Specimen Twin
-- as the first Operational Twin implementation.
-- ============================================================================

-- ############################################################################
-- PART 1: ENUMS
-- ############################################################################

DO $$ BEGIN
    CREATE TYPE twin_type AS ENUM (
        'specimen',
        'transaction',
        'shipment',
        'organization',
        'collection'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE twin_event_type AS ENUM (
        -- Specimen events
        'SpecimenCollected',
        'AliquotCreated',
        'QCPassed',
        'QCFailed',
        'FreezeThawRecorded',
        'VolumeAdjusted',
        'ShipmentInitiated',
        'Consumed',
        'Destroyed',
        'LocationChanged',
        'ConsentUpdated',
        -- Transaction events
        'TransactionInitiated',
        'GovernanceReviewStarted',
        'PolicyApproved',
        'PolicyDenied',
        'MTASigned',
        'FulfillmentStarted',
        'FulfillmentCompleted',
        'SettlementCompleted',
        -- Shipment events
        'ShipmentScheduled',
        'ShipmentPickedUp',
        'TemperatureReading',
        'TemperatureBreach',
        'ShipmentDelivered',
        'ShipmentAccepted',
        'ShipmentDisputed',
        -- Organization events
        'OrganizationRegistered',
        'AccreditationAdded',
        'AccreditationExpired',
        'TrustScoreUpdated',
        -- Collection events
        'CollectionRegistered',
        'DonorEnrolled',
        'DonorWithdrawn'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- PART 2: SHARED EVENT STORE
-- ############################################################################

CREATE TABLE IF NOT EXISTS twin_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    twin_type       twin_type NOT NULL,
    twin_id         UUID NOT NULL,
    event_type      twin_event_type NOT NULL,
    payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
    sequence        BIGINT NOT NULL,
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    actor_id        UUID REFERENCES auth.users(id),
    evidence_ref    TEXT,

    -- Sequence must be unique per twin
    CONSTRAINT twin_events_unique_sequence
        UNIQUE (twin_type, twin_id, sequence),

    -- Sequence must be positive
    CONSTRAINT twin_events_positive_sequence
        CHECK (sequence > 0)
);

COMMENT ON TABLE twin_events IS
    'Immutable event store for all Operational Twins. Events are append-only.';
COMMENT ON COLUMN twin_events.sequence IS
    'Monotonic, gapless sequence number per twin. Used for deterministic reconstruction.';
COMMENT ON COLUMN twin_events.payload IS
    'Event-specific data. Schema depends on event_type.';
COMMENT ON COLUMN twin_events.evidence_ref IS
    'Optional reference to supporting evidence (document hash, external event ID).';

-- Index for event replay: get all events for a twin in order
CREATE INDEX IF NOT EXISTS idx_twin_events_replay
    ON twin_events(twin_type, twin_id, sequence ASC);

-- Index for time-range queries (reconstruction at time T)
CREATE INDEX IF NOT EXISTS idx_twin_events_time
    ON twin_events(twin_type, twin_id, recorded_at DESC);

-- Index for event type queries
CREATE INDEX IF NOT EXISTS idx_twin_events_event_type
    ON twin_events(event_type);

-- ############################################################################
-- PART 3: SPECIMEN TWINS — CURRENT STATE TABLE
-- ############################################################################

CREATE TYPE specimen_status AS ENUM (
    'collected',
    'stored',
    'shipped',
    'received',
    'consumed',
    'destroyed',
    'quarantined'
);

CREATE TABLE IF NOT EXISTS specimen_twins (
    id                  UUID PRIMARY KEY,  -- same as the specimen/research asset ID
    organization_id     UUID NOT NULL REFERENCES organizations(id),
    parent_id           UUID,              -- NULL for primary specimens, set for aliquots

    -- Current derived state
    status              specimen_status NOT NULL DEFAULT 'collected',
    specimen_type       VARCHAR(100),      -- whole_blood, plasma, ffpe, etc.
    container_type      VARCHAR(100),      -- vial, slide, block, cryovial
    preservation_type   VARCHAR(100),      -- ffpe, fresh_frozen, rna_later
    storage_temperature  VARCHAR(50),      -- ambient, 4c, minus_80, ln2
    current_location     JSONB DEFAULT '{}'::jsonb,  -- {org, facility, freezer, rack, box, position}

    -- Tracking
    remaining_quantity   NUMERIC(10,4),    -- mL, mg, units (NULL for non-quantifiable)
    unit                 VARCHAR(20),      -- mL, mg, units, slides
    freeze_thaw_count    INTEGER NOT NULL DEFAULT 0,
    last_qc_result       VARCHAR(20),      -- passed, failed, pending
    last_qc_at           TIMESTAMPTZ,
    consent_status       VARCHAR(50),      -- active, withdrawn, expired
    consent_id           UUID,

    -- Event stream tracking
    twin_sequence        BIGINT NOT NULL DEFAULT 0,  -- last applied event sequence
    twin_updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Metadata
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    collected_at         TIMESTAMPTZ,
    collected_by         UUID REFERENCES auth.users(id),
    notes                TEXT,

    CONSTRAINT specimen_twins_positive_sequence
        CHECK (twin_sequence >= 0)
);

COMMENT ON TABLE specimen_twins IS
    'Current derived state of Specimen Twins. Updated atomically when events are recorded.';
COMMENT ON COLUMN specimen_twins.id IS
    'Same as the specimen Research Asset ID. The twin IS the authoritative record.';
COMMENT ON COLUMN specimen_twins.twin_sequence IS
    'The sequence number of the last event applied. Used for conflict detection.';

CREATE INDEX IF NOT EXISTS idx_specimen_twins_organization
    ON specimen_twins(organization_id);
CREATE INDEX IF NOT EXISTS idx_specimen_twins_status
    ON specimen_twins(status);
CREATE INDEX IF NOT EXISTS idx_specimen_twins_parent
    ON specimen_twins(parent_id);

-- ############################################################################
-- PART 4: ROW-LEVEL SECURITY
-- ############################################################################

ALTER TABLE twin_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE specimen_twins ENABLE ROW LEVEL SECURITY;

-- Twin events: visible to members of the owning organization
CREATE POLICY twin_events_select ON twin_events
    FOR SELECT
    USING (auth.role() = 'service_role');

-- Twin events: insert via service role (engines call the API)
CREATE POLICY twin_events_insert ON twin_events
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- Specimen twins: visible to org members
CREATE POLICY specimen_twins_select ON specimen_twins
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
        OR auth.role() = 'service_role'
    );

-- Specimen twins: insert/update via service role
CREATE POLICY specimen_twins_insert ON specimen_twins
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY specimen_twins_update ON specimen_twins
    FOR UPDATE
    USING (auth.role() = 'service_role');

-- ############################################################################
-- PART 5: EVENT APPLICATION FUNCTION (SECURITY DEFINER)
-- ############################################################################

-- This function atomically records an event and updates the twin state.
-- It is called by the application layer — not exposed as an API endpoint.

CREATE OR REPLACE FUNCTION apply_twin_event(
    p_twin_type         twin_type,
    p_twin_id           UUID,
    p_event_type        twin_event_type,
    p_payload           JSONB,
    p_actor_id          UUID,
    p_occurred_at       TIMESTAMPTZ,
    p_evidence_ref      TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_next_sequence BIGINT;
    v_result JSONB;
BEGIN
    -- Get next sequence number for this twin
    SELECT COALESCE(MAX(sequence), 0) + 1
    INTO v_next_sequence
    FROM twin_events
    WHERE twin_type = p_twin_type AND twin_id = p_twin_id;

    -- Insert the event
    INSERT INTO twin_events (
        twin_type, twin_id, event_type, payload, sequence,
        occurred_at, actor_id, evidence_ref
    ) VALUES (
        p_twin_type, p_twin_id, p_event_type, p_payload, v_next_sequence,
        p_occurred_at, p_actor_id, p_evidence_ref
    );

    -- For specimen twins, update state based on event type
    IF p_twin_type = 'specimen' THEN
        -- Ensure the twin row exists
        INSERT INTO specimen_twins (id, organization_id, twin_sequence)
        VALUES (
            p_twin_id,
            (p_payload ->> 'organization_id')::UUID,
            v_next_sequence
        )
        ON CONFLICT (id) DO UPDATE SET
            twin_sequence = v_next_sequence,
            twin_updated_at = now();

        -- Apply event-specific state changes
        CASE p_event_type
            WHEN 'SpecimenCollected' THEN
                UPDATE specimen_twins SET
                    status = 'collected',
                    specimen_type = p_payload ->> 'specimen_type',
                    container_type = p_payload ->> 'container_type',
                    preservation_type = p_payload ->> 'preservation_type',
                    storage_temperature = p_payload ->> 'storage_temperature',
                    collected_at = p_occurred_at,
                    collected_by = p_actor_id,
                    remaining_quantity = (p_payload ->> 'initial_quantity')::NUMERIC,
                    unit = p_payload ->> 'unit',
                    consent_status = p_payload ->> 'consent_status',
                    consent_id = (p_payload ->> 'consent_id')::UUID,
                    current_location = jsonb_build_object(
                        'organization_id', p_payload ->> 'organization_id'
                    )
                WHERE id = p_twin_id;

            WHEN 'QCPassed' THEN
                UPDATE specimen_twins SET
                    last_qc_result = 'passed',
                    last_qc_at = p_occurred_at
                WHERE id = p_twin_id;

            WHEN 'QCFailed' THEN
                UPDATE specimen_twins SET
                    last_qc_result = 'failed',
                    last_qc_at = p_occurred_at,
                    status = 'quarantined'
                WHERE id = p_twin_id;

            WHEN 'FreezeThawRecorded' THEN
                UPDATE specimen_twins SET
                    freeze_thaw_count = freeze_thaw_count + 1
                WHERE id = p_twin_id;

            WHEN 'VolumeAdjusted' THEN
                UPDATE specimen_twins SET
                    remaining_quantity = remaining_quantity - (p_payload ->> 'volume_used')::NUMERIC
                WHERE id = p_twin_id;

            WHEN 'ShipmentInitiated' THEN
                UPDATE specimen_twins SET
                    status = 'shipped',
                    current_location = jsonb_build_object(
                        'shipment_id', p_payload ->> 'shipment_id',
                        'status', 'in_transit'
                    )
                WHERE id = p_twin_id;

            WHEN 'Consumed' THEN
                UPDATE specimen_twins SET
                    status = 'consumed'
                WHERE id = p_twin_id;

            WHEN 'Destroyed' THEN
                UPDATE specimen_twins SET
                    status = 'destroyed'
                WHERE id = p_twin_id;

            WHEN 'LocationChanged' THEN
                UPDATE specimen_twins SET
                    current_location = jsonb_build_object(
                        'organization_id', p_payload ->> 'organization_id',
                        'facility', p_payload ->> 'facility',
                        'freezer', p_payload ->> 'freezer',
                        'rack', p_payload ->> 'rack',
                        'box', p_payload ->> 'box',
                        'position', p_payload ->> 'position'
                    )
                WHERE id = p_twin_id;

            WHEN 'ConsentUpdated' THEN
                UPDATE specimen_twins SET
                    consent_status = p_payload ->> 'consent_status',
                    consent_id = (p_payload ->> 'consent_id')::UUID
                WHERE id = p_twin_id;

            ELSE
                -- Unknown event type — still recorded, no state update
        END CASE;
    END IF;

    -- Return the recorded event
    SELECT jsonb_build_object(
        'event_id', id,
        'sequence', sequence,
        'event_type', event_type
    ) INTO v_result
    FROM twin_events
    WHERE twin_type = p_twin_type AND twin_id = p_twin_id AND sequence = v_next_sequence;

    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION apply_twin_event IS
    'Atomically records a twin event and updates the twin state table. '
    'Called by the application layer. SECURITY DEFINER — the function has '
    'elevated privileges to write to both tables.';

-- ############################################################################
-- PART 6: SEED DATA — DEMO SPECIMEN TWIN
-- ############################################################################

-- No seed data for specimens (requires an organization to exist).
-- The twin is created when the first event is recorded.
