-- ============================================================================
-- KADARN PLATFORM — Sprint 0B: RLS Foundation
-- ============================================================================
-- Target: PostgreSQL 15+ (Supabase compatible)
-- Design: ADR-002 — Shared database + RLS for multi-tenancy
-- Blueprint: §4 — Tenant / RLS Model, §19 — Migration Rules
-- Dependencies: 008_organizations_capabilities.sql
--
-- This migration creates:
--   1. RLS helper functions for fast JWT-based and DB-based checks
--   2. Row-Level Security policies for all Sprint 0A tables
--   3. Default deny-by-default for unlisted operations
--
-- Key design (Blueprint §4.3):
--   - Fast path: JWT app_metadata claims for frequent checks
--   - Slow path: DB queries for complex checks (program access, capabilities)
--   - Deny-by-default: only explicitly granted operations are allowed
-- ============================================================================

-- ############################################################################
-- PART 1: RLS HELPER FUNCTIONS
-- ############################################################################
--
-- Naming convention (Blueprint §19.4):
--   current_*()   — reads from JWT (fast, no DB)
--   is_*()        — DB lookup for membership/role checks
--   has_*()       — DB lookup for capability checks
-- ===========================================================================

-- ============================================================================
-- 1a. current_user_id()
-- Shorthand for auth.uid(). Avoids repeating auth.uid() in every policy.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID
LANGUAGE SQL
STABLE
AS $$
    SELECT auth.uid();
$$;

-- ============================================================================
-- 1b. current_user_email()
-- Reads email from JWT claims (fast, avoids user_profiles query).
-- ============================================================================
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
    SELECT auth.jwt() ->> 'email';
$$;

-- ============================================================================
-- 1c. is_org_member(p_user_id, p_org_id)
-- Checks if a user has an active membership in an organization.
-- (Blueprint §4.4 — RLS helper functions table)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_org_member(
    p_user_id UUID,
    p_org_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.organization_memberships
        WHERE user_id = p_user_id
          AND organization_id = p_org_id
          AND status = 'active'
    );
$$;

-- ============================================================================
-- 1d. is_org_member(p_org_id)
-- Overload: checks current user against an organization.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_org_member(
    p_org_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
    SELECT public.is_org_member(auth.uid(), p_org_id);
$$;

-- ============================================================================
-- 1e. has_org_capability(p_org_id, p_capability_key)
-- Checks if an organization has a specific capability.
-- (Blueprint §5.2 — capability model)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.has_org_capability(
    p_org_id UUID,
    p_capability_key TEXT
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.organization_capabilities oc
        JOIN public.organization_capability_types oct ON oct.id = oc.capability_type_id
        WHERE oc.organization_id = p_org_id
          AND oct.key = p_capability_key
    );
$$;

-- ============================================================================
-- 1f. has_current_user_capability(p_capability_key)
-- Checks if ANY organization the current user belongs to has a capability.
-- (Blueprint §4.4 — feature-level access check)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.has_current_user_capability(
    p_capability_key TEXT
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.organization_memberships om
        JOIN public.organization_capabilities oc ON oc.organization_id = om.organization_id
        JOIN public.organization_capability_types oct ON oct.id = oc.capability_type_id
        WHERE om.user_id = auth.uid()
          AND om.status = 'active'
          AND oct.key = p_capability_key
    );
$$;

-- ============================================================================
-- 1g. has_org_role(p_user_id, p_org_id, p_role_key)
-- Checks if a user has a specific role within an organization.
-- (Blueprint §5.3 — organization roles)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.has_org_role(
    p_user_id UUID,
    p_org_id UUID,
    p_role_key TEXT
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.organization_memberships om
        JOIN public.membership_roles mr ON mr.membership_id = om.id
        JOIN public.organization_roles r ON r.id = mr.role_id
        WHERE om.user_id = p_user_id
          AND om.organization_id = p_org_id
          AND om.status = 'active'
          AND r.key = p_role_key
    );
$$;

-- ============================================================================
-- 1h. has_org_role(p_org_id, p_role_key)
-- Overload: checks current user in an organization.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.has_org_role(
    p_org_id UUID,
    p_role_key TEXT
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
    SELECT public.has_org_role(auth.uid(), p_org_id, p_role_key);
$$;

-- ============================================================================
-- 1i. is_org_admin()
-- Convenience: checks if current user is an org_admin in ANY organization.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_org_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.organization_memberships om
        JOIN public.membership_roles mr ON mr.membership_id = om.id
        JOIN public.organization_roles r ON r.id = mr.role_id
        WHERE om.user_id = auth.uid()
          AND om.status = 'active'
          AND r.key = 'org_admin'
    );
$$;

-- ============================================================================
-- 1j. is_org_admin(p_org_id)
-- Convenience: checks if current user is an org_admin in a specific org.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_org_admin(
    p_org_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
    SELECT public.has_org_role(auth.uid(), p_org_id, 'org_admin');
$$;

-- ============================================================================
-- 1k. can_access_program(p_user_id, p_program_id)
-- Checks if a user can access a program (via org membership + program participation).
-- Depends on programs + program_participants from migration 010.
-- Safe to create now — resolves at runtime; returns false if tables don't exist.
-- (Blueprint §6 — Program Engine)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.can_access_program(
    p_user_id UUID,
    p_program_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    -- Return false if the programs table doesn't exist yet (migration 010 not applied)
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'program_participants'
    ) THEN
        RETURN false;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM public.organization_memberships om
        JOIN public.program_participants pp ON pp.organization_id = om.organization_id
        WHERE om.user_id = p_user_id
          AND om.status = 'active'
          AND pp.program_id = p_program_id
          AND pp.status = 'active'
    );
END;
$$;

-- ============================================================================
-- 1l. can_access_program(p_program_id)
-- Overload: checks current user against a program.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.can_access_program(
    p_program_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
    SELECT public.can_access_program(auth.uid(), p_program_id);
$$;

-- ============================================================================
-- 1m. check_visibility(p_organization_id, p_visibility_scope)
-- Reusable visibility check for multi-tenant tables.
-- (Blueprint §4.2 — visibility scopes)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.check_visibility(
    p_organization_id UUID,
    p_visibility_scope visibility_scope
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
    SELECT
        CASE p_visibility_scope
            WHEN 'public' THEN true
            WHEN 'organization' THEN public.is_org_member(p_organization_id)
            WHEN 'program' THEN false  -- requires program_id context, handled per-policy
            WHEN 'network' THEN
                EXISTS (
                    SELECT 1
                    FROM public.organization_memberships om
                    WHERE om.user_id = auth.uid()
                      AND om.status = 'active'
                )
            ELSE false
        END;
$$;

-- ############################################################################
-- PART 1G: USER ORGANIZATIONS VIEW
-- ############################################################################
--
-- Convenience view mapping users to their active organizations.
-- Used throughout all engine RLS policies.
-- ============================================================================

CREATE OR REPLACE VIEW public.user_organizations AS
    SELECT DISTINCT m.user_id, m.organization_id, r.key AS role
    FROM public.organization_memberships m
    JOIN public.membership_roles mr ON mr.membership_id = m.id
    JOIN public.organization_roles r ON r.id = mr.role_id
    WHERE m.status = 'active';

-- ############################################################################
-- PART 2: ROW LEVEL SECURITY — ENABLE
-- ############################################################################
--
-- (Blueprint §4 — every sensitive table must have RLS enabled)
-- ============================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_capability_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_identity_links ENABLE ROW LEVEL SECURITY;

-- ############################################################################
-- PART 3: RLS POLICIES — organizations
-- ############################################################################
--
-- (Blueprint §20.1 — Sprint 0 acceptance: RLS isolation verified)
-- ============================================================================

-- SELECT:
--   - Public/network visibility: all authenticated users
--   - Organization scope: members only
--   - Admins: full visibility across the network
CREATE POLICY organizations_select ON public.organizations
    FOR SELECT
    USING (
        auth.role() = 'authenticated'
        AND (
            visibility_scope IN ('public', 'network')
            OR public.is_org_member(id)
            OR public.is_org_admin()
        )
    );

-- INSERT: any authenticated user can create an org (they become creator)
CREATE POLICY organizations_insert ON public.organizations
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated'
        AND created_by = auth.uid()
    );

-- UPDATE: org_admins within their own org
CREATE POLICY organizations_update ON public.organizations
    FOR UPDATE
    USING (public.is_org_admin(id))
    WITH CHECK (public.is_org_admin(id));

-- DELETE: org_admins only
CREATE POLICY organizations_delete ON public.organizations
    FOR DELETE
    USING (public.is_org_admin(id));

-- ############################################################################
-- PART 4: RLS POLICIES — organization_capability_types
-- ############################################################################

-- SELECT: all authenticated users (reference data)
CREATE POLICY org_cap_types_select ON public.organization_capability_types
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- INSERT/UPDATE/DELETE: org_admin required
CREATE POLICY org_cap_types_insert ON public.organization_capability_types
    FOR INSERT
    WITH CHECK (public.is_org_admin());

CREATE POLICY org_cap_types_update ON public.organization_capability_types
    FOR UPDATE
    USING (public.is_org_admin());

CREATE POLICY org_cap_types_delete ON public.organization_capability_types
    FOR DELETE
    USING (public.is_org_admin());

-- ############################################################################
-- PART 5: RLS POLICIES — organization_capabilities
-- ############################################################################

-- SELECT: visible if the organization itself is visible
CREATE POLICY org_capabilities_select ON public.organization_capabilities
    FOR SELECT
    USING (
        auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM public.organizations o
            WHERE o.id = organization_id
            AND (
                o.visibility_scope IN ('public', 'network')
                OR public.is_org_member(o.id)
            )
        )
    );

-- INSERT/UPDATE/DELETE: org_admin in the owning org
CREATE POLICY org_capabilities_insert ON public.organization_capabilities
    FOR INSERT
    WITH CHECK (
        created_by = auth.uid()
        AND public.is_org_admin(organization_id)
    );

CREATE POLICY org_capabilities_update ON public.organization_capabilities
    FOR UPDATE
    USING (public.is_org_admin(organization_id))
    WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY org_capabilities_delete ON public.organization_capabilities
    FOR DELETE
    USING (public.is_org_admin(organization_id));

-- ############################################################################
-- PART 6: RLS POLICIES — organization_roles
-- ############################################################################

-- SELECT: all authenticated users (reference data)
CREATE POLICY org_roles_select ON public.organization_roles
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- INSERT: org_admin
CREATE POLICY org_roles_insert ON public.organization_roles
    FOR INSERT
    WITH CHECK (public.is_org_admin());

-- UPDATE: org_admin, cannot change is_system_role
CREATE POLICY org_roles_update ON public.organization_roles
    FOR UPDATE
    USING (public.is_org_admin())
    WITH CHECK (
        public.is_org_admin()
        AND is_system_role = (SELECT original.is_system_role FROM public.organization_roles original WHERE original.id = organization_roles.id)
    );

-- DELETE: org_admin, cannot delete system roles
CREATE POLICY org_roles_delete ON public.organization_roles
    FOR DELETE
    USING (
        public.is_org_admin()
        AND is_system_role = false
    );

-- ############################################################################
-- PART 7: RLS POLICIES — organization_memberships
-- ############################################################################

-- SELECT:
--   - Users see their own memberships
--   - Org_admins see all memberships in their org
--   - Org members see other active members in the same org
CREATE POLICY org_memberships_select_self ON public.organization_memberships
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY org_memberships_select_admin ON public.organization_memberships
    FOR SELECT
    USING (public.is_org_admin(organization_id));

CREATE POLICY org_memberships_select_members ON public.organization_memberships
    FOR SELECT
    USING (
        status = 'active'
        AND public.is_org_member(organization_id)
    );

-- INSERT: org_admin or self-registration as 'invited'
CREATE POLICY org_memberships_insert_admin ON public.organization_memberships
    FOR INSERT
    WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY org_memberships_insert_self ON public.organization_memberships
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND status = 'invited'
    );

-- UPDATE: org_admin, or user accepting own invitation
CREATE POLICY org_memberships_update_admin ON public.organization_memberships
    FOR UPDATE
    USING (public.is_org_admin(organization_id))
    WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY org_memberships_update_self ON public.organization_memberships
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (
        user_id = auth.uid()
        AND organization_id = (SELECT original.organization_id FROM public.organization_memberships original WHERE original.id = organization_memberships.id)
    );

-- DELETE: org_admin or self
CREATE POLICY org_memberships_delete_admin ON public.organization_memberships
    FOR DELETE
    USING (public.is_org_admin(organization_id));

CREATE POLICY org_memberships_delete_self ON public.organization_memberships
    FOR DELETE
    USING (user_id = auth.uid());

-- ############################################################################
-- PART 8: RLS POLICIES — membership_roles
-- ############################################################################

-- SELECT: via parent membership visibility
CREATE POLICY membership_roles_select_admin ON public.membership_roles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_memberships om
            WHERE om.id = membership_id
            AND public.is_org_admin(om.organization_id)
        )
    );

CREATE POLICY membership_roles_select_self ON public.membership_roles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_memberships om
            WHERE om.id = membership_id
            AND om.user_id = auth.uid()
        )
    );

-- INSERT/UPDATE/DELETE: org_admin only (via parent org)
CREATE POLICY membership_roles_insert ON public.membership_roles
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_memberships om
            WHERE om.id = membership_id
            AND public.is_org_admin(om.organization_id)
        )
    );

CREATE POLICY membership_roles_update ON public.membership_roles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_memberships om
            WHERE om.id = membership_id
            AND public.is_org_admin(om.organization_id)
        )
    );

CREATE POLICY membership_roles_delete ON public.membership_roles
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_memberships om
            WHERE om.id = membership_id
            AND public.is_org_admin(om.organization_id)
        )
    );

-- ############################################################################
-- PART 9: RLS POLICIES — user_profiles
-- ############################################################################

-- SELECT: own profile, or org_admin seeing members
CREATE POLICY user_profiles_select_self ON public.user_profiles
    FOR SELECT
    USING (id = auth.uid());

CREATE POLICY user_profiles_select_admin ON public.user_profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_memberships om
            WHERE om.user_id = user_profiles.id
            AND public.is_org_admin(om.organization_id)
        )
    );

-- UPDATE: users update non-critical own fields only
CREATE POLICY user_profiles_update_self ON public.user_profiles
    FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid()
        AND email = (SELECT original.email FROM public.user_profiles original WHERE original.id = user_profiles.id)  -- email managed by auth provider, not direct update
    );

-- ############################################################################
-- PART 10: RLS POLICIES — identity_providers
-- ############################################################################

-- SELECT: all authenticated users
CREATE POLICY identity_providers_select ON public.identity_providers
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- INSERT/UPDATE/DELETE: org_admin only
CREATE POLICY identity_providers_insert ON public.identity_providers
    FOR INSERT
    WITH CHECK (public.is_org_admin());

CREATE POLICY identity_providers_update ON public.identity_providers
    FOR UPDATE
    USING (public.is_org_admin());

CREATE POLICY identity_providers_delete ON public.identity_providers
    FOR DELETE
    USING (public.is_org_admin());

-- ############################################################################
-- PART 11: RLS POLICIES — external_identity_links
-- ############################################################################

-- SELECT: users see their own links
CREATE POLICY ext_identity_links_select_self ON public.external_identity_links
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = user_profile_id
            AND up.id = auth.uid()
        )
    );

-- INSERT/DELETE: users manage their own links
CREATE POLICY ext_identity_links_insert_self ON public.external_identity_links
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = user_profile_id
            AND up.id = auth.uid()
        )
    );

CREATE POLICY ext_identity_links_delete_self ON public.external_identity_links
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = user_profile_id
            AND up.id = auth.uid()
        )
    );

-- ############################################################################
-- PART 12: SPRINT 1 TODOs
-- ############################################################################
--
-- TODO Sprint 1: Introduce platform_admin role for managing global reference data:
--   - organization_capability_types (INSERT/UPDATE/DELETE)
--   - organization_roles (INSERT/UPDATE/DELETE)
--   Currently gated by is_org_admin() which allows any org admin to modify global data.
--
-- TODO Sprint 1: Add onboarding status for organizations:
--   pending_review / active / suspended
--   Currently all orgs are immediately visible at network scope after creation.
--   An onboarding workflow would gate visibility until review.
-- ============================================================================

-- ############################################################################
-- PART 13: VERIFICATION
-- ############################################################################
--
-- Run after migration to list all policies:
--   SELECT * FROM pg_policies WHERE schemaname = 'public'
--   ORDER BY tablename, policyname;
-- ============================================================================

-- ============================================================================
-- END OF MIGRATION 009 — Sprint 0B: RLS Foundation
-- ============================================================================
