-- ============================================================================
-- Phase 8 Staging Cutover Seed — Sprint 28K
-- Target: local/staging only. National Biobank public passport + discovery session.
-- ============================================================================

DO $$
DECLARE
    v_org     CONSTANT UUID := 'a0000000-0000-0000-0000-000000000004';
    v_profile UUID := '00000000-0000-4000-8000-000000000101';
    v_claim1  UUID := '00000000-0000-4000-8000-000000000201';
    v_claim2  UUID := '00000000-0000-4000-8000-000000000202';
    v_user    UUID;
BEGIN
    SELECT id INTO v_user FROM auth.users WHERE email = 'biobank@kadarn.test' LIMIT 1;

    INSERT INTO public.site_continuity_profiles (
        id, organization_id, headline, summary, public_slug,
        passport_visibility, status, created_by
    ) VALUES (
        v_profile, v_org,
        'Regional Biobank Network',
        'Multi-site biospecimen facility with cold-chain infrastructure',
        'national-biobank-staging',
        'public', 'active',
        v_user
    ) ON CONFLICT (id) DO UPDATE SET
        headline = EXCLUDED.headline,
        summary = EXCLUDED.summary,
        public_slug = EXCLUDED.public_slug,
        passport_visibility = EXCLUDED.passport_visibility;

    INSERT INTO public.continuity_experience_claims (
        id, site_continuity_profile_id, organization_id,
        claim_type, category, title, description,
        therapeutic_area, study_phase,
        verification_status, confidence_score, is_public
    ) VALUES
    (
        v_claim1, v_profile, v_org,
        'biospecimen_collection', 'capability',
        '500K plasma samples', 'Longitudinal biobank collection across 3 sites',
        'Oncology', 'Phase III',
        'kadarn_verified', 88, true
    ),
    (
        v_claim2, v_profile, v_org,
        'clinical_experience', 'experience',
        'Phase II immunotherapy trials', '12 completed trials 2019-2024',
        NULL, NULL,
        'evidence_submitted', 72, true
    )
    ON CONFLICT (id) DO NOTHING;

    UPDATE public.organizations
    SET city = 'Bethesda', region = 'MD',
        description = 'Large-scale biobank with 500K+ samples across 50+ collections'
    WHERE id = v_org;
END $$;
