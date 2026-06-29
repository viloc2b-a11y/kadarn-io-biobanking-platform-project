-- ============================================================================
-- KADARN PLATFORM — Sprint 9: Trust & Financial Runtime
-- ============================================================================
-- Extends escrow lifecycle, adds invoice/payment/reconciliation tables.
-- Dependencies: 016_exchange_engine.sql, 023_trust_engine.sql
-- ============================================================================

-- Escrow status values used by settlement API transitions
DO $$ BEGIN
    ALTER TYPE escrow_status ADD VALUE IF NOT EXISTS 'completed';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE escrow_status ADD VALUE IF NOT EXISTS 'cancelled';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM ('draft', 'issued', 'paid', 'void');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'captured', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE reconciliation_status AS ENUM ('pending', 'balanced', 'discrepancy');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.financial_invoices (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id       UUID NOT NULL REFERENCES public.exchange_escrow(id) ON DELETE CASCADE,
    deal_id             UUID NOT NULL REFERENCES public.exchange_deals(id) ON DELETE CASCADE,
    organization_id     UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    invoice_number      TEXT NOT NULL,
    status              invoice_status NOT NULL DEFAULT 'draft',
    total_amount        NUMERIC(12,2) NOT NULL,
    platform_fee        NUMERIC(12,2) NOT NULL DEFAULT 0,
    biobank_payout      NUMERIC(12,2) NOT NULL DEFAULT 0,
    courier_payout      NUMERIC(12,2) NOT NULL DEFAULT 0,
    currency            CHAR(3) NOT NULL DEFAULT 'USD',
    issued_at           TIMESTAMPTZ,
    due_at              TIMESTAMPTZ,
    correlation_id      TEXT,
    metadata            JSONB NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (settlement_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_financial_invoices_deal
    ON public.financial_invoices(deal_id);
CREATE INDEX IF NOT EXISTS idx_financial_invoices_org
    ON public.financial_invoices(organization_id);

CREATE TABLE IF NOT EXISTS public.financial_payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id       UUID NOT NULL REFERENCES public.exchange_escrow(id) ON DELETE CASCADE,
    invoice_id          UUID REFERENCES public.financial_invoices(id) ON DELETE SET NULL,
    amount              NUMERIC(12,2) NOT NULL,
    status              payment_status NOT NULL DEFAULT 'pending',
    payment_method      TEXT NOT NULL DEFAULT 'escrow',
    recorded_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    correlation_id      TEXT,
    metadata            JSONB NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_payments_settlement
    ON public.financial_payments(settlement_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS public.financial_reconciliations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id       UUID NOT NULL UNIQUE REFERENCES public.exchange_escrow(id) ON DELETE CASCADE,
    expected_amount     NUMERIC(12,2) NOT NULL,
    paid_amount         NUMERIC(12,2) NOT NULL DEFAULT 0,
    released_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
    variance            NUMERIC(12,2) NOT NULL DEFAULT 0,
    status              reconciliation_status NOT NULL DEFAULT 'pending',
    reconciled_at       TIMESTAMPTZ,
    correlation_id      TEXT,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_financial_invoices_updated_at
    BEFORE UPDATE ON public.financial_invoices
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_financial_reconciliations_updated_at
    BEFORE UPDATE ON public.financial_reconciliations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.financial_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_reconciliations ENABLE ROW LEVEL SECURITY;

CREATE POLICY financial_invoices_select ON public.financial_invoices
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.user_organizations uo
            JOIN public.exchange_deals ed ON ed.sponsor_org_id = uo.organization_id
                OR ed.provider_org_id = uo.organization_id
            WHERE ed.id = financial_invoices.deal_id AND uo.user_id = auth.uid()
        )
    );

CREATE POLICY financial_payments_select ON public.financial_payments
    FOR SELECT USING (
        settlement_id IN (
            SELECT ee.id FROM public.exchange_escrow ee
            JOIN public.exchange_deals ed ON ed.id = ee.deal_id
            JOIN public.user_organizations uo ON uo.organization_id IN (ed.sponsor_org_id, ed.provider_org_id)
            WHERE uo.user_id = auth.uid()
        )
    );

CREATE POLICY financial_reconciliations_select ON public.financial_reconciliations
    FOR SELECT USING (
        settlement_id IN (
            SELECT ee.id FROM public.exchange_escrow ee
            JOIN public.exchange_deals ed ON ed.id = ee.deal_id
            JOIN public.user_organizations uo ON uo.organization_id IN (ed.sponsor_org_id, ed.provider_org_id)
            WHERE uo.user_id = auth.uid()
        )
    );

COMMENT ON TABLE public.financial_invoices IS 'Settlement fee invoices generated by the financial runtime.';
COMMENT ON TABLE public.financial_payments IS 'Escrow payment captures recorded by the financial runtime.';
COMMENT ON TABLE public.financial_reconciliations IS 'Settlement reconciliation ledger (expected vs paid/released).';
