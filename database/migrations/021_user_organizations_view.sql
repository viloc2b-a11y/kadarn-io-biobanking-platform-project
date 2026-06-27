-- ============================================================================
-- KADARN PLATFORM — user_organizations View (RLS Bridging)
-- ============================================================================
-- Target: PostgreSQL 15+ (Supabase compatible)
-- Design: ADR-002 — Multi-Tenant Architecture & Organization Model
-- Reference: Blueprint §4 — Tenant / RLS Model
-- Dependencies: 008_organizations_capabilities.sql
--               009_rls_foundation.sql
--
-- Fixes RLS in migrations 013-020 which reference user_organizations but the
-- view was never created. This view bridges organization_memberships (from
-- migration 008) with the user_organizations pattern expected by later engine
-- migrations.
--
-- The view follows the naming convention used by RLS helper functions in
-- migration 009 and uses the same underlying organization_memberships table
-- with status = 'active' filter.
-- ============================================================================

-- ============================================================================
-- 1. user_organizations View
-- ============================================================================

CREATE OR REPLACE VIEW public.user_organizations AS
SELECT 
  om.user_id,
  om.organization_id,
  o.name AS organization_name,
  r.name AS role
FROM public.organization_memberships om
JOIN public.organizations o ON o.id = om.organization_id
JOIN public.membership_roles mr ON mr.membership_id = om.id
JOIN public.organization_roles r ON r.id = mr.role_id
WHERE om.status = 'active';

COMMENT ON VIEW public.user_organizations IS
  'Bridging view for RLS policies in engines (migrations 013-020). Replaces the non-existent user_organizations table with the actual organization_memberships data.';

-- ============================================================================
-- 2. Grant Access
-- ============================================================================

GRANT SELECT ON public.user_organizations TO authenticated, service_role;
