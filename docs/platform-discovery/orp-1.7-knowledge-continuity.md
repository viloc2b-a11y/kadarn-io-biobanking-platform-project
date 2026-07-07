# ORP-1.7 — Knowledge Continuity

**Program:** ORP-1.0 — Onboarding Refactoring & Architecture Alignment  
**Purpose:** Refactor Memory into linked knowledge continuity across institution, people, capabilities, evidence, documents, infrastructure, sponsors, inspections, technology, and growth.  
**Gate:** Every evidence object has temporal continuity metadata and can appear in at least one continuity timeline.

## Objective

Refactor Memory.

Memory should stop behaving like a single chronology of manually entered events. It should become the temporal continuity layer for Kadarn's knowledge model.

```text
Evidence / Claim / Object lifecycle
  -> ContinuityEvent
  -> Timeline lenses
  -> Claim impact
  -> Confidence context
```

Not:

```text
Manual event
  -> Flat timeline list
```

## Timeline Lenses

Create linked timeline lenses:

- Institution Timeline
- People Timeline
- Capability Timeline
- Evidence Timeline
- Document Timeline
- Infrastructure Timeline
- Sponsor Timeline
- Inspection Timeline
- Technology Timeline
- Growth Timeline

These are not separate histories. They are views over the same continuity event graph.

## Current Behavior

Current Memory uses:

```typescript
InstitutionalMemoryEvent {
  id
  date
  title
  domain
  description
  linkedEvidence: string[]
}
```

Current domains are limited:

- Institutional Timeline
- Research History
- Capability Evolution
- Document History
- People History
- Location / Infrastructure History

This is useful as MVP history, but it does not preserve enough structure:

- no canonical subject link
- no evidence object link
- no claim impact
- no provenance link
- no event relationship
- no confidence / temporal continuity signal
- no sponsor, inspection, technology, or growth lens

## Target Model

```text
ContinuityEvent
  -> subject
  -> timeline lenses
  -> evidence links
  -> claim impacts
  -> provenance
  -> related events
  -> review status
```

## Continuity Event Requirements

Every continuity event should include:

| Field | Purpose |
|---|---|
| `occurredAt` | When the event happened or became effective. |
| `subjectType` | Institution, Person, Claim, Evidence, Document, Facility, Sponsor, Inspection, Technology, etc. |
| `subjectId` | Canonical object ID. |
| `timelineLenses[]` | Which timelines show this event. |
| `evidenceLinks[]` | Evidence objects supporting, contradicting, or sourcing the event. |
| `claimImpacts[]` | Claims strengthened, weakened, superseded, contradicted, or contextualized by the event. |
| `provenance` | Source path: manual, document extraction, Evidence Core, sponsor feedback, API, integration, or audit. |
| `relatedEventIds[]` | Renewal, supersession, contradiction, remediation, or follow-on relationships. |
| `reviewStatus` | Derived, user-entered, confirmed, disputed, superseded. |

## Timeline Responsibilities

| Timeline | What it explains |
|---|---|
| Institution Timeline | How the institution formed, expanded, changed, and matured. |
| People Timeline | Staff roles, credentials, joins/leaves, training, license/certification lifecycle. |
| Capability Timeline | When capabilities emerged, strengthened, weakened, expired, or were remediated. |
| Evidence Timeline | Evidence added, renewed, expired, superseded, contradicted, or corroborated. |
| Document Timeline | Source document lifecycle, versions, conversions, extraction runs, renewals. |
| Infrastructure Timeline | Facility/lab/equipment/storage/logistics/utility changes and qualifications. |
| Sponsor Timeline | Sponsor relationships, qualifications, repeat work, feedback, external confirmation. |
| Inspection Timeline | Audits, inspections, findings, CAPA, remediation, closure. |
| Technology Timeline | CTMS, eReg, LIMS, EMR, monitoring systems, validation, integrations. |
| Growth Timeline | New sites, expanded services, additional modalities, capacity increases, network growth. |

## Evidence Continuity Rule

Every evidence object must carry temporal continuity metadata.

Minimum metadata:

- created date
- effective date where applicable
- expiration date where applicable
- superseded-by relationship where applicable
- renewal relationship where applicable
- source document / source version
- extraction or review timestamp
- claim relationship timestamps
- continuity event IDs

Evidence without temporal context is incomplete.

## Event Relationships

Continuity events should be linked when one explains another.

| Relationship | Meaning |
|---|---|
| `caused` | One event triggered another. |
| `followed` | Event follows another in the same lifecycle. |
| `renewed` | Later evidence extends validity of earlier evidence. |
| `superseded` | Later event replaces earlier source/evidence/version. |
| `corrected` | Later event corrects an earlier gap or error. |
| `contradicted` | Later event challenges prior evidence or claim. |
| `corroborated` | Later event independently supports an existing claim or event. |
| `remediated` | Later event resolves finding, gap, or counter-evidence. |

## Source Mapping

| Source | Continuity event examples |
|---|---|
| Institution data | Founded, renamed, new location, network expansion. |
| People data | PI added, role changed, certification renewed, license expired. |
| Infrastructure data | Lab added, equipment qualified, storage upgraded, utility validated. |
| Documents pipeline | Document uploaded, converted, extracted, renewed, superseded, expired. |
| Evidence Core | Claim created, evidence node appended, counter-evidence added, right of response. |
| Sponsor feedback | Sponsor qualification, repeat work, performance confirmation, dispute. |
| Inspection data | Inspection opened, finding recorded, CAPA opened, remediation closed. |
| Technology data | LIMS adopted, CTMS validated, monitoring integration enabled. |
| Historical ingestion | Study completed, publication added, sponsor history discovered. |

## Product Output Impact

| Output | Continuity contribution |
|---|---|
| Passport | Current snapshot can link to supporting continuity history. |
| Capabilities | Shows capability formation, renewal, weakening, and recovery. |
| Readiness | Uses continuity gaps, expired evidence, inspection status, and renewal history. |
| Roadmap | Converts continuity gaps into renewal, remediation, and evidence actions. |
| Sponsor Intelligence | Shows whether a capability is stable, recent, contested, or externally confirmed. |
| Confidence Graph | Uses continuity as explainable temporal context, especially Evidence Class E. |

## Activities

- Replace single `MemoryDomain` with timeline lens support.
- Introduce `ContinuityEvent` read model.
- Convert manual memory events into continuity event candidates.
- Derive continuity events from documents, evidence, claims, people, infrastructure, sponsors, inspections, technology, and growth events.
- Link events to canonical subjects.
- Link events to evidence objects and claims.
- Add event relationship model for renewal, supersession, contradiction, corroboration, and remediation.
- Ensure derived continuity events remain readonly projections unless explicitly confirmed as manual history.
- Add continuity gap outputs consumed by Roadmap and Readiness.

## Non-Regression Rule

ORP-1.7 must preserve existing manual Memory behavior while adding canonical continuity.

Allowed:

- manual memory events as continuity candidates
- derived readonly continuity events
- multiple timeline lens filters over the same event graph
- compatibility display for existing `memory_events`

Not allowed:

- copying derived events into manual history as source truth
- string-only evidence links when evidence object IDs exist
- timeline events without subject links
- evidence objects without temporal metadata
- treating Continuity as Passport source truth instead of supporting temporal context

## Deliverables

- Knowledge Continuity plan.
- Timeline lens model.
- Continuity event model.
- Evidence continuity metadata requirements.
- Event relationship model.
- Memory refactor map.

## Gate

ORP-1.7 is complete when:

- Institution, People, Capability, Evidence, Document, Infrastructure, Sponsor, Inspection, Technology, and Growth timelines exist as lenses over one event graph
- every evidence object has temporal continuity metadata
- every evidence object can appear in at least one continuity timeline
- continuity events link to canonical subjects
- continuity events link to evidence and claim impacts where applicable
- derived continuity events remain readonly unless confirmed by the user
