# ORP-1.10 — Fast Track Elimination

**Program:** ORP-1.0 — Onboarding Refactoring & Architecture Alignment  
**Purpose:** Remove legacy fast-track logic and replace it with a Progressive Maturity Engine.  
**Gate:** No legacy Fast Track logic remains.

## Objective

Eliminate `fast-track.ts`.

The current fast-track model is based on critical questions, flat legacy fields, and Passport levels 0-3. ORP-1.10 replaces it with a Progressive Maturity Engine based on canonical knowledge maturity levels.

```text
Level 1
  -> Level 2
  -> Level 3
  -> Level 4
  -> Level 5
```

## Current Problem

Current `fast-track.ts` uses:

- `PASSPORT_LEVEL1_CRITICAL`
- `PASSPORT_LEVELS`
- `computeFastTrackProgress`
- `QUICK_START`
- `canSkipForLevel1`

It also references legacy flat fields:

- `people_pi_name`
- `people_pi_experience`
- `people_roles`
- `people_certs`
- `infra_has_lab`
- `infra_has_biospecimen`
- `infra_backup_power`
- `docs_uploaded_count`

This conflicts with ORP because progress should be based on canonical maturity, not answered legacy questions.

## Replacement Model

Replace Fast Track with:

```text
Progressive Maturity Engine
  -> Level 1: Identity
  -> Level 2: People + Infrastructure
  -> Level 3: Evidence
  -> Level 4: Memory / Continuity
  -> Level 5: Automation
```

## Level Definitions

| Level | Name | Canonical gate | Output |
|---|---|---|---|
| Level 1 | Identity | `Institution` identity and minimal research profile exist. | Initial Passport. |
| Level 2 | People + Infrastructure | Relevant `Person`, role, and infrastructure objects exist to support initial claims. | Capabilities. |
| Level 3 | Evidence | At least one `EvidenceObject` supports or weakens a claim. | Readiness. |
| Level 4 | Continuity | At least one `ContinuityEvent` links evidence, claim, person, or infrastructure over time. | Continuity. |
| Level 5 | Automation | Authorized connectors, APIs, sponsor feedback, or historical ingestion produce candidates. | Continuous enrichment. |

## Engine Inputs

The Progressive Maturity Engine should consume canonical read models:

- `Institution`
- `Location`
- `Person`
- `PersonRoleAssignment`
- `Facility`
- `Laboratory`
- `Equipment`
- `Storage`
- `Logistics`
- `OperationalService`
- `EvidenceSource`
- `EvidenceObject`
- `ClaimCandidate`
- `Claim`
- `ConfidenceState`
- `ContinuityEvent`
- connector/source authorization state

It should not consume flat onboarding answer keys.

## Engine Output

```typescript
interface ProgressiveMaturityState {
  currentLevel: 1 | 2 | 3 | 4 | 5
  nextLevel: 2 | 3 | 4 | 5 | null
  levelLabel: string
  canGeneratePassport: boolean
  outputsAvailable: string[]
  missingForNextLevel: MaturityGap[]
  estimatedMinutesToNextLevel: number
}
```

The exact TypeScript interface may change during implementation, but the output must be canonical-level based.

## Removal Map

| Legacy fast-track concept | Replacement |
|---|---|
| `PASSPORT_LEVEL1_CRITICAL` | Level 1 canonical identity gate. |
| `PASSPORT_LEVELS` | Progressive levels 1-5. |
| `computeFastTrackProgress()` | `computeProgressiveMaturity()` or equivalent. |
| `criticalCompleted` | canonical gate completion. |
| `totalCompleted` | knowledge maturity, not answer count. |
| `docs_uploaded_count` | `EvidenceObject` / evidence support count. |
| `canSkipForLevel1()` | level-specific optionality rules based on evidence/inference. |
| `QUICK_START` | Level 1 identity acquisition flow. |

## Activities

- Inventory all imports/usages of `fast-track.ts`.
- Replace fast-track APIs with Progressive Maturity Engine APIs.
- Remove critical-question arrays based on legacy keys.
- Replace answer-count progress with canonical-level gates.
- Update journey metadata to include level and output availability.
- Update UI copy from "fast track" to "maturity level" or "institutional knowledge level."
- Ensure Level 1 can generate Passport without People/Infrastructure/Documents/Memory.
- Ensure Level 3 uses EvidenceObjects, not document count.
- Delete or retire `fast-track.ts` after all consumers migrate.

## Non-Regression Rule

ORP-1.10 must preserve user progress visibility while replacing the engine.

Allowed:

- temporary adapter translating old progress display to new maturity levels
- migration tests comparing old and new UI affordances
- compatibility exports during migration if clearly marked deprecated

Not allowed:

- new dependencies on `PASSPORT_LEVEL1_CRITICAL`
- progress derived from flat answer keys
- document count as evidence maturity
- PI/lab/cert flat fields as level gates
- blocking Passport behind old fast-track completion

## Deliverables

- Fast Track Elimination plan.
- Fast-track usage inventory.
- Progressive Maturity Engine specification.
- Level gate map.
- Migration/removal map.
- UI copy replacement map.

## Gate

ORP-1.10 is complete when:

- no legacy Fast Track logic remains
- `fast-track.ts` is deleted or fully retired with no active imports
- no level gate references legacy flat fields
- progress is computed from canonical maturity levels
- Level 1 can generate Passport without legacy critical question completion
- document count is not used as evidence maturity
