-- Pilot Seed: Vilo Research — Verified v4 (ALL NOT NULL columns filled)

DO $$
DECLARE
  vilo_org_id uuid := 'f0000000-0000-0000-0000-000000000001';
  vilo_profile_id uuid := 'b0000000-0000-0000-0000-000000000001';
  admin_uid uuid := 'a1000000-0000-0000-0000-000000000001';
BEGIN
  INSERT INTO public.organizations (id, name, created_by)
  VALUES (vilo_org_id, 'Vilo Research', admin_uid)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.site_profiles (id, institution_id, profile_type, state)
  VALUES (vilo_profile_id, vilo_org_id, 'clinical_research_site', 'DATA_COLLECTION')
  ON CONFLICT (id) DO NOTHING;

  -- Claims — all 19 NOT NULL columns
  INSERT INTO public.claims (id, claim_type_id, name, description, organization_id, status, domain,
    decays, decay_period_months, valid_evidence_classes, required_evidence_classes, created_by_actor_id, created_by_org_id,
    correlation_id, owning_org_id, visibility_scope, authorized_sponsor_ids, workflow_state)
  VALUES
    ('c0000000-0000-0000-0000-000000000001', 'biospecimen_collection', 'Biospecimen Collection',
     'Site collects biospecimens per protocol', vilo_org_id, 'active', 'clinical_operations',
     true, 12, '{}', '{}', admin_uid, vilo_org_id,
     gen_random_uuid(), vilo_org_id, 'site', '{}', 'draft'),
    ('c0000000-0000-0000-0000-000000000002', 'sample_processing', 'Sample Processing',
     'Site processes PBMC samples per SOP', vilo_org_id, 'active', 'lab_operations',
     true, 12, '{}', '{}', admin_uid, vilo_org_id,
     gen_random_uuid(), vilo_org_id, 'site', '{}', 'draft')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.capability_instances (id, profile_id, capability_code, entity_type, state, readiness_contribution)
  VALUES
    ('a0000000-0000-0000-0000-000000000001', vilo_profile_id, 'biospecimen_collection', 'institution', 'DECLARED', 0.10),
    ('a0000000-0000-0000-0000-000000000002', vilo_profile_id, 'sample_processing', 'institution', 'DOCUMENTED', 0.60)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.capability_claim_links (capability_id, claim_id, dependency_type, is_critical)
  VALUES
    ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'ALL_REQUIRED', true),
    ('a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'ALL_REQUIRED', true)
  ON CONFLICT (capability_id, claim_id) DO NOTHING;
END $$;
