# Migration Canonicalization — R1

## Current State

Two migration directories exist:
- `database/migrations/` — declared canonical by audit (evidence-core focused)
- `supabase/migrations/` — what `supabase start` and `supabase db reset` read from

## Divergence Map

### Files ONLY in database/migrations/ (need sync to supabase/)

| File | Purpose |
|------|---------|
| 036_domain_events_runtime.sql | Domain events setup (different numbering than supabase 041) |
| 046_discovery_core.sql | Discovery engine tables |
| 047_discovery_preparation.sql | Discovery preparation |
| 048_discovery_agent_outputs.sql | Agent output storage |
| 049_discovery_curation.sql | Curation records |
| 050_validation_notes.sql | Validation notes |
| 051_sponsor_portfolio.sql | Sponsor portfolio |
| 052_program_type_taxonomy.sql | Program type taxonomy |
| 053_readiness_requirements.sql | Readiness requirements |
| 054_readiness_evaluations.sql | Readiness evaluations |
| 055_hybrid_trial_readiness.sql | Hybrid trial readiness |
| 056_review_workflow.sql | **SUPERSEDED by 060** — will remove |
| 057_passport_publication.sql | **SUPERSEDED by 061** — will remove |

### Files ONLY in supabase/migrations/ (phase8 variants — keep for backward compat)

| File | Purpose |
|------|---------|
| 035_append_only_helpers.sql | Append-only helpers (different numbering) |
| 041_domain_events_runtime.sql | Domain events (database has as 036) |
| 046_evidence_lineage.sql | Phase8 evidence lineage |
| 047_phase8_claims_and_views.sql | Phase8 claim views |
| 048_phase8_hybrid_index.sql | Phase8 hybrid index |
| 049_phase8_staging_cutover_seed.sql | Phase8 staging seed |
| 050_discovery_core.sql | Phase8 discovery |
| 051_discovery_preparation.sql | Phase8 preparation |
| 052_discovery_agent_outputs.sql | Phase8 agent outputs |
| 053_discovery_curation.sql | Phase8 curation |
| 054_validation_notes.sql | Phase8 validation notes |
| 055_discovery_staging_seed.sql | Phase8 staging seed |
| 056_phase8_public_read_grants.sql | Phase8 grants |
| 057_gotrue_seed_compat.sql | GoTrue compatibility |

### Files in BOTH (same name, verify content)

35 files are shared. Content may differ for 045 (already fixed) and 055 (already fixed). Others should be identical.

## Action Plan

1. Remove superseded 056/057 from database/migrations/
2. Sync database-only files to supabase/migrations/ (they're needed for clean reset)
3. Keep phase8 files in supabase/migrations/ (needed by existing databases)
4. Verify clean reset from 001 through 061
5. Update documentation

## New Policy

All new migrations MUST be created in `database/migrations/` first, then synced to `supabase/migrations/`. The `supabase/migrations/` directory is a deployment artifact, not an authoring source.
