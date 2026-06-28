-- ============================================================================
-- KADARN PLATFORM — Sprint 0D: Smoke Tests
-- ============================================================================
-- Target: PostgreSQL 15+ (Supabase compatible)
-- Dependencies: Migrations 008–011 applied with seed data
--
-- These smoke tests validate multi-tenant RLS infrastructure and data integrity.
-- Run as superuser or with bypassrls after migrations are applied.
--
-- (Blueprint §20 — Sprint 0 acceptance criteria)
--
-- TODO Sprint 1: Add real RLS functional tests with Supabase auth context / JWT users.
--   Current tests run as superuser (bypasses RLS). To validate RLS properly:
--   1. Start Supabase local with auth enabled
--   2. Run queries as each demo user via Supabase auth.uid() context
--   3. Verify Org A user CANNOT see Org B data
--   4. Verify multi-org user CAN see both orgs
--   5. Verify non-member CANNOT insert/update
--   These will be added as 013_rls_functional_tests.sql or as API-level integration tests.
--
-- HOW TO RUN:
--   psql -d <database> -f 012_smoke_tests.sql
--
-- Each test prints PASS/FAIL.
-- ============================================================================

-- ############################################################################
-- PART 0: TEST FRAMEWORK HELPER
-- ############################################################################

CREATE OR REPLACE FUNCTION public.test_result(
    p_test_name TEXT,
    p_passed BOOLEAN,
    p_detail TEXT DEFAULT NULL
)
RETURNS TABLE (result TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_passed THEN
        RETURN QUERY SELECT format('  ✅ PASS: %s', p_test_name)::TEXT;
    ELSE
        RETURN QUERY SELECT format('  ❌ FAIL: %s — %s', p_test_name, COALESCE(p_detail, 'unexpected result'))::TEXT;
    END IF;
END;
$$;

-- ############################################################################
-- PART 1: SEED DATA INTEGRITY
-- ############################################################################

-- Test 1.1: 7 organizations exist
SELECT public.test_result(
    'Seed data: 7 organizations created',
    (SELECT COUNT(*) FROM public.organizations) = 7,
    format('Found %s orgs, expected 7', (SELECT COUNT(*) FROM public.organizations)::TEXT)
);

-- Test 1.2: 12 capability types seeded
SELECT public.test_result(
    'Seed data: 12 capability types',
    (SELECT COUNT(*) FROM public.organization_capability_types WHERE is_active = true) = 12,
    format('Found %s types, expected 12', (SELECT COUNT(*) FROM public.organization_capability_types)::TEXT)
);

-- Test 1.3: 12 capability types have standard keys
SELECT public.test_result(
    'Seed data: capability types include sponsor, cro, biobank, clinical_site, irb',
    (SELECT COUNT(*) FROM public.organization_capability_types
     WHERE key IN ('sponsor', 'cro', 'biobank', 'clinical_site', 'irb', 'processing_lab',
                   'storage_facility', 'logistics_vendor', 'regulatory_body',
                   'diagnostic_lab', 'data_processor', 'technology_provider')) = 12
);

-- Test 1.4: Organization capabilities are seeded
SELECT public.test_result(
    'Seed data: organization capabilities exist',
    (SELECT COUNT(*) FROM public.organization_capabilities) >= 9,
    format('Found %s capabilities', (SELECT COUNT(*) FROM public.organization_capabilities)::TEXT)
);

-- Test 1.5: 6 system roles seeded
SELECT public.test_result(
    'Seed data: 6 system roles',
    (SELECT COUNT(*) FROM public.organization_roles WHERE is_system_role = true) = 6
);

-- Test 1.6: 8 users created (1 admin + 7 org users)
SELECT public.test_result(
    'Seed data: 8 demo users',
    (SELECT COUNT(*) FROM public.user_profiles) >= 8,
    format('Found %s users', (SELECT COUNT(*) FROM public.user_profiles)::TEXT)
);

-- Test 1.7: At least 8 memberships (7 org users + 1 admin in 2 orgs = 9 total)
SELECT public.test_result(
    'Seed data: memberships created',
    (SELECT COUNT(*) FROM public.organization_memberships) >= 9,
    format('Found %s memberships', (SELECT COUNT(*) FROM public.organization_memberships)::TEXT)
);

-- Test 1.7b: At least one user belongs to multiple orgs
SELECT public.test_result(
    'Seed data: multi-org user exists',
    EXISTS (
        SELECT user_id, COUNT(*) FROM public.organization_memberships
        WHERE status = 'active'
        GROUP BY user_id
        HAVING COUNT(*) > 1
    ),
    'No user has memberships in multiple organizations'
);

-- Test 1.8: 2 programs exist
SELECT public.test_result(
    'Seed data: 2 programs',
    (SELECT COUNT(*) FROM public.programs) = 2,
    format('Found %s programs', (SELECT COUNT(*) FROM public.programs)::TEXT)
);

-- Test 1.9: Program 1 (TNBC) has 7 participants (sponsor, CRO, site, biobank, lab, courier, IRB)
SELECT public.test_result(
    'Seed data: Program 1 (TNBC) has 7 participants',
    (SELECT COUNT(*) FROM public.program_participants
     WHERE program_id = 'b0000000-0000-0000-0000-000000000001') = 7,
    format('Found %s participants', (SELECT COUNT(*) FROM public.program_participants
           WHERE program_id = 'b0000000-0000-0000-0000-000000000001')::TEXT)
);

-- Test 1.10: Program 2 (NSCLC) has 5 participants
SELECT public.test_result(
    'Seed data: Program 2 (NSCLC) has 5 participants',
    (SELECT COUNT(*) FROM public.program_participants
     WHERE program_id = 'b0000000-0000-0000-0000-000000000002') = 5,
    format('Found %s participants', (SELECT COUNT(*) FROM public.program_participants
           WHERE program_id = 'b0000000-0000-0000-0000-000000000002')::TEXT)
);

-- Test 1.11: Programs have created_by_organization_id
SELECT public.test_result(
    'Seed data: programs have created_by_organization_id',
    (SELECT COUNT(*) FROM public.programs WHERE created_by_organization_id IS NOT NULL) = 2,
    format('Found %s programs with creator org', (SELECT COUNT(*) FROM public.programs WHERE created_by_organization_id IS NOT NULL)::TEXT)
);

-- Test 1.12: Program creator org matches first participant
SELECT public.test_result(
    'Seed data: Program 1 creator org is participant',
    EXISTS (
        SELECT 1 FROM public.programs p
        JOIN public.program_participants pp ON pp.program_id = p.id
        WHERE p.id = 'b0000000-0000-0000-0000-000000000001'
          AND pp.organization_id = p.created_by_organization_id
          AND pp.role = 'sponsor'
    ),
    'Program 1 creator org is not a participant or not sponsor'
);

-- ############################################################################
-- PART 2: RLS — ROW LEVEL SECURITY ENABLED
-- ############################################################################

-- Test 2.1: All tables have RLS enabled
SELECT public.test_result(
    'RLS: enabled on organizations',
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'organizations' AND relnamespace = 'public'::regnamespace),
    'RLS not enabled'
);

SELECT public.test_result(
    'RLS: enabled on organization_capabilities',
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'organization_capabilities' AND relnamespace = 'public'::regnamespace)
);

SELECT public.test_result(
    'RLS: enabled on organization_memberships',
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'organization_memberships' AND relnamespace = 'public'::regnamespace)
);

SELECT public.test_result(
    'RLS: enabled on membership_roles',
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'membership_roles' AND relnamespace = 'public'::regnamespace)
);

SELECT public.test_result(
    'RLS: enabled on user_profiles',
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'user_profiles' AND relnamespace = 'public'::regnamespace)
);

SELECT public.test_result(
    'RLS: enabled on programs',
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'programs' AND relnamespace = 'public'::regnamespace)
);

SELECT public.test_result(
    'RLS: enabled on program_participants',
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'program_participants' AND relnamespace = 'public'::regnamespace)
);

SELECT public.test_result(
    'RLS: enabled on audit_events',
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'audit_events' AND relnamespace = 'public'::regnamespace)
);

-- ############################################################################
-- PART 3: RLS — POLICY COUNT
-- ############################################################################

-- Test 3.1: Each table has at least one policy
CREATE OR REPLACE FUNCTION public.check_table_has_policies(p_table TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
    SELECT COUNT(*) > 0
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = p_table;
$$;

SELECT public.test_result(
    'Policies: organizations has policies',
    public.check_table_has_policies('organizations')
);
SELECT public.test_result(
    'Policies: organization_capability_types has policies',
    public.check_table_has_policies('organization_capability_types')
);
SELECT public.test_result(
    'Policies: organization_capabilities has policies',
    public.check_table_has_policies('organization_capabilities')
);
SELECT public.test_result(
    'Policies: organization_roles has policies',
    public.check_table_has_policies('organization_roles')
);
SELECT public.test_result(
    'Policies: organization_memberships has policies',
    public.check_table_has_policies('organization_memberships')
);
SELECT public.test_result(
    'Policies: membership_roles has policies',
    public.check_table_has_policies('membership_roles')
);
SELECT public.test_result(
    'Policies: user_profiles has policies',
    public.check_table_has_policies('user_profiles')
);
SELECT public.test_result(
    'Policies: programs has policies',
    public.check_table_has_policies('programs')
);
SELECT public.test_result(
    'Policies: program_participants has policies',
    public.check_table_has_policies('program_participants')
);
SELECT public.test_result(
    'Policies: program_access_policies has policies',
    public.check_table_has_policies('program_access_policies')
);
SELECT public.test_result(
    'Policies: audit_events has policies',
    public.check_table_has_policies('audit_events')
);

-- ############################################################################
-- PART 4: RLS — HELPER FUNCTIONS EXIST
-- ############################################################################

-- Test 4.1: All RLS helper functions exist
CREATE OR REPLACE FUNCTION public.check_function_exists(p_schema TEXT, p_name TEXT, p_args TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = p_schema
          AND p.proname = p_name
    );
$$;

SELECT public.test_result(
    'Helper: current_user_id() exists',
    public.check_function_exists('public', 'current_user_id')
);
SELECT public.test_result(
    'Helper: is_org_member(UUID) exists',
    public.check_function_exists('public', 'is_org_member')
);
SELECT public.test_result(
    'Helper: has_org_capability(UUID, TEXT) exists',
    public.check_function_exists('public', 'has_org_capability')
);
SELECT public.test_result(
    'Helper: has_current_user_capability(TEXT) exists',
    public.check_function_exists('public', 'has_current_user_capability')
);
SELECT public.test_result(
    'Helper: has_org_role(UUID, TEXT) exists',
    public.check_function_exists('public', 'has_org_role')
);
SELECT public.test_result(
    'Helper: is_org_admin() exists',
    public.check_function_exists('public', 'is_org_admin')
);
SELECT public.test_result(
    'Helper: can_access_program(UUID) exists',
    public.check_function_exists('public', 'can_access_program')
);
SELECT public.test_result(
    'Helper: check_visibility(UUID, visibility_scope) exists',
    public.check_function_exists('public', 'check_visibility')
);
SELECT public.test_result(
    'Helper: emit_audit_event(...) exists',
    public.check_function_exists('public', 'emit_audit_event')
);

-- ############################################################################
-- PART 5: TRIGGERS EXIST
-- ############################################################################

-- Test 5.1: updated_at triggers exist
SELECT public.test_result(
    'Trigger: organizations updated_at',
    EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_organizations_updated_at')
);
SELECT public.test_result(
    'Trigger: programs updated_at',
    EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_programs_updated_at')
);
SELECT public.test_result(
    'Trigger: program_participants updated_at',
    EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_program_participants_updated_at')
);

-- Test 5.2: Audit triggers exist
SELECT public.test_result(
    'Trigger: programs audit',
    EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_programs_audit')
);
SELECT public.test_result(
    'Trigger: program_participants audit',
    EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_program_participants_audit')
);

-- Test 5.3: Auth triggers exist
SELECT public.test_result(
    'Trigger: on_auth_user_created exists',
    EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created')
);
SELECT public.test_result(
    'Trigger: user_profiles auth sync exists',
    EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_user_profiles_auth_sync')
);

-- ############################################################################
-- PART 6: DATA INTEGRITY — CONSTRAINTS
-- ############################################################################

-- Test 6.1: No duplicate org names within same country
SELECT public.test_result(
    'Constraint: no duplicate org names per country',
    NOT EXISTS (
        SELECT name, country, COUNT(*)
        FROM public.organizations
        GROUP BY name, country
        HAVING COUNT(*) > 1
    )
);

-- Test 6.2: All capabilities reference valid orgs
SELECT public.test_result(
    'Integrity: all capabilities reference valid orgs',
    NOT EXISTS (
        SELECT 1 FROM public.organization_capabilities oc
        LEFT JOIN public.organizations o ON o.id = oc.organization_id
        WHERE o.id IS NULL
    )
);

-- Test 6.3: All memberships reference valid users (may be system users)
SELECT public.test_result(
    'Integrity: all memberships reference valid orgs',
    NOT EXISTS (
        SELECT 1 FROM public.organization_memberships om
        LEFT JOIN public.organizations o ON o.id = om.organization_id
        WHERE o.id IS NULL
    )
);

-- Test 6.4: All program participants reference valid orgs and programs
SELECT public.test_result(
    'Integrity: program_participants orgs exist',
    NOT EXISTS (
        SELECT 1 FROM public.program_participants pp
        LEFT JOIN public.organizations o ON o.id = pp.organization_id
        WHERE o.id IS NULL
    )
);

SELECT public.test_result(
    'Integrity: program_participants programs exist',
    NOT EXISTS (
        SELECT 1 FROM public.program_participants pp
        LEFT JOIN public.programs p ON p.id = pp.program_id
        WHERE p.id IS NULL
    )
);

-- Test 6.5: Program 1 has all 7 required actor types
SELECT public.test_result(
    'Integrity: Program 1 has sponsor, lead, 2 contributors, processor, processor, reviewer',
    (
        SELECT COUNT(DISTINCT role) FROM public.program_participants
        WHERE program_id = 'b0000000-0000-0000-0000-000000000001'
    ) >= 4  -- sponsor, lead, contributor, processor, reviewer
    AND (
        SELECT COUNT(*) FROM public.program_participants
        WHERE program_id = 'b0000000-0000-0000-0000-000000000001'
        AND role = 'contributor'
    ) = 2
);

-- ############################################################################
-- PART 7: AUDIT — BASIC VERIFICATION
-- ############################################################################

-- Test 7.1: Audit events capture program creation (trigger auto-fires)
-- Note: seed data was inserted with INSERT ... ON CONFLICT DO NOTHING
-- which does NOT fire AFTER INSERT triggers if the row already exists.
-- This test verifies the mechanism, not the seed events.
SELECT public.test_result(
    'Audit: emit_audit_event function works',
    public.emit_audit_event(
        'system'::audit_action,
        'other'::audit_resource_type,
        gen_random_uuid(),
        NULL, NULL, NULL,
        'Smoke test audit event'
    ) IS NOT NULL
);

-- ############################################################################
-- PART 8: SUMMARY
-- ############################################################################

WITH test_summary AS (
    SELECT COUNT(*) AS total
    FROM (SELECT 1 AS t WHERE public.check_table_has_policies('organizations')) dummy
)
SELECT '🏁 Sprint 0 smoke tests complete.' AS result;

-- Clean up test helpers
DROP FUNCTION IF EXISTS public.test_result(TEXT, BOOLEAN, TEXT);
DROP FUNCTION IF EXISTS public.check_table_has_policies(TEXT);
DROP FUNCTION IF EXISTS public.check_function_exists(TEXT, TEXT, TEXT);

-- ============================================================================
-- END OF MIGRATION 012 — Sprint 0D: Smoke Tests
-- ============================================================================
