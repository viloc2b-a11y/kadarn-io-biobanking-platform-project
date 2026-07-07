# ORP-1.2 — Canonical Data Refactoring

**Program:** ORP-1.0 — Onboarding Refactoring & Architecture Alignment  
**Purpose:** Remove redundant flat capture and make onboarding write to canonical objects only.  
**Gate:** No new writes target legacy models or flat projection keys.

## Objective

Eliminate redundant data capture in onboarding.

Every onboarding write must create, update, or link a canonical object. Onboarding must stop treating flat legacy keys as source truth.

```text
Never:
  write people_pi_name
  write people_roles
  write infra_has_lab
  write docs_uploaded_count

Always:
  write Person
  write Location
  write Laboratory
  write Evidence
  write Claim
```

## Activities

### Remove Legacy Write Targets

Eliminate writes to flat legacy keys, including:

- `people_pi_name`
- `people_pi_first_name`
- `people_pi_last_name`
- `people_pi_title`
- `people_pi_email`
- `people_pi_experience`
- `people_roles`
- `people_certs`
- `people_languages`
- `people_total_team`
- `infra_has_lab`
- `infra_has_biospecimen`
- `infra_backup_power`
- `infra_storage_equip`
- `infra_temp_monitoring`
- `infra_specimen_types`
- `infra_location_count`
- `docs_uploaded_count`

These values may exist temporarily as read-only compatibility projections, but they must not be persisted as canonical onboarding input.

### Replace With Canonical Objects

All onboarding writes must target one of these object families:

| Legacy concept | Canonical target |
|---|---|
| PI name / PI fields | `Person` + `ResearchRole: Principal Investigator` |
| People roles | `PersonRoleAssignment` |
| People certifications | `PersonEvidence` / `Evidence` linked to `Person` |
| Team language summary | Derived from `Person.languages[]` |
| Lab yes/no | `Laboratory` object existence |
| Biospecimen yes/no | `CapabilityClaim` derived from lab/storage/logistics/person evidence |
| Backup power | `Utilities` object linked to `Facility` / `Storage` |
| Storage equipment | `Equipment` / `Storage` objects |
| Temperature monitoring | `Utilities` linked to `Storage` |
| Document count | Derived from `EvidenceSource[]` / `EvidenceObject[]` |
| Memory event | `TimelineEvent` / `ContinuityEvent` |
| Capability declaration | `Claim` / `ClaimCandidate` |

## Canonical Write Model

```text
Onboarding input
  -> canonical object adapter
  -> Institution
  -> Person
  -> Location
  -> Facility / Laboratory / Equipment / Storage / Utilities / Logistics
  -> Document / EvidenceSource
  -> EvidenceObject
  -> TimelineEvent / ContinuityEvent
  -> Claim / ClaimCandidate
```

Flat keys are allowed only after this boundary:

```text
canonical object
  -> projection adapter
  -> temporary legacy read model
```

They are not allowed before the canonical object boundary.

## Refactoring Targets

| Area | Current problem | ORP-1.2 action |
|---|---|---|
| `onboarding-context.tsx` | `withDerivedAnswers()` writes derived legacy keys into `answers`. | Stop persisting derived projections; expose projection helper only where legacy readers still require it. |
| `fast-track.ts` | Tracks progress through legacy flat keys. | Defer final fix to ORP-1.6, but stop adding new legacy gates. |
| `passport-assembler.ts` | Reads a mix of structured objects and legacy fallbacks. | Defer source-boundary refactor to ORP-1.4, but document which branches are compatibility-only. |
| People onboarding | Structured team exists, but PI/roles/certs still leak as projections. | Treat `people_team_members[]` as source; project legacy values only at read time. |
| Infrastructure onboarding | Structured location infrastructure exists, but flat infra keys still exist downstream. | Treat `infra_location_infrastructure[]` as source; project legacy values only at read time. |
| Documents onboarding | Uploaded docs exist, but count is treated like a field. | Treat upload/evidence collection as source; derive counts. |

## Non-Regression Rule

ORP-1.2 must keep existing user-visible onboarding behavior working while changing the data boundary.

Allowed:

- compatibility read models
- projection adapters
- temporary legacy fallbacks
- tests that prove old consumers still receive expected projections

Not allowed:

- new writes to legacy keys
- new questions that capture derived values
- duplicated source fields
- downstream code treating projections as user input

## Deliverables

- Canonical Data Refactoring plan.
- Legacy write target inventory.
- Canonical replacement map.
- ORP-1.2 implementation report.
- Updated ORP sequence references.

Implementation report:

- `docs/platform-discovery/orp-1.2-implementation-report.md`

## Gate

ORP-1.2 is complete when:

- no new writes target legacy models or flat projection keys
- existing legacy projections are read-only compatibility outputs
- every onboarding write maps to a canonical object family
- duplicate capture is removed or explicitly justified
- downstream consumers can still run through projection adapters during migration
