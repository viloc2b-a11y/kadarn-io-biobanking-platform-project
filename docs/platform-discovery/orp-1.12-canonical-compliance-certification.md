# ORP-1.12 — Canonical Compliance Certification

**Program:** ORP-1.0 — Onboarding Refactoring & Architecture Alignment  
**Purpose:** Certify that onboarding consumes Kadarn's canonical architecture and no longer depends on legacy form-shaped structures.  
**Gate:** ORP is closed only when onboarding reaches full canonical compliance.

## Objective

Final audit.

ORP-1.12 verifies that the refactoring program has achieved its architectural purpose:

```text
Onboarding
  -> Canonical Objects
  -> Evidence
  -> Claims
  -> Confidence
  -> Passport / Readiness / Capabilities / Roadmap
```

Not:

```text
Onboarding
  -> legacy answer keys
  -> duplicated fields
  -> persisted projections
  -> local scoring branches
```

## Certification Checks

ORP-1.12 must verify:

- No legacy.
- No duplicates.
- No persisted projections.
- Everything derives from canonical objects.
- Every document generates evidence.
- Every evidence object generates or supports Claims.
- Every Claim feeds Confidence.
- Every Confidence signal feeds Passport.

## Final Compliance Chain

The certified chain is:

```text
Canonical Objects
  -> Documents as Evidence Pipeline entry points
  -> Evidence Objects
  -> Claims
  -> Confidence Graph
  -> Passport
  -> Readiness
  -> Capabilities
  -> Roadmap
```

Every onboarding-created fact must be traceable through this chain, or it must have a documented exception with an explicit migration plan.

## Audit Scope

Audit:

- Organization
- People
- Infrastructure
- Documents
- Memory
- Capabilities
- Readiness
- Passport
- Roadmap
- Progressive maturity
- Extraction/review flows
- Legacy adapters
- Persistence boundaries
- Tests and fixtures

## Verification Matrix

| Requirement | Verification |
|---|---|
| No legacy | No new writes use legacy flat keys or legacy compatibility structures as source truth. |
| No duplicates | Each fact has one canonical owner; repeated views are projections only. |
| No persisted projections | Passport, Readiness, Capabilities, Roadmap, progress, and summaries are regenerated from canonical sources. |
| Canonical derivation | All onboarding facts map to Institution, Person, Location, Equipment, Laboratory, Document, Evidence, Timeline Event, Claim, or canonical adapters. |
| Documents produce Evidence | Upload/import paths create Evidence Objects with provenance metadata. |
| Evidence supports Claims | Evidence objects generate, update, or support Claim candidates. |
| Claims feed Confidence | Claim/evidence relationships update confidence signals. |
| Confidence feeds Passport | Passport and downstream projections consume confidence-backed claims, not local form flags. |

## Final Gate

The ORP is considered closed when:

- 100% of onboarding consumes the existing canonical architecture.
- 0% of new writes use legacy structures.
- Passport, Readiness, Capabilities, and Roadmap are pure projections of the same knowledge model.
- Documents works as an entry point to the Evidence Pipeline, not as an independent repository.
- Onboarding is progressive, resumable, and evidence-based.
- New capabilities are added through new Claims and Evidence, without modifying the base onboarding flow.

## Execution Priority

Do not execute ORP sprints in parallel.

Recommended sequence:

### Phase A — Architecture Alignment

```text
ORP-1.1
  -> ORP-1.2
  -> ORP-1.3
```

Purpose:

- establish the audit baseline
- eliminate legacy writes
- remove persisted projection boundaries

### Phase B — Evidence Model Integration

```text
ORP-1.4
  -> ORP-1.5
  -> ORP-1.6
```

Purpose:

- connect Documents to the Evidence Pipeline
- make onboarding progressive
- reduce manual questions through extraction

### Phase C — Derivation And Intelligence

```text
ORP-1.7
  -> ORP-1.8
  -> ORP-1.9
```

Purpose:

- add temporal continuity
- derive readiness from evidence-backed claims
- make Passport a regenerable projection

### Phase D — Cleanup And Certification

```text
ORP-1.10
  -> ORP-1.11
  -> ORP-1.12
```

Purpose:

- eliminate Fast Track legacy logic
- consolidate UX friction
- certify canonical compliance

This sequence minimizes risk because it first aligns the data model, then connects the Evidence Pipeline, then migrates projections, and finally removes remaining technical debt before certification.

## Activities

- Audit all onboarding write paths.
- Audit all projection read paths.
- Audit all document upload/import paths.
- Audit evidence-to-claim creation.
- Audit claim-to-confidence propagation.
- Audit confidence-backed projection consumption.
- Audit duplicate field removal.
- Audit legacy adapter boundaries.
- Confirm all remaining exceptions have migration plans.
- Produce final compliance reports.

## Deliverables

- Canonical Compliance Report.
- Architecture Alignment Report.
- ORP Final Report.

## Non-Regression Rule

Certification must not be achieved by narrowing the scope of onboarding or deleting necessary behavior.

Allowed:

- removing legacy paths
- replacing local projections with canonical projections
- migrating test fixtures
- documenting temporary exceptions with owners and removal dates

Not allowed:

- keeping legacy structures as hidden source truth
- renaming legacy fields without changing ownership
- bypassing Evidence, Claims, or Confidence for speed
- treating Documents as storage-only
- declaring compliance while projections still read local form flags

## Closure Statement

ORP-1.12 closes ORP-1.0 only when onboarding is no longer a form system with derived screens. It must be a progressive, resumable, evidence-based consumer of Kadarn's canonical knowledge architecture.
