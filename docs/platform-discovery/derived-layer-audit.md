# Kadarn MVP Derived Layer Audit

Sprint 3 establishes the absolute boundary between inputs and outputs. Kadarn may ask for institutional knowledge, evidence, and history. It must not ask users to manually edit derived capabilities, readiness, Passport state, or Roadmap recommendations.

## Boundary Rule

```text
Inputs
  Organization
  People
  Infrastructure
  Documents
  History

Evidence Graph
  Canonical entities
  Evidence links
  Capability claims
  Confidence / readiness inputs

Readonly Outputs
  Capabilities
  Readiness
  Passport
  Roadmap
```

Derived layers are projections. They may explain, link back to the source section, or recommend fixes. They must not write primary onboarding answers.

## Executive Finding

The current MVP is directionally correct: `Capabilities`, `Readiness`, `Passport`, and `Roadmap` mostly behave as readonly projections. The risk is not that these pages contain obvious form fields. The risk is that the system still mixes canonical input fields and derived legacy projections in the same `answers` object, so derived facts can appear to be manual state.

The boundary should be made explicit in code:

```text
Canonical Inputs -> Evidence Graph / Projection Adapter -> Derived Read Models
```

Not:

```text
answers -> mixed canonical + derived keys -> derived pages
```

## Current Layer Classification

| Layer | Current route / module | Current behavior | Audit status |
|---|---|---|---|
| Organization input | `/onboarding/organization` | Captures institution identity, research focus, locations, footprint. | Valid input layer, but writes legacy location projections. |
| People input | `/onboarding/people` | Captures research team, roles, certifications. | Valid input layer, but team summaries still exist as derived keys. |
| Infrastructure input | `/onboarding/infrastructure` | Captures location-scoped infrastructure. | Valid input layer; downstream consumers still read flat `infra_*` projections. |
| Documents input | `/onboarding/documents` | Uploads evidence documents and shows taxonomy. | Valid input layer. Document count must remain calculated. |
| History input | `/onboarding/memory` | Adds explicit historical events and derives timeline events. | Valid input only for `TimelineEvent`; derived events must not become editable facts. |
| Evidence Graph | Not explicit in onboarding MVP | Currently represented indirectly by canonical answers, uploaded docs, supporting evidence arrays, and `assemblePassport()`. | Missing formal boundary. Needs explicit adapter/model. |
| Capabilities output | `/onboarding/capabilities` | Derives from `assemblePassport()` and has no `setAnswer()` writes. | Correct readonly projection. |
| Readiness output | `/onboarding/readiness` | Derives from `assemblePassport()` and has no writes. | Correct readonly projection. |
| Passport output | `/onboarding/passport` | Derives current snapshot; share/export only. | Correct readonly projection. |
| Roadmap output | `/onboarding/roadmap` | Derives prioritized action cards from Passport gaps and canonical objects. | Correct readonly projection. |

## Readonly Compliance Check

| Derived page | Writes onboarding answers? | Contains data-entry fields? | Allowed interactions | Result |
|---|---:|---:|---|---|
| Capabilities | No | No | Link back to input sections via "Improve this capability". | Pass |
| Readiness | No | No | Link to Passport. | Pass |
| Passport | No | No | Share current URL, export/print, link to Memory/Roadmap. | Pass |
| Roadmap | No | No | Link to source sections via "Fix this". | Pass |

These interactions are acceptable because they do not mutate derived state. They redirect users to canonical input layers.

## Input Compliance Check

| Input page | Creates canonical object? | Current issue | Correction |
|---|---:|---|---|
| Organization | Yes | Writes `org_street`, `org_city`, `org_state`, `org_country`, `org_zip`, `org_time_zone` alongside `org_locations`. | Stop writing these from UI; derive them in a compatibility projection only. |
| People | Yes | `people_research_leadership_role` is ambiguous: it may be institution-level leadership model or person role context. | Assign it to a canonical target or remove/reframe. |
| People | Yes | `withDerivedAnswers()` writes `people_pi_*`, `people_roles`, `people_certs`, `people_languages`, `people_total_team`. | Keep these as projection-only fields outside canonical answers. |
| Infrastructure | Yes | Per-location infrastructure is canonical, but `withDerivedAnswers()` writes flat `infra_*` projections. | Move flat projections into adapter consumed only by legacy derivation. |
| Documents | Yes | `docs_uploaded_count` is a derived count. | Keep calculated from `uploadedDocs`; do not store as input. |
| Memory | Yes | Manual `memory_events` are valid, but page also derives events from current facts. | Keep derived timeline events readonly and separate from explicit user-entered history. |

## Derived State Risks

### 1. `answers` mixes inputs and projections

`OnboardingAnswers` currently stores both canonical entities and derived compatibility fields. This is the main boundary violation.

Examples:

- Canonical: `people_team_members`
- Projection: `people_pi_name`, `people_roles`, `people_certs`
- Canonical: `infra_location_infrastructure`
- Projection: `infra_has_lab`, `infra_has_biospecimen`, `infra_backup_power`
- Canonical: `uploadedDocs`
- Projection: `docs_uploaded_count`

Correction:

```text
canonical state
  -> projection adapter
  -> legacy read model
```

Do not persist projections beside canonical input facts.

### 2. Fast-track still treats projections as questions

`fast-track.ts` still names critical questions like:

- `people_pi_name`
- `people_pi_experience`
- `people_roles`
- `people_certs`
- `infra_has_lab`
- `infra_has_biospecimen`
- `infra_backup_power`
- `docs_uploaded_count`

These are no longer canonical questions. They are derived completion checks.

Correction:

```text
people_team_members contains PI -> PI complete
people_team_members has roles -> team structure complete
people_team_members has certifications -> certification coverage complete
infra_location_infrastructure has lab -> lab complete
infra_location_infrastructure has biospecimen operations -> biospecimen complete
uploadedDocs.length >= 3 -> evidence complete
```

### 3. `assemblePassport()` is acting as both Evidence Graph and output assembler

The MVP currently uses `assemblePassport()` to derive:

- Passport
- Evidence coverage
- Capabilities
- Readiness
- Next steps

This works for MVP, but the conceptual Evidence Graph boundary is hidden.

Correction:

Split responsibilities:

```text
buildEvidenceGraph(canonicalInputs)
deriveCapabilities(evidenceGraph)
deriveReadiness(evidenceGraph, capabilities)
assemblePassport(evidenceGraph, capabilities, readiness)
deriveRoadmap(evidenceGraph, passport, readiness)
```

### 4. Capabilities are correctly readonly, but derivation still reads legacy fields

The UI is correct. The derivation path still needs cleanup so capabilities are derived from canonical entities and evidence, not flat fallback fields.

Correction:

- `Clinical Research Operations` from `InstitutionResearchExperience` + `Person[]`
- `Sample Processing` from `Laboratory` + `Evidence`
- `Biospecimen Storage` from `Equipment[]` + monitoring evidence
- `Shipping` from location-scoped infrastructure + staff/document evidence

### 5. Readiness is correctly readonly, but scoring should depend on canonical claim state

Readiness must not be editable. It should be calculated from capability claims, evidence quality, missing evidence, and canonical object completeness.

Correction:

Readiness dimensions should consume:

- `CapabilityClaim.status`
- `Evidence.class`
- `Evidence.validity`
- `missingEvidence[]`
- canonical completeness of `Location`, `Person`, `Laboratory`, and `Equipment`

## Required Boundary Contract

Add a documented contract around the onboarding engine:

```typescript
interface OnboardingInputState {
  institution: Institution
  locations: Location[]
  people: Person[]
  laboratories: Laboratory[]
  equipment: Equipment[]
  evidence: Evidence[]
  timelineEvents: TimelineEvent[]
}

interface EvidenceGraphReadModel {
  claims: CapabilityClaim[]
  evidenceLinks: EvidenceLink[]
  missingEvidence: MissingEvidence[]
  confidenceInputs: ConfidenceInput[]
}

interface DerivedOnboardingOutputs {
  capabilities: CapabilityReadModel[]
  readiness: ReadinessReadModel
  passport: PassportReadModel
  roadmap: RoadmapReadModel
}
```

Only `OnboardingInputState` should be mutable by onboarding input pages.

## Allowed vs Forbidden Interactions

| Interaction | Allowed? | Reason |
|---|---:|---|
| Add/edit institution identity | Yes | Creates `Institution`. |
| Add/edit locations | Yes | Creates `Location`. |
| Add/edit staff | Yes | Creates `Person`. |
| Add/edit staff certifications | Yes | Creates person-scoped `Evidence`. |
| Add/edit location infrastructure | Yes | Creates `Laboratory`, `Equipment`, or infrastructure claims. |
| Upload/remove documents | Yes | Creates/removes MVP evidence objects. |
| Add historical event | Yes | Creates `TimelineEvent`. |
| Edit capability strength directly | No | Capability strength is derived. |
| Edit readiness score directly | No | Readiness is derived. |
| Edit Passport section text directly | No | Passport is a projection. |
| Edit Roadmap action priority directly | No | Roadmap is derived from gaps. |
| Link from output to source input | Yes | Redirects to canonical input layer. |
| Share/export output | Yes | Does not mutate source state. |

## Page-Level Audit

### Organization

Status: input page.

Keep:

- Institution identity.
- Research experience inputs.
- Locations.
- Operational footprint.

Fix:

- Do not write primary-location legacy fields from `InstitutionalLocationsEditor`.
- Make copy say facts here become claims and evidence requirements, not profile fields.

### People

Status: input page.

Keep:

- Research team members.
- Person roles.
- Person-scoped certifications.

Fix:

- Make institutional certification summary readonly.
- Treat `people_research_leadership_role` as either a leadership model or remove it.
- Ensure fast-track does not target derived `people_*` fields.

### Infrastructure

Status: input page.

Keep:

- Location-scoped infrastructure.
- Lab/equipment/biospecimen details by location.

Fix:

- Stop downstream logic from requiring flat `infra_*` fields.
- Reframe lab and biospecimen "yes/no" concepts as object existence: lab exists, biospecimen operation exists.

### Documents

Status: input page.

Keep:

- Upload/remove evidence documents.
- Evidence taxonomy display.

Fix:

- Keep counts, missing document status, evidence coverage, and document health readonly.
- Promote uploaded documents toward `Evidence` objects instead of generic uploaded doc records.

### History / Memory

Status: input page for timeline events plus readonly derived timeline.

Keep:

- Manual historical events.
- Links to evidence/documents.

Fix:

- Clearly label inferred timeline cards as derived and not directly editable.
- Do not let Memory modify current Passport, readiness, or capability state.

### Capabilities

Status: readonly derived output.

Keep:

- Derived capabilities.
- Supporting evidence.
- Missing evidence.
- "Improve this capability" links.

Fix:

- Add an explicit "Readonly derived from evidence graph" label.
- Ensure no future capability input fields are added here.

### Readiness

Status: readonly derived output.

Keep:

- Maturity profile.
- Domain readiness.
- Gaps and recommendations.

Fix:

- Add an explicit "Readonly derived from claims and evidence" label.
- Derive from canonical claim/evidence state, not legacy flat answers.

### Passport

Status: readonly derived output.

Keep:

- Current snapshot.
- Share/export.
- Supporting history link.
- Roadmap link.

Fix:

- Add an explicit "Readonly current snapshot" label if needed.
- Do not introduce editable Passport text.

### Roadmap

Status: readonly derived output.

Keep:

- Prioritized action cards.
- Required evidence.
- Linked source sections.

Fix:

- Add an explicit "Readonly recommendations" label.
- Strategic growth goals may become input, but should live in an input/planning section, not inside derived Roadmap actions.

## Implementation Recommendations

1. Create a canonical input state boundary.
   - Only input pages can mutate it.
   - Outputs cannot call `setAnswer`, `setAnswers`, `addDocument`, or `removeDocument`.

2. Create an Evidence Graph read model.
   - Build it from canonical inputs and evidence.
   - Derive capabilities, readiness, Passport, and Roadmap from it.

3. Move legacy projection keys out of persisted input state.
   - `withDerivedAnswers()` should become a compatibility adapter, not a state mutator.

4. Replace fast-track question IDs with canonical completion predicates.
   - Completion checks should answer "does the canonical object exist and meet minimum evidence requirements?"

5. Add a derived-page guardrail.
   - Derived routes should not import mutating context functions.
   - Derived routes should only import read state and derivation functions.

6. Add UI copy to make the boundary visible.
   - Input pages: "Add evidence/facts."
   - Derived pages: "Readonly result generated from your evidence graph."

## Acceptance Check

Sprint 3 is complete when:

- Only Organization, People, Infrastructure, Documents, and History can mutate canonical input state.
- Capabilities, Readiness, Passport, and Roadmap contain no primary input controls.
- Derived pages do not import or call onboarding mutation functions.
- Fast-track progress uses canonical object completion predicates, not derived flat keys.
- `answers` no longer stores canonical facts and derived projections together.
- The Evidence Graph is a named boundary between inputs and outputs.
