-- ============================================================================
-- KADARN PLATFORM — Sprint 0D: Seed Data
-- ============================================================================
-- Target: PostgreSQL 15+ (Supabase compatible)
-- Dependencies: 008_organizations_capabilities.sql, 009_rls_foundation.sql,
--               010_audit_programs.sql
--
-- Seeds demo data covering all actor types from Blueprint §3:
--   ✅ sponsor, CRO, clinical_site, biobank, lab, courier, IRB
--   ✅ Users with memberships and roles
--   ✅ Programs connecting multiple organizations
--   ✅ Program access policies
--
-- (Blueprint §20 — Sprint 0 acceptance criteria)
-- ============================================================================

-- ############################################################################
-- PART 1: HELPER — ensure seed idempotency
-- ############################################################################
--
-- We use ON CONFLICT DO NOTHING and manual UUIDs so the seed can be
-- re-run safely. All IDs are fixed for test consistency.
-- ============================================================================

-- ############################################################################
-- PART 2: ORGANIZATIONS
-- ############################################################################
--
-- 7 organizations covering the 7 required actor types.
-- (Blueprint §3 — Ecosystem map: Sites, Labs, Biobanks, Sponsors, etc.)
-- ============================================================================

INSERT INTO public.organizations (id, name, legal_name, country, region, description, created_by, visibility_scope) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'PharmaCorp',       'PharmaCorp International Inc.',  'US', 'Massachusetts',  'Global pharmaceutical company funding oncology and rare disease programs',                    '00000000-0000-0000-0000-000000000000', 'network'),
    ('a0000000-0000-0000-0000-000000000002', 'ClinResearch CRO', 'ClinResearch Organization LLC',   'US', 'North Carolina',  'Full-service CRO managing multi-site biospecimen programs',                                   '00000000-0000-0000-0000-000000000000', 'network'),
    ('a0000000-0000-0000-0000-000000000003', 'Univ Medical Center', 'University Medical Center',   'US', 'California',     'Academic medical center with clinical research site and biorepository',                       '00000000-0000-0000-0000-000000000000', 'network'),
    ('a0000000-0000-0000-0000-000000000004', 'National Biobank', 'National Biobank Repository',      'US', 'Maryland',       'Large-scale biobank with 500K+ samples across 50+ collections',                               '00000000-0000-0000-0000-000000000000', 'network'),
    ('a0000000-0000-0000-0000-000000000005', 'Advanced Path Lab','Advanced Pathology Laboratories',  'DE', 'Bavaria',        'ISO 20387-certified laboratory specializing in IHC, NGS, and digital pathology',              '00000000-0000-0000-0000-000000000000', 'network'),
    ('a0000000-0000-0000-0000-000000000006', 'Global Cold Chain','Global Cold Chain Logistics GmbH', 'DE', 'Hesse',          'Cold-chain logistics provider specializing in UN 3373 biological substances',                 '00000000-0000-0000-0000-000000000000', 'network'),
    ('a0000000-0000-0000-0000-000000000007', 'Central IRB',      'Central Ethics Review Board',     'US', 'District of Columbia', 'Central IRB providing ethics review for multi-site biospecimen programs',                   '00000000-0000-0000-0000-000000000000', 'network')
ON CONFLICT (id) DO NOTHING;

-- ############################################################################
-- PART 3: ORGANIZATION CAPABILITIES
-- ############################################################################
--
-- Each org gets its primary capability(s).
-- (Blueprint §5.2 — capability types)
-- ============================================================================

-- PharmaCorp → sponsor
INSERT INTO public.organization_capabilities (organization_id, capability_type_id, is_primary, created_by)
SELECT 'a0000000-0000-0000-0000-000000000001', id, true, '00000000-0000-0000-0000-000000000000'
FROM public.organization_capability_types WHERE key = 'sponsor'
ON CONFLICT DO NOTHING;

-- ClinResearch CRO → cro
INSERT INTO public.organization_capabilities (organization_id, capability_type_id, is_primary, created_by)
SELECT 'a0000000-0000-0000-0000-000000000002', id, true, '00000000-0000-0000-0000-000000000000'
FROM public.organization_capability_types WHERE key = 'cro'
ON CONFLICT DO NOTHING;

-- Univ Medical Center → clinical_site + biobank
INSERT INTO public.organization_capabilities (organization_id, capability_type_id, is_primary, created_by)
SELECT 'a0000000-0000-0000-0000-000000000003', id, true, '00000000-0000-0000-0000-000000000000'
FROM public.organization_capability_types WHERE key = 'clinical_site'
ON CONFLICT DO NOTHING;

INSERT INTO public.organization_capabilities (organization_id, capability_type_id, is_primary, created_by)
SELECT 'a0000000-0000-0000-0000-000000000003', id, false, '00000000-0000-0000-0000-000000000000'
FROM public.organization_capability_types WHERE key = 'biobank'
ON CONFLICT DO NOTHING;

-- National Biobank → biobank + storage_facility
INSERT INTO public.organization_capabilities (organization_id, capability_type_id, is_primary, created_by)
SELECT 'a0000000-0000-0000-0000-000000000004', id, true, '00000000-0000-0000-0000-000000000000'
FROM public.organization_capability_types WHERE key = 'biobank'
ON CONFLICT DO NOTHING;

INSERT INTO public.organization_capabilities (organization_id, capability_type_id, is_primary, created_by)
SELECT 'a0000000-0000-0000-0000-000000000004', id, false, '00000000-0000-0000-0000-000000000000'
FROM public.organization_capability_types WHERE key = 'storage_facility'
ON CONFLICT DO NOTHING;

-- Advanced Path Lab → processing_lab + diagnostic_lab
INSERT INTO public.organization_capabilities (organization_id, capability_type_id, is_primary, created_by)
SELECT 'a0000000-0000-0000-0000-000000000005', id, true, '00000000-0000-0000-0000-000000000000'
FROM public.organization_capability_types WHERE key = 'processing_lab'
ON CONFLICT DO NOTHING;

INSERT INTO public.organization_capabilities (organization_id, capability_type_id, is_primary, created_by)
SELECT 'a0000000-0000-0000-0000-000000000005', id, false, '00000000-0000-0000-0000-000000000000'
FROM public.organization_capability_types WHERE key = 'diagnostic_lab'
ON CONFLICT DO NOTHING;

-- Global Cold Chain → logistics_vendor
INSERT INTO public.organization_capabilities (organization_id, capability_type_id, is_primary, created_by)
SELECT 'a0000000-0000-0000-0000-000000000006', id, true, '00000000-0000-0000-0000-000000000000'
FROM public.organization_capability_types WHERE key = 'logistics_vendor'
ON CONFLICT DO NOTHING;

-- Central IRB → irb
INSERT INTO public.organization_capabilities (organization_id, capability_type_id, is_primary, created_by)
SELECT 'a0000000-0000-0000-0000-000000000007', id, true, '00000000-0000-0000-0000-000000000000'
FROM public.organization_capability_types WHERE key = 'irb'
ON CONFLICT DO NOTHING;

-- ############################################################################
-- PART 4: USERS (via auth.users + user_profiles)
-- ############################################################################
--
-- One user per organization plus a platform-level admin.
-- Passwords are for local dev only (Test123!).
-- Uses admin_create_user (defined in migration 008).
-- ============================================================================

-- Platform admin (cross-org, not tied to a single org)
SELECT public.admin_create_user(
    'admin@kadarn.test', 'Test123!', 'Kadarn Admin'
);

-- PharmaCorp (sponsor)
SELECT public.admin_create_user(
    'sponsor@kadarn.test', 'Test123!', 'Sarah Chen',
    'a0000000-0000-0000-0000-000000000001'
);

-- ClinResearch CRO
SELECT public.admin_create_user(
    'cro@kadarn.test', 'Test123!', 'Miguel Torres',
    'a0000000-0000-0000-0000-000000000002'
);

-- Univ Medical Center (site + biobank)
SELECT public.admin_create_user(
    'site@kadarn.test', 'Test123!', 'Emily Nakamura',
    'a0000000-0000-0000-0000-000000000003'
);

-- National Biobank
SELECT public.admin_create_user(
    'biobank@kadarn.test', 'Test123!', 'James Okafor',
    'a0000000-0000-0000-0000-000000000004'
);

-- Advanced Path Lab
SELECT public.admin_create_user(
    'lab@kadarn.test', 'Test123!', 'Anna Weber',
    'a0000000-0000-0000-0000-000000000005'
);

-- Global Cold Chain
SELECT public.admin_create_user(
    'courier@kadarn.test', 'Test123!', 'Klaus Mueller',
    'a0000000-0000-0000-0000-000000000006'
);

-- Central IRB
SELECT public.admin_create_user(
    'irb@kadarn.test', 'Test123!', 'Patricia Okonkwo',
    'a0000000-0000-0000-0000-000000000007'
);

-- ############################################################################
-- PART 5: ORG_ADMIN ROLES FOR SEED USERS
-- ############################################################################
--
-- Assign org_admin role to each org's user so they can manage their org
-- in smoke tests and development.
-- ============================================================================

-- Grant org_admin to each org's primary user
INSERT INTO public.membership_roles (membership_id, role_id, assigned_by)
SELECT om.id, r.id, om.user_id
FROM public.organization_memberships om
CROSS JOIN public.organization_roles r
WHERE r.key = 'org_admin'
  AND om.status = 'active'
  -- Only for memberships created by admin_create_user (where invited_by = user_id)
  AND om.invited_by = om.user_id
ON CONFLICT DO NOTHING;

-- Also give the platform admin org_admin at PharmaCorp (for testing)
INSERT INTO public.organization_memberships (user_id, organization_id, status, invited_by, invited_at, joined_at)
SELECT up.id, 'a0000000-0000-0000-0000-000000000001', 'active', up.id, now(), now()
FROM public.user_profiles up
WHERE up.email = 'admin@kadarn.test'
  AND NOT EXISTS (
    SELECT 1 FROM public.organization_memberships om
    WHERE om.user_id = up.id AND om.organization_id = 'a0000000-0000-0000-0000-000000000001'
  );

INSERT INTO public.membership_roles (membership_id, role_id, assigned_by)
SELECT om.id, r.id, om.user_id
FROM public.organization_memberships om
CROSS JOIN public.organization_roles r
WHERE r.key = 'org_admin'
  AND om.user_id = (SELECT id FROM public.user_profiles WHERE email = 'admin@kadarn.test')
  AND om.organization_id = 'a0000000-0000-0000-0000-000000000001'
  AND NOT EXISTS (
    SELECT 1 FROM public.membership_roles mr WHERE mr.membership_id = om.id AND mr.role_id = r.id
  );

-- Also add the admin to Central IRB (multi-org user for RLS testing)
INSERT INTO public.organization_memberships (user_id, organization_id, status, invited_by, invited_at, joined_at)
SELECT up.id, 'a0000000-0000-0000-0000-000000000007', 'active', up.id, now(), now()
FROM public.user_profiles up
WHERE up.email = 'admin@kadarn.test'
  AND NOT EXISTS (
    SELECT 1 FROM public.organization_memberships om
    WHERE om.user_id = up.id AND om.organization_id = 'a0000000-0000-0000-0000-000000000007'
  );

INSERT INTO public.membership_roles (membership_id, role_id, assigned_by)
SELECT om.id, r.id, om.user_id
FROM public.organization_memberships om
CROSS JOIN public.organization_roles r
WHERE r.key = 'org_admin'
  AND om.user_id = (SELECT id FROM public.user_profiles WHERE email = 'admin@kadarn.test')
  AND om.organization_id = 'a0000000-0000-0000-0000-000000000007'
  AND NOT EXISTS (
    SELECT 1 FROM public.membership_roles mr WHERE mr.membership_id = om.id AND mr.role_id = r.id
  );

-- ############################################################################
-- PART 6: PROGRAMS
-- ############################################################################
--
-- Two demo programs connecting multiple organizations.
-- (Blueprint §6 — Program Engine, §20.1 — Sprint 0 acceptance)
-- ============================================================================

-- Program 1: Retrospective breast cancer study
INSERT INTO public.programs (id, name, short_name, description, program_type, therapeutic_areas, diseases,
                             start_date, end_date, status, sponsor_org_id, lead_org_id,
                             default_data_scope, created_by, created_by_organization_id)
VALUES (
    'p0000000-0000-0000-0000-000000000001',
    'Triple-Negative Breast Cancer Retrospective Cohort',
    'TNBC-RETRO-001',
    'Multi-center retrospective study requiring 500 FFPE blocks and matched clinical data from triple-negative breast cancer patients.',
    ARRAY['retrospective_study', 'multi_center'],
    ARRAY['oncology'],
    '[{"code": "ICD-10:C50.9", "label": "Malignant neoplasm of breast"}, {"code": "ICD-10:C50.0", "label": "Nipple and areola"}]'::jsonb,
    '2026-07-01', '2027-06-30', 'active',
    'a0000000-0000-0000-0000-000000000001',  -- PharmaCorp (sponsor)
    'a0000000-0000-0000-0000-000000000002',  -- ClinResearch CRO (lead)
    'de_identified',
    (SELECT id FROM public.user_profiles WHERE email = 'admin@kadarn.test'),
    'a0000000-0000-0000-0000-000000000001'   -- PharmaCorp (creator org)
) ON CONFLICT (id) DO NOTHING;

-- Program 2: Prospective liquid biopsy collection
INSERT INTO public.programs (id, name, short_name, description, program_type, therapeutic_areas, diseases,
                             start_date, end_date, status, sponsor_org_id, lead_org_id,
                             default_data_scope, created_by, created_by_organization_id)
VALUES (
    'p0000000-0000-0000-0000-000000000002',
    'NSCLC Liquid Biopsy Prospective Collection',
    'NSCLC-LBIO-002',
    'Prospective collection of 200 liquid biopsy samples from Stage IV NSCLC patients across 5 clinical sites in Brazil and Argentina.',
    ARRAY['prospective_collection', 'multi_center', 'international'],
    ARRAY['oncology', 'pulmonology'],
    '[{"code": "ICD-10:C34.9", "label": "Malignant neoplasm of bronchus or lung"}]'::jsonb,
    '2026-08-01', '2027-12-31', 'active',
    'a0000000-0000-0000-0000-000000000001',  -- PharmaCorp (sponsor)
    'a0000000-0000-0000-0000-000000000002',  -- ClinResearch CRO (lead)
    'de_identified',
    (SELECT id FROM public.user_profiles WHERE email = 'admin@kadarn.test'),
    'a0000000-0000-0000-0000-000000000001'   -- PharmaCorp (creator org)
) ON CONFLICT (id) DO NOTHING;

-- ############################################################################
-- PART 7: PROGRAM PARTICIPANTS
-- ############################################################################
--
-- Programs connect multiple organizations with specific roles.
-- (Blueprint §6.4 — participant roles)
-- ============================================================================

-- Program 1 participants
INSERT INTO public.program_participants (program_id, organization_id, role, status, joined_at, created_by)
VALUES
    ('p0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'sponsor', 'active', now(),
     (SELECT id FROM public.user_profiles WHERE email = 'admin@kadarn.test')),
    ('p0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'lead', 'active', now(),
     (SELECT id FROM public.user_profiles WHERE email = 'admin@kadarn.test')),
    ('p0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'contributor', 'active', now(),
     (SELECT id FROM public.user_profiles WHERE email = 'admin@kadarn.test')),
    ('p0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'contributor', 'active', now(),
     (SELECT id FROM public.user_profiles WHERE email = 'admin@kadarn.test')),
    ('p0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', 'processor', 'active', now(),
     (SELECT id FROM public.user_profiles WHERE email = 'admin@kadarn.test')),
    ('p0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000006', 'processor', 'active', now(),
     (SELECT id FROM public.user_profiles WHERE email = 'admin@kadarn.test')),
    ('p0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000007', 'reviewer', 'active', now(),
     (SELECT id FROM public.user_profiles WHERE email = 'admin@kadarn.test'))
ON CONFLICT (program_id, organization_id) DO NOTHING;

-- Program 2 participants
INSERT INTO public.program_participants (program_id, organization_id, role, status, joined_at, created_by)
VALUES
    ('p0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'sponsor', 'active', now(),
     (SELECT id FROM public.user_profiles WHERE email = 'admin@kadarn.test')),
    ('p0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'lead', 'active', now(),
     (SELECT id FROM public.user_profiles WHERE email = 'admin@kadarn.test')),
    ('p0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 'contributor', 'active', now(),
     (SELECT id FROM public.user_profiles WHERE email = 'admin@kadarn.test')),
    ('p0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000005', 'processor', 'active', now(),
     (SELECT id FROM public.user_profiles WHERE email = 'admin@kadarn.test')),
    ('p0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000007', 'reviewer', 'active', now(),
     (SELECT id FROM public.user_profiles WHERE email = 'admin@kadarn.test'))
ON CONFLICT (program_id, organization_id) DO NOTHING;

-- ############################################################################
-- PART 8: PROGRAM ACCESS POLICIES
-- ############################################################################
--
-- Default access policies for each program.
-- (Blueprint §6.5 — data sharing scopes)
-- ============================================================================

-- Program 1: TNBC study — de-identified data, no export, requires approval
INSERT INTO public.program_access_policies (program_id, name, policy_type, allowed_data_scope, allow_export, require_approval, created_by)
VALUES
    ('p0000000-0000-0000-0000-000000000001', 'Default Data Access', 'default', 'de_identified', false, true,
     (SELECT id FROM public.user_profiles WHERE email = 'admin@kadarn.test'))
ON CONFLICT DO NOTHING;

-- Program 2: NSCLC collection — metadata only until collection complete
INSERT INTO public.program_access_policies (program_id, name, policy_type, allowed_data_scope, allow_export, require_approval, created_by)
VALUES
    ('p0000000-0000-0000-0000-000000000002', 'Interim Metadata Access', 'default', 'metadata_only', false, true,
     (SELECT id FROM public.user_profiles WHERE email = 'admin@kadarn.test'))
ON CONFLICT DO NOTHING;

-- ############################################################################
-- PART 9: VERIFICATION
-- ############################################################################
--
-- After seeding, verify with:
--
-- SELECT 'organizations' AS entity, COUNT(*) FROM public.organizations
-- UNION ALL
-- SELECT 'capabilities', COUNT(*) FROM public.organization_capabilities
-- UNION ALL
-- SELECT 'memberships', COUNT(*) FROM public.organization_memberships
-- UNION ALL
-- SELECT 'membership_roles', COUNT(*) FROM public.membership_roles
-- UNION ALL
-- SELECT 'programs', COUNT(*) FROM public.programs
-- UNION ALL
-- SELECT 'program_participants', COUNT(*) FROM public.program_participants
-- ORDER BY entity;
-- ============================================================================

-- ============================================================================
-- END OF MIGRATION 011 — Sprint 0D: Seed Data
-- ============================================================================
