# Kadarn MVP Data Redundancy Report

Kadarn's onboarding has evolved beyond a form workflow. The current code already contains the beginning of an evidence architecture: structured institutional entities are captured once, then Passport, Capabilities, Readiness, Institutional Memory, and Roadmap derive value from those entities. The remaining problem is that several legacy answer keys still make derived data look like primary input.

## Executive Finding

The primary correction is not visual. It is semantic:

```text
Input -> Canonical Entity -> Derived Objects
```

Kadarn should avoid:

```text
Input -> Input -> Input -> Input
```

Most redundancy now comes from compatibility keys in `OnboardingAnswers`, `withDerivedAnswers()`, `fast-track.ts`, and `passport-assembler.ts`. These fields were useful during migration, but they blur the source of truth and make the onboarding feel like repeated form capture.

## Current Canonical Entities

| Canonical entity | Current source | Should be primary input? | Derived objects |
|---|---|---:|---|
| Institution identity | `org_name`, `org_type`, `org_mission`, `org_website`, `org_founded_year` | Yes | Passport identity, Memory founding event, Roadmap sponsor readiness |
| Research experience | `org_research_focus`, `org_therapeutic_areas`, `org_research_modalities` | Yes | Capabilities, Passport research focus, Readiness, Roadmap growth |
| Operational footprint | `org_operational_coverage`, `org_active_regions`, `org_countries`, `org_recruitment_reach`, `org_sample_logistics`, `org_operational_assets`, `org_languages`, `org_time_zones` | Mostly yes | Geographic reach, recruitment readiness, logistics capabilities |
| Institutional locations | `org_locations` | Yes | Legacy address fields, infrastructure scope, Passport locations, Memory, Roadmap |
| Research team | `people_team_members` | Yes | PI profile, roles, languages, certifications, team counts |
| Location infrastructure | `infra_location_infrastructure` | Yes | Lab flags, biospecimen flags, storage, backup power, shipping, readiness |
| Evidence documents | `uploadedDocs` plus document taxonomy | Yes | Evidence coverage, missing documents, document history, Passport evidence |
| Institutional memory events | `memory_events` | Yes, for explicit history only | Memory timeline, supporting history link |
| Roadmap growth goals | `roadmap_strategic_growth_goals` | Future input | Strategic growth recommendations |

## Redundancy Inventory

| Concept | Captured / stored now | Problem | Recommendation |
|---|---|---|---|
| Principal Investigator identity | `people_team_members`, `people_pi_name`, `people_pi_first_name`, `people_pi_last_name`, `people_pi_title`, `people_pi_email` | PI is both an entity and a set of legacy fields. | Capture only `people_team_members`; derive PI projection from the member marked `isPrincipalInvestigator`. |
| PI experience and therapeutic expertise | `people_team_members[].yearsExperience`, `people_pi_experience`, `people_pi_ta` | Same facts appear as person attributes and flat PI fields. | Keep on team member entity; derive Passport/fast-track projections. |
| Team roles | `people_team_members[].researchRoles`, `people_roles` | Roles are aggregated from people but still used as if directly answered. | Store roles only per person; compute institutional role summary. |
| Team languages | `people_team_members[].languages`, `people_languages`, `org_languages` | Language can mean staff language or institutional operating language. | Keep `org_languages` as institution-level language coverage; derive `people_languages` from staff only if needed as projection. |
| Staff certifications | `people_team_members[].certifications`, `people_certs` | Certifications belong to people but are flattened into institution-level answers. | Store only under staff member; derive certification summary and compliance gaps. |
| Location address | `org_locations`, `org_street`, `org_city`, `org_state`, `org_country`, `org_zip`, `org_time_zone` | Single-location fields duplicate primary location from structured locations. | Store only `org_locations`; derive primary location projection for legacy consumers. |
| Location count | `org_locations`, `infra_location_infrastructure`, `infra_location_count` | Count is calculated, not input. | Derive from `org_locations`; infrastructure records should attach to location ids. |
| Facility type | `org_locations[].type`, `infra_location_infrastructure[].facilityType`, `infra_facility_type` | Institution location type and infrastructure facility type overlap. | Keep location type on `org_locations`; keep infrastructure-specific facility classification only if it adds operational detail. Remove flat `infra_facility_type` as input. |
| Research space | `infra_location_infrastructure[].dedicatedResearchSpace`, `infra_research_space` | Flat research-space answer duplicates first location infrastructure. | Store per-location only; derive institution summary. |
| Backup power | `infra_location_infrastructure[].backupPower`, `infra_backup_power` | Backup power is location-specific but flattened globally. | Store per-location; derive institutional backup resilience summary. |
| Laboratory presence | `infra_location_infrastructure[].laboratoryPresent`, `infra_has_lab` | Lab presence is calculated from locations. | Derive `infra_has_lab` only as a projection for readiness/fast-track until consumers are migrated. |
| Biospecimen presence | `infra_location_infrastructure[].biospecimenOperations`, `infra_has_biospecimen`, `infra_specimen_types` | Operations and specimen capability are conflated. | Store operations per location; derive institutional biospecimen capability and specimen summary. |
| Storage equipment | `infra_location_infrastructure[].storageEquipment`, `infra_storage_equip` | Storage equipment is per-location but flattened. | Store per-location; derive inventory summary and counts. |
| Temperature monitoring | `infra_location_infrastructure[].temperatureMonitoring`, `infra_temp_monitoring` | Monitoring is location-specific but flattened. | Store per-location; derive strongest/current monitoring posture. |
| Shipping | `infra_location_infrastructure[].shippingCapability`, `infra_shipping` | Shipping is location-specific but flattened. | Store per-location; derive institution-level shipping capability. |
| Document count | `uploadedDocs`, `docs_uploaded_count` | Count is calculated. | Derive from uploaded docs. |
| Geographic reach | `org_operational_coverage`, `org_active_regions`, `org_countries`, `org_geographic_reach` | Legacy reach label duplicates richer operational footprint. | Keep operational footprint fields; derive legacy geographic label for Passport compatibility only. |
| Capabilities | No direct input in `capabilities/page.tsx`, derived in `passport-assembler.ts` | Correct direction, but some derivation still reads legacy fields first. | Migrate derivation to canonical entities directly. |
| Readiness | Derived in `passport-assembler.ts` and presented in `readiness/page.tsx` | Correct direction, but scoring still reads several flat legacy fields. | Migrate readiness dimensions to canonical entities and evidence contributions. |
| Passport | Derived via `assemblePassport()` | Correct direction. | Preserve as present-time projection only. |
| Memory | Derived plus `memory_events` | Correct direction. | Keep explicit memory events only for history not inferable from canonical facts. |
| Roadmap | Derived via `deriveInstitutionRoadmap()` | Correct direction. | Keep strategic goals as future-facing inputs; derive all action cards. |

## Input -> Canonical Entity -> Derived Objects

| Input area | Canonical entity | Derived objects |
|---|---|---|
| Organization identity questions | `Institution` | Passport "Who We Are", Memory founding event, sponsor-facing identity claim |
| Research experience questions | `InstitutionResearchExperience` | Research capability claims, modality coverage, readiness dimensions, sponsor matching |
| Operational footprint questions | `InstitutionOperationalFootprint` | Geographic reach projection, logistics readiness, recruitment reach, Roadmap growth gaps |
| Institutional locations editor | `InstitutionalLocation[]` | Primary location, location count, infrastructure scope, multi-site readiness, Memory location events |
| Research team editor | `ResearchTeamMember[]` | PI projection, team summary, role coverage, staff certification summary, people readiness |
| Staff certification editor | `StaffCertification[]` nested under staff | Valid certifications, expired certification gaps, compliance/renewal calendar |
| Location infrastructure cards | `LocationInfrastructure[]` keyed by location id | Lab capability, biospecimen capability, storage capability, backup power posture, readiness dimensions |
| Document upload and taxonomy | `UploadedDoc[]` + `DOCUMENT_TAXONOMY` | Evidence coverage, critical document gaps, document history, Passport proof, Roadmap actions |
| Manual memory event | `InstitutionalMemoryEvent[]` | Institutional Memory timeline only |
| Strategic growth goals | `roadmap_strategic_growth_goals` | Strategic Growth roadmap actions |

## Fields That Should Stop Behaving Like Inputs

These should remain temporary compatibility projections only:

- `people_pi_name`
- `people_pi_first_name`
- `people_pi_last_name`
- `people_pi_title`
- `people_pi_email`
- `people_pi_experience`
- `people_pi_ta`
- `people_total_team`
- `people_roles`
- `people_languages`
- `people_certs`
- `org_street`
- `org_city`
- `org_state`
- `org_country`
- `org_zip`
- `org_time_zone`
- `org_geographic_reach`
- `infra_location_count`
- `infra_facility_type`
- `infra_research_space`
- `infra_backup_power`
- `infra_has_lab`
- `infra_has_biospecimen`
- `infra_storage_equip`
- `infra_temp_monitoring`
- `infra_specimen_types`
- `docs_uploaded_count`

## Current Derivation Hotspots

| File | Role | Redundancy risk |
|---|---|---|
| `apps/web/src/lib/onboarding/onboarding-context.tsx` | Central state and `withDerivedAnswers()` | Mixes canonical entities and legacy projection keys in the same `answers` map. |
| `apps/web/src/lib/passport/passport-assembler.ts` | Derives Passport, capabilities, readiness, next steps | Some derivations still read legacy flat keys, so projections can become de facto inputs. |
| `apps/web/src/lib/onboarding/fast-track.ts` | Calculates Passport level readiness | Critical questions still target several legacy derived keys. |
| `apps/web/src/app/(onboarding)/onboarding/organization/page.tsx` | Captures identity, research, locations, footprint | Correct canonical direction, but writes primary-location legacy address fields. |
| `apps/web/src/app/(onboarding)/onboarding/people/page.tsx` | Captures research team | Correct canonical direction, but answered-count logic still treats `people_*` as direct answers. |
| `apps/web/src/app/(onboarding)/onboarding/infrastructure/page.tsx` | Captures per-location infrastructure | Correct canonical direction; downstream consumers still need migration from flat `infra_*`. |
| `apps/web/src/app/(onboarding)/onboarding/capabilities/page.tsx` | Presents derived capabilities | Good pattern: informational only, no input. |
| `apps/web/src/app/(onboarding)/onboarding/readiness/page.tsx` | Presents derived readiness | Good pattern: informational only, no input. |
| `apps/web/src/app/(onboarding)/onboarding/passport/page.tsx` | Presents current snapshot | Good pattern: projection only. |
| `apps/web/src/app/(onboarding)/onboarding/memory/page.tsx` | Presents history | Good pattern: derived events plus explicit historical event input. |
| `apps/web/src/app/(onboarding)/onboarding/roadmap/page.tsx` | Presents future actions | Good pattern: projection only. |

## Recommended Sprint 1 Corrections

1. Mark canonical vs derived keys explicitly.
   - Add a documented `CanonicalAnswers` boundary or split `answers` into `entities` and `projections`.
   - Keep legacy projections in one adapter function only.

2. Move fast-track critical questions to canonical entities.
   - Replace `people_pi_name`, `people_roles`, `people_certs`, `infra_has_lab`, `infra_has_biospecimen`, `infra_backup_power`, and `docs_uploaded_count` with canonical completion checks.

3. Update Passport/readiness derivation to prefer canonical entities exclusively.
   - `assembleTeam()` should only read flat `people_*` fields as fallback.
   - `assembleInfrastructure()`, `deriveCapabilities()`, and `deriveReadiness()` should use `LocationInfrastructure[]` first and stop requiring legacy flat fields for score quality.

4. Stop writing primary-location legacy fields from the Organization page.
   - Keep the values derivable from `org_locations`.
   - If legacy consumers still need them, generate them inside the projection adapter, not during input capture.

5. Introduce claim/evidence vocabulary in onboarding copy.
   - Screens should ask for institutional facts and evidence, not "form fields."
   - Capabilities, Readiness, Passport, Memory, and Roadmap should remain projections.

## Target Architecture

```text
Institution Inputs
  -> Institution
  -> InstitutionalLocation[]
  -> ResearchTeamMember[]
  -> StaffCertification[]
  -> LocationInfrastructure[]
  -> UploadedEvidence[]
  -> InstitutionalMemoryEvent[]
  -> StrategicGrowthGoal[]

Canonical Entities
  -> Claims
  -> Evidence Links
  -> Capability Map
  -> Readiness Profile
  -> Institution Passport
  -> Institutional Memory
  -> Institution Roadmap
```

## Acceptance Check

Sprint 1 is complete when:

- No page asks the user for a fact that is already captured by another canonical entity.
- Derived pages do not write answers.
- Legacy flat keys are generated in a single compatibility/projection layer.
- Fast-track progress, Passport, Capabilities, Readiness, Memory, and Roadmap can be derived from canonical entities plus evidence.
- The onboarding language makes it clear that Kadarn is acquiring institutional knowledge, not collecting form responses.
