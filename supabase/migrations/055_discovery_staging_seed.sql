-- ============================================================================
-- Phase 8 Staging — Discovery session + agent outputs for National Biobank
-- Depends: 050–054 discovery migrations, 049 passport seed
-- ============================================================================

DO $$
DECLARE
    v_org       CONSTANT UUID := 'a0000000-0000-0000-0000-000000000004';
    v_user      UUID;
    v_session   UUID := '00000000-0000-4000-8000-000000000401';
    v_run       UUID := '00000000-0000-4000-8000-000000000402';
    v_artifact  UUID := '00000000-0000-4000-8000-000000000403';
    v_layer1    UUID := '00000000-0000-4000-8000-000000000404';
    v_prep      UUID := '00000000-0000-4000-8000-000000000405';
    v_cand      UUID := '00000000-0000-4000-8000-000000000501';
BEGIN
    SELECT id INTO v_user FROM auth.users WHERE email = 'biobank@kadarn.test' LIMIT 1;
    IF v_user IS NULL THEN
        SELECT id INTO v_user FROM auth.users LIMIT 1;
    END IF;

    UPDATE public.organizations
    SET city = 'Bethesda', region = 'MD',
        description = 'Large-scale biobank with 500K+ samples across 50+ collections'
    WHERE id = v_org;

    INSERT INTO discovery_sessions (id, organization_id, status, created_by, correlation_id)
    VALUES (v_session, v_org, 'active', COALESCE(v_user, '00000000-0000-0000-0000-000000000001'), v_session)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO discovery_runs (id, session_id, status, pipeline_version, completed_at)
    VALUES (v_run, v_session, 'completed', 'staging-28k:1.0.0', now())
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO discovery_artifacts (
        id, run_id, file_name, artifact_type, size_bytes, file_hash, source, storage_ref
    ) VALUES (
        v_artifact, v_run, 'facility-overview.pdf', 'pdf', 102400,
        'sha256-staging-facility-overview', 'upload', 'staging://facility-overview.pdf'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO discovery_layer1 (
        id, artifact_id, markdown, extractor, extractor_version, original_hash, status
    ) VALUES (
        v_layer1, v_artifact, '# National Biobank Facility Overview', 'staging-extractor', '1.0.0',
        'sha256-staging-facility-overview', 'completed'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO discovery_preparation_requests (
        request_id, discovery_run_id, artifact_id, layer1_id, request_type, status,
        pipeline_version, input_hash, completed_at
    ) VALUES (
        v_prep, v_run, v_artifact, v_layer1, 'CLAIM_CANDIDATE_DETECTION', 'COMPLETED',
        'staging-28k:1.0.0', 'sha256-staging-input', now()
    ) ON CONFLICT (request_id) DO NOTHING;

    INSERT INTO discovery_agent_outputs (
        id, request_id, agent_name, agent_version, status, output, confidence,
        layer1_id, artifact_id
    ) VALUES
    (
        '00000000-0000-4000-8000-000000000411', v_prep,
        'capability_detector', '1.0.0', 'COMPLETED',
        '{"capabilities":[{"capabilityId":"cap-stg-001","claimTypeId":"cold_chain","name":"Ultra-Low Temperature Storage","category":"infrastructure","status":"confirmed","supportingEntityIds":[],"reasoning":"Facility documentation references -80C storage"}]}'::jsonb,
        0.910, v_layer1, v_artifact
    ),
    (
        '00000000-0000-4000-8000-000000000412', v_prep,
        'claim_candidate_detector', '1.0.0', 'COMPLETED',
        '{"candidates":[{"id":"cand-stg-001","proposedClaimTypeId":"biospecimen_storage","reasoning":"Cold chain capability documented"}]}'::jsonb,
        0.780, v_layer1, v_artifact
    ),
    (
        '00000000-0000-4000-8000-000000000413', v_prep,
        'evidence_gap_detector', '1.0.0', 'COMPLETED',
        '{"reports":[{"gaps":[]}]}'::jsonb,
        1.000, v_layer1, v_artifact
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO discovery_candidates (
        id, run_id, current_state, content, discovery_confidence, source
    ) VALUES (
        v_cand, v_run, 'CLAIMS_PROPOSED',
        'Laboratory capability inferred from facility documentation', 0.76, 'claim_candidate_detector'
    ) ON CONFLICT (id) DO NOTHING;
END $$;
