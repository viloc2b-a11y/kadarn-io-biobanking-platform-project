-- ============================================================================
-- KAD-010 — Sharing and Access Grants
-- ============================================================================
-- Extends passport_shares with full lifecycle, access levels, and audit.
-- Adds public access endpoint support for sponsor viewing.
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE access_level AS ENUM ('view', 'download', 'full');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE IF EXISTS public.passport_shares
    ADD COLUMN IF NOT EXISTS granted_by UUID,
    ADD COLUMN IF NOT EXISTS access_level public.access_level NOT NULL DEFAULT 'view',
    ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS revoked_by UUID,
    ADD COLUMN IF NOT EXISTS access_token UUID DEFAULT gen_random_uuid(),
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_passport_shares_token ON public.passport_shares(access_token);
CREATE INDEX IF NOT EXISTS idx_passport_shares_sponsor ON public.passport_shares(sponsor_organization_id);
CREATE INDEX IF NOT EXISTS idx_passport_shares_active ON public.passport_shares(revoked_at) WHERE revoked_at IS NULL;

-- RLS: sponsors can view shares granted to them via access token
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'passport_shares' AND policyname = 'ps_select_sponsor') THEN
        CREATE POLICY ps_select_sponsor ON public.passport_shares
            FOR SELECT
            USING (
                sponsor_organization_id IN (
                    SELECT organization_id FROM public.organization_memberships
                    WHERE user_id = auth.uid() AND status = 'active'
                )
                OR auth.role() = 'service_role'
            );
    END IF;
END $$;
