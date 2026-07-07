# ORP-1.8 — Readiness Engine Refactoring

**Program:** ORP-1.0 — Onboarding Refactoring & Architecture Alignment  
**Purpose:** Refactor Readiness so it is derived only from claims, evidence, confidence, missing evidence, and temporal continuity.  
**Gate:** Readiness is completely derived.

## Objective

Eliminate manual readiness rules.

Readiness must never be calculated directly from manual form fields or flat legacy keys. It must be a projection over the canonical knowledge model.

```text
Claims
  -> Evidence
  -> Confidence
  -> Missing Evidence
  -> Temporal Continuity
  -> Readiness
```

Not:

```text
Manual field
  -> readiness score
```

## Current Problem

Current readiness behavior is directionally readonly, but derivation still depends on local/manual signals in the Passport assembler.

Examples of legacy or form-shaped inputs to remove from readiness source truth:

- `infra_has_lab`
- `infra_backup_power`
- `infra_lab_certs`
- `people_certs`
- `docs_uploaded_count`
- local document missing status without evidence object support
- hand-authored capability assumptions without claims

These fields may exist as temporary compatibility projections, but Readiness must not treat them as canonical evidence.

## Target Readiness Inputs

| Input | Role in Readiness |
|---|---|
| `Claim` / `ClaimCandidate` | Defines what institutional capability/readiness assertion is being evaluated. |
| `EvidenceObject` | Supports, weakens, contradicts, corroborates, or supersedes claims. |
| `ConfidenceState` | Provides claim-level confidence, explanation, contributions, and counter-evidence status. |
| `MissingEvidence` | Identifies proof required to strengthen or unlock readiness. |
| `TemporalContinuity` | Indicates stability, renewal, expiration, remediation, contradiction, and decay risk over time. |

## Readiness Rule

Readiness answers:

> What can this institution credibly support today, based on claims and evidence?

It should not answer:

> What did the user select in a form?

## Readiness Dimensions

Readiness dimensions should be composed from claim families and evidence states.

| Readiness dimension | Canonical basis |
|---|---|
| Institutional Identity Readiness | Identity claims + legal/operational evidence + provenance. |
| People Readiness | Person/role claims + credential evidence + license/certification confidence + gaps. |
| Infrastructure Readiness | Facility/lab/equipment/storage/logistics claims + evidence and continuity. |
| Evidence Readiness | Evidence coverage, freshness, provenance, missing evidence, contradictions. |
| Operational Readiness | SOP/process/logistics/quality claims + supporting operational evidence. |
| Continuity Readiness | Temporal continuity events, renewals, expirations, remediation, unresolved findings. |
| Sponsor Readiness | External confirmation, sponsor feedback, performance evidence, relationship continuity. |

## Derivation Chain

```text
Canonical Objects
  -> Claim Candidates
  -> Accepted Claims
  -> Evidence Links
  -> Confidence State
  -> Missing Evidence Map
  -> Temporal Continuity Signals
  -> Readiness Dimensions
  -> Readiness Profile
```

## Source Boundary

| Current source pattern | ORP-1.8 replacement |
|---|---|
| `infra_has_lab === yes` | Claim: Laboratory exists + evidence support + confidence. |
| `infra_backup_power === generator` | Claim: backup utility support + utility evidence + continuity/maintenance. |
| `people_certs` summary | Person evidence + credential claims + expiration/continuity. |
| uploaded document count | Evidence object coverage + missing evidence map. |
| manual capability checkbox | Claim candidate + evidence links + confidence. |
| static missing document list | Missing evidence required by claim/readiness dimension. |
| local score constants | scoring policy over confidence, evidence class, missing proof, and continuity state. |

## Missing Evidence Model

Readiness must explicitly understand what is missing.

```text
Claim
  -> required evidence classes
  -> existing evidence objects
  -> missing evidence
  -> readiness gap
  -> roadmap action
```

Examples:

- Sample Processing claim missing lab certification evidence.
- International Shipping claim missing IATA/person evidence.
- Biospecimen Storage claim missing temperature monitoring continuity.
- Early Phase Readiness claim missing emergency procedure evidence.
- IVD Readiness claim missing validation records.

## Temporal Continuity Impact

Temporal continuity should affect readiness explanation and gap classification.

| Continuity state | Readiness effect |
|---|---|
| stable over time | Strengthens confidence in readiness. |
| recently established | Marks readiness as emerging until more evidence accumulates. |
| expired | Weakens readiness and creates renewal gap. |
| superseded | Uses newest valid evidence while preserving history. |
| contradicted | Creates readiness risk until resolved. |
| remediated | Shows recovery and may restore readiness with evidence. |
| continuity gap | Creates roadmap action and readiness limitation. |

## Activities

- Inventory all readiness rules and their source fields.
- Mark manual/legacy source rules for removal.
- Define claim families that feed readiness dimensions.
- Define evidence requirements per readiness dimension.
- Define missing evidence map per claim/readiness dimension.
- Define continuity signals that affect readiness.
- Refactor `deriveReadiness` or future readiness builder to consume canonical read models.
- Ensure readiness explanations cite claims, evidence, missing evidence, confidence, and continuity.
- Ensure Roadmap consumes readiness gaps from the same missing evidence model.

## Non-Regression Rule

ORP-1.8 must preserve current Readiness UI behavior while replacing the source boundary.

Allowed:

- compatibility adapters during migration
- cached readiness projections
- transitional mapping from legacy fields to claim/evidence candidates
- side-by-side old/new readiness comparison tests

Not allowed:

- readiness calculated directly from manual fields
- readiness scores without claim/evidence explanation
- missing evidence derived from static checklists when claim requirements exist
- user-editable readiness values
- readiness gaps disconnected from Roadmap actions

## Deliverables

- Readiness Engine Refactoring plan.
- Readiness source-field inventory.
- Claim-to-readiness dimension map.
- Evidence requirement map.
- Missing evidence model.
- Temporal continuity impact map.
- Readiness projection boundary specification.

## Gate

ORP-1.8 is complete when:

- Readiness is completely derived
- no readiness score is calculated directly from manual or legacy flat fields
- every readiness dimension references claims and evidence
- every readiness gap maps to missing evidence or weak/conflicted evidence
- confidence state contributes to readiness explanations
- temporal continuity contributes to readiness explanations
- Readiness and Roadmap consume the same gap model
