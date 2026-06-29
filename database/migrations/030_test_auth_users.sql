-- ============================================================================
-- KADARN PLATFORM — Test Auth Users
-- ============================================================================
-- Target: local dev + CI only. Never run against production.
-- Dependencies: 008_organizations_capabilities.sql, 011_seed_data.sql
--
-- Adds 3 test users covering access scenarios not in the main seed:
--   1. noorg@kadarn.test     — authenticated, no org membership
--   2. koc@kadarn.test       — Kadarn internal (kadarn_role = kadarn_internal)
--   3. multiorg@kadarn.test  — member of 2 orgs, no active_org_id set
--
-- All passwords: Test123! (local dev only)
-- ============================================================================

-- ############################################################################
-- PART 1: noorg@kadarn.test
-- ############################################################################
-- Authenticated user who has not joined any organization.
-- Expected: login OK → allowed_experiences = ['marketplace']
--           default_redirect = '/marketplace'
-- ============================================================================

SELECT public.admin_create_user(
    'noorg@kadarn.test',
    'Test123!',
    'No Org User'
);

-- ############################################################################
-- PART 2: koc@kadarn.test
-- ############################################################################
-- Kadarn internal operator. No org membership — platform-level access.
-- Expected: kadarn_role = 'kadarn_internal' → default_redirect = '/koc'
--           allowed_experiences = ['marketplace', 'workspace', 'koc']
-- ============================================================================

SELECT public.admin_create_user(
    'koc@kadarn.test',
    'Test123!',
    'KOC Operator'
);

UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('kadarn_role', 'kadarn_internal')
WHERE email = 'koc@kadarn.test';

-- ############################################################################
-- PART 3: multiorg@kadarn.test
-- ############################################################################
-- Regular user with active memberships in 2 orgs (PharmaCorp + National Biobank).
-- No active_org_id set in metadata — org selector must be shown.
-- Expected: default_redirect = '/auth/select-org'
--           After selecting org → default_redirect = '/workspace'
-- ============================================================================

SELECT public.admin_create_user(
    'multiorg@kadarn.test',
    'Test123!',
    'Multi Org User'
    -- no org_id — we add memberships manually below
);

-- Membership 1: PharmaCorp (sponsor)
INSERT INTO public.organization_memberships (user_id, organization_id, status, invited_by, invited_at, joined_at)
SELECT up.id, 'a0000000-0000-0000-0000-000000000001', 'active', up.id, now(), now()
FROM public.user_profiles up
WHERE up.email = 'multiorg@kadarn.test'
ON CONFLICT (user_id, organization_id) DO NOTHING;

INSERT INTO public.membership_roles (membership_id, role_id, assigned_by)
SELECT om.id, r.id, om.user_id
FROM public.organization_memberships om
JOIN public.user_profiles up ON up.id = om.user_id
CROSS JOIN public.organization_roles r
WHERE up.email = 'multiorg@kadarn.test'
  AND om.organization_id = 'a0000000-0000-0000-0000-000000000001'
  AND r.key = 'org_member'
ON CONFLICT DO NOTHING;

-- Membership 2: National Biobank (biobank)
INSERT INTO public.organization_memberships (user_id, organization_id, status, invited_by, invited_at, joined_at)
SELECT up.id, 'a0000000-0000-0000-0000-000000000004', 'active', up.id, now(), now()
FROM public.user_profiles up
WHERE up.email = 'multiorg@kadarn.test'
ON CONFLICT (user_id, organization_id) DO NOTHING;

INSERT INTO public.membership_roles (membership_id, role_id, assigned_by)
SELECT om.id, r.id, om.user_id
FROM public.organization_memberships om
JOIN public.user_profiles up ON up.id = om.user_id
CROSS JOIN public.organization_roles r
WHERE up.email = 'multiorg@kadarn.test'
  AND om.organization_id = 'a0000000-0000-0000-0000-000000000004'
  AND r.key = 'org_member'
ON CONFLICT DO NOTHING;

-- ############################################################################
-- PART 4: VERIFICATION
-- ############################################################################
--
-- SELECT u.email,
--        u.raw_user_meta_data->>'kadarn_role' AS kadarn_role,
--        COUNT(om.id) AS membership_count
-- FROM auth.users u
-- LEFT JOIN public.user_profiles up ON up.id = u.id
-- LEFT JOIN public.organization_memberships om ON om.user_id = u.id AND om.status = 'active'
-- WHERE u.email IN ('noorg@kadarn.test', 'koc@kadarn.test', 'multiorg@kadarn.test')
-- GROUP BY u.email, u.raw_user_meta_data->>'kadarn_role';
--
-- Expected:
--   noorg@kadarn.test    | NULL              | 0
--   koc@kadarn.test      | kadarn_internal   | 0
--   multiorg@kadarn.test | NULL              | 2
-- ============================================================================

-- ============================================================================
-- END OF MIGRATION 030 — Test Auth Users
-- ============================================================================
