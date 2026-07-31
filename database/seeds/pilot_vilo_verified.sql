-- Pilot Seed: Vilo Research (Corrected for real schema)
-- Zero PHI/PII/credentials

-- Assumes: organizations table has row with name 'Vilo Research'
DO $$ DECLARE org_id uuid; loc1 uuid; loc2 uuid;
BEGIN
  SELECT id INTO org_id FROM public.organizations WHERE name = 'Vilo Research' LIMIT 1;
  IF org_id IS NULL THEN
    INSERT INTO public.organizations (id, name) VALUES ('f0000000-0000-0000-0000-000000000001', 'Vilo Research')
    RETURNING id INTO org_id;
  END IF;

  -- Profile
  INSERT INTO public.site_profiles (id, organization_id, profile_type, state)
  VALUES ('b0000000-0000-0000-0000-000000000001', org_id, 'clinical_research_site', 'DATA_COLLECTION')
  ON CONFLICT (id) DO NOTHING;

  -- Claims (existing claims table schema)
  INSERT INTO public.claims (id, claim_type_id, name, description, organization_id, domain, decays, created_by_actor_id)
  VALUES
    ('c0000000-0000-0000-0000-000000000001', 'biospecimen_collection', 'Biospecimen Collection', 'Site can collect biospecimens per protocol', org_id, 'clinical_operations', true, '00000000-0000-0000-0000-000000000000'),
    ('c0000000-0000-0000-0000-000000000002', 'sample_processing', 'Sample Processing', 'Site can process PBMC samples per SOP', org_id, 'lab_operations', true, '00000000-0000-0000-0000-000000000000')
  ON CONFLICT (id) DO NOTHING;

  -- Capability instances
  INSERT INTO public.capability_instances (id, profile_id, capability_code, entity_type, state, readiness_contribution)
  VALUES
    ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'biospecimen_collection', 'institution', 'DECLARED', 0.1),
    ('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'sample_processing', 'institution', 'EVIDENCE_BACKED', 0.6)
  ON CONFLICT (id) DO NOTHING;

  -- Capability-claim links
  INSERT INTO public.capability_claim_links (capability_id, claim_id, dependency_type, is_critical)
  VALUES
    ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'ALL_REQUIRED', true),
    ('a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'ALL_REQUIRED', true)
  ON CONFLICT (capability_id, claim_id) DO NOTHING;

END $$;
