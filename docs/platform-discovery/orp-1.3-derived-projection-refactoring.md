# ORP-1.3 — Derived Projection Refactoring

**Program:** ORP-1.0 — Onboarding Refactoring & Architecture Alignment  
**Purpose:** Remove persistence of derived projections and make all derived outputs read from canonical knowledge sources.  
**Gate:** No derived data is persisted as source truth.

## Objective

Eliminate persistence of projections.

Passport, Readiness, Capabilities, Roadmap, and compatibility read models must be derived from:

```text
Canonical Objects
  -> Evidence
  -> Claims
  -> Confidence Graph
```

They must not be written back into onboarding answers as if they were user input.

## Refactoring Targets

| Target | Current issue | ORP-1.3 action |
|---|---|---|
| `withDerivedAnswers` | Writes derived legacy keys into `answers`. | Convert into read-only projection adapter or remove persisted derived writes. |
| `passport-assembler` | Builds Passport from a mix of canonical objects and legacy projection keys. | Read from canonical objects, evidence, claims, and confidence/readiness inputs. |
| `readiness-builder` | Readiness can behave like local scoring over flat fields. | Derive from claim support, evidence freshness, canonical object completeness, and confidence signals. |
| `capability-builder` | Capabilities can be inferred from form answers rather than claims. | Derive from `Claim` / `ClaimCandidate` support and evidence links. |
| `roadmap-builder` | Roadmap can read projection gaps instead of canonical graph gaps. | Derive actions from missing canonical objects, missing evidence, weak claims, and confidence/continuity gaps. |

Current files may not use these exact builder names yet. ORP-1.3 defines the architectural boundary they must satisfy.

## Projection Rule

Derived outputs may be cached or computed, but they are not canonical input.

Allowed:

```text
Canonical object
  -> projection adapter
  -> Passport / Readiness / Capabilities / Roadmap
```

Not allowed:

```text
Projection
  -> persisted answer
  -> treated as user input
```

## Derived Data To Remove From Source Truth

Derived values must not be persisted as onboarding input, including:

- PI display name
- PI experience summary
- team role summary
- team certification summary
- total team count
- language coverage summary
- lab yes/no summary
- biospecimen yes/no summary
- backup power summary
- storage equipment summary
- document count
- capability list
- readiness dimensions
- Passport section summaries
- roadmap actions
- derived memory events

These can exist as read-only projections, but not as source facts.

## Target Derivation Chain

```text
Institution
Location
Person
Facility / Laboratory / Equipment / Storage / Utilities / Logistics
Document / EvidenceSource
TimelineEvent / ContinuityEvent
        ↓
EvidenceObject
        ↓
Claim / ClaimCandidate
        ↓
ConfidenceGraph / ConfidenceState
        ↓
Passport
Capabilities
Readiness
Roadmap
Continuity
Marketplace
Sponsor Intelligence
Analytics
Recommendations
```

## Source Boundary By Output

| Output | Must derive from | Must not derive from |
|---|---|---|
| Passport | Canonical objects, evidence, claims, confidence/readiness read model. | `people_pi_name`, `infra_has_lab`, `docs_uploaded_count`, or other persisted projection keys. |
| Capabilities | Claims, evidence links, people/infrastructure/document support. | Manual capability self-attestation alone. |
| Readiness | Evidence freshness, missing proof, claim support, object completeness, continuity risk. | Local scoring over flat legacy keys. |
| Roadmap | Missing canonical objects, weak claims, expired/missing evidence, continuity gaps. | Gaps inferred from duplicated form fields. |
| Memory / Continuity | Timeline/continuity events linked to subjects and evidence. | Derived timeline events persisted as manual memory. |

## Activities

- Identify every place derived data is persisted.
- Convert persisted derived data into read-only selectors or projection adapters.
- Mark legacy projection branches as compatibility-only.
- Refactor Passport derivation away from flat answer keys.
- Refactor capability derivation toward claims and evidence support.
- Refactor readiness derivation toward canonical object completeness and evidence confidence.
- Refactor roadmap derivation toward canonical gaps and weak claim/evidence support.
- Ensure derived memory events remain projections, not manual history records.

## Non-Regression Rule

ORP-1.3 must preserve current product behavior while moving source boundaries.

Allowed:

- temporary compatibility adapters
- cached projections
- readonly legacy view models
- tests that compare old and new projections during migration

Not allowed:

- derived values written into canonical input state
- derived values counted as answered questions
- derived values used as a source for other derived values when canonical sources exist
- user-editable derived outputs

## Deliverables

- Derived Projection Refactoring plan.
- Persisted derived data inventory.
- Projection adapter map.
- Output source-boundary matrix.

## Gate

ORP-1.3 is complete when:

- no derived data is persisted as source truth
- every derived output has a documented canonical source boundary
- Passport, Capabilities, Readiness, and Roadmap can be rebuilt from canonical objects, evidence, claims, and confidence graph inputs
- compatibility projections are read-only and explicitly transitional
- no progress gate treats a derived projection as a user answer
