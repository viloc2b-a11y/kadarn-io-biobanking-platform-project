# ORP-1.2 — Canonical Data Refactoring Implementation Report

**Program:** ORP-1.0 — Onboarding Refactoring & Architecture Alignment  
**Sprint:** ORP-1.2 — Canonical Data Refactoring  
**Status:** Implemented as a scoped data-boundary refactor.

## Scope Applied

This implementation does not change UX, Passport output, Documents pipeline behavior, or product navigation.

The change is limited to onboarding input ownership:

```text
Onboarding input
  -> canonical owner
  -> read-only legacy projection when required
  -> sanitized canonical persistence payload
```

## Implementation Summary

ORP-1.2 now establishes a canonical ownership boundary for onboarding answers.

- Added a canonical ownership map for active onboarding input keys.
- Added a legacy flat projection inventory.
- Prevented direct writes to legacy flat projection keys through onboarding context.
- Stopped Organization location and operational coverage UI from writing legacy projection keys.
- Kept legacy read compatibility by deriving projections from canonical objects in `withDerivedAnswers()`.
- Sanitized the local persistence payload so read-model projections are not persisted.
- Added tests proving active onboarding inputs resolve to canonical owners and legacy projections are stripped before persistence.

## Persistence Path Inventory

| Path | Role | ORP-1.2 result |
|---|---|---|
| `setAnswer(questionId, value)` | Single onboarding answer write path. | Rejects legacy flat projection keys. |
| `setAnswers(answers)` | Batch onboarding answer write path. | Strips legacy flat projection keys before state update. |
| `setInstitutionName(name)` | Institution name shortcut. | Writes canonical `org_name`. |
| `addDocument(doc)` | Document upload state path. | Preserved unchanged; Documents pipeline is deferred. |
| `removeDocument(label)` | Document removal state path. | Preserved unchanged. |
| `localStorage.setItem('kadarn-onboarding', ...)` | Local onboarding persistence. | Persists sanitized canonical answers only. |
| `withDerivedAnswers(state)` | Legacy compatibility read model. | Derives legacy projections from canonical answers and uploaded docs. |

## Legacy Key Inventory

These keys are now classified as read-only compatibility projections:

| Legacy key | Canonical source |
|---|---|
| `org_street` | `org_locations[]` primary `Location`. |
| `org_city` | `org_locations[]` primary `Location`. |
| `org_state` | `org_locations[]` primary `Location`. |
| `org_country` | `org_locations[]` primary `Location`. |
| `org_zip` | `org_locations[]` primary `Location`. |
| `org_time_zone` | `org_locations[]` primary `Location`. |
| `org_geographic_reach` | `org_operational_coverage` projection. |
| `people_pi_name` | `people_team_members[]` lead `Person`. |
| `people_pi_first_name` | `people_team_members[]` lead `Person`. |
| `people_pi_last_name` | `people_team_members[]` lead `Person`. |
| `people_pi_title` | `people_team_members[]` lead `Person`. |
| `people_pi_email` | `people_team_members[]` lead `Person`. |
| `people_pi_experience` | `people_team_members[]` lead `Person`. |
| `people_pi_ta` | `people_team_members[]` lead `Person`. |
| `people_total_team` | `people_team_members[]` count. |
| `people_roles` | `people_team_members[].researchRoles`. |
| `people_languages` | `people_team_members[].languages`. |
| `people_certs` | `people_team_members[].certifications`. |
| `infra_location_count` | `infra_location_infrastructure[]` count. |
| `infra_facility_type` | `infra_location_infrastructure[]` first configured facility. |
| `infra_research_space` | `infra_location_infrastructure[]` first configured facility. |
| `infra_backup_power` | `infra_location_infrastructure[]` utilities projection. |
| `infra_has_lab` | `infra_location_infrastructure[].laboratoryPresent`. |
| `infra_has_biospecimen` | `infra_location_infrastructure[].biospecimenOperations`. |
| `infra_storage_equip` | `infra_location_infrastructure[].storageEquipment`. |
| `infra_temp_monitoring` | `infra_location_infrastructure[].temperatureMonitoring`. |
| `infra_specimen_types` | `infra_location_infrastructure[].biospecimenOperations`. |
| `docs_uploaded_count` | `uploadedDocs[]` uploaded count. |

## Canonical Ownership Map

| Onboarding input | Canonical owner |
|---|---|
| `org_name` | `Institution` |
| `org_dba` | `Institution` |
| `org_type` | `Institution` |
| `org_mission` | `Institution` |
| `org_founded_year` | `Institution` |
| `org_website` | `Institution` |
| `org_operational_coverage` | `Institution` |
| `org_active_regions` | `Institution` |
| `org_countries` | `Institution` |
| `org_recruitment_reach` | `Institution` |
| `org_sample_logistics` | `Institution` |
| `org_operational_assets` | `Institution` |
| `org_languages` | `Institution` |
| `org_time_zones` | `Institution` |
| `org_locations` | `Location` |
| `people_research_leadership_role` | `Person` |
| `people_team_members` | `Person` |
| `infra_location_infrastructure` | `Laboratory` |
| `memory_events` | `TimelineEvent` |
| `org_research_focus` | `Claim` |
| `org_therapeutic_areas` | `Claim` |
| `org_research_modalities` | `Claim` |
| `roadmap_strategic_growth_goals` | `Claim` |

## Read Compatibility

Compatibility is preserved by deriving legacy keys after canonical state is assembled:

```text
canonical answers
  -> withDerivedAnswers()
  -> temporary read model
```

The read model exists for legacy consumers such as current progress and projection code. It is not the persistence payload.

## Tests

Added:

- `tests/web/onboarding-canonical-ownership.test.ts`

Updated:

- `tests/web/mvp-onboarding-validation.test.ts`

Coverage:

- active onboarding keys map to canonical owners
- legacy flat keys are classified as read compatibility only
- legacy flat projections are stripped before persistence
- persisted onboarding writes use the sanitized canonical payload
- Organization page no longer writes `org_*` legacy projection keys

## Remaining Read-Only Compatibility List

The remaining compatibility projections are intentionally read-only until later ORP sprints migrate all consumers:

- Organization: `org_street`, `org_city`, `org_state`, `org_country`, `org_zip`, `org_time_zone`, `org_geographic_reach`
- People: `people_pi_name`, `people_pi_first_name`, `people_pi_last_name`, `people_pi_title`, `people_pi_email`, `people_pi_experience`, `people_pi_ta`, `people_total_team`, `people_roles`, `people_languages`, `people_certs`
- Infrastructure: `infra_location_count`, `infra_facility_type`, `infra_research_space`, `infra_backup_power`, `infra_has_lab`, `infra_has_biospecimen`, `infra_storage_equip`, `infra_temp_monitoring`, `infra_specimen_types`
- Documents: `docs_uploaded_count`

These projections may be read by deferred consumers such as current Fast Track and Passport assembly compatibility branches. They are not persisted as source truth by the onboarding write boundary.

## Explicit Confirmation

- No new onboarding writes persist legacy flat keys.
- `withDerivedAnswers()` no longer writes persisted derived values; it creates a read model and `createPersistedOnboardingState()` strips projections before storage.
- Organization no longer dual-writes primary location or geographic reach projections.
- Onboarding persistence is sanitized at the localStorage boundary.

## Validation

Passed:

- `npx vitest run web/onboarding-canonical-ownership.test.ts web/mvp-onboarding-validation.test.ts`
  - 2 files passed
  - 25 tests passed
- `npx vitest run api/sponsor-passport-recommendations.test.ts api/sponsor-passport-store.test.ts api/sponsor-passport-stability-adapter.test.ts api/sponsor-passport-stability-domain.test.ts api/sponsor-passport-stability-source.test.ts api/sponsor-passport-reads.test.ts api/sponsor-passport-claims.test.ts api/sponsor-passport-provenance.test.ts api/sponsor-passport-identity-capabilities.test.ts api/sponsor-passport-history.test.ts api/sponsor-passport-mock.test.ts api/sponsor-passport-portfolio.test.ts api/sponsor-passport-parity.test.ts`
  - 13 files passed
  - 76 tests passed
- `npm run type-check -w apps/web`
- `npm run build -w apps/web`

Notes:

- Sponsor passport tests emitted existing ADR boundary warnings and Supabase local reachability warnings, but all selected tests passed.
- Web build emitted the existing Next.js middleware convention deprecation warning, but build completed successfully.

## Gate Status

ORP-1.2 passes when targeted validation is green and remaining legacy flat keys are read-only projections.

Current implementation satisfies the sprint scope:

- no new onboarding writes persist legacy flat keys
- active onboarding fields resolve to canonical owners
- read compatibility remains available for consumers deferred to later ORP sprints
- Passport output and Documents pipeline were not modified
