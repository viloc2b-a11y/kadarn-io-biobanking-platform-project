-- ============================================================================
-- KTP-1.3 — Migration 055: Hybrid Trial Readiness
-- ============================================================================
-- Purpose:
--   Define the Hybrid Trial Readiness Passport as a new readiness program type
--   within the existing readiness infrastructure. Adds capability types,
--   program type taxonomy entry, capability requirements, and evidence
--   requirements for evaluating institutional readiness to participate in
--   hybrid, decentralized, and at-home clinical trials.
--
-- Design Principles:
--   - No new tables. Reuses program_type_taxonomy (052),
--     readiness_capability_requirements (053), readiness_evidence_requirements
--     (053), and organization_capability_types (008).
--   - No new enums. Reuses readiness_status (054), evidence_class (045),
--     visibility_scope (008).
--   - Readiness is DERIVED from evidence. evaluation_snapshot remains a cache.
--   - All capability types use category 'hybrid_trial' to separate from
--     organizational types (research, clinical, logistics, etc.).
--
-- Claim Families (see docs/domain/claim-taxonomy-v1.1-hybrid-trial.md):
--   clinical_trials.hybrid.site_execution
--   clinical_trials.hybrid.at_home_coordination
--   clinical_trials.hybrid.data_integrity
--   clinical_trials.hybrid.patient_access_diversity
--   clinical_trials.hybrid.biospecimen_at_home
--   clinical_trials.hybrid.remote_monitoring
--   clinical_trials.hybrid.vendor_nurse_coordination
--   clinical_trials.hybrid.protocol_compliance
--   clinical_trials.hybrid.safety_escalation
--   clinical_trials.hybrid.historical_experience
--
-- Rules:
--   - Declared only ≠ Supported (requires evidence, not just self-declaration)
--   - Unknown ≠ No (missing data is not absence of capability)
--   - Not applicable does not penalize readiness
--   - Expired evidence degrades confidence
--   - Self-report cannot produce high readiness (Class B only → cap at 0.40)
--
-- Dependencies:
--   - public.organization_capability_types (migration 008)
--   - public.program_type_taxonomy (migration 052)
--   - public.readiness_capability_requirements (migration 053)
--   - public.readiness_evidence_requirements (migration 053)
--   - evidence_class enum (migration 045)
-- ============================================================================

-- ###########################################################################
-- PART 1: Capability Types — Hybrid Trial Dimensions
-- ###########################################################################

INSERT INTO public.organization_capability_types (key, name, description, category, display_order)
VALUES
    (
        'hybrid_site_execution',
        'Site-Based Execution',
        'Capability to execute site-based components of hybrid trials including physical infrastructure, staff deployment, and protocol-driven visit execution with documented procedures.',
        'hybrid_trial',
        20
    ),
    (
        'hybrid_at_home_coordination',
        'At-Home Coordination',
        'Capability to coordinate at-home patient visits including scheduling, home health provider deployment, remote visit documentation, and patient communication workflows.',
        'hybrid_trial',
        21
    ),
    (
        'hybrid_data_integrity',
        'Hybrid Data Integrity',
        'Capability to maintain data integrity across hybrid collection points including source documentation, EHR/EDC/eSource/eConsent workflows, audit/query processes, and data review procedures spanning site and remote data sources.',
        'hybrid_trial',
        22
    ),
    (
        'hybrid_patient_access_diversity',
        'Patient Access & Diversity',
        'Capability to ensure broad patient access and demographic diversity in hybrid trials, including patient panel characterization, geographic reach, language accessibility, underserved community access, and retention history.',
        'hybrid_trial',
        23
    ),
    (
        'hybrid_biospecimen_at_home',
        'Biospecimen-at-Home',
        'Capability to collect, handle, and ship biospecimens from patient homes including chain of custody documentation, sample workflow procedures, shipping/courier coordination, and temperature control throughout the at-home collection-to-lab pipeline.',
        'hybrid_trial',
        24
    ),
    (
        'hybrid_remote_monitoring',
        'Remote Monitoring',
        'Capability to implement and manage remote patient monitoring including device deployment, data ingestion from wearables/sensors/home devices, alert management, patient training, and integration of remote data into the clinical data flow.',
        'hybrid_trial',
        25
    ),
    (
        'hybrid_vendor_nurse_coordination',
        'Vendor / Home Nurse Coordination',
        'Capability to coordinate external vendors and home nursing services including vendor qualification, contract management, training oversight, performance monitoring, and integration of vendor-delivered services into the clinical trial workflow.',
        'hybrid_trial',
        26
    ),
    (
        'hybrid_protocol_compliance',
        'Protocol Compliance Documentation',
        'Capability to document protocol compliance across distributed trial sites including protocol deviation tracking, corrective action workflows, compliance monitoring, and documentation standards that span site, remote, and at-home settings.',
        'hybrid_trial',
        27
    ),
    (
        'hybrid_safety_escalation',
        'Safety Escalation',
        'Capability to manage safety events across distributed settings including AE/SAE detection, escalation pathways from remote/at-home to site, emergency response coordination, and safety reporting timelines that account for non-site settings.',
        'hybrid_trial',
        28
    ),
    (
        'hybrid_historical_experience',
        'Hybrid Trial Historical Experience',
        'Demonstrated track record of participation in hybrid or decentralized clinical trials including study completion, operational metrics, and documented lessons learned from prior hybrid trial execution.',
        'hybrid_trial',
        29
    )
ON CONFLICT (key) DO NOTHING;

-- ###########################################################################
-- PART 2: Program Type Taxonomy — Hybrid Trial Readiness
-- ###########################################################################

INSERT INTO public.program_type_taxonomy (type_key, name, category, readiness_threshold, description, display_order)
VALUES
    (
        'readiness_hybrid_trial',
        'Hybrid Trial Readiness',
        'readiness',
        0.75,
        'Validates institutional readiness to participate in hybrid, decentralized, and at-home clinical trials. Covers site execution, at-home coordination, data integrity, patient access and diversity, biospecimen-at-home handling, remote monitoring, vendor/nurse coordination, protocol compliance documentation, safety escalation, and historical hybrid trial experience.',
        40
    )
ON CONFLICT (type_key) DO NOTHING;

-- ###########################################################################
-- PART 3: Capability Requirements per Program Type
-- ###########################################################################

-- Helper: resolve program_type_id and capability_type_id by stable keys
DO $$
DECLARE
    v_program_type_id UUID;
    v_cap_id UUID;
BEGIN
    SELECT id INTO v_program_type_id FROM public.program_type_taxonomy WHERE type_key = 'readiness_hybrid_trial';
    IF v_program_type_id IS NULL THEN
        RAISE EXCEPTION 'Program type readiness_hybrid_trial not found — seed data incomplete.';
    END IF;

    -- 1. Site-Based Execution (MANDATORY)
    SELECT id INTO v_cap_id FROM public.organization_capability_types WHERE key = 'hybrid_site_execution';
    INSERT INTO public.readiness_capability_requirements (program_type_id, capability_type_id, is_mandatory, minimum_confidence, description, display_order)
    VALUES (v_program_type_id, v_cap_id, true, NULL,
        'Can the institution execute site-based components of hybrid trials with documented procedures, facility infrastructure, and trained staff?',
        1)
    ON CONFLICT (program_type_id, capability_type_id) DO NOTHING;

    -- 2. At-Home Coordination (MANDATORY when applicable)
    SELECT id INTO v_cap_id FROM public.organization_capability_types WHERE key = 'hybrid_at_home_coordination';
    INSERT INTO public.readiness_capability_requirements (program_type_id, capability_type_id, is_mandatory, minimum_confidence, description, display_order)
    VALUES (v_program_type_id, v_cap_id, true, NULL,
        'Can the institution coordinate at-home patient visits with defined responsibility matrix, workflow SOPs, and patient communication channels?',
        2)
    ON CONFLICT (program_type_id, capability_type_id) DO NOTHING;

    -- 3. Hybrid Data Integrity (MANDATORY)
    SELECT id INTO v_cap_id FROM public.organization_capability_types WHERE key = 'hybrid_data_integrity';
    INSERT INTO public.readiness_capability_requirements (program_type_id, capability_type_id, is_mandatory, minimum_confidence, description, display_order)
    VALUES (v_program_type_id, v_cap_id, true, NULL,
        'Can the institution maintain data integrity across hybrid collection points with documented source documentation, EHR/EDC/eSource workflows, and audit/query processes?',
        3)
    ON CONFLICT (program_type_id, capability_type_id) DO NOTHING;

    -- 4. Patient Access & Diversity (MANDATORY)
    SELECT id INTO v_cap_id FROM public.organization_capability_types WHERE key = 'hybrid_patient_access_diversity';
    INSERT INTO public.readiness_capability_requirements (program_type_id, capability_type_id, is_mandatory, minimum_confidence, description, display_order)
    VALUES (v_program_type_id, v_cap_id, true, NULL,
        'Can the institution ensure broad patient access and demographic diversity with documented patient panel, geographic reach, language accessibility, and underserved community outreach?',
        4)
    ON CONFLICT (program_type_id, capability_type_id) DO NOTHING;

    -- 5. Biospecimen-at-Home (MANDATORY when applicable)
    SELECT id INTO v_cap_id FROM public.organization_capability_types WHERE key = 'hybrid_biospecimen_at_home';
    INSERT INTO public.readiness_capability_requirements (program_type_id, capability_type_id, is_mandatory, true, NULL,
        'Can the institution collect, handle, and ship biospecimens from patient homes with chain of custody, temperature control, and courier coordination?',
        5)
    ON CONFLICT (program_type_id, capability_type_id) DO NOTHING;

    -- 6. Remote Monitoring (OPTIONAL)
    SELECT id INTO v_cap_id FROM public.organization_capability_types WHERE key = 'hybrid_remote_monitoring';
    INSERT INTO public.readiness_capability_requirements (program_type_id, capability_type_id, is_mandatory, false, NULL,
        'Can the institution deploy and manage remote monitoring devices with documented SOPs, patient training, and data ingestion workflows?',
        6)
    ON CONFLICT (program_type_id, capability_type_id) DO NOTHING;

    -- 7. Vendor / Home Nurse Coordination (MANDATORY when applicable)
    SELECT id INTO v_cap_id FROM public.organization_capability_types WHERE key = 'hybrid_vendor_nurse_coordination';
    INSERT INTO public.readiness_capability_requirements (program_type_id, capability_type_id, is_mandatory, true, NULL,
        'Can the institution coordinate external vendors and home nursing services with documented qualification, training oversight, and performance monitoring?',
        7)
    ON CONFLICT (program_type_id, capability_type_id) DO NOTHING;

    -- 8. Protocol Compliance Documentation (MANDATORY)
    SELECT id INTO v_cap_id FROM public.organization_capability_types WHERE key = 'hybrid_protocol_compliance';
    INSERT INTO public.readiness_capability_requirements (program_type_id, capability_type_id, is_mandatory, true, NULL,
        'Can the institution document protocol compliance across distributed sites with deviation tracking, corrective action workflows, and compliance monitoring?',
        8)
    ON CONFLICT (program_type_id, capability_type_id) DO NOTHING;

    -- 9. Safety Escalation (MANDATORY)
    SELECT id INTO v_cap_id FROM public.organization_capability_types WHERE key = 'hybrid_safety_escalation';
    INSERT INTO public.readiness_capability_requirements (program_type_id, capability_type_id, is_mandatory, true, NULL,
        'Can the institution manage safety events across distributed settings with documented escalation pathways, emergency response coordination, and AE/SAE reporting timelines?',
        9)
    ON CONFLICT (program_type_id, capability_type_id) DO NOTHING;

    -- 10. Hybrid Trial Historical Experience (OPTIONAL)
    SELECT id INTO v_cap_id FROM public.organization_capability_types WHERE key = 'hybrid_historical_experience';
    INSERT INTO public.readiness_capability_requirements (program_type_id, capability_type_id, is_mandatory, false, NULL,
        'Has the institution participated in hybrid or decentralized clinical trials with documented study completion and operational metrics?',
        10)
    ON CONFLICT (program_type_id, capability_type_id) DO NOTHING;
END $$;

-- ###########################################################################
-- PART 4: Evidence Requirements per Capability
-- ###########################################################################

DO $$
DECLARE
    v_req_id UUID;
BEGIN
    -- 4.1 Site-Based Execution
    SELECT id INTO v_req_id FROM public.readiness_capability_requirements
        WHERE program_type_id = (SELECT id FROM public.program_type_taxonomy WHERE type_key = 'readiness_hybrid_trial')
          AND capability_type_id = (SELECT id FROM public.organization_capability_types WHERE key = 'hybrid_site_execution');
    INSERT INTO public.readiness_evidence_requirements (capability_requirement_id, evidence_class, is_mandatory, minimum_count, description, display_order)
    VALUES
        (v_req_id, 'B', true,  1, 'Site execution SOP or facility documentation', 1),
        (v_req_id, 'C', true,  1, 'Operational visit records showing site-based execution within protocol timelines', 2),
        (v_req_id, 'F', false, 1, 'Sponsor site qualification letter or monitoring visit confirmation', 3)
    ON CONFLICT (capability_requirement_id, evidence_class) DO NOTHING;

    -- 4.2 At-Home Coordination
    SELECT id INTO v_req_id FROM public.readiness_capability_requirements
        WHERE program_type_id = (SELECT id FROM public.program_type_taxonomy WHERE type_key = 'readiness_hybrid_trial')
          AND capability_type_id = (SELECT id FROM public.organization_capability_types WHERE key = 'hybrid_at_home_coordination');
    INSERT INTO public.readiness_evidence_requirements (capability_requirement_id, evidence_class, is_mandatory, minimum_count, description, display_order)
    VALUES
        (v_req_id, 'B', true,  2, 'Responsibility matrix AND at-home workflow SOP', 1),
        (v_req_id, 'C', true,  1, 'At-home visit completion records or coordination logs', 2),
        (v_req_id, 'F', false, 1, 'Sponsor confirmation of at-home coordination capability', 3)
    ON CONFLICT (capability_requirement_id, evidence_class) DO NOTHING;

    -- 4.3 Hybrid Data Integrity
    SELECT id INTO v_req_id FROM public.readiness_capability_requirements
        WHERE program_type_id = (SELECT id FROM public.program_type_taxonomy WHERE type_key = 'readiness_hybrid_trial')
          AND capability_type_id = (SELECT id FROM public.organization_capability_types WHERE key = 'hybrid_data_integrity');
    INSERT INTO public.readiness_evidence_requirements (capability_requirement_id, evidence_class, is_mandatory, minimum_count, description, display_order)
    VALUES
        (v_req_id, 'B', true,  2, 'Source documentation SOP AND data integrity / data review SOP', 1),
        (v_req_id, 'C', true,  1, 'Audit trail records or query resolution logs', 2),
        (v_req_id, 'A', false, 1, '21 CFR Part 11 compliance documentation or regulatory certification', 3),
        (v_req_id, 'F', false, 1, 'Sponsor audit confirmation referencing data integrity', 4)
    ON CONFLICT (capability_requirement_id, evidence_class) DO NOTHING;

    -- 4.4 Patient Access & Diversity
    SELECT id INTO v_req_id FROM public.readiness_capability_requirements
        WHERE program_type_id = (SELECT id FROM public.program_type_taxonomy WHERE type_key = 'readiness_hybrid_trial')
          AND capability_type_id = (SELECT id FROM public.organization_capability_types WHERE key = 'hybrid_patient_access_diversity');
    INSERT INTO public.readiness_evidence_requirements (capability_requirement_id, evidence_class, is_mandatory, minimum_count, description, display_order)
    VALUES
        (v_req_id, 'B', true,  1, 'Patient panel demographics documentation or language accessibility plan', 1),
        (v_req_id, 'C', true,  1, 'Enrollment diversity metrics from prior studies or retention rate reports', 2),
        (v_req_id, 'A', false, 1, 'Public diversity plan submission or community outreach documentation', 3),
        (v_req_id, 'F', false, 1, 'Sponsor confirmation of diverse enrollment capability', 4)
    ON CONFLICT (capability_requirement_id, evidence_class) DO NOTHING;

    -- 4.5 Biospecimen-at-Home
    SELECT id INTO v_req_id FROM public.readiness_capability_requirements
        WHERE program_type_id = (SELECT id FROM public.program_type_taxonomy WHERE type_key = 'readiness_hybrid_trial')
          AND capability_type_id = (SELECT id FROM public.organization_capability_types WHERE key = 'hybrid_biospecimen_at_home');
    INSERT INTO public.readiness_evidence_requirements (capability_requirement_id, evidence_class, is_mandatory, minimum_count, description, display_order)
    VALUES
        (v_req_id, 'B', true,  2, 'At-home collection SOP AND chain of custody SOP', 1),
        (v_req_id, 'C', true,  1, 'Completed at-home collection records with temperature data', 2),
        (v_req_id, 'C', false, 1, 'Courier performance reports or shipping temperature logs', 3),
        (v_req_id, 'F', false, 1, 'Sponsor or courier confirmation of at-home biospecimen quality', 4)
    ON CONFLICT (capability_requirement_id, evidence_class) DO NOTHING;

    -- 4.6 Remote Monitoring
    SELECT id INTO v_req_id FROM public.readiness_capability_requirements
        WHERE program_type_id = (SELECT id FROM public.program_type_taxonomy WHERE type_key = 'readiness_hybrid_trial')
          AND capability_type_id = (SELECT id FROM public.organization_capability_types WHERE key = 'hybrid_remote_monitoring');
    INSERT INTO public.readiness_evidence_requirements (capability_requirement_id, evidence_class, is_mandatory, minimum_count, description, display_order)
    VALUES
        (v_req_id, 'B', true,  2, 'Remote monitoring SOP AND device management SOP', 1),
        (v_req_id, 'C', true,  1, 'Remote monitoring data records or alert management logs', 2),
        (v_req_id, 'F', false, 1, 'Device vendor or sponsor confirmation', 3)
    ON CONFLICT (capability_requirement_id, evidence_class) DO NOTHING;

    -- 4.7 Vendor / Home Nurse Coordination
    SELECT id INTO v_req_id FROM public.readiness_capability_requirements
        WHERE program_type_id = (SELECT id FROM public.program_type_taxonomy WHERE type_key = 'readiness_hybrid_trial')
          AND capability_type_id = (SELECT id FROM public.organization_capability_types WHERE key = 'hybrid_vendor_nurse_coordination');
    INSERT INTO public.readiness_evidence_requirements (capability_requirement_id, evidence_class, is_mandatory, minimum_count, description, display_order)
    VALUES
        (v_req_id, 'B', true,  2, 'Vendor qualification SOP AND vendor training SOP', 1),
        (v_req_id, 'C', true,  1, 'Vendor performance records or training completion logs', 2),
        (v_req_id, 'F', false, 1, 'Sponsor approval of vendor qualification', 3)
    ON CONFLICT (capability_requirement_id, evidence_class) DO NOTHING;

    -- 4.8 Protocol Compliance Documentation
    SELECT id INTO v_req_id FROM public.readiness_capability_requirements
        WHERE program_type_id = (SELECT id FROM public.program_type_taxonomy WHERE type_key = 'readiness_hybrid_trial')
          AND capability_type_id = (SELECT id FROM public.organization_capability_types WHERE key = 'hybrid_protocol_compliance');
    INSERT INTO public.readiness_evidence_requirements (capability_requirement_id, evidence_class, is_mandatory, minimum_count, description, display_order)
    VALUES
        (v_req_id, 'B', true,  2, 'Protocol deviation SOP AND compliance monitoring SOP', 1),
        (v_req_id, 'C', true,  1, 'Deviation records or compliance reports', 2),
        (v_req_id, 'A', false, 1, 'Regulatory inspection report or CAPA records linked to deviations', 3),
        (v_req_id, 'F', false, 1, 'Sponsor audit confirmation', 4)
    ON CONFLICT (capability_requirement_id, evidence_class) DO NOTHING;

    -- 4.9 Safety Escalation
    SELECT id INTO v_req_id FROM public.readiness_capability_requirements
        WHERE program_type_id = (SELECT id FROM public.program_type_taxonomy WHERE type_key = 'readiness_hybrid_trial')
          AND capability_type_id = (SELECT id FROM public.organization_capability_types WHERE key = 'hybrid_safety_escalation');
    INSERT INTO public.readiness_evidence_requirements (capability_requirement_id, evidence_class, is_mandatory, minimum_count, description, display_order)
    VALUES
        (v_req_id, 'B', true,  2, 'Safety escalation SOP AND emergency response SOP for remote settings', 1),
        (v_req_id, 'C', true,  1, 'Safety event records with escalation timestamps or escalation drill logs', 2),
        (v_req_id, 'A', false, 1, 'IRB safety report or regulatory safety filing', 3),
        (v_req_id, 'F', false, 1, 'Sponsor safety audit confirmation', 4)
    ON CONFLICT (capability_requirement_id, evidence_class) DO NOTHING;

    -- 4.10 Hybrid Trial Historical Experience
    SELECT id INTO v_req_id FROM public.readiness_capability_requirements
        WHERE program_type_id = (SELECT id FROM public.program_type_taxonomy WHERE type_key = 'readiness_hybrid_trial')
          AND capability_type_id = (SELECT id FROM public.organization_capability_types WHERE key = 'hybrid_historical_experience');
    INSERT INTO public.readiness_evidence_requirements (capability_requirement_id, evidence_class, is_mandatory, minimum_count, description, display_order)
    VALUES
        (v_req_id, 'A', true,  1, 'ClinicalTrials.gov records for hybrid/DCT studies', 1),
        (v_req_id, 'C', false, 1, 'Operational records from prior hybrid studies', 2),
        (v_req_id, 'F', false, 1, 'Sponsor confirmation of hybrid study participation', 3)
    ON CONFLICT (capability_requirement_id, evidence_class) DO NOTHING;
END $$;

-- ###########################################################################
-- PART 5: Comments
-- ###########################################################################

COMMENT ON TABLE public.organization_capability_types IS
    'Organization capability taxonomy. Categories: research, clinical, logistics, regulatory, technology, hybrid_trial. '
    'Hybrid trial capability types evaluate institutional readiness for decentralized and at-home clinical trial components. '
    'See migration 055 for the 10 hybrid_trial capability types.';

-- ============================================================================
-- END Migration 055
-- ============================================================================
