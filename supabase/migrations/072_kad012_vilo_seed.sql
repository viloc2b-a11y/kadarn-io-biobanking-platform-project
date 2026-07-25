-- ============================================================================
-- KAD-012 — Vilo Production Pilot — Seed Data
-- ============================================================================
-- Seeds Vilo Research Group as a pilot institution.
-- This enables the first real Passport generation for Vilo.
-- ============================================================================

-- Vilo organization UUID (stable, deterministic)
-- Using a fixed UUID for traceability across environments
INSERT INTO public.organizations (id, name, legal_name, tax_id, website, created_by, created_at)
VALUES (
    'e0000000-0000-0000-0000-000000000001',
    'Vilo Research Group',
    'Vilo Research Group LLC',
    'XX-XXXXXXX',
    'https://viloresearch.com',
    '00000000-0000-0000-0000-000000000000',
    now()
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = now();

-- Vilo capability types
INSERT INTO public.organization_capability_types (key, name, description)
VALUES
    ('oncology_phase1', 'Oncology Phase I', 'Phase I oncology clinical trials'),
    ('oncology_phase2', 'Oncology Phase II', 'Phase II oncology clinical trials'),
    ('oncology_phase3', 'Oncology Phase III', 'Phase III oncology clinical trials'),
    ('vaccine', 'Vaccine Trials', 'Vaccine clinical development'),
    ('rare_disease', 'Rare Disease', 'Rare disease and orphan drug trials')
ON CONFLICT (key) DO NOTHING;
