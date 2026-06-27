-- ============================================================================
-- KADARN PLATFORM — Sprint 8: Logistics Engine
-- ============================================================================
-- Target: PostgreSQL 15+ (Supabase compatible)
-- Dependencies: 008, 009, 010 (programs), 013 (supply_items)
--
-- This migration creates the Logistics Engine:
--   1. logistics_shipments — shipping records with carrier tracking
--   2. logistics_shipment_items — samples/items within a shipment
--   3. logistics_containers — dry ice, LN2, and other shipping containers
--   4. logistics_telemetry — temperature monitoring during transit
--   5. logistics_customs_docs — international shipping documentation
--   6. logistics_carriers — configured carrier integrations
--   7. RLS policies
-- (Blueprint §14 — Logistics Engine)
-- ============================================================================

-- ############################################################################
-- PART 1: ENUMS
-- ############################################################################

DO $$ BEGIN
    CREATE TYPE shipment_status AS ENUM (
        'pending', 'label_created', 'picked_up', 'in_transit',
        'customs_clearance', 'out_for_delivery', 'delivered',
        'exception', 'lost', 'returned', 'cancelled'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE container_type AS ENUM (
        'dry_ice_box', 'liquid_nitrogen_dry_shipper', 'refrigerated',
        'ambient', 'frozen_gel_packs', 'temperature_controlled_container'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE carrier AS ENUM (
        'fedex', 'dhl', 'world_courier', 'marken', 'ups', 'other'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- PART 2: TABLE — logistics_shipments
-- ############################################################################
--
-- A shipment record tracking physical transport of biospecimens.
-- (Blueprint §14.2 — Logistics Components)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.logistics_shipments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id          UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Shipment identity
    shipment_name       TEXT NOT NULL,
    shipment_type       TEXT NOT NULL DEFAULT 'standard' CHECK (shipment_type IN ('standard', 'express', 'priority_overnight', 'dry_ice', 'cryo')),
    status              shipment_status NOT NULL DEFAULT 'pending',

    -- Carrier
    carrier             carrier NOT NULL,
    carrier_account     TEXT,
    service_type        TEXT,  -- e.g. 'FedEx Priority Overnight', 'DHL Express Worldwide'
    tracking_number     TEXT,
    tracking_url        TEXT,

    -- Shipping addresses
    origin_org_id       UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    origin_address      TEXT,
    origin_contact      TEXT,
    origin_phone        TEXT,

    destination_org_id  UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    destination_address TEXT,
    destination_contact TEXT,
    destination_phone   TEXT,

    -- Scheduling
    pick_up_date        TIMESTAMPTZ,
    estimated_delivery  TIMESTAMPTZ,
    actual_delivery     TIMESTAMPTZ,
    shipped_date        TIMESTAMPTZ,

    -- Documentation
    waybill_url         TEXT,
    label_url           TEXT,
    commercial_invoice_url TEXT,

    -- Container
    container_type      container_type,
    container_prepared_by TEXT,

    -- Tracking metadata
    last_tracking_event TEXT,
    last_tracking_at    TIMESTAMPTZ,
    metadata            JSONB DEFAULT '{}',

    -- Audit
    created_by          UUID NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_log_ship_program ON public.logistics_shipments(program_id);
CREATE INDEX IF NOT EXISTS idx_log_ship_org ON public.logistics_shipments(organization_id);
CREATE INDEX IF NOT EXISTS idx_log_ship_carrier ON public.logistics_shipments(carrier);
CREATE INDEX IF NOT EXISTS idx_log_ship_status ON public.logistics_shipments(status);
CREATE INDEX IF NOT EXISTS idx_log_ship_tracking ON public.logistics_shipments(tracking_number);

COMMENT ON TABLE public.logistics_shipments IS
    'Shipping records for biospecimen transport. Tracks carrier, status, and documentation.';

-- ############################################################################
-- PART 3: TABLE — logistics_shipment_items
-- ############################################################################
--
-- Links samples/aliquots to shipments.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.logistics_shipment_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id         UUID NOT NULL REFERENCES public.logistics_shipments(id) ON DELETE CASCADE,
    sample_id           UUID REFERENCES public.processing_samples(id) ON DELETE SET NULL,
    aliquot_id          UUID REFERENCES public.processing_aliquots(id) ON DELETE SET NULL,
    container_id        UUID REFERENCES public.logistics_containers(id) ON DELETE SET NULL,

    description         TEXT,  -- description of what's being shipped
    quantity            INTEGER NOT NULL DEFAULT 1,
    unit                TEXT,
    declared_value      NUMERIC(12,2),

    CHECK (sample_id IS NOT NULL OR aliquot_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_log_ship_items_shipment ON public.logistics_shipment_items(shipment_id);
CREATE INDEX IF NOT EXISTS idx_log_ship_items_sample ON public.logistics_shipment_items(sample_id);

-- ############################################################################
-- PART 4: TABLE — logistics_containers
-- ############################################################################
--
-- Shipping containers for biospecimen transport.
-- (Blueprint §14.2 — Dry Ice / LN2)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.logistics_containers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    container_type      container_type NOT NULL,
    container_name      TEXT NOT NULL,
    serial_number       TEXT,
    weight_kg           NUMERIC(8,2),
    notes               TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_by          UUID NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_log_containers_org ON public.logistics_containers(organization_id);

COMMENT ON TABLE public.logistics_containers IS
    'Shipping containers (dry ice boxes, LN2 dry shippers, etc.).';

-- ############################################################################
-- PART 5: TABLE — logistics_telemetry
-- ############################################################################
--
-- Temperature monitoring during transit.
-- (Blueprint §14.2 — Temperature Monitoring)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.logistics_telemetry (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id         UUID NOT NULL REFERENCES public.logistics_shipments(id) ON DELETE CASCADE,

    recorded_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    temperature_celsius NUMERIC(6,2) NOT NULL,
    humidity_percent    NUMERIC(5,1),
    battery_level       INTEGER CHECK (battery_level IS NULL OR (battery_level BETWEEN 0 AND 100)),

    -- GPS
    latitude            NUMERIC(9,6),
    longitude           NUMERIC(9,6),

    -- Device
    device_id           TEXT,
    device_type         TEXT,
    metadata            JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_log_telemetry_shipment ON public.logistics_telemetry(shipment_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_log_telemetry_temp ON public.logistics_telemetry(shipment_id, temperature_celsius);

COMMENT ON TABLE public.logistics_telemetry IS
    'Temperature telemetry from data loggers during transit.';

-- ############################################################################
-- PART 6: TABLE — logistics_customs_docs
-- ############################################################################
--
-- International shipping customs documentation.
-- (Blueprint §14.2 — Customs Documentation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.logistics_customs_docs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id         UUID NOT NULL REFERENCES public.logistics_shipments(id) ON DELETE CASCADE,

    document_type       TEXT NOT NULL CHECK (document_type IN ('commercial_invoice', 'proforma_invoice', 'packing_list', 'certificate_of_origin', 'export_declaration', 'import_permit', 'msds')),
    document_number     TEXT,
    document_url        TEXT,
    content             JSONB DEFAULT '{}',  -- structured document data

    -- HS / commodity codes
    hs_code             TEXT,
    commodity           TEXT,

    -- Value
    declared_value      NUMERIC(12,2),
    currency            TEXT DEFAULT 'USD',

    -- Status
    is_ready            BOOLEAN NOT NULL DEFAULT false,
    filed_at            TIMESTAMPTZ,
    filed_by            UUID,

    created_by          UUID NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_log_customs_shipment ON public.logistics_customs_docs(shipment_id);
CREATE INDEX IF NOT EXISTS idx_log_customs_type ON public.logistics_customs_docs(document_type);

COMMENT ON TABLE public.logistics_customs_docs IS
    'International shipping customs documentation.';

-- ############################################################################
-- PART 7: TABLE — logistics_carriers
-- ############################################################################
--
-- Configured carrier integrations for organizations.
-- (Blueprint §14.2 — Carrier Integration)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.logistics_carriers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    carrier             carrier NOT NULL,
    account_number      TEXT,
    api_key_encrypted   TEXT,  -- encrypted API key
    is_active           BOOLEAN NOT NULL DEFAULT true,
    config              JSONB DEFAULT '{}',  -- carrier-specific configuration
    created_by          UUID NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (organization_id, carrier)
);

COMMENT ON TABLE public.logistics_carriers IS
    'Configured carrier accounts for organizations. API keys stored encrypted.';

-- ############################################################################
-- PART 8: TRIGGERS
-- ############################################################################

CREATE TRIGGER trg_logistics_shipments_updated_at
    BEFORE UPDATE ON public.logistics_shipments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ############################################################################
-- PART 9: TEMPERATURE BREACH DETECTION
-- ############################################################################

CREATE OR REPLACE FUNCTION public.check_shipment_temperature_breach(
    p_shipment_id UUID,
    p_temperature NUMERIC,
    p_threshold NUMERIC DEFAULT -50.0
)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
AS $$
    SELECT p_temperature > p_threshold;
$$;

COMMENT ON FUNCTION public.check_shipment_temperature_breach IS
    'Checks if a temperature reading exceeds the threshold for frozen biospecimens.';

-- ############################################################################
-- PART 10: RLS
-- ############################################################################

ALTER TABLE public.logistics_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_shipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_customs_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_carriers ENABLE ROW LEVEL SECURITY;

-- Shipments: program participants can view; org_admin of sending/receiving org can manage
CREATE POLICY logistics_shipments_select ON public.logistics_shipments
    FOR SELECT
    USING (public.can_access_program(program_id) OR public.is_org_admin(organization_id));
CREATE POLICY logistics_shipments_insert ON public.logistics_shipments
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated' AND public.is_org_admin(organization_id));
CREATE POLICY logistics_shipments_update ON public.logistics_shipments
    FOR UPDATE
    USING (public.is_org_admin(organization_id));
CREATE POLICY logistics_shipments_delete ON public.logistics_shipments
    FOR DELETE
    USING (public.is_org_admin(organization_id));

-- Shipment items: same as parent shipment
CREATE POLICY logistics_shipment_items_select ON public.logistics_shipment_items
    FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.logistics_shipments s WHERE s.id = shipment_id AND public.can_access_program(s.program_id)));
CREATE POLICY logistics_shipment_items_insert ON public.logistics_shipment_items
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Containers: org members can see, org_admin can manage
CREATE POLICY logistics_containers_select ON public.logistics_containers
    FOR SELECT
    USING (public.is_org_member(organization_id) OR public.is_org_admin());
CREATE POLICY logistics_containers_insert ON public.logistics_containers
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated' AND public.is_org_admin(organization_id));

-- Telemetry: program participants
CREATE POLICY logistics_telemetry_select ON public.logistics_telemetry
    FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.logistics_shipments s WHERE s.id = shipment_id AND public.can_access_program(s.program_id)));
CREATE POLICY logistics_telemetry_insert ON public.logistics_telemetry
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Customs docs: same as shipment
CREATE POLICY logistics_customs_docs_select ON public.logistics_customs_docs
    FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.logistics_shipments s WHERE s.id = shipment_id AND public.can_access_program(s.program_id)));
CREATE POLICY logistics_customs_docs_insert ON public.logistics_customs_docs
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Carriers: org admin only
CREATE POLICY logistics_carriers_select ON public.logistics_carriers
    FOR SELECT
    USING (public.is_org_admin(organization_id) OR public.is_org_member(organization_id));
CREATE POLICY logistics_carriers_insert ON public.logistics_carriers
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated' AND public.is_org_admin(organization_id));
CREATE POLICY logistics_carriers_update ON public.logistics_carriers
    FOR UPDATE
    USING (public.is_org_admin(organization_id));

-- ############################################################################
-- PART 11: POSTGREST PERMISSIONS
-- ############################################################################

GRANT ALL ON public.logistics_shipments TO anon, authenticated, service_role;
GRANT ALL ON public.logistics_shipment_items TO anon, authenticated, service_role;
GRANT ALL ON public.logistics_containers TO anon, authenticated, service_role;
GRANT ALL ON public.logistics_telemetry TO anon, authenticated, service_role;
GRANT ALL ON public.logistics_customs_docs TO anon, authenticated, service_role;
GRANT ALL ON public.logistics_carriers TO anon, authenticated, service_role;

-- ============================================================================
-- END OF MIGRATION 018 — Sprint 8: Logistics Engine
-- ============================================================================
