-- ============================================================================
-- KAD-002C — Institution Participation Model
-- ============================================================================
-- Authority: Foundation Library 016_CANONICAL_ENTITY_SPECIFICATIONS
-- Establishes the Membership + Role model:
--   Person ──Membership── Institution
--   Membership ──RoleAssignment── Role
-- ============================================================================

-- ############################################################################
-- ENUMS
-- ############################################################################

DO $$ BEGIN
    CREATE TYPE membership_status AS ENUM (
        'invited',
        'active',
        'suspended',
        'terminated',
        'expired'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- EXTEND organization_memberships
-- ############################################################################

-- Add person_id FK to link to canonical people table
ALTER TABLE public.organization_memberships
    ADD COLUMN IF NOT EXISTS person_id UUID REFERENCES public.people(id) ON DELETE SET NULL;

-- Add temporal fields for lifecycle tracking
ALTER TABLE public.organization_memberships
    ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;

-- Add reason tracking for status transitions
ALTER TABLE public.organization_memberships
    ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
    ADD COLUMN IF NOT EXISTS termination_reason TEXT;

-- Add deactivated_by for audit trail
ALTER TABLE public.organization_memberships
    ADD COLUMN IF NOT EXISTS deactivated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ############################################################################
-- SEED: Governed Role Catalog (MVP)
-- ############################################################################

-- Add scope column if not present
ALTER TABLE public.organization_roles ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'institution';

INSERT INTO public.organization_roles (key, name, description, scope, is_system_role, priority)
VALUES
    ('org_admin', 'Organization Administrator', 'Full workspace access. Can manage members, settings, and all institutional data.', 'institution', true, 100),
    ('org_member', 'Organization Member', 'Standard workspace access. Can create claims, evidence, and view institutional data.', 'institution', true, 90),
    ('site_pi', 'Principal Investigator', 'Can create and verify claims. Responsible for institutional evidence quality.', 'institution', false, 80),
    ('site_coordinator', 'Site Coordinator', 'Can manage evidence submission and review workflows.', 'institution', false, 70),
    ('reviewer', 'Evidence Reviewer', 'Can review and verify evidence. Cannot create claims or manage members.', 'institution', false, 60),
    ('sponsor_viewer', 'Sponsor Viewer', 'Can view published passports and shared evidence for sponsored institutions.', 'sponsor', true, 50)
ON CONFLICT (key) DO NOTHING;

-- ############################################################################
-- INDEXES
-- ############################################################################

CREATE INDEX IF NOT EXISTS idx_memberships_person ON public.organization_memberships(person_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON public.organization_memberships(status);
CREATE INDEX IF NOT EXISTS idx_memberships_effective ON public.organization_memberships(organization_id, started_at);
CREATE INDEX IF NOT EXISTS idx_roles_key ON public.organization_roles(key);

-- ############################################################################
-- GRANTS
-- ############################################################################

GRANT SELECT, INSERT, UPDATE ON public.organization_memberships TO authenticated, service_role;
GRANT SELECT ON public.organization_roles TO authenticated, service_role;
GRANT SELECT, INSERT, DELETE ON public.membership_roles TO authenticated, service_role;
