# Kadarn MVP Institution Continuity Model

Sprint 9 redesigns Memory from a single chronological list into an institution-wide continuity model. Memory should not be "events on a page." It should be the temporal layer that connects institution identity, capabilities, evidence, documents, people, relationships, sponsors, inspections, technology, and growth over time.

Target model:

```text
Institution Continuity
  -> Institution Timeline
  -> Capability Timeline
  -> Evidence Timeline
  -> Document Timeline
  -> People Timeline
  -> Relationship Timeline
  -> Sponsor Timeline
  -> Inspection Timeline
  -> Technology Timeline
  -> Growth Timeline
  -> Linked Evidence / Claims / Provenance
```

This aligns with KUX Continuity and KEMS-001 Class E: Temporal Continuity Evidence.

## Design Rule

```text
Temporal facts
  -> Continuity events
  -> Timeline lenses
  -> Claim / evidence relationships
  -> Confidence graph continuity signal
  -> Passport / Readiness / Roadmap projections
```

Never:

```text
Manual event
  -> Flat timeline list
```

Every continuity event should have subject links, evidence links, provenance, and a reason it matters.

## Why This Matters

Kadarn's current Memory module already preserves historical context, but it presents history as one timeline. That is not enough for institutional intelligence.

Sponsors and institutions need to understand:

- how capabilities evolved
- whether evidence has remained stable
- whether people changes weakened or strengthened claims
- whether inspections introduced counter-evidence or external confirmation
- whether sponsor relationships validate operational continuity
- whether technology and infrastructure improvements changed readiness
- whether growth reflects stable maturity or recent unproven expansion

Continuity is not nostalgia. It is a confidence signal.

## Current Problem

The current `InstitutionalMemoryEvent` model is:

```typescript
interface InstitutionalMemoryEvent {
  id: string
  date: string
  title: string
  domain: MemoryDomain
  description: string
  linkedEvidence: string[]
}
```

Current domains are:

- Institutional Timeline
- Research History
- Capability Evolution
- Document History
- People History
- Location / Infrastructure History

This is useful for MVP, but it is still event-list shaped. It does not model:

- event subject
- timeline lens
- claim impact
- evidence relationship
- confidence effect
- provenance
- versioning
- counter-evidence
- sponsor or inspection context
- supersession or correction

## Canonical Objects

| Object | Purpose |
|---|---|
| `ContinuityEvent` | Atomic temporal event about an institution or linked entity. |
| `ContinuitySubject` | The entity the event is about: institution, claim, evidence, person, facility, sponsor, relationship, inspection, technology. |
| `TimelineLens` | Product-facing timeline view over the same event graph. |
| `ContinuityEvidenceLink` | Evidence/provenance supporting the event. |
| `ContinuityClaimImpact` | How the event affects a claim or capability. |
| `ContinuityRelationship` | Link between events: caused, superseded, corrected, corroborated, contradicted, followed. |
| `ContinuityProjection` | Readonly output for Memory, Passport, Readiness, Roadmap, or Sponsor views. |

## Data Model Direction

```typescript
type TimelineLens =
  | 'institution'
  | 'capability'
  | 'evidence'
  | 'document'
  | 'people'
  | 'relationship'
  | 'sponsor'
  | 'inspection'
  | 'technology'
  | 'growth'

type ContinuitySubjectType =
  | 'Institution'
  | 'CapabilityClaim'
  | 'EvidenceObject'
  | 'DocumentSource'
  | 'Person'
  | 'Location'
  | 'Facility'
  | 'Laboratory'
  | 'Equipment'
  | 'Sponsor'
  | 'Inspection'
  | 'TechnologySystem'
  | 'Relationship'

interface ContinuityEvent {
  id: string
  occurredAt: string
  title: string
  summary: string
  lens: TimelineLens[]
  subjectType: ContinuitySubjectType
  subjectId: string
  eventType: string
  evidenceLinks: ContinuityEvidenceLink[]
  claimImpacts: ContinuityClaimImpact[]
  relatedEventIds: string[]
  provenance: ContinuityProvenance
  reviewStatus: 'derived' | 'user-entered' | 'confirmed' | 'disputed' | 'superseded'
}

interface ContinuityClaimImpact {
  claimId: string
  impact: 'supports' | 'weakens' | 'contradicts' | 'corroborates' | 'supersedes' | 'neutral'
  confidenceSignal: 'temporal-continuity' | 'decay-risk' | 'external-confirmation' | 'counter-evidence' | 'context'
  explanation: string
}

interface ContinuityEvidenceLink {
  evidenceId: string
  relationship: 'supports' | 'contradicts' | 'corroborates' | 'supersedes' | 'source'
  evidenceClass?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  sourceSpan?: string
}

interface ContinuityProvenance {
  source: 'manual' | 'document-extraction' | 'evidence-core' | 'passport-projection' | 'audit' | 'integration'
  sourceId?: string
  extractedFactIds: string[]
  createdBy?: string
  createdAt: string
}
```

The current `memory_events` array can remain as an MVP input, but it should be treated as a manual source that produces `ContinuityEvent` candidates.

## Timeline Lenses

The timelines are not separate databases. They are lenses over the same continuity graph.

| Timeline | Question answered | Example events |
|---|---|---|
| Institution Timeline | How did the institution evolve? | Founded, new site opened, accreditation gained, network expansion. |
| Capability Timeline | How did a capability emerge, mature, weaken, or recover? | Sample processing added, IATA capability expired, PBMC SOP validated. |
| Evidence Timeline | How did evidence support change over time? | Evidence added, superseded, contradicted, renewed, expired. |
| Document Timeline | What happened to source documents and versions? | CV uploaded, CLIA renewed, SOP version superseded, inspection report added. |
| People Timeline | How did staffing and qualifications change? | PI joined, coordinator left, IATA staff certified, license expired. |
| Relationship Timeline | How did partner/network relationships change? | Lab partner added, courier agreement renewed, referral network expanded. |
| Sponsor Timeline | What sponsor interactions validate continuity? | Sponsor qualification, study award, repeat sponsor, performance confirmation. |
| Inspection Timeline | What external reviews occurred? | FDA inspection, IRB audit, CAP inspection, corrective action closed. |
| Technology Timeline | How did technical systems evolve? | CTMS adopted, eReg launched, LIMS integrated, monitoring system validated. |
| Growth Timeline | How did capacity and maturity expand? | New locations, more studies, additional modalities, upgraded infrastructure. |

## Continuity Event Types

| Event type | Typical subjects | Confidence relevance |
|---|---|---|
| `created` | Institution, Location, Facility, Person, Evidence | Establishes origin point. |
| `added` | Capability, Person, Equipment, Service, Relationship | Shows capability formation or expansion. |
| `renewed` | License, certification, accreditation, agreement | Strengthens temporal continuity and reduces decay risk. |
| `expired` | Evidence, credential, agreement | Weakens current confidence until renewed or replaced. |
| `superseded` | Document, SOP, evidence node, claim version | Preserves append-only history while moving current state forward. |
| `confirmed` | Claim, sponsor relationship, inspection outcome | Can act as external confirmation or corroboration. |
| `contradicted` | Claim, evidence, capability | Introduces counter-evidence or dispute context. |
| `remediated` | Inspection finding, gap, corrective action | Shows recovery path and maturity. |
| `expanded` | Location, service, capability, team, technology | Supports growth and readiness evolution. |
| `reduced` | Staffing, service, capability, relationship | Indicates potential continuity or readiness risk. |

## Evidence Core Alignment

KEMS-001 defines Evidence Class E as Temporal Continuity Evidence: evidence of consistent capability maintenance over time. The Institution Continuity Model is the product layer that makes that signal visible and explainable.

Continuity should not replace Evidence Core. It should link to it.

| KEMS concept | Continuity model role |
|---|---|
| Claim | A continuity event may affect one or more claims. |
| Evidence Node | A continuity event may cite evidence nodes as support, contradiction, or supersession. |
| Evidence Relationship | Event links mirror supports, contradicts, corroborates, responds_to, supersedes where relevant. |
| Confidence State | Continuity contributes explanation and temporal signal, not hidden scoring. |
| Temporal Metadata | `occurredAt`, expiration, renewal, supersession, and decay risk are first-class. |
| Provenance | Every event must reconstruct where it came from. |

## Timeline-to-Claim Mapping

| Claim family | Timeline lenses that matter | Examples |
|---|---|---|
| Clinical Research Operations | Institution, People, Sponsor, Document | PI continuity, GCP renewals, sponsor repeat work. |
| Sample Processing | Capability, Laboratory, Evidence, Inspection | CLIA renewal, SOP version, CAP inspection, processing training. |
| Biospecimen Storage | Capability, Equipment, Utilities, Evidence | Freezer qualification, temperature logs, excursion remediation. |
| International Shipping | Capability, People, Logistics, Relationship | IATA certification, courier agreement, shipping SOP renewal. |
| Multi-Site Operations | Institution, Growth, Relationship, People | New sites added, site leads assigned, network agreements. |
| IVD Readiness | Laboratory, Technology, Inspection, Document | Validation reports, LIMS integration, quality manual updates. |
| Early Phase Readiness | Facility, People, Utilities, Inspection | Overnight capacity, emergency SOP, monitoring validation. |

## Continuity Sources

| Source | Produces events |
|---|---|
| Organization data | Founded date, location additions, network structure, digital presence changes. |
| People data | Staff joins/leaves, role assignments, certification/license lifecycle. |
| Infrastructure data | Lab creation, equipment qualification, storage additions, utility changes, logistics upgrades. |
| Documents pipeline | Upload, extraction, versioning, renewal, expiration, supersession. |
| Evidence Core | Claim creation, evidence node append, counter-evidence, right of response, confidence snapshot. |
| Sponsor interactions | Qualification, study participation, repeat sponsor relationship, performance confirmation. |
| Inspections/audits | Inspection, finding, CAPA, remediation, closure. |
| Technology systems | CTMS/eReg/LIMS adoption, validation, integration, migration. |
| Manual history | User-entered historical context, later linked to evidence where possible. |

## Memory Page v2 Sections

```text
Institution Continuity
  1. Continuity Overview
  2. Timeline Lenses
  3. Continuity Events
  4. Claim Impact
  5. Evidence & Provenance
  6. Continuity Gaps
  7. Derived Continuity Signals
```

### 1. Continuity Overview

Shows the institutional continuity map:

- oldest evidence
- current active evidence
- renewed evidence
- expired evidence
- unresolved counter-evidence
- major capability changes
- people and relationship stability

### 2. Timeline Lenses

Lets users switch views without duplicating events:

- Institution
- Capability
- Evidence
- Document
- People
- Relationship
- Sponsor
- Inspection
- Technology
- Growth

Each lens filters the same continuity graph.

### 3. Continuity Events

Shows events as structured nodes, not just cards:

- event title
- occurred date
- subject
- event type
- evidence links
- claim impacts
- related events
- review status

### 4. Claim Impact

Answers:

> What did this event change about institutional confidence?

Examples:

- CLIA renewed strengthens Sample Processing continuity.
- IATA expired weakens International Shipping until renewed.
- Sponsor repeat work corroborates Clinical Research Operations.
- FDA inspection finding creates counter-evidence until remediated.

### 5. Evidence & Provenance

Every event should explain:

- which evidence supports it
- which source produced it
- whether it was extracted, derived, manual, confirmed, disputed, or superseded
- whether it affects current state or historical context only

### 6. Continuity Gaps

Readonly gap projection:

- capability has no recent evidence
- document expired without replacement
- role changed without updated delegation evidence
- sponsor relationship old and unconfirmed
- inspection finding open
- technology system unvalidated
- infrastructure upgraded without qualification evidence

### 7. Derived Continuity Signals

Readonly signals consumed by Passport, Readiness, and Roadmap:

- stable over time
- recently established
- renewed recently
- decay risk
- contradicted
- remediated
- externally confirmed
- continuity gap

## Current-to-v2 Mapping

| Current Memory concept | Institution Continuity target | Decision |
|---|---|---|
| `memory_events[].date` | `ContinuityEvent.occurredAt` | Keep, but normalize as temporal metadata. |
| `memory_events[].title` | `ContinuityEvent.title` | Keep. |
| `memory_events[].description` | `ContinuityEvent.summary` | Keep. |
| `memory_events[].domain` | `TimelineLens[]` | Replace single domain with one or more lenses. |
| `memory_events[].linkedEvidence` | `ContinuityEvidenceLink[]` | Replace string labels with evidence IDs/relationships. |
| Derived location event | `ContinuityEvent` with `subjectType: Location` | Keep as derived, readonly. |
| Derived person event | `ContinuityEvent` with `subjectType: Person` | Keep as derived, readonly. |
| Derived capability event | `ContinuityEvent` with `subjectType: CapabilityClaim` | Add claim impact. |
| Derived document event | `ContinuityEvent` with `subjectType: DocumentSource` or `EvidenceObject` | Add evidence lifecycle type. |

## Manual vs Derived Events

Manual events are allowed, but they are not the whole model.

| Event source | Editable? | Purpose |
|---|---:|---|
| Manual history | Yes | Capture context not yet extracted from evidence. |
| Derived from current inputs | No | Reflect current canonical objects over time. |
| Derived from documents | Confirm/reject | Turn source documents into timeline facts. |
| Derived from Evidence Core | No | Reflect claim/evidence lifecycle. |
| Derived from integrations | Confirm/reject where needed | Bring external operational facts into continuity. |

Derived events should not be copied into manual `memory_events`. They should remain projections over canonical state, evidence, and provenance.

## Relationship Model

Events must be linked when one explains another.

| Relationship | Meaning |
|---|---|
| `caused` | One event produced or triggered another. |
| `followed` | Event happened after another in the same lifecycle. |
| `renewed` | Later event extends validity of earlier evidence/credential. |
| `superseded` | Later event replaces earlier source/evidence/version. |
| `corrected` | Later event fixes an earlier error or gap. |
| `contradicted` | Later event challenges a prior claim or evidence. |
| `corroborated` | Later event independently supports a prior event/claim. |
| `remediated` | Later event resolves a finding, gap, or counter-evidence. |

## Example Continuity Graph

```text
CLIA Certificate uploaded
  -> Evidence Timeline: CLIA source captured
  -> Document Timeline: CLIA version 2026 accepted
  -> Laboratory Timeline: regulated laboratory authority confirmed
  -> Capability Timeline: Sample Processing supported
  -> Confidence Signal: Temporal Continuity Evidence if prior CLIA existed
  -> Roadmap: remove CLIA renewal gap

IATA Certificate expired
  -> People Timeline: shipping staff credential expired
  -> Logistics Timeline: international shipping support weakened
  -> Capability Timeline: International Shipping claim weakened
  -> Roadmap: renew IATA certification
```

## Outputs

| Output | Continuity contribution |
|---|---|
| Capabilities | Shows capability formation, strengthening, weakening, contradiction, renewal, and recovery over time. |
| Readiness | Uses continuity gaps, renewal status, inspection status, and unresolved counter-evidence as maturity signals. |
| Passport | Shows current snapshot with continuity context available as supporting history. |
| Roadmap | Converts continuity gaps into next actions. |
| Sponsor views | Explains whether a site has stable support over time or only recent/fragile evidence. |
| Confidence Graph | Provides temporal continuity and provenance explanation for claim-level confidence. |

## Implementation Notes

1. Keep `memory_events` for MVP manual history, but do not treat it as the continuity source of truth.
2. Replace `MemoryDomain` with `TimelineLens[]` when moving to implementation.
3. Introduce `ContinuityEvent` as the normalized read model from manual events, documents, canonical objects, and Evidence Core lifecycle.
4. Link every event to a subject object and evidence/provenance where possible.
5. Preserve derived events as readonly projections.
6. Add claim impact metadata so Memory can show why an event matters.
7. Add relationship links between events to support supersession, renewal, contradiction, and remediation.
8. Keep Passport as current snapshot; Continuity is supporting temporal context, not the Passport itself.
9. Treat temporal continuity as an explainable signal, not a hidden score.

## Acceptance Check

Institution Continuity Model is complete when:

- Memory has multiple linked timeline lenses, not one flat chronology.
- Every continuity event has subject, evidence/provenance, event type, and optional claim impact.
- Capability, evidence, document, people, sponsor, inspection, technology, relationship, and growth timelines are views over the same event graph.
- Derived continuity events are readonly and do not overwrite manual history.
- Continuity can explain strengthening, weakening, renewal, expiration, contradiction, remediation, and supersession.
- Passport remains a current snapshot, while Continuity provides the temporal record behind it.
- Confidence explanations can reference temporal continuity where appropriate.
